import mongoose from 'mongoose';

const TrackSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        uppercase: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    formPhases: [
        {
            name: String,
            description: String,
            fields: [
                { 
                    label: String, 
                    type: { type: String }
                }
            ]
        }
    ],
    status: {
        type: String,
        enum: ['ACTIVE', 'FROZEN'],
        default: 'ACTIVE',
        uppercase: true
    }
}, { timestamps: true });

export default mongoose.models.Track || mongoose.model('Track', TrackSchema);
