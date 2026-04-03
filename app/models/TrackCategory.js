import mongoose from 'mongoose';

const TrackCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    }
}, { timestamps: true });

export default mongoose.models.TrackCategory || mongoose.model('TrackCategory', TrackCategorySchema);
