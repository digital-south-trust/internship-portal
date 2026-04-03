import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { sendEmail } from '@/lib/mailer';

export async function POST(req) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findOne({ email });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Update their selection status to 'Selected'
        user.selectionStatus = 'Selected';
        await user.save();

        // Send selection email
        const emailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                <h2 style="color: #4f46e5; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px;">Congratulations! You are Selected</h2>
                <p>Dear <strong>${user.fullName}</strong>,</p>
                <p>We are delighted to inform you that you have successfully cleared the eligibility assessment for our internship program.</p>
                <p>As per our evaluation criteria, you have been selected to join as an intern in the <strong>${user.track}</strong> track.</p>
                <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
                <h3 style="color: #1e293b;">Next Steps:</h3>
                <p>1. <strong>Login:</strong> Use your registered <strong>email (${user.email})</strong> and <strong>password</strong> to login to the portal.</p>
                <p>2. <strong>Profile Completion:</strong> Upon first login, you will be required to provide your complete personal details, educational background, and upload identification documents (Aadhar, Photo, Resume).</p>
                <p>3. <strong>Identity Verification:</strong> Complete the Aadhaar verification to finalize your onboarding.</p>
                <div style="margin-top: 32px; padding: 16px; background-color: #f8fafc; border-radius: 8px; text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; font-weight: bold; border-radius: 8px;">Login to Portal</a>
                </div>
                <p style="font-size: 12px; color: #64748b; margin-top: 24px;">This is an automated message. Please do not reply directly to this email.</p>
            </div>
        `;

        await sendEmail(user.email, 'Congratulations! Your Internship Selection', emailHtml);

        return NextResponse.json({ success: true, message: 'Intern approved successfully!' }, { status: 200 });

    } catch (error) {
        console.error('Manual Approve Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
