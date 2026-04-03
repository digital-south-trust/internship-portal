import mongoose from 'mongoose';

const ChatConversationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, default: 'New Conversation' },
    messages: [{
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
    }],
    aiResponseCount: { type: Number, default: 0 },
    isResolved: { type: Boolean, default: null },
    isPinned: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.ChatConversation || mongoose.model('ChatConversation', ChatConversationSchema);
