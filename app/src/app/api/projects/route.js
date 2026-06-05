import dbConnect from "@/lib/mongodb";
import ProjectRequest from "@/models/ProjectRequest";
import User from "@/models/User";
import ProjectPool from "@/models/ProjectPool";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (id) {
            const project = await ProjectRequest.findById(id).populate('internId', 'fullName profilePicture avatarSeed');
            if (!project) {
                return NextResponse.json({ message: "Project not found" }, { status: 404 });
            }

            // Sync with pool template if preset project
            if (project.projectType === 'preset' || !project.projectType) {
                const poolProj = await ProjectPool.findOne({ title: project.projectName });
                if (poolProj) {
                    const projectObj = project.toObject();
                    projectObj.formPhases = poolProj.formPhases || [];
                    projectObj.topics = poolProj.topics || [];
                    projectObj.description = poolProj.description || projectObj.description;
                    if (poolProj.techStack) {
                        projectObj.techStack = typeof poolProj.techStack === 'string'
                            ? poolProj.techStack.split(',').map(s => s.trim())
                            : poolProj.techStack;
                    }
                    projectObj.difficulty = poolProj.difficulty || projectObj.difficulty;
                    projectObj.duration = poolProj.deadline || poolProj.duration || projectObj.duration;
                    projectObj.documentFile = poolProj.documentFile || projectObj.documentFile;
                    projectObj.documentLink = poolProj.documentLink || projectObj.documentLink;
                    return NextResponse.json(projectObj, { status: 200 });
                }
            }

            return NextResponse.json(project, { status: 200 });
        }

        const email = searchParams.get('email');
        const role = searchParams.get('role');

        let query = {};
        if (email) {
            query.internEmail = email;
        } else if (role !== 'admin') {
            return NextResponse.json({ message: "Email query parameter required" }, { status: 400 });
        }

        const projects = await ProjectRequest.find(query)
            .sort({ requestedAt: -1 })
            .populate('internId', 'fullName profilePicture avatarSeed');
        return NextResponse.json(projects, { status: 200 });
    } catch (error) {
        console.error("Error fetching projects:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await dbConnect();
        const body = await req.json();

        const { 
            internEmail, title, description, colorHex, techStack, repoLink, deployLink, documentFile, documentLink, 
            solution, progress, track, category, isPreset, status, projectType, difficulty, duration,
            realWorld, matters, existingSolutions, objectives, features, apis, dataset, blockchainNetwork,
            smartContractLang, targetPlatform, researchBackground, hypothesis, innovation, relevance,
            researchOutput, startDate, endDate, milestones,
            // Track specifics
            tokenStandard, walletIntegration, storageUsed, deploymentNetwork, useCase, targetUsers,
            modelUsed, aiTools, vectorDatabase, deploymentPlatform, mlTaskType, algorithms,
            mlFramework, trainingEnvironment, appCategory,
            formPhases, dynamicFields, topics
        } = body;

        if (!internEmail || !title || !description) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        const user = await User.findOne({ email: internEmail });
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        const validatedStatus = ['Pending', 'Approved', 'Rejected'].includes(status) 
            ? status 
            : (isPreset ? 'Approved' : 'Pending');

        const newProject = await ProjectRequest.create({
            internId: user._id,
            internName: user.fullName,
            internEmail: user.email,
            track,
            category,
            projectName: title,
            description,
            colorHex,
            techStack,
            repoLink,
            deployLink,
            documentFile,
            documentLink,
            solution,
            realWorld, matters, existingSolutions, objectives, features, apis, dataset, blockchainNetwork,
            smartContractLang, targetPlatform, researchBackground, hypothesis, innovation, relevance,
            researchOutput, startDate, endDate, milestones,
            tokenStandard, walletIntegration, storageUsed, deploymentNetwork, useCase, targetUsers,
            modelUsed, aiTools, vectorDatabase, deploymentPlatform, mlTaskType, algorithms,
            mlFramework, trainingEnvironment, appCategory,
            formPhases, dynamicFields, topics,
            difficulty: difficulty || 'Medium',
            duration,
            progress: progress || 0,
            status: validatedStatus,
            projectType: projectType || (isPreset ? 'preset' : 'custom')
        });

        return NextResponse.json({ message: "Project created successfully", project: newProject }, { status: 201 });
    } catch (error) {
        console.error("Error creating project:", error);
        return NextResponse.json({ message: "Error creating project", error: error.message }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        await dbConnect();
        const body = await req.json();
        const { 
            id, title, description, colorHex, techStack, repoLink, deployLink, documentFile, documentLink, 
            solution, progress, status, adminFeedback, category, difficulty, duration, track,
            realWorld, matters, existingSolutions, objectives, features, apis, dataset, blockchainNetwork,
            smartContractLang, targetPlatform, researchBackground, hypothesis, innovation, relevance,
            researchOutput, startDate, endDate, milestones,
            // Track specifics
            tokenStandard, walletIntegration, storageUsed, deploymentNetwork, useCase, targetUsers,
            modelUsed, aiTools, vectorDatabase, deploymentPlatform, mlTaskType, algorithms,
            mlFramework, trainingEnvironment, appCategory,
            formPhases, dynamicFields, topics,
            projectType,
            isSubmission
        } = body;

        if (!id) {
            return NextResponse.json({ message: "Project ID required" }, { status: 400 });
        }

        const updateData = { 
            projectName: title, description, colorHex, techStack, repoLink, deployLink, documentFile, 
            documentLink, solution, 
            realWorld, matters, existingSolutions, objectives, features, apis, dataset, blockchainNetwork,
            smartContractLang, targetPlatform, researchBackground, hypothesis, innovation, relevance,
            researchOutput, startDate, endDate, milestones,
            tokenStandard, walletIntegration, storageUsed, deploymentNetwork, useCase, targetUsers,
            modelUsed, aiTools, vectorDatabase, deploymentPlatform, mlTaskType, algorithms,
            mlFramework, trainingEnvironment, appCategory,
            formPhases, dynamicFields
        };

        if (!isSubmission && progress !== undefined) {
            updateData.progress = progress;
        }

        if (isSubmission) {
            const existingRequest = await ProjectRequest.findById(id);
            if (!existingRequest) {
                return NextResponse.json({ message: "Project not found" }, { status: 404 });
            }
            if (existingRequest.lastSubmittedAt) {
                const timeDiff = Date.now() - new Date(existingRequest.lastSubmittedAt).getTime();
                const hoursDiff = timeDiff / (1000 * 60 * 60);
                if (hoursDiff < 24) {
                    const remainingMs = (24 * 60 * 60 * 1000) - timeDiff;
                    return NextResponse.json({ 
                        message: "Submission locked. You can only submit once every 24 hours.", 
                        remainingMs 
                    }, { status: 403 });
                }
            }

            // Archive the submitted state of deliverables
            const newSubmission = {
                submittedAt: new Date(),
                repoLink: repoLink || "",
                deployLink: deployLink || "",
                solution: solution || "",
                documentFile: documentFile || "",
                documentLink: documentLink || "",
                dynamicFields: dynamicFields || {}
            };

            updateData.submissionHistory = [...(existingRequest.submissionHistory || []), newSubmission];
            updateData.lastSubmittedAt = new Date();
        }

        if (category !== undefined) updateData.category = category;
        if (track !== undefined) updateData.track = track;
        if (difficulty !== undefined) updateData.difficulty = difficulty;
        if (duration !== undefined) updateData.duration = duration;
        if (adminFeedback !== undefined) updateData.adminFeedback = adminFeedback;
        if (topics !== undefined) updateData.topics = topics;
        if (projectType !== undefined) updateData.projectType = projectType;
        
        if (status !== undefined) {
            if (['Pending', 'Approved', 'Rejected'].includes(status)) {
                updateData.status = status;
            }
        }

        const project = await ProjectRequest.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!project) {
            return NextResponse.json({ message: "Project not found" }, { status: 404 });
        }

        return NextResponse.json(project, { status: 200 });
    } catch (error) {
        console.error("Error updating project:", error);
        return NextResponse.json({ message: "Error updating project" }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: "Project ID required" }, { status: 400 });
        }

        const project = await ProjectRequest.findByIdAndDelete(id);
        if (!project) {
            return NextResponse.json({ message: "Project not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Project deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting project:", error);
        return NextResponse.json({ message: "Error deleting project", error: error.message }, { status: 500 });
    }
}
