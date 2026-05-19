import { NextResponse } from 'next/server';
import { WorklogService } from '@/services/worklog.service';
import { worklogCreateSchema } from '@/validations/worklog.schema';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

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

        const data = await WorklogService.getInternHistory(user._id);
        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error("Error in GET /api/worklogs:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await dbConnect();
        const body = await req.json();
        const { email, content, links } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Validate submission payload
        const validation = worklogCreateSchema.safeParse({ content, links });
        if (!validation.success) {
            return NextResponse.json({ 
                error: 'Validation failed', 
                details: validation.error.flatten().fieldErrors 
            }, { status: 400 });
        }

        const user = await User.findOne({ email }).lean();
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const newLog = await WorklogService.submitWorklog(user._id, validation.data);
        return NextResponse.json({ message: 'Worklog submitted successfully', worklog: newLog }, { status: 201 });
    } catch (error) {
        console.error("Error in POST /api/worklogs:", error);
        return NextResponse.json({ error: error.message || 'Failed to submit worklog' }, { status: 500 });
    }
}
