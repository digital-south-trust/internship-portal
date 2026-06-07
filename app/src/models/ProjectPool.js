import mongoose from 'mongoose';

const ProjectPoolSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, required: true },
    track: { type: String, required: true },
    difficulty: { type: String, default: 'Intermediate' },
    type: { type: String, default: 'Coding Project' },
    description: { type: String, required: true },
    realWorld: String,
    matters: String,
    existingSolutions: String,
    objectives: String,
    features: String,
    techStack: String,
    apis: String,
    dataset: String,
    researchBackground: String,
    hypothesis: String,
    innovation: String,
    relevance: String,
    researchOutput: String,
    startDate: String,
    endDate: String,
    milestones: String,
    documentFile: String,
    documentLink: String,
    timeline: String,
    repoLink: String,
    demoLink: String,
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
            name: { type: String, required: true },
            description: String,
            fields: [
                {
                    label: { type: String, required: true },
                    type: { type: String, enum: ['text', 'link', 'file', 'textarea'], default: 'text' }
                }
            ]
        }
    ],
    dynamicFields: { type: Object, default: {} },
    status: { type: String, default: 'Active' },
    deadline: { type: String, default: '1 Month' },
    enrolled: { type: Number, default: 0 }
}, { timestamps: true });

ProjectPoolSchema.index({ track: 1 });
ProjectPoolSchema.index({ createdAt: -1 });

if (mongoose.models.ProjectPool) {
    delete mongoose.models.ProjectPool;
}
export default mongoose.models.ProjectPool || mongoose.model('ProjectPool', ProjectPoolSchema);
