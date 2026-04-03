import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { sendSelectionEmail, sendRejectionEmail } from "@/lib/mailer";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        await dbConnect();
        const { userId, status } = await req.json();

        if (!userId || !status) {
            return NextResponse.json({ 
                error: 'Missing userId or status' 
            }, { status: 400 });
        }

        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Update selection status
        user.selectionStatus = status;
        user.isApproved = status === 'Selected';

        // Send appropriate email
        if (status === 'Selected') {
            user.status = 'SELECTED';
            // Send selection email
            await sendSelectionEmail(user.email, user.fullName);
        } else if (status === 'Rejected') {
            user.status = 'REJECTED';
            // Send rejection email
            await sendRejectionEmail(user.email, user.fullName);
        }

        await user.save();

        return NextResponse.json({ 
            message: `User status updated to ${status}`,
            user: {
                _id: user._id,
                email: user.email,
                selectionStatus: user.selectionStatus,
                isApproved: user.isApproved
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Update Assessment Status error:", error);
        return NextResponse.json({ 
            error: 'Failed to update status',
            details: error.message 
        }, { status: 500 });
    }
}
