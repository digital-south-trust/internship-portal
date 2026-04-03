import mongoose from "mongoose";

const pendingUserSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    track: { type: String, required: true },
    otp: { type: String, required: true },
    otpExpires: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now, expires: 600 } // Auto-delete after 10 mins
}, { timestamps: true });

export default mongoose.models.PendingUser || mongoose.model("PendingUser", pendingUserSchema);
