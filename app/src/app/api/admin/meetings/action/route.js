import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import WeeklyReview from '@/models/WeeklyReview';
import User from '@/models/User';
import { sendMissedMeetingWarning } from '@/lib/mailer';

export async function POST(req) {
    try {
        await connectMongo();
        const body = await req.json();
        const { reviewId, action } = body; // action can be 'missed' or 'attended'

        if (!reviewId || !action) {
            return NextResponse.json({ message: 'Missing reviewId or action' }, { status: 400 });
        }

        const review = await WeeklyReview.findById(reviewId);
        if (!review) {
            return NextResponse.json({ message: 'Meeting not found' }, { status: 404 });
        }

        const user = await User.findById(review.internId);
        if (!user) {
            return NextResponse.json({ message: 'Intern not found' }, { status: 404 });
        }

        if (action === 'missed') {
            // Increment missed meetings
            user.missedMeetings = (user.missedMeetings || 0) + 1;
            const newCount = user.missedMeetings;

            // Terminate if 3 misses
            if (newCount >= 3) {
                user.status = 'Terminated';
            }

            await user.save();

            // Send warning email
            await sendMissedMeetingWarning({
                to: user.email,
                internName: user.fullName,
                warningCount: newCount > 3 ? 3 : newCount,
            });

            // Update meeting status
            review.status = 'Cancelled';
            review.progressNote = `Missed ${newCount}/3 meetings.`;
            await review.save();

            return NextResponse.json({
                message: newCount >= 3 ? 'Intern terminated due to 3 missed meetings' : `Warning ${newCount}/3 sent to intern`,
                action: 'missed',
                missedCount: newCount
            }, { status: 200 });

        } else if (action === 'attended') {
            review.status = 'Completed';
            // Also reset missed meetings? Or just don't reset. Usually we don't reset unless specified.
            await review.save();

            return NextResponse.json({
                message: 'Meeting marked as attended.',
                action: 'attended'
            }, { status: 200 });
        } else {
            return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
        }

    } catch (err) {
        console.error('Action error:', err);
        return NextResponse.json({ message: 'Server error', error: err.message }, { status: 500 });
    }
}
