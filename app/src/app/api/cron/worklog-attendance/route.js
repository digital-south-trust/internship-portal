import { NextResponse } from 'next/server';
import { WorklogService } from '@/services/worklog.service';

export async function GET(req) {
    try {
        const authHeader = req.headers.get('authorization');
        
        // Secure in production, allow local execution for testing
        if (process.env.NODE_ENV === 'production') {
            if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        const result = await WorklogService.evaluateDailyAttendance();
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("Error in Worklog Cron:", error);
        return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
    }
}
