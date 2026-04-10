import { NextResponse } from 'next/server';
import Ambassador from '../../../../models/Ambassador';
import dbConnect from '../../../../lib/mongodb';

export async function POST(req) {
    try {
        await dbConnect();
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ message: 'Missing credentials' }, { status: 400 });
        }

        const ambassador = await Ambassador.findOne({ email });

        if (!ambassador) {
            return NextResponse.json({ message: 'Ambassador identity not found' }, { status: 401 });
        }

        // Ideally hash and compare, but for simplicity:
        if (ambassador.password !== password) {
            return NextResponse.json({ message: 'Invalid protocol credentials' }, { status: 401 });
        }

        return NextResponse.json({
            message: 'Authentication Successful',
            email: ambassador.email,
            fullName: ambassador.fullName,
            token: 'dummy-token' // Use JWT in production
        });

    } catch (error) {
        console.error('Ambassador Login Error:', error);
        return NextResponse.json({ message: 'Server Protocol Failure' }, { status: 500 });
    }
}
