
import WeeklyReview from '@/models/WeeklyReview';
import User from '@/models/User';
import { sendMeetingReminder } from '@/lib/mailer';

const DEFAULT_LINK = 'https://meet.google.com/vcd-gfct-jqa';
const SLOT_MINUTES = 20;            // gap between interns on same date
const BASE_TIME = '10:00';       // first slot of the day (HH:MM)
const MEETINGS_PER_MONTH = 4;       // one per week

/**
 * Adds `mins` minutes to a "HH:MM" string and returns "HH:MM"
 */
function addMinutes(timeStr, mins) {
    const [h, m] = timeStr.split(':').map(Number);
    const total = h * 60 + m + mins;
    const hh = String(Math.floor(total / 60) % 24).padStart(2, '0');
    const mm = String(total % 60).padStart(2, '0');
    return `${hh}:${mm}`;
}

/**
 * Auto-schedule 4 weekly reviews for a single intern starting from `startDate`.
 * Each week's meeting date lands on staggered time based on existing bookings.
 *
 * @param {Object} intern  - Mongoose User doc (fullName, email, track, assignedAdmin, _id)
 * @param {Date}   startDate - first meeting date (intern's joinDate or today)
 * @param {string} meetLink  - Google Meet / Zoom URL
 * @returns {Array}  created WeeklyReview docs
 */
export async function scheduleMonthlyReviews(intern, startDate, meetLink = DEFAULT_LINK, startTime = '10:00') {
    const created = [];
    const baseTimeForDay = startTime || BASE_TIME;

    for (let week = 0; week < MEETINGS_PER_MONTH; week++) {
        // Target date = startDate + 7*week days (spread weekly)
        const target = new Date(startDate);
        target.setDate(target.getDate() + 7 * week);
        target.setUTCHours(0, 0, 0, 0);

        // How many reviews are already booked ON that exact date?
        const dateStart = new Date(target); dateStart.setUTCHours(0, 0, 0, 0);
        const dateEnd = new Date(target); dateEnd.setUTCHours(23, 59, 59, 999);
        const existingCount = await WeeklyReview.countDocuments({
            scheduledDate: { $gte: dateStart, $lte: dateEnd },
        });

        const slotTime = addMinutes(baseTimeForDay, existingCount * SLOT_MINUTES);

        // Label e.g. "Week 1 — Mar 10, 2026"
        const weekLabel = `Week ${week + 1} — ${target.toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
        })}`;

        // Skip if this intern already has a review for this week
        const exists = await WeeklyReview.findOne({
            internId: intern._id,
            scheduledDate: { $gte: dateStart, $lte: dateEnd },
        });
        if (exists) continue;

        const adminEmail = intern.assignedAdmin || 'gauthamram.um@gmail.com';

        const review = await WeeklyReview.create({
            internId: intern._id,
            internName: intern.fullName,
            internEmail: intern.email,
            assignedAdmin: adminEmail,
            track: intern.track || '',
            weekLabel,
            weekStart: target,
            meetLink,
            scheduledDate: target,
            scheduledTime: slotTime,
            status: 'Scheduled',
            emailSent: false,
        });

        // Removed the initial confirmation emails per new instruction.
        // Reminders will naturally be picked up by the chron job exactly 24 hours 
        // and 1 hour heavily before the specific week hits.

        created.push(review);
    }

    return created;
}
