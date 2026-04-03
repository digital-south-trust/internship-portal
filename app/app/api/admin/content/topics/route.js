import dbConnect from "@/lib/mongodb";
import LiveBookTopic from "@/models/LiveBookTopic";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await dbConnect();
        const topics = await LiveBookTopic.find({}).sort({ updatedAt: -1 });
        return NextResponse.json(topics, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error fetching internal topics" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await dbConnect();
        const body = await req.json();
        const newTopic = await LiveBookTopic.create(body);
        return NextResponse.json(newTopic, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: "Error creating topic", error: error.message }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        await dbConnect();
        const body = await req.json();
        const { id, ...updateData } = body;
        if (!id) return NextResponse.json({ message: "Topic ID is required" }, { status: 400 });

        const updatedTopic = await LiveBookTopic.findByIdAndUpdate(id, updateData, { new: true });
        return NextResponse.json(updatedTopic, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error updating topic" }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ message: "Topic ID is required" }, { status: 400 });

        await LiveBookTopic.findByIdAndDelete(id);
        return NextResponse.json({ message: "Topic deleted successfully" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error deleting topic" }, { status: 500 });
    }
}
