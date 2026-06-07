import { NextResponse } from 'next/server';
import Ambassador from '../../../../models/Ambassador';
import dbConnect from '../../../../lib/mongodb';
import { sendAmbassadorOfferLetter } from '../../../../lib/mailer';
import bcrypt from 'bcryptjs';

export async function POST(req) {
    try {
        await dbConnect();
        const body = await req.json();
        const { fullName, email, phone, collegeName, aadhaarNumber, discountPercentage, commissionPercentage, password } = body;

        if (!fullName || !email || !password) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check if ambassador already exists
        const existing = await Ambassador.findOne({ email: normalizedEmail });
        if (existing) {
            return NextResponse.json({ message: 'Ambassador already exists with this email' }, { status: 400 });
        }

        // Hash password for security
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate Referral Code (e.g. FIRSTNAME + random 4 digits)
        const firstName = fullName.split(' ')[0].toUpperCase();
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        const referralCode = `${firstName}${randomDigits}`;

        const newAmbassador = await Ambassador.create({
            fullName,
            email: normalizedEmail,
            phone,
            collegeName,
            aadhaarNumber,
            discountPercentage: parseFloat(discountPercentage) || 10,
            commissionPercentage: parseFloat(commissionPercentage) || 10,
            password: hashedPassword,
            referralCode
        });

        // Send Offer Letter
        try {
            await sendAmbassadorOfferLetter({
                to: email,
                ambassadorName: fullName,
                referralCode: referralCode,
                password: password
            });
        } catch (mailError) {
            console.error('Failed to send offer letter email:', mailError);
            // We don't fail the registration if email fails, but we log it
        }

        return NextResponse.json({
            message: 'Ambassador Protocol ACTIVE',
            ambassador: newAmbassador,
            referralCode: newAmbassador.referralCode
        }, { status: 201 });

    } catch (error) {
        console.error('Ambassador Creation Error:', error);
        return NextResponse.json({ message: 'Server Protocol Failure' }, { status: 500 });
    }
}

export async function GET() {
    try {
        await dbConnect();
        const ambassadors = await Ambassador.find({}).select('-password').sort({ createdAt: -1 }).lean();
        return NextResponse.json(ambassadors);
    } catch (error) {
        return NextResponse.json({ message: 'Fetch Failure' }, { status: 500 });
    }
}
