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

        const search = searchParams.get('search');
        const roleFilter = searchParams.get('roleFilter');
        const sortParam = searchParams.get('sort');

        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { track: { $regex: search, $options: 'i' } }
            ];
        }

        if (roleFilter && roleFilter !== 'all') {
             query.role = roleFilter;
        }

        let sort = { createdAt: -1 };
        if (sortParam === 'name') {
            sort = { fullName: 1 };
        } else if (sortParam === 'role') {
            sort = { role: 1 };
        } else if (sortParam === 'score') {
            sort = { assessmentScore: -1 };
        }

        // Delegate db operations to the Service Layer
        const result = await UserService.getUsersPaginated({ page, limit, query, sort });

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("[API_ADMIN_USERS_GET] Error fetching users:", error);
        return NextResponse.json({ 
            message: "Internal Server Error", 
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
