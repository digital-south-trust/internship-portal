import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await dbConnect();

        const users = await User.find({ 
            status: { $ne: 'REJECTED' },
            selectionStatus: { $ne: 'Rejected' } 
        }).select('-password').sort({ createdAt: -1 });
        return NextResponse.json(users, { status: 200 });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
