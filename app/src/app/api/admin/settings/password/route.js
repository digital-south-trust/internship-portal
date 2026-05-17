import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req) {
    try {
        await connectMongo();
        const { email, oldPassword, newPassword } = await req.json();

        if (!email || !oldPassword || !newPassword) {
            return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return NextResponse.json({ message: 'User not found.' }, { status: 404 });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return NextResponse.json({ message: 'Incorrect old password.' }, { status: 401 });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        return NextResponse.json({ message: 'Password updated successfully.' }, { status: 200 });

    } catch (err) {
        console.error('Password change error:', err);
        return NextResponse.json({ message: 'Server error', error: err.message }, { status: 500 });
    }
}
