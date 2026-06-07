
import mongoose from 'mongoose';

const ProjectRequestSchema = new mongoose.Schema({
    internId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    internName: String,
    internEmail: String,
    track: String,
    projectName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    projectType: {
        type: String,
        enum: ['custom', 'preset'],
        default: 'custom'
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    colorHex: { type: String, default: '#8b5cf6' },
    category: String,
    techStack: [String],
    repoLink: String,
    deployLink: String,
    documentFile: String,
    documentLink: String,
    solution: String,
    realWorld: String,
    matters: String,
    existingSolutions: String,
    objectives: String,
    features: String,
    apis: String,
    dataset: String,
    blockchainNetwork: String,
    smartContractLang: String,
    targetPlatform: String,
    researchBackground: String,
    hypothesis: String,
    innovation: String,
    relevance: String,
    researchOutput: String,
    startDate: String,
    endDate: String,
    milestones: String,
    blockchainNetwork: String,
    smartContractLang: String,
    tokenStandard: String,
    walletIntegration: String,
    storageUsed: String,
    deploymentNetwork: String,
    useCase: String,
    targetUsers: String,
    modelUsed: String,
    aiTools: String,
    vectorDatabase: String,
    deploymentPlatform: String,
    mlTaskType: String,
    algorithms: String,
    mlFramework: String,
    trainingEnvironment: String,
    appCategory: String,
    topics: [
        {
            title: String,
            subtopics: [
                {
                    title: String,
                    contentType: { type: String, enum: ['text', 'link', 'image'], default: 'text' },
                    contentValue: String
                }
            ]
        }
    ],
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
    dynamicFields: { type: Object, default: {} },
    progress: { type: Number, default: 0 },
    adminFeedback: String,
    difficulty: { type: String, default: 'Medium' },
    duration: String,
    lastSubmittedAt: Date,
    submissionHistory: { type: Array, default: [] },
    requestedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

ProjectRequestSchema.index({ internEmail: 1 });
ProjectRequestSchema.index({ internId: 1 });
ProjectRequestSchema.index({ requestedAt: -1 });
ProjectRequestSchema.index({ status: 1 });

if (mongoose.models.ProjectRequest) {
    delete mongoose.models.ProjectRequest;
}
export default mongoose.models.ProjectRequest || mongoose.model('ProjectRequest', ProjectRequestSchema);
