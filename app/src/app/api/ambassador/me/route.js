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
        
        let ambassador = ambassadors.find(a => 
            a.email.trim().toLowerCase() === searchEmail
        );

        if (!ambassador) {
            // Check if user is an admin in the User collection
            const adminUser = await User.findOne({ email: new RegExp(`^${searchEmail}$`, "i"), role: /admin/i });
            
            if (adminUser) {
                // Auto-provision an Ambassador profile for the Admin
                ambassador = await Ambassador.create({
                    fullName: adminUser.fullName || 'Administrator',
                    email: adminUser.email,
                    password: adminUser.password || 'auto-provisioned',
                    phone: adminUser.phone || '0000000000',
                    referralCode: `ADMIN${Math.floor(1000 + Math.random() * 9000)}`,
                    discountPercentage: 20,
                    commissionPercentage: 20
                });
            } else {
                return NextResponse.json({ message: 'Ambassador not found' }, { status: 404 });
            }
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
