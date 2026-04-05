import mongoose from 'mongoose';

const ReplySchema = new mongoose.Schema({
    message: { type: String, required: true },
    repliedBy: { type: String },
    repliedAt: { type: Date, default: Date.now },
});

const TicketSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['Bug Report', 'Suggest a Feature (UI)', 'Change Problem Statement', 'Intern Doubt', 'Others'],
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['Open', 'In Progress', 'Resolved'],
        default: 'Open',
    },
    reportedBy: {
        type: String, // Email of the intern
    },
    replies: [ReplySchema],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Ticket || mongoose.model('Ticket', TicketSchema);
