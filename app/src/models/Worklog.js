import mongoose from 'mongoose';

const WorklogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: String, // Normalized to YYYY-MM-DD
        required: true,
    },
    content: {
        type: String,
        default: '',
    },
    links: {
        type: [String],
        default: [],
    },
    status: {
        type: String,
        enum: ['Present', 'Absent'],
        required: true,
        default: 'Present',
    },
}, { timestamps: true });

// A user can only have ONE worklog entry per date
WorklogSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.Worklog || mongoose.model('Worklog', WorklogSchema);
