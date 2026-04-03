import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        await dbConnect();
        const { email, otp } = await req.json();

        if (!email || !otp) {
            return NextResponse.json({ message: "Email and OTP are required" }, { status: 400 });
        }

        const PendingUser = (await import("@/models/PendingUser")).default;
        const userData = await PendingUser.findOne({ email });

        if (!userData) {
            return NextResponse.json({ message: "Verification session not found. Please register again." }, { status: 404 });
        }

        // Check if OTP matches and has not expired
        if (userData.otp !== otp) {
            return NextResponse.json({ message: "Invalid verification code" }, { status: 400 });
        }

        if (new Date() > userData.otpExpires) {
            return NextResponse.json({ message: "Verification code has expired" }, { status: 400 });
        }

        // OTP matched! Now 'safe fully' into main User collection
        // Check if user already exists (guard)
        const existing = await User.findOne({ email });
        if (existing) {
             await PendingUser.deleteOne({ email });
             return NextResponse.json({ message: "User already exists." }, { status: 400 });
        }

        const newUser = await User.create({
            fullName: userData.fullName,
            email: userData.email,
            password: userData.password,
            track: userData.track,
            role: 'intern',
            status: "OTP_VERIFIED",
            isAssessmentDone: false,
            isProfileComplete: false,
            isVerified: true, 
            isApproved: false,
            assessmentScore: 0,
        });

        // Delete from temporary storage
        await PendingUser.deleteOne({ email });

        const response = NextResponse.json({ 
            message: "Email verified successfully! You can now take the assessment.",
            status: "OTP_VERIFIED",
            redirectTo: "/assessment"
        }, { status: 200 });

        // Set session cookies
        response.cookies.set('userRole', 'intern', { path: '/', maxAge: 10800 });
        response.cookies.set('userEmail', newUser.email, { path: '/', maxAge: 10800 });

        return response;

    } catch (error) {
        console.error("OTP Verification Error:", error);
        return NextResponse.json({ message: "Server error during verification", error: error.message }, { status: 500 });
    }
}
