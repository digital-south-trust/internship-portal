import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import WeeklyReview from '@/models/WeeklyReview';
import Schedule from '@/models/Schedule';
import User from '@/models/User';
import { sendMeetingReminder } from '@/lib/mailer';

/**
 * GET /api/cron/reminders
 *
 * This route should be called every ~30 minutes by a cron service
 * (e.g. Vercel Cron, an external service, or manually).
 *
 * It sends two types of emails:
 *   1. 24-hour reminder  → sent when meeting is 23–25 hours away
 *   2.  1-hour reminder  → sent when meeting is 50–70 minutes away
 *
 * Protected by a secret key in the query string: ?key=CRON_SECRET
 */
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    if (searchParams.get('key') !== process.env.CRON_SECRET) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();

    const now = new Date();

    // Windows: [now + 50min, now + 70min]  → 1-hour reminder
    const in1h_from = new Date(now.getTime() + 50 * 60 * 1000);
    const in1h_to = new Date(now.getTime() + 70 * 60 * 1000);

    // Windows: [now + 23h, now + 25h]  → 24-hour reminder
    const in24h_from = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const in24h_to = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    let sent = 0;
    let errors = 0;

    // ── Process WeeklyReview collection ──────────────────────────────────
    const reviews = await WeeklyReview.find({ status: 'Scheduled' });

    for (const r of reviews) {
        // Combine scheduledDate + scheduledTime into a JS Date
        const [h, m] = (r.scheduledTime || '10:00').split(':').map(Number);
        const meetingAt = new Date(r.scheduledDate);
        meetingAt.setHours(h, m, 0, 0);

        const is1h = meetingAt >= in1h_from && meetingAt <= in1h_to && !r.reminder1hSent;
        const is24h = meetingAt >= in24h_from && meetingAt <= in24h_to && !r.reminder24hSent;

        if (!is1h && !is24h) continue;

        const reminderType = is1h ? '⏰ 1 Hour Reminder' : '📅 Tomorrow Reminder';
        const description = `${reminderType} — ${r.weekLabel}`;

        const adminUser = await User.findOne({ email: r.assignedAdmin }).select('fullName');
        const adminName = adminUser?.fullName || r.assignedAdmin;

        const base = {
            internName: r.internName,
            date: r.scheduledDate.toISOString(),
            time: r.scheduledTime,
            meetingLink: r.meetLink,
            description,
        };

        try {
            await sendMeetingReminder({ ...base, to: r.internEmail, recipientName: r.internName, adminName, role: 'intern' });
            await sendMeetingReminder({ ...base, to: r.assignedAdmin, recipientName: adminName, adminName, role: 'admin' });

            if (is1h) r.reminder1hSent = true;
            if (is24h) r.reminder24hSent = true;
            await r.save();

            sent += 2;
        } catch (e) {
            console.error('Reminder email error (WeeklyReview):', e.message);
            errors++;
        }
    }

    // ── Process Schedule collection (regular meetings) ────────────────────
    try {
        const schedules = await Schedule.find({}).populate('userId', 'fullName email');
        for (const s of schedules) {
            const [h, m] = (s.time || '10:00').split(':').map(Number);
            const meetingAt = new Date(s.date);
            meetingAt.setHours(h, m, 0, 0);

            const is1h = meetingAt >= in1h_from && meetingAt <= in1h_to && !s.reminder1hSent;
            const is24h = meetingAt >= in24h_from && meetingAt <= in24h_to && !s.reminder24hSent;
            if (!is1h && !is24h) continue;

            const reminderType = is1h ? '⏰ 1 Hour Reminder' : '📅 Tomorrow Reminder';
            const internName = s.userId?.fullName || 'Intern';
            const internEmail = s.userId?.email;
            if (!internEmail) continue;

            const base = {
                internName,
                date: new Date(s.date).toISOString(),
                time: s.time,
                meetingLink: s.meetingLink,
                description: `${reminderType} — ${s.description || 'Meeting'}`,
            };

            const adminUser = await User.findOne({ email: s.adminEmail }).select('fullName');
            const adminName = adminUser?.fullName || s.adminEmail;

            try {
                await sendMeetingReminder({ ...base, to: internEmail, recipientName: internName, adminName, role: 'intern' });
                await sendMeetingReminder({ ...base, to: s.adminEmail, recipientName: adminName, adminName, role: 'admin' });

                if (is1h) s.reminder1hSent = true;
                if (is24h) s.reminder24hSent = true;
                await s.save();

                sent += 2;
            } catch (e) {
                console.error('Reminder email error (Schedule):', e.message);
                errors++;
            }
        }
    } catch (e) {
        // Schedule model might not exist in all setups — safe to skip
        console.warn('Schedule model error (skipping):', e.message);
    }

    return NextResponse.json({ message: `Sent ${sent} reminder emails. Errors: ${errors}.`, sent, errors }, { status: 200 });
}
