import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Exam from '@/models/Exam';
import Question from '@/models/Question';

export async function GET(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const examId = searchParams.get('examId');

        if (!examId) {
            return NextResponse.json({ error: 'Exam ID is required' }, { status: 400 });
        }

        const questions = await Question.find({ examId });
        return NextResponse.json({ questions }, { status: 200 });

    } catch (error) {
        console.error('Fetch questions error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await dbConnect();
        const body = await req.json();
        const { examId, text, options } = body;

        if (!examId || !text || !options || options.length < 2) {
            return NextResponse.json({ error: 'Invalid question data' }, { status: 400 });
        }

        const newQuestion = await Question.create({
            examId,
            text,
            options
        });

        // Add to exam's question list
        await Exam.findByIdAndUpdate(examId, {
            $push: { questions: newQuestion._id }
        });

        return NextResponse.json(newQuestion, { status: 201 });

    } catch (error) {
        console.error('Create question error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
        }

        const question = await Question.findByIdAndDelete(id);
        if (question) {
            // Remove from exam's question list
            await Exam.findByIdAndUpdate(question.examId, {
                $pull: { questions: id }
            });
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error('Delete question error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        await dbConnect();
        const body = await req.json();
        const { id, text, options } = body;

        if (!id || !text || !options) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        const question = await Question.findByIdAndUpdate(id, {
            text,
            options
        }, { new: true });

        if (!question) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        return NextResponse.json({ success: true, question }, { status: 200 });

    } catch (error) {
        console.error('Update question error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
