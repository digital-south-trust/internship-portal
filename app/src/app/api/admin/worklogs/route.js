import { NextResponse } from 'next/server';
import { WorklogService } from '@/services/worklog.service';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const tab = searchParams.get('tab') || 'today';
        const search = searchParams.get('search') || '';
        const filter = searchParams.get('filter') || 'All';

        if (tab === 'today') {
            const data = await WorklogService.getAdminTodayLogs(search, filter);
            return NextResponse.json(data, { status: 200 });
        } else if (tab === 'previous') {
            const data = await WorklogService.getAdminInternsList(search);
            return NextResponse.json(data, { status: 200 });
        } else {
            return NextResponse.json({ error: "Invalid tab parameter. Must be 'today' or 'previous'." }, { status: 400 });
        }
    } catch (error) {
        console.error("Error in GET /api/admin/worklogs:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
