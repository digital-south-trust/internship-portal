import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Result from '@/models/Result';
import Question from '@/models/Question';
import Exam from '@/models/Exam';

export async function POST(req) {
    try {
        const { email, examId, answers, violations, timeTaken, forced } = await req.json();

        if (!email || !examId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await dbConnect();

        // 1. Fetch user and exam
        const user = await User.findOne({ email });
        const exam = await Exam.findById(examId).populate('questions');

        if (!user || !exam) {
            return NextResponse.json({ error: 'User or Exam not found' }, { status: 404 });
        }

        if (user.isAssessmentDone) {
            return NextResponse.json({ error: 'Assessment already completed' }, { status: 400 });
        }

        // 2. Grade answers
        let correctCount = 0;
        const totalQuestions = exam.questions.length;
        const gradedAnswers = [];

        exam.questions.forEach(question => {
            const userAnswer = answers[question._id.toString()];
            const correctOption = question.options.find(opt => opt.isCorrect);
            const isCorrect = correctOption?.text === userAnswer;
            
            if (isCorrect) correctCount++;

            gradedAnswers.push({
                questionId: question._id,
                selectedOption: userAnswer,
                isCorrect,
                aiExplanation: question.aiExplanation || ''
            });
        });

        const scorePercentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
        const passed = scorePercentage >= (exam.passingScore || 75);

        // 3. Create Result entry
        const result = await Result.create({
            user: user._id,
            exam: examId,
            score: correctCount,
            scorePercentage: Math.round(scorePercentage * 100) / 100,
            totalQuestions,
            passed,
            answers: gradedAnswers,
            violationCount: violations || 0,
            violationReason: violations > 0 ? 'Security violations detected during exam' : '',
            timeTaken,
            submittedAt: new Date()
        });

        // 4. Update User info
        user.isAssessmentDone = true;
        user.assessmentScore = scorePercentage;
        user.assessmentDate = new Date();
        user.status = 'ASSESSMENT_COMPLETED';
        
        // Generate Admission ID if not exists
        if (!user.admissionId) {
            const year = new Date().getFullYear();
            const random = Math.floor(100000 + Math.random() * 900000);
            user.admissionId = `DS-${year}-${random}`;
        }
        
        await user.save();

        return NextResponse.json({
            success: true,
            score: correctCount,
            scorePercentage: Math.round(scorePercentage * 100) / 100,
            totalQuestions,
            passed,
            message: passed ? 'Assessment passed! You will hear back within 24 hours.' : 'Assessment not passed. Unfortunately, you did not meet the required score of 75%.'
        }, { status: 200 });

    } catch (error) {
        console.error('Submit API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
