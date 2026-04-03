
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Please provide ur name.'],
    },
    email: {
        type: String,
        required: [true, 'Please provide an email.'],
        unique: true,
    },
    dob: {
        type: String,
    },
    phone: {
        type: String,
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
    },
    address: {
        type: String,
    },
    track: {
        type: String,
        required: [true, 'Please select a track.'],
    },
    duration: {
        type: String,
    },
    mode: {
        type: String, // 'Remote', 'In-office', etc.
        default: 'Remote',
    },
    joinDate: {
        type: Date,
        default: Date.now,
    },
    admissionId: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        enum: ['NEW', 'OTP_VERIFIED', 'ASSESSMENT_COMPLETED', 'SELECTED', 'REJECTED', 'PROFILE_PENDING', 'VERIFIED', 'ACTIVE', 'Terminated'],
        default: 'NEW',
    },
    otp: {
        type: String,
    },
    otpExpires: {
        type: Date,
    },
    reExamRequested: {
        type: Boolean,
        default: false,
    },
    password: {
        type: String,
        select: false, // Don't return password by default
    },
    role: {
        type: String,
        enum: ['intern', 'admin'],
        default: 'intern',
    },
    profilePicture: {
        type: String,
    },
    aadhaarNumber: { type: String },
    passportPhoto: { type: String }, // Storing as base64 or URL
    aadhaarCard: { type: String },
    educationQualification: {
        type: String,
    },
    courseName: { type: String },
    collegeName: { type: String },
    workingDetails: { type: String },
    resumeDocument: { type: String },
    avatarSeed: {
        type: String,
    },
    assignedAdmin: {
        type: String, // email of the admin assigned to this intern
        default: 'gauthamram.um@gmail.com',
    },
    missedMeetings: {
        type: Number,
        default: 0,
    },
    // Assessment Fields
    isAssessmentDone: {
        type: Boolean,
        default: false,
    },
    assessmentScore: {
        type: Number,
        default: 0,
    },
    assessmentDate: {
        type: Date,
    },
    reExamApproved: {
        type: Boolean,
        default: false,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    isApproved: {
        type: Boolean,
        default: false,
    },
    isProfileComplete: {
        type: Boolean,
        default: false,
    },
    selectionStatus: {
        type: String,
        enum: ['Pending Selection (24h Buffer)', 'Selected', 'Rejected'],
        default: 'Pending Selection (24h Buffer)',
    },
    aadharVerificationTries: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
