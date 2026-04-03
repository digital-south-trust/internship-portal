import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import ProjectRequest from "@/models/ProjectRequest";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const user = await User.findById(id).select('-password');
        if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });
        const projects = await ProjectRequest.find({ internId: id }).sort({ createdAt: -1 });
        return NextResponse.json({ user, projects }, { status: 200 });
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
            if (['SELECTED', 'PROFILE_PENDING', 'VERIFIED', 'ACTIVE'].includes(body.status)) {
                allowedFields.selectionStatus = 'Selected';
                allowedFields.isApproved = true;
            } else if (body.status === 'REJECTED') {
                allowedFields.selectionStatus = 'Rejected';
                allowedFields.isApproved = false;
            }
        }

        if (Object.keys(allowedFields).length === 0) {
            return NextResponse.json({ message: "No valid fields to update" }, { status: 400 });
        }

        const updated = await User.findByIdAndUpdate(
            id,
            { $set: allowedFields },
            { new: true }
        ).select('-password');

        if (!updated) return NextResponse.json({ message: "User not found" }, { status: 404 });

        return NextResponse.json({ message: "Updated successfully", user: updated }, { status: 200 });
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
