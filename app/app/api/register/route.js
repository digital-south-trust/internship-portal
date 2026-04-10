import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sendOTPEmail } from "@/lib/mailer";

export async function POST(req) {
    try {
        await dbConnect();
        const body = await req.json();

        const PendingUser = (await import("@/models/PendingUser")).default;

        if (!body.email || !body.password || !body.track || !body.fullName) {
            return NextResponse.json({ message: "Email, password, track, and full name are required" }, { status: 400 });
        }
        
        let email = body.email.toLowerCase().trim();

        // Check if user already exists in permanent User records
        const existingUser = await User.findOne({ 
            $or: [{ email: email }, { phone: body.phone }] 
        });
        if (existingUser) {
            return NextResponse.json({ message: "Already account is there" }, { status: 400 });
        }

        const hashedPassword = body.password ? await bcrypt.hash(body.password, 10) : undefined;
        
        // Generate a 6-digit random number for OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiration = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        // 1. Safe only to Pending collection temporarily
        await PendingUser.deleteMany({ email: email }); // Clear previous attempts if any
        
        await PendingUser.create({
            fullName: body.fullName,
            email: email,
            password: hashedPassword,
            track: body.track,
            phone: body.phone,
            otp: otpCode,
            otpExpires: otpExpiration,
        });

        // 2. Send the OTP via email
        try {
            await sendOTPEmail(email, otpCode);
        } catch (mailError) {
            console.error("Failed to send OTP email:", mailError);
            await PendingUser.deleteMany({ email: email }); // Rollback creation
            return NextResponse.json({ message: "Failed to send verification email. Please check your email address or try again.", error: mailError.message }, { status: 500 });
        }

        return NextResponse.json({ 
            message: "Account created! A verification code has been sent to your email. Please verify to continue.", 
            email: email,
            status: "PENDING_OTP" // Informative status for frontend
        }, { status: 201 });

    } catch (error) {
        console.error("Error registering user:", error);
        return NextResponse.json({ message: "Error registering user", error: error.message }, { status: 500 });
    }
}
