import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Exam from '@/models/Exam';

export async function POST(req) {
    try {
        await dbConnect();
        const body = await req.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const updatedExam = await Exam.findByIdAndUpdate(
            id,
            updates,
            { new: true }
        );

        if (!updatedExam) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
        }

        return NextResponse.json(updatedExam, { status: 200 });

    } catch (error) {
        console.error('Update exam error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
