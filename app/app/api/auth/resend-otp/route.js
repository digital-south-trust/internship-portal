import dbConnect from "@/lib/mongodb";
import PendingUser from "@/models/PendingUser";
import { NextResponse } from "next/server";
import { sendOTPEmail } from "@/lib/mailer";

export async function POST(req) {
    try {
        await dbConnect();
        let { email } = await req.json();

        if (!email) {
            return NextResponse.json({ message: "Email is required" }, { status: 400 });
        }
        
        email = email.toLowerCase().trim();

        const userData = await PendingUser.findOne({ email });

        if (!userData) {
            return NextResponse.json({ message: "Verification session not found. Please register again." }, { status: 404 });
        }

        // Generate a new 6-digit random number for OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiration = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        // Update the existing pending user record
        userData.otp = otpCode;
        userData.otpExpires = otpExpiration;
        await userData.save();

        // Send the new OTP via email
        try {
            await sendOTPEmail(email, otpCode);
        } catch (mailError) {
            console.error("Failed to resend OTP email:", mailError);
            return NextResponse.json({ message: "Mail server failed to send OTP. Please check your address or try again later.", error: mailError.message }, { status: 500 });
        }

        return NextResponse.json({ 
            message: "A new verification code has been sent to your email.",
            success: true
        }, { status: 200 });

    } catch (error) {
        console.error("Resend OTP Error:", error);
        return NextResponse.json({ message: "Server error during resend", error: error.message }, { status: 500 });
    }
}
