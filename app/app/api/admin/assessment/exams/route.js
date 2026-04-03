import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Exam from '@/models/Exam';
import Question from '@/models/Question';

export async function GET(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const track = searchParams.get('track');

        if (!track) {
            return NextResponse.json({ error: 'Track is required' }, { status: 400 });
        }

        const exams = await Exam.find({ track }).sort({ createdAt: -1 });
        return NextResponse.json({ exams }, { status: 200 });

    } catch (error) {
        console.error('Fetch exams error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await dbConnect();
        const body = await req.json();
        const { track, title, durationMinutes } = body;

        if (!track || !title) {
            return NextResponse.json({ error: 'Track and title are required' }, { status: 400 });
        }

        const newExam = await Exam.create({
            title,
            track,
            durationMinutes: durationMinutes || 60,
            description: `Assessment for ${track}`,
            supervisorEmail: 'admin@digitalsouth.co.in',
            scheduledAt: new Date(),
            status: 'active'
        });

        return NextResponse.json(newExam, { status: 201 });

    } catch (error) {
        console.error('Create exam error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Exam ID is required' }, { status: 400 });
        }

        await Exam.findByIdAndDelete(id);
        // Also delete questions for this exam
        await Question.deleteMany({ examId: id });

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error('Delete exam error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
