import { NextResponse } from 'next/server';
import Ambassador from '../../../../models/Ambassador';
import dbConnect from '../../../../lib/mongodb';

export async function GET(request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.json({ error: 'Code is required' }, { status: 400 });
        }

        const ambassador = await Ambassador.findOne({ referralCode: code.toUpperCase() });

        if (!ambassador) {
            return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
        }

        // Return relevant details for UI display
        return NextResponse.json({
            fullName: ambassador.fullName,
            referralCode: ambassador.referralCode,
            discountPercentage: ambassador.discountPercentage || 10
        });
    } catch (error) {
        console.error('Validate Referral Error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
