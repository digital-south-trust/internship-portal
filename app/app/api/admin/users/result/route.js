import dbConnect from "@/lib/mongodb";
import Result from "@/models/Result";
import Exam from "@/models/Exam";
import Question from "@/models/Question";
import ProjectRequest from "@/models/ProjectRequest";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        await dbConnect();
        const url = new URL(req.url);
        const userId = url.searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
        }

        // Fetch the detailed result and populate question data
        const result = await Result.findOne({ user: userId })
            .populate('exam')
            .populate({
                path: 'answers.questionId',
                model: Question,
                select: 'text options'
            });

        // Fetch user projects
        const projects = await ProjectRequest.find({ internId: userId }).sort({ requestedAt: -1 });

        return NextResponse.json({
            assessment: result || null,
            projects: projects || []
        }, { status: 200 });

    } catch (error) {
        console.error("Fetch Result error:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
