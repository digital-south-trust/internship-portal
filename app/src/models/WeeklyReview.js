import mongoose from 'mongoose';

const WeeklyReviewSchema = new mongoose.Schema({
    internId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    internName: { type: String, required: true },
    internEmail: { type: String, required: true },
    assignedAdmin: { type: String, default: 'gauthamram.um@gmail.com' },
    track: { type: String, default: '' },
    weekLabel: { type: String, required: true }, // e.g. "Week of Mar 10, 2026"
    weekStart: { type: Date, required: true },
    meetLink: { type: String, default: 'https://meet.google.com/vcd-gfct-jqa' },
    scheduledDate: { type: Date, required: true },
    scheduledTime: { type: String, default: '10:00' },
    status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled'], default: 'Scheduled' },
    progressRating: { type: String, enum: ['', 'Excellent', 'On Track', 'Needs Attention', 'Behind'], default: '' },
    progressNote: { type: String, default: '' },
    reminder24hSent: { type: Boolean, default: false },
    reminder1hSent: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.WeeklyReview || mongoose.model('WeeklyReview', WeeklyReviewSchema);
