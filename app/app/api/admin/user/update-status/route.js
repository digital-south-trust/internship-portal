import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { NextResponse } from "next/server";
import { sendSelectionEmail, sendRejectionEmail } from "@/lib/mailer";

export async function POST(req) {
    try {
        await dbConnect();
        const { email, status } = await req.json();

        if (!email || !status) {
            return NextResponse.json({ message: "Email and status are required" }, { status: 400 });
        }

        const validStatuses = ['NEW', 'OTP_VERIFIED', 'ASSESSMENT_COMPLETED', 'SELECTED', 'REJECTED', 'PROFILE_PENDING', 'VERIFIED', 'ACTIVE', 'Terminated'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ message: "Invalid status" }, { status: 400 });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // Action-specific logic
        if (status === 'OTP_VERIFIED' && user.reExamRequested) {
            user.reExamRequested = false;
            user.isAssessmentDone = false; // Reset assessment so they can retake
            user.assessmentScore = 0;
        }

        user.status = status;

        if (['SELECTED', 'PROFILE_PENDING', 'VERIFIED', 'ACTIVE'].includes(status)) {
            user.selectionStatus = 'Selected';
            user.isApproved = true;
        } else if (status === 'REJECTED') {
            user.selectionStatus = 'Rejected';
            user.isApproved = false;
        }

        await user.save();

        // Send email notifications
        if (status === 'SELECTED') {
            try { await sendSelectionEmail(user.email, user.fullName); } catch (e) { console.error(e); }
        } else if (status === 'REJECTED') {
            try { await sendRejectionEmail(user.email, user.fullName); } catch (e) { console.error(e); }
        }

        return NextResponse.json({ 
            message: `User status updated to ${status}`,
            user: { email: user.email, status: user.status }
        }, { status: 200 });

    } catch (error) {
        console.error("Status Update Error:", error);
        return NextResponse.json({ message: "Server error during status update" }, { status: 500 });
    }
}
