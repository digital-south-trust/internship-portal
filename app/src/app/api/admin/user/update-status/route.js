import { NextResponse } from "next/server";
import { UserService } from "@/services/user.service";
import { z } from "zod";
import { sendSelectionEmail, sendRejectionEmail } from "@/lib/mailer";

// Zod schema for input validation
const updateStatusSchema = z.object({
    email: z.string().email("Invalid email address"),
    status: z.enum([
        'NEW', 'OTP_VERIFIED', 'ASSESSMENT_COMPLETED', 
        'SELECTED', 'REJECTED', 'PROFILE_PENDING', 
        'VERIFIED', 'ACTIVE', 'Terminated'
    ], { errorMap: () => ({ message: "Invalid status" }) })
});

export async function POST(req) {
    try {
        const body = await req.json();

        // 1. Zod Validation
        const validationResult = updateStatusSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json({ 
                message: "Validation Error", 
                errors: validationResult.error.format() 
            }, { status: 400 });
        }

        const { email, status } = validationResult.data;

        // 2. Fetch User via Service Layer
        const user = await UserService.getUserByEmail(email);
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // 3. Action-specific logic (preparing the update)
        const updatePayload = { status };

        if (status === 'OTP_VERIFIED' && user.reExamRequested) {
            updatePayload.reExamRequested = false;
            updatePayload.isAssessmentDone = false;
            updatePayload.assessmentScore = 0;
        }

        if (['SELECTED', 'PROFILE_PENDING', 'VERIFIED', 'ACTIVE'].includes(status)) {
            updatePayload.selectionStatus = 'Selected';
            updatePayload.isApproved = true;
        } else if (status === 'REJECTED') {
            updatePayload.selectionStatus = 'Rejected';
            updatePayload.isApproved = false;
        }

        // 4. Update using Service
        const updatedUser = await UserService.updateUser(user._id, updatePayload);

        // 5. Fire-and-forget Email Notifications
        if (status === 'SELECTED') {
            sendSelectionEmail(updatedUser.email, updatedUser.fullName).catch(console.error);
        } else if (status === 'REJECTED') {
            sendRejectionEmail(updatedUser.email, updatedUser.fullName).catch(console.error);
        }

        return NextResponse.json({ 
            message: `User status updated to ${status}`,
            user: { email: updatedUser.email, status: updatedUser.status }
        }, { status: 200 });

    } catch (error) {
        console.error("[API_ADMIN_USER_STATUS_POST] Error:", error);
        return NextResponse.json({ 
            message: "Server error during status update",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined 
        }, { status: 500 });
    }
}
