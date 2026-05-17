import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findOne({ email }).lean();
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        let assessmentResult = null;
        if (user.isAssessmentDone) {
            const Result = (await import('@/models/Result')).default;
            await import('@/models/Exam'); // Register Exam model for population
            assessmentResult = await Result.findOne({ user: user._id })
                .sort({ submittedAt: -1 })
                .populate('exam', 'title')
                .lean();
        }

        return NextResponse.json({ ...user, assessmentResult }, { status: 200 });

    } catch (error) {
        console.error('Me API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        await dbConnect();
        const body = await req.json();
        const { email, password, avatarSeed, profilePicture, profilePic, ...otherData } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const updates = { ...otherData };
        
        // Match both naming conventions just in case
        if (avatarSeed !== undefined) updates.avatarSeed = avatarSeed;
        if (profilePicture !== undefined) updates.profilePicture = profilePicture;
        if (profilePic !== undefined) updates.profilePicture = profilePic;

        if (password) {
            const bcrypt = (await import('bcryptjs')).default;
            updates.password = await bcrypt.hash(password, 10);
        }

        const user = await User.findOneAndUpdate(
            { email },
            { $set: updates },
            { new: true, runValidators: true }
        ).lean();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // If user is an admin, also sync their details to the Ambassador collection
        if (user.role === 'admin') {
            const Ambassador = (await import('@/models/Ambassador')).default;
            await Ambassador.findOneAndUpdate(
                { email: user.email },
                { 
                    $set: { 
                        fullName: user.fullName,
                        phone: user.phone,
                        password: user.password // Sync password as well if changed
                    } 
                }
            );
        }

        // Sync name changes to ProjectRequests where this user is the intern
        const ProjectRequest = (await import('@/models/ProjectRequest')).default;
        await ProjectRequest.updateMany(
            { internId: user._id },
            { $set: { internName: user.fullName } }
        );

        return NextResponse.json({ message: 'Profile updated successfully', user }, { status: 200 });
    } catch (error) {
        console.error('User Update Error:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
