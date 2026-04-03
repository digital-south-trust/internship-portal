import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Exam from '@/models/Exam';
import Question from '@/models/Question';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const track = searchParams.get('track');
        const email = searchParams.get('email');

        if (!track) {
            return NextResponse.json({ error: 'Track is required' }, { status: 400 });
        }

        await dbConnect();

        // Check if user already attempted if email provided
        if (email) {
            const User = require('@/models/User').default;
            const user = await User.findOne({ email });
            if (user && user.isAssessmentDone) {
                return NextResponse.json({ 
                    error: 'Assessment already completed',
                    message: 'You have already taken the assessment. Each candidate can only take it once.'
                }, { status: 403 });
            }
        }

        // Get all active exams for this track
        const activeExams = await Exam.find({ track, status: 'active' });

        if (activeExams.length === 0) {
            return NextResponse.json({ error: 'No active assessment found for this track' }, { status: 404 });
        }

        // Assign a stable random exam based on email to ensure different students get mixed papers
        // but the same student always gets the same paper on refresh.
        let exam;
        if (email) {
            const hash = Array.from(email).reduce((acc, char) => acc + char.charCodeAt(0), 0);
            exam = activeExams[hash % activeExams.length];
        } else {
            exam = activeExams[0];
        }

        // Fetch questions for this exam
        const questions = await Question.find({ examId: exam._id });

        // Combined response with questions as part of exam object
        const examData = {
            _id: exam._id,
            title: exam.title,
            description: exam.description,
            durationMinutes: exam.durationMinutes,
            totalQuestions: exam.totalQuestions || questions.length,
            track: exam.track,
            passingScore: exam.passingScore || 75,
            questions: questions.map(q => ({
                _id: q._id,
                text: q.text,
                options: q.options.map(o => ({
                    text: o.text,
                    explanation: o.explanation
                })),
                aiExplanation: q.aiExplanation
            }))
        };

        return NextResponse.json({
            exam: examData,
            questions: examData.questions
        }, { status: 200 });

    } catch (error) {
        console.error('Get Assessment Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
