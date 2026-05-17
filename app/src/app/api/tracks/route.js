import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Track from '@/models/Track';

export async function GET() {
    try {
        await dbConnect();
        
        // Fetch only basic info for public registration
        const tracks = await Track.find(
            {}, 
            { name: 1, category: 1, status: 1 }
        ).lean();

        return NextResponse.json(tracks, { status: 200 });
    } catch (error) {
        console.error('Public API [GET] /api/tracks Error:', error);
        return NextResponse.json({ error: 'Failed to fetch tracks' }, { status: 500 });
    }
}
