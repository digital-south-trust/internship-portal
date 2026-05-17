import mongoose from 'mongoose';

const MeetingSchema = new mongoose.Schema({
    intern: { type: String, required: true },
    title: { type: String, required: true },
    type: { type: String, default: 'Sync' }, // 'Sync', 'Review', 'Milestone'
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    time: { type: String, required: true }, // Format: HH:MM AM/PM
    link: { type: String, required: true },
    description: { type: String }
}, { timestamps: true });

export default mongoose.models.Meeting || mongoose.model('Meeting', MeetingSchema);
