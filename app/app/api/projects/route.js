import dbConnect from "@/lib/mongodb";
import ProjectRequest from "@/models/ProjectRequest";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');
        const role = searchParams.get('role');

        let query = {};
        if (email) {
            query.internEmail = email;
        } else if (role !== 'admin') {
            return NextResponse.json({ message: "Email query parameter required" }, { status: 400 });
        }

        const projects = await ProjectRequest.find(query).sort({ requestedAt: -1 });
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
            solution, progress, track, category, isPreset,
            realWorld, matters, existingSolutions, objectives, features, apis, dataset, blockchainNetwork,
            smartContractLang, targetPlatform, researchBackground, hypothesis, innovation, relevance,
            researchOutput, startDate, endDate, milestones,
            // Track specifics
            tokenStandard, walletIntegration, storageUsed, deploymentNetwork, useCase, targetUsers,
            modelUsed, aiTools, vectorDatabase, deploymentPlatform, mlTaskType, algorithms,
            mlFramework, trainingEnvironment, appCategory,
            formPhases, dynamicFields
        } = body;

        if (!internEmail || !title || !description) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        const user = await User.findOne({ email: internEmail });
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

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
            formPhases, dynamicFields,
            progress: progress || 10,
            status: isPreset ? 'Approved' : 'Pending',
            projectType: isPreset ? 'preset' : 'custom'
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
            solution, progress, status, adminFeedback, category,
            realWorld, matters, existingSolutions, objectives, features, apis, dataset, blockchainNetwork,
            smartContractLang, targetPlatform, researchBackground, hypothesis, innovation, relevance,
            researchOutput, startDate, endDate, milestones,
            // Track specifics
            tokenStandard, walletIntegration, storageUsed, deploymentNetwork, useCase, targetUsers,
            modelUsed, aiTools, vectorDatabase, deploymentPlatform, mlTaskType, algorithms,
            mlFramework, trainingEnvironment, appCategory,
            formPhases, dynamicFields
        } = body;

        if (!id) {
            return NextResponse.json({ message: "Project ID required" }, { status: 400 });
        }

        const updateData = { 
            projectName: title, description, colorHex, techStack, repoLink, deployLink, documentFile, 
            documentLink, solution, progress, 
            realWorld, matters, existingSolutions, objectives, features, apis, dataset, blockchainNetwork,
            smartContractLang, targetPlatform, researchBackground, hypothesis, innovation, relevance,
            researchOutput, startDate, endDate, milestones,
            tokenStandard, walletIntegration, storageUsed, deploymentNetwork, useCase, targetUsers,
            modelUsed, aiTools, vectorDatabase, deploymentPlatform, mlTaskType, algorithms,
            mlFramework, trainingEnvironment, appCategory,
            formPhases, dynamicFields
        };
        if (category) updateData.category = category;
        if (status) updateData.status = status;
        if (adminFeedback !== undefined) updateData.adminFeedback = adminFeedback;

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
