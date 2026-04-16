import mongoose from 'mongoose';

const ScheduleSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    adminEmail: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    meetingLink: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    reminder24hSent: {
        type: Boolean,
        default: false
    },
    reminder1hSent: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['Scheduled', 'Completed', 'Cancelled'],
        default: 'Scheduled'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Since Next.js clears modules on hot reload, avoid redefining model
export default mongoose.models.Schedule || mongoose.model('Schedule', ScheduleSchema);
