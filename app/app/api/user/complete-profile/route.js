import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req) {
    try {
        const data = await req.json();
        const { email, ...profileData } = data;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findOne({ email });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check for duplicate phone
        if (profileData.phone) {
            const phoneOwner = await User.findOne({ 
                phone: profileData.phone,
                email: { $ne: email } 
            });
            if (phoneOwner) {
                return NextResponse.json({ error: 'This mobile number is registered already' }, { status: 400 });
            }
        }

        // Update user fields
        Object.assign(user, profileData);
        user.isProfileComplete = true;
        user.isApplicationSubmitted = true;
        user.status = 'VERIFIED'; 
        
        await user.save();

        return NextResponse.json({ success: true, message: 'Profile completed successfully!' }, { status: 200 });

    } catch (error) {
        console.error('Complete Profile API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
