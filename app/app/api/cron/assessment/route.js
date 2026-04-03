import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { sendEmail } from '@/lib/mailer';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const key = searchParams.get('key');

        if (key !== 'ds_intern_cron_2026') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // 1. Find users who passed the assessment and are in the buffer period (> 24 hours ago)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const eligibleUsers = await User.find({
            isAssessmentDone: true,
            assessmentScore: { $gte: 75 },
            selectionStatus: 'Pending Selection (24h Buffer)',
            assessmentDate: { $lte: oneDayAgo }
        });

        console.log(`Cron: Processing ${eligibleUsers.length} selected candidates...`);

        // 2. Process each eligible user
        for (const user of eligibleUsers) {
            try {
                // Update their selection status to 'Selected'
                user.selectionStatus = 'Selected';
                await user.save();

                // Send selection email
                const emailHtml = `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                        <h2 style="color: #4f46e5; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px;">Congratulations! You are Selected</h2>
                        <p>Dear <strong>${user.fullName}</strong>,</p>
                        <p>We are delighted to inform you that you have successfully cleared the eligibility assessment for our internship program with a score of <strong>${user.assessmentScore.toFixed(0)}%</strong>.</p>
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

                await sendEmail(user.email, 'Update: Your Internship Assessment Result!', emailHtml);
                console.log(`Cron: Selection email sent to ${user.email}`);

            } catch (err) {
                console.error(`Cron: Error processing candidate ${user.email}:`, err);
            }
        }

        return NextResponse.json({ success: true, processed: eligibleUsers.length }, { status: 200 });

    } catch (error) {
        console.error('Assessment Cron Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
