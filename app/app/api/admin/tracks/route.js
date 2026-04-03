import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Track from '@/models/Track';
import TrackCategory from '@/models/TrackCategory';

const DEFAULT_PHASES = {
    CODING: [
        {
            name: "Initial Protocol",
            description: "Essential project identifiers and version control links.",
            fields: [
                { label: "GitHub Repository", type: "text" },
                { label: "Live Deployment Link", type: "link" }
            ]
        },
        {
            name: "Technical Stack",
            description: "Identify the primary technologies utilized in the deployment.",
            fields: [
                { label: "Core Implementation Language", type: "text" },
                { label: "Infrastructure / Cloud Provider", type: "text" }
            ]
        }
    ],
    RESEARCH: [
        {
            name: "Intellectual Assets",
            description: "Primary documentation and research publications.",
            fields: [
                { label: "Research Paper / Document Link", type: "link" },
                { label: "Abstract / Executive Summary", type: "textarea" }
            ]
        },
        {
            name: "Protocol Findings",
            description: "Key outcomes and analytical results.",
            fields: [
                { label: "Presentation Slides", type: "link" },
                { label: "Core Analytical Result", type: "textarea" }
            ]
        }
    ]
};

export async function GET() {
    try {
        await dbConnect();
        let tracks = await Track.find({});

        // Auto-seed if empty
        if (tracks.length === 0) {
            const TRACK_NAMES = {
                CODING: [
                    "Web Development",
                    "Blockchain / Web3",
                    "GenAI",
                    "AI/ML",
                    "App Development"
                ],
                RESEARCH: [
                    "Cybersecurity",
                    "Robotics",
                    "Semiconductor",
                    "Biotechnology",
                    "Renewable Energy",
                    "Artificial Intelligence",
                    "Quantum Computing"
                ]
            };

            const initialTracks = [];
            for (const category of ['CODING', 'RESEARCH']) {
                for (const name of TRACK_NAMES[category]) {
                    initialTracks.push({ 
                        category, 
                        name, 
                        description: `Default description for ${name}.`,
                        formPhases: DEFAULT_PHASES[category] 
                    });
                }
            }
            await Track.insertMany(initialTracks);
            tracks = await Track.find({}); // Re-fetch
        }

        // Apply defaults if they are missing (for existing tracks)
        const tracksWithDefaults = tracks.map(track => {
            const trackObj = track.toObject();
            if (!trackObj.formPhases || trackObj.formPhases.length === 0) {
                return { ...trackObj, formPhases: DEFAULT_PHASES[trackObj.category] || DEFAULT_PHASES.CODING };
            }
            return trackObj;
        });

        console.log(`API [GET] /api/admin/tracks: Found ${tracksWithDefaults.length} tracks.`);
        return NextResponse.json(tracksWithDefaults, { status: 200 });
    } catch (err) {
        console.error("API [GET] /api/admin/tracks error:", err);
        return NextResponse.json({ message: 'Error fetching tracks', error: err.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await dbConnect();
        let { category, name, description, formPhases } = await req.json();
        category = category.toUpperCase();

        const existingTrack = await Track.findOne({ category, name });
        if (existingTrack) {
            return NextResponse.json({ message: 'Track already exists' }, { status: 400 });
        }

        // Ensure formPhases is an array and fields are properly structured
        let finalPhases = Array.isArray(formPhases) && formPhases.length > 0
            ? formPhases
            : (DEFAULT_PHASES[category] || DEFAULT_PHASES.CODING);

        const track = await Track.create({ category, name, description, formPhases: finalPhases });
        return NextResponse.json(track, { status: 201 });
    } catch (error) {
        console.error("Track Creation Error:", error);
        return NextResponse.json({ 
            message: 'Error creating track', 
            error: error.message 
        }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        await dbConnect();
        const { id, name, description, formPhases, category, status } = await req.json();
        
        // 1. Get the current track state to see if name/category changed
        const currentTrack = await Track.findById(id);
        if (!currentTrack) {
            return NextResponse.json({ message: 'Track not found' }, { status: 404 });
        }

        const oldName = currentTrack.name;
        const newName = name || oldName; // Keep old name if not provided
        const newCategory = category?.toUpperCase();

        // 2. Perform the update on the track
        const updatedTrack = await Track.findByIdAndUpdate(
            id, 
            { 
                name: newName, 
                description, 
                formPhases, 
                category: newCategory,
                status: status?.toUpperCase() // Correctly handle status update
            }, 
            { new: true }
        );

        // 3. PROPAGATION: Handle track name or status changes
        const Exam = (await import('@/models/Exam')).default;
        const ProjectRequest = (await import('@/models/ProjectRequest')).default;
        const User = (await import('@/models/User')).default;

        const updates = [];

        // If track name changed, update all related collections
        if (oldName !== newName) {
            updates.push(
                Exam.updateMany({ track: oldName }, { track: newName }),
                ProjectRequest.updateMany({ track: oldName }, { track: newName }),
                User.updateMany({ track: oldName }, { track: newName })
            );
        }

        // If status changed to FROZEN, freeze all projects in this track
        if (status === 'FROZEN') {
            updates.push(ProjectRequest.updateMany({ track: newName }, { status: 'Frozen' }));
        } else if (status === 'ACTIVE' && currentTrack.status === 'FROZEN') {
            // Restore projects to Approved when track starts again
            updates.push(ProjectRequest.updateMany({ track: newName, status: 'Frozen' }, { status: 'Approved' }));
        }

        if (updates.length > 0) {
            await Promise.all(updates);
        }

        return NextResponse.json(updatedTrack, { status: 200 });
    } catch (err) {
        console.error("Track Update Propagation Error:", err);
        return NextResponse.json({ message: 'Error updating track', error: err.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        await dbConnect();
        const url = new URL(req.url);
        const id = url.searchParams.get('id');

        // 1. Get track name before deletion for cleanup
        const trackToDelete = await Track.findById(id);
        if (trackToDelete) {
            const trackName = trackToDelete.name;

            // 2. Cleanup related data
            const Exam = (await import('@/models/Exam')).default;
            const Question = (await import('@/models/Question')).default;
            const ProjectRequest = (await import('@/models/ProjectRequest')).default;
            
            // Find exams to cleanup their questions
            const exams = await Exam.find({ track: trackName });
            const examIds = exams.map(e => e._id);

            await Promise.all([
                // Remove questions for these exams
                Question.deleteMany({ examId: { $in: examIds } }),
                // Remove the exams
                Exam.deleteMany({ track: trackName }),
                // Remove project requests
                ProjectRequest.deleteMany({ track: trackName })
                // Note: We DON'T delete Users, we might just set their track to "Unassigned" or leave as is
            ]);
        }

        await Track.findByIdAndDelete(id);
        return NextResponse.json({ message: 'Track and all associated data purged.' }, { status: 200 });
    } catch (err) {
        console.error("Track Deletion Cleanup Error:", err);
        return NextResponse.json({ message: 'Error deleting track', error: err.message }, { status: 500 });
    }
}
