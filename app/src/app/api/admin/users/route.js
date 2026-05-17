import { NextResponse } from "next/server";
import { UserService } from "@/services/user.service";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        
        // Pagination logic
        const pageParam = searchParams.get('page');
        const limitParam = searchParams.get('limit');
        
        const page = pageParam ? parseInt(pageParam, 10) : 1;
        const limit = limitParam ? parseInt(limitParam, 10) : 100; // Increased default limit for legacy support
        
        // Filtering logic (exclude rejected by default)
        const query = {
            status: { $ne: 'REJECTED' },
            selectionStatus: { $ne: 'Rejected' }
        };

        // Delegate db operations to the Service Layer
        const result = await UserService.getUsersPaginated({ page, limit, query });

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("[API_ADMIN_USERS_GET] Error fetching users:", error);
        return NextResponse.json({ 
            message: "Internal Server Error", 
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
