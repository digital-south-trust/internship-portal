import dbConnect from "@/lib/mongodb";
import LiveBookCourse from "@/models/LiveBookCourse";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await dbConnect();
        const courses = await LiveBookCourse.find({}).sort({ createdAt: -1 });
        return NextResponse.json(courses, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error fetching internal courses" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await dbConnect();
        const body = await req.json();
        const newCourse = await LiveBookCourse.create(body);
        return NextResponse.json(newCourse, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: "Error creating course", error: error.message }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        await dbConnect();
        const body = await req.json();
        const { id, ...updateData } = body;
        if (!id) return NextResponse.json({ message: "Course ID is required" }, { status: 400 });

        const updatedCourse = await LiveBookCourse.findByIdAndUpdate(id, updateData, { new: true });
        return NextResponse.json(updatedCourse, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error updating course" }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ message: "Course ID is required" }, { status: 400 });

        await LiveBookCourse.findByIdAndDelete(id);
        return NextResponse.json({ message: "Course deleted successfully" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error deleting course" }, { status: 500 });
    }
}
