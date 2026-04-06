import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Ambassador from "@/models/Ambassador";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req) {
    try {
        await dbConnect();
        const { email, password } = await req.json();

        // 1. Identify Identity - Priority: Ambassador > Admin/User (Foolproof Search)
        const searchEmail = email.trim().toLowerCase();
        
        // Fetch all possible matches to perform a manual normalized comparison
        const ambassadors = await Ambassador.find({ 
            email: new RegExp(searchEmail, "i") 
        }).select('+password');
        
        let ambassadorRecord = ambassadors.find(a => 
            a.email.trim().toLowerCase() === searchEmail
        );

        let userRecord = null;
        if (!ambassadorRecord) {
            const users = await User.find({ 
                email: new RegExp(searchEmail, "i") 
            }).select('+password');
            userRecord = users.find(u => 
                u.email.trim().toLowerCase() === searchEmail
            );
        }

        let user = ambassadorRecord || userRecord;
        let isAmbassador = !!ambassadorRecord;

        if (!user) {
            return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
        }

        // Verify password
        if (!user.password) {
            return NextResponse.json({ message: "Please reset your password or register again." }, { status: 401 });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
        }

        // Block terminated users
        if (user.status === 'Terminated') {
            return NextResponse.json({
                message: "Your account has been terminated.",
                contact: "gautham@digitalsouth.co.in",
                terminated: true
            }, { status: 403 });
        }

        // Return user info (without password)
        const userObj = user.toObject();
        delete userObj.password;
        if (isAmbassador) userObj.role = 'ambassador';

        // Determine redirection based on status
        const roadmap = {
            'OTP_VERIFIED': '/assessment',
            'ASSESSMENT_COMPLETED': '/internship/result-pending',
            'SELECTED': '/dashboard/complete-profile',
            'PROFILE_PENDING': '/dashboard/complete-profile',
            'REJECTED': '/internship/rejected',
            'Active': '/dashboard',
            'ACTIVE': '/dashboard'
        };

        let redirectTo = '/dashboard';
        if (isAmbassador) {
            redirectTo = '/ambassador/dashboard';
        } else if (user.role === 'admin') {
            redirectTo = '/admin';
        } else {
            redirectTo = roadmap[user.status] || '/dashboard';
        }

        const response = NextResponse.json({
            message: "Login successful",
            user: userObj,
            redirectTo
        }, { status: 200 });

        // Set cookies locally for the middleware to use
        response.cookies.set('userRole', isAmbassador ? 'ambassador' : user.role, { path: '/', maxAge: 10800 });
        response.cookies.set('userEmail', user.email, { path: '/', maxAge: 10800 });

        return response;

    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
    }
}
