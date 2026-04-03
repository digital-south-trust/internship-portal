import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Exam from '@/models/Exam';
import Question from '@/models/Question';

export async function GET(req) {
    try {
        await dbConnect();

        const tracks = [
            'Web Development',
            'App Development',
            'Blockchain/Web3',
            'Gen AI',
            'AI/ML',
            'Cybersecurity',
            'Robotics'
        ];

        for (const trackName of tracks) {
            // Check if exam already exists
            const existing = await Exam.findOne({ track: trackName });
            if (existing) continue;

            const exam = await Exam.create({
                title: `${trackName} Eligibility Assessment`,
                description: `Test your skills in ${trackName} to join our internship program.`,
                durationMinutes: 60,
                supervisorEmail: 'gautham@digitalsouth.co.in',
                scheduledAt: new Date(),
                track: trackName,
                status: 'active'
            });

            // Create 10 sample questions per track
            const questions = [];
            for (let i = 1; i <= 10; i++) {
                questions.push({
                    examId: exam._id,
                    text: `Sample ${trackName} Question ${i}?`,
                    options: [
                        { text: 'Option A (Correct)', isCorrect: true },
                        { text: 'Option B', isCorrect: false },
                        { text: 'Option C', isCorrect: false },
                        { text: 'Option D', isCorrect: false }
                    ],
                    points: 1
                });
            }

            await Question.insertMany(questions);
            console.log(`Seeded ${trackName} assessment.`);
        }

        return NextResponse.json({ success: true, message: 'Sample assessments seeded successfully!' }, { status: 200 });

    } catch (error) {
        console.error('Seed Error:', error);
        return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
    }
}
