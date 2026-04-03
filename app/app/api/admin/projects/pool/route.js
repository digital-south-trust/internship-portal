import dbConnect from "@/lib/mongodb";
import ProjectPool from "@/models/ProjectPool";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const trackParam = searchParams.get('track');

        let query = {};
        if (trackParam) {
            let regexPattern = trackParam;
            // Handle variations between admin naming and intern profile naming
            if (trackParam.includes("Blockchain")) {
                regexPattern = "Blockchain";
            } else if (trackParam.includes("Gen")) {
                regexPattern = "Gen\\s*AI";
            } else if (trackParam.includes("App Development") || trackParam.includes("App Dev")) {
                regexPattern = "App Development";
            } else if (trackParam === "AI/ML" || trackParam === "Artificial Intelligence") {
                regexPattern = "(AI/ML|Artificial Intelligence)";
            }

            query.track = { $regex: new RegExp(regexPattern, 'i') };
        }

        const projects = await ProjectPool.find(query).sort({ createdAt: -1 });
        return NextResponse.json(projects, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error fetching pool" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await dbConnect();
        const body = await req.json();
        const newProject = await ProjectPool.create(body);
        return NextResponse.json(newProject, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: "Error creating project in pool", error: error.message }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        await dbConnect();
        const body = await req.json();
        const { id, ...updateData } = body;
        if (!id) return NextResponse.json({ message: "ID is required" }, { status: 400 });

        const updatedProject = await ProjectPool.findByIdAndUpdate(id, updateData, { new: true });
        return NextResponse.json(updatedProject, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error updating project in pool" }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ message: "ID is required" }, { status: 400 });

        await ProjectPool.findByIdAndDelete(id);
        return NextResponse.json({ message: "Project deleted" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error deleting project in pool" }, { status: 500 });
    }
}
