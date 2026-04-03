
import mongoose from 'mongoose';

const TicketSchema = new mongoose.Schema({
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
        type: String, // Email or User ID if authenticated
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Ticket || mongoose.model('Ticket', TicketSchema);
