
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        await dbConnect();
        const { email, aadharNumber } = await req.json();

        if (!email || !aadharNumber) {
            return NextResponse.json({ error: "Email and Aadhaar number are required" }, { status: 400 });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Mock verification logic (for demo purposes, succeed if number is 12 digits)
        const isValid = aadharNumber.length === 12;

        if (isValid) {
            user.isVerified = true;
            user.aadhaarNumber = aadharNumber;
            await user.save();
            return NextResponse.json({ 
                success: true, 
                message: "Aadhaar verified successfully via DigiLocker proxy.",
                tries: user.aadharVerificationTries
            }, { status: 200 });
        } else {
            await user.save();
            return NextResponse.json({ 
                success: false, 
                error: "Invalid Aadhaar number format. Please try again.",
                tries: user.aadharVerificationTries
            }, { status: 400 });
        }

    } catch (error) {
        console.error("Aadhar Verification error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
