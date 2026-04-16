import mongoose from 'mongoose';

const CertificateSchema = new mongoose.Schema({
    internEmail: { type: String, required: true },
    internName: { type: String, required: true },
    title: { type: String, required: true }, // e.g. "Full Stack Web Development"
    certificateId: { type: String, required: true, unique: true },
    issuedDate: { type: Date, default: Date.now },
    issuer: { type: String, default: 'Digital South' },
    track: String,
    type: { type: String, default: 'Completion' }, // Completion, Excellence, etc.
    themeId: { type: Number, default: 1 }, // Map to templates 1-5
    customUrl: String, // If user uploads a custom image
    pdfUrl: String, // Future use
}, { timestamps: true });

export default mongoose.models.Certificate || mongoose.model('Certificate', CertificateSchema);
