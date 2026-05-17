import mongoose from 'mongoose';

const AmbassadorSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Please provide name.'],
    },
    email: {
        type: String,
        required: [true, 'Please provide email.'],
        unique: true,
    },
    password: {
        type: String,
        required: [true, 'Please provide password.'],
    },
    phone: {
        type: String,
        required: [true, 'Please provide phone.'],
    },
    collegeName: {
        type: String,
    },
    aadhaarNumber: {
        type: String,
    },
    referralCode: {
        type: String,
        unique: true,
        required: true,
    },
    discountPercentage: {
        type: Number,
        default: 10, // 10% discount for the user
    },
    commissionPercentage: {
        type: Number,
        default: 10, // 10% commission for the ambassador
    },
    earnings: {
        type: Number,
        default: 0,
    },
    userCount: {
        type: Number,
        default: 0,
    }
}, { timestamps: true });

export default mongoose.models.Ambassador || mongoose.model('Ambassador', AmbassadorSchema);
