import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import WeeklyReview from '@/models/WeeklyReview';
import User from '@/models/User';
import { scheduleMonthlyReviews } from '@/lib/scheduleReviews';
import { sendMeetingCancellation } from '@/lib/mailer';

const DEFAULT_LINK = 'https://meet.google.com/vcd-gfct-jqa';

/* ── GET  — list all weekly reviews ── */
export async function GET(req) {
    try {
        await connectMongo();
        const { searchParams } = new URL(req.url);
        const internId = searchParams.get('internId');
        const query = internId ? { internId } : {};
        const reviews = await WeeklyReview.find(query).sort({ scheduledDate: 1, scheduledTime: 1 });
        return NextResponse.json(reviews, { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

/* ── POST — schedule 4 weekly reviews for one intern ── */
export async function POST(req) {
    try {
        await connectMongo();
        const body = await req.json();
        const {
            internId,
            meetLink = DEFAULT_LINK,
            startDate, // optional ISO date — defaults to today
            startTime = '10:00'
        } = body;

        if (!internId) {
            return NextResponse.json({ message: 'internId is required' }, { status: 400 });
        }

        const intern = await User.findById(internId).select('fullName email track assignedAdmin joinDate');
        if (!intern) {
            return NextResponse.json({ message: 'Intern not found' }, { status: 404 });
        }

        // Use provided startDate, or intern joinDate, or today
        const from = startDate
            ? new Date(startDate)
            : intern.joinDate
                ? new Date(intern.joinDate)
                : new Date();

        const created = await scheduleMonthlyReviews(intern, from, meetLink, startTime);

        return NextResponse.json({
            message: `Scheduled ${created.length} review(s) for ${intern.fullName}. (${4 - created.length} already existed.)`,
            created,
        }, { status: 201 });

    } catch (err) {
        console.error(err);
        return NextResponse.json({ message: 'Server error', error: err.message }, { status: 500 });
    }
}

/* ── PATCH — update progress / status / meetLink on a single review ── */
export async function PATCH(req) {
    try {
        await connectMongo();
        const { id, progressRating, progressNote, status, meetLink, scheduledDate, scheduledTime } = await req.json();
        const updates = {};
        if (progressRating !== undefined) updates.progressRating = progressRating;
        if (progressNote !== undefined) updates.progressNote = progressNote;
        if (status !== undefined) updates.status = status;
        if (meetLink !== undefined) updates.meetLink = meetLink;
        if (scheduledDate !== undefined) updates.scheduledDate = new Date(scheduledDate);
        if (scheduledTime !== undefined) updates.scheduledTime = scheduledTime;

        const updated = await WeeklyReview.findByIdAndUpdate(id, { $set: updates }, { new: true });
        if (!updated) return NextResponse.json({ message: 'Review not found' }, { status: 404 });

        // If status changed to Cancelled, send email
        if (status === 'Cancelled') {
            const intern = await User.findById(updated.internId).select('fullName email');
            if (intern) {
                sendMeetingCancellation({
                    to: intern.email,
                    internName: intern.fullName,
                    date: updated.scheduledDate,
                    time: updated.scheduledTime,
                    description: `Weekly Review — ${updated.weekLabel}`
                }).catch(e => console.error("Cancellation email error:", e));
            }
        }

        return NextResponse.json(updated, { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}
