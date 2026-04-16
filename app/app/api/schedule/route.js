import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import Schedule from '@/models/Schedule';
import WeeklyReview from '@/models/WeeklyReview';
import User from '@/models/User';
import { sendMeetingReminder, sendMeetingCancellation } from '@/lib/mailer';

export async function POST(req) {
    try {
        await connectMongo();
        const body = await req.json();
        const { userId, adminEmail, date, time, meetingLink, description } = body;

        // 9am to 8pm validation
        if (time < "09:00" || time > "20:00") {
            return NextResponse.json({ message: "Meetings must be scheduled between 09:00 and 20:00." }, { status: 400 });
        }

        // Fetch intern details
        const intern = await User.findById(userId);
        if (!intern) {
            return NextResponse.json({ message: "Intern not found" }, { status: 404 });
        }

        // Determine which admin email receives the copy.
        // Use the intern's assignedAdmin if set, else fall back to the scheduling adminEmail.
        const assignedAdminEmail = intern.assignedAdmin || adminEmail;

        // Fetch assigned admin's name (for display in the intern's email)
        const adminUser = await User.findOne({ email: assignedAdminEmail }).select('fullName');
        const adminName = adminUser?.fullName || assignedAdminEmail;

        // Save schedule
        const newSchedule = new Schedule({ userId, adminEmail, date, time, meetingLink, description });
        await newSchedule.save();

        // ── Fire emails (non-blocking — don't fail schedule creation if email fails) ──
        const emailBase = { internName: intern.fullName, date, time, meetingLink, description };

        // 1. Email to intern
        sendMeetingReminder({
            ...emailBase,
            to: intern.email,
            recipientName: intern.fullName,
            adminName,
            role: 'intern',
        }).catch(e => console.error("Intern email error:", e));

        // 2. Email to assigned admin
        sendMeetingReminder({
            ...emailBase,
            to: assignedAdminEmail,
            recipientName: adminName,
            adminName,
            role: 'admin',
        }).catch(e => console.error("Admin email error:", e));

        return NextResponse.json({ message: "Schedule created and reminders sent!", schedule: newSchedule }, { status: 201 });
    } catch (error) {
        console.error("Failed to create schedule:", error);
        return NextResponse.json({ message: "Failed to create schedule" }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        await connectMongo();

        const url = new URL(req.url);
        const email = url.searchParams.get('email');
        const role = url.searchParams.get('role');

        if (!email && role !== 'admin') {
            return NextResponse.json({ message: "Missing email parameter" }, { status: 400 });
        }

        let schedules = [];

        if (role === 'admin') {
            schedules = await Schedule.find({ adminEmail: email })
                .populate('userId', 'fullName email track')
                .lean();
        } else {
            const user = await User.findOne({ email });
            if (!user) {
                return NextResponse.json({ message: "User not found" }, { status: 404 });
            }
            
            // Fetch ad-hoc meetings
            const adhocMeetings = await Schedule.find({ userId: user._id })
                .populate('userId', 'fullName')
                .lean();
                
            // Fetch automated weekly reviews
            const reviews = await WeeklyReview.find({ internId: user._id })
                .lean();
                
            // Normalize and Combine
            const normalizedMeetings = adhocMeetings.map(m => ({
                ...m,
                type: 'meeting',
                tag: 'meeting'
            }));
            
            const normalizedReviews = reviews.map(r => ({
                ...r,
                date: r.scheduledDate,
                time: r.scheduledTime,
                meetingLink: r.meetLink,
                description: `Weekly Review: ${r.weekLabel}. Progress: ${r.progressRating || 'Pending'}`,
                adminEmail: r.assignedAdmin,
                type: 'review',
                tag: 'review'
            }));
            
            schedules = [...normalizedMeetings, ...normalizedReviews].sort((a, b) => new Date(a.date) - new Date(b.date));
        }

        return NextResponse.json(schedules, { status: 200 });
    } catch (error) {
        console.error("Failed to fetch schedules:", error);
        return NextResponse.json({ message: "Failed to fetch schedules" }, { status: 500 });
    }
}
export async function PATCH(req) {
    try {
        await connectMongo();
        const { id, date, time, meetingLink, status } = await req.json();

        const updates = {};
        if (date) updates.date = new Date(date);
        if (time) updates.time = time;
        if (meetingLink) updates.meetingLink = meetingLink;
        if (status) updates.status = status;

        const updated = await Schedule.findByIdAndUpdate(id, { $set: updates }, { new: true }).populate('userId', 'fullName email');

        if (!updated) {
            return NextResponse.json({ message: "Schedule not found" }, { status: 404 });
        }

        // If status changed to Cancelled, send email
        if (status === 'Cancelled' && updated.userId) {
            sendMeetingCancellation({
                to: updated.userId.email,
                internName: updated.userId.fullName,
                date: updated.date,
                time: updated.time,
                description: updated.description
            }).catch(e => console.error("Cancellation email error:", e));
        }

        return NextResponse.json({ message: "Schedule updated successfully!", schedule: updated }, { status: 200 });
    } catch (error) {
        console.error("Failed to update schedule:", error);
        return NextResponse.json({ message: "Failed to update schedule" }, { status: 500 });
    }
}
