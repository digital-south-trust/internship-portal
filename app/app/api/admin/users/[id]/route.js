import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Ambassador from "@/models/Ambassador";
import ProjectRequest from "@/models/ProjectRequest";
import Schedule from "@/models/Schedule";
import WeeklyReview from "@/models/WeeklyReview";
import Result from "@/models/Result";
import Ticket from "@/models/Ticket";
import Certificate from "@/models/Certificate";
import Meeting from "@/models/Meeting";
import ChatConversation from "@/models/ChatConversation";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        
        let user = await User.findById(id).select('-password').lean();
        let isAmbassador = false;

        if (!user) {
            user = await Ambassador.findById(id).select('-password').lean();
            if (user) {
                isAmbassador = true;
                user.role = 'ambassador';
            }
        }

        if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });
        
        let projects = [];
        let referredUsers = [];

        if (isAmbassador) {
            // Find users who joined with this ambassador's code
            referredUsers = await User.find({ referralCodeUsed: user.referralCode })
                .select('fullName email status createdAt track')
                .sort({ createdAt: -1 });
        } else {
            projects = await ProjectRequest.find({ internId: id }).sort({ createdAt: -1 });
        }
        
        return NextResponse.json({ user, projects, referredUsers }, { status: 200 });
    } catch (error) {
        console.error("Error fetching user details:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

// Update assignedAdmin  OR  terminate a user
export async function PATCH(req, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        const allowedFields = {};
        if (body.assignedAdmin !== undefined) allowedFields.assignedAdmin = body.assignedAdmin;
        if (body.status !== undefined) {
            allowedFields.status = body.status;
            if (['SELECTED', 'PROFILE_PENDING', 'VERIFIED', 'ACTIVE', 'Active'].includes(body.status)) {
                allowedFields.selectionStatus = 'Selected';
                allowedFields.isApproved = true;
            } else if (body.status === 'REJECTED' || body.status === 'Terminated') {
                allowedFields.selectionStatus = body.status === 'REJECTED' ? 'Rejected' : 'Terminated';
                allowedFields.isApproved = false;
            }
        }

        if (Object.keys(allowedFields).length === 0) {
            return NextResponse.json({ message: "No valid fields to update" }, { status: 400 });
        }

        let updated = await User.findByIdAndUpdate(
            id,
            { $set: allowedFields },
            { new: true }
        ).select('-password');

        if (!updated) {
            updated = await Ambassador.findByIdAndUpdate(
                id,
                { $set: allowedFields },
                { new: true }
            ).select('-password');
        }

        if (!updated) return NextResponse.json({ message: "User not found" }, { status: 404 });

        return NextResponse.json({ message: "Updated successfully", user: updated }, { status: 200 });
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        
        // 1. Try finding in both collections
        let user = await User.findById(id);
        let isAmbassador = false;

        if (!user) {
            user = await Ambassador.findById(id);
            if (user) isAmbassador = true;
        }

        if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

        const userEmail = user.email;

        // 2. Cascading Delete - ID based
        await Promise.all([
            Schedule.deleteMany({ userId: id }),
            WeeklyReview.deleteMany({ internId: id }),
            Result.deleteMany({ user: id }),
            ProjectRequest.deleteMany({ internId: id }),
            ChatConversation.deleteMany({ userId: id })
        ]);

        // 3. Cascading Delete - Email based
        if (userEmail) {
            await Promise.all([
                Ticket.deleteMany({ reportedBy: userEmail }),
                Certificate.deleteMany({ internEmail: userEmail }),
                Meeting.deleteMany({ intern: userEmail })
            ]);
        }
        
        // 4. Finally delete the User or Ambassador
        if (isAmbassador) {
            await Ambassador.findByIdAndDelete(id);
        } else {
            await User.findByIdAndDelete(id);
        }

        return NextResponse.json({ 
            message: `${isAmbassador ? 'Ambassador' : 'User'} and all related records successfully purged.` 
        }, { status: 200 });
    } catch (error) {
        console.error("Error performing cascading delete for user:", error);
        return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
    }
}
