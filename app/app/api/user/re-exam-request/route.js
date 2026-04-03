import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        await dbConnect();
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ message: "Email is required" }, { status: 400 });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        if (user.status !== 'REJECTED') {
            return NextResponse.json({ message: "Only rejected users can request a re-exam" }, { status: 403 });
        }

        user.reExamRequested = true;
        await user.save();

        return NextResponse.json({ 
            message: "Re-exam request sent to administrators",
            reExamRequested: true
        }, { status: 200 });

    } catch (error) {
        console.error("Re-exam Request Error:", error);
        return NextResponse.json({ message: "Server error during request" }, { status: 500 });
    }
}
