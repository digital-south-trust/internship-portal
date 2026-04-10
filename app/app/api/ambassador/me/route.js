import { NextResponse } from 'next/server';
import Ambassador from '../../../../models/Ambassador';
import User from '../../../../models/User';
import dbConnect from '../../../../lib/mongodb';

export async function GET(request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ message: 'Identity required' }, { status: 400 });
        }

        const searchEmail = email.trim().toLowerCase();
        
        // Fetch all possible matches to perform a manual normalized comparison
        const ambassadors = await Ambassador.find({ 
            email: new RegExp(searchEmail, "i") 
        });
        
        const ambassador = ambassadors.find(a => 
            a.email.trim().toLowerCase() === searchEmail
        );

        if (!ambassador) {
            return NextResponse.json({ message: 'Ambassador not found' }, { status: 404 });
        }

        // Find joined users using this referral code
        const referredUsers = await User.find({ referralCodeUsed: ambassador.referralCode })
            .select('fullName email status createdAt')
            .sort({ createdAt: -1 });

        return NextResponse.json({
            ...ambassador.toObject(),
            referredUsers,
            referredCount: referredUsers.length
        });

    } catch (error) {
        console.error('Ambassador Data Error:', error);
        return NextResponse.json({ message: 'Protocol Failure' }, { status: 500 });
    }
}
