import mongoose from 'mongoose';

const LiveBookCourseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    desc: { type: String },
    tracks: [{ type: String }],
    modules: [{
        id: String,
        title: String
    }],
    icon: { type: String, default: 'BookOpen' },
    status: { type: String, default: 'Draft' }
}, { timestamps: true });

export default mongoose.models.LiveBookCourse || mongoose.model('LiveBookCourse', LiveBookCourseSchema);
