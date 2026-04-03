import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findOne({ email }).lean();
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        let assessmentResult = null;
        if (user.isAssessmentDone) {
            const Result = (await import('@/models/Result')).default;
            assessmentResult = await Result.findOne({ user: user._id })
                .sort({ submittedAt: -1 })
                .populate('exam', 'title')
                .lean();
        }

        return NextResponse.json({ ...user, assessmentResult }, { status: 200 });

    } catch (error) {
        console.error('Me API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
