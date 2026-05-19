import { NextResponse } from 'next/server';
import { WorklogService } from '@/services/worklog.service';

export async function GET(req, { params }) {
    try {
        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: 'Worklog ID is required' }, { status: 400 });
        }

        const data = await WorklogService.getWorklogDetails(id);
        if (!data) {
            return NextResponse.json({ error: 'Worklog not found' }, { status: 404 });
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error("Error in GET /api/admin/worklogs/[id]:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
