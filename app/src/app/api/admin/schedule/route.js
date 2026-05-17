import dbConnect from "@/lib/mongodb";
import Meeting from "@/models/Meeting";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await dbConnect();
        const meetings = await Meeting.find({}).sort({ date: 1, time: 1 });
        return NextResponse.json(meetings, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error fetching internal schedule", error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await dbConnect();
        const body = await req.json();
        const newMeeting = await Meeting.create(body);
        return NextResponse.json(newMeeting, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: "Error scheduling meeting", error: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        await dbConnect();
        const url = new URL(req.url);
        const id = url.searchParams.get("id");
        if (!id) return NextResponse.json({ message: "Meeting ID required" }, { status: 400 });

        await Meeting.findByIdAndDelete(id);
        return NextResponse.json({ message: "Meeting deleted successfully" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error canceling meeting" }, { status: 500 });
    }
}
