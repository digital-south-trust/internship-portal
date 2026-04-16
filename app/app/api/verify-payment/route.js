import { NextResponse } from 'next/server';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export async function POST(req) {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            email,
            fullName,
            referralCode
        } = await req.json();

        // 1. Verify Signature
        const generated_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            return NextResponse.json(
                { error: "Payment verification failed" },
                { status: 400 }
            );
        }

        // 2. Update User Status
        const dbConnect = (await import('@/lib/mongodb')).default;
        const User = (await import('@/models/User')).default;
        await dbConnect();

        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        user.status = 'ACTIVE';
        user.isApproved = true;
        user.paymentDetails = {
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            date: new Date()
        };

        // 2.5 Handle Ambassador Commission
        if (referralCode) {
            const Ambassador = (await import('@/models/Ambassador')).default;
            const ambassador = await Ambassador.findOne({ referralCode: referralCode.toUpperCase() });
            if (ambassador) {
                // Find what fee was actually paid (approximate based on order)
                // In production you might want to fetch the amount from Razorpay
                // But for now we calculate based on the tiers 4700, 9400, 14000
                // User fee is 10% off. So 100% is approx amount / 0.9
                // Let's calculate commission based on their duration
                const feeMap = { '2 Months': 4700, '4 Months': 9400, '6 Months': 14000 };
                const baseFee = feeMap[user.duration] || 4700; // default to min if somehow missing
                
                ambassador.userCount += 1;
                ambassador.earnings += (baseFee * (ambassador.commissionPercentage || 10)) / 100;
                await ambassador.save();
                
                // Link user to referral code for records (Normalized to uppercase)
                user.referralCodeUsed = referralCode.toUpperCase();
            }
        }

        await user.save();

        // 3. Send Confirmation Email (Wrapped in try-catch so it doesn't block the response)
        try {
            const hasSmtpConfig = process.env.EMAIL_HOST && process.env.EMAIL_USER;
            if (hasSmtpConfig) {
                const transporter = nodemailer.createTransport({
                    host: process.env.EMAIL_HOST,
                    port: parseInt(process.env.EMAIL_PORT) || 465,
                    secure: process.env.EMAIL_PORT == "465", 
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS,
                    },
                });

                const mailOptions = {
                    from: `"Digital South" <${process.env.EMAIL_USER}>`,
                    to: email,
                    subject: 'Internship Portal - Payment Successful',
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                            <h2 style="color: #000;">Welcome to the Program, ${fullName}!</h2>
                            <p>Your payment was successful and your account is now <strong>ACTIVE</strong>.</p>
                            <p>You can now access your full dashboard and start your internship tasks.</p>
                            <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <p><strong>Order ID:</strong> ${razorpay_order_id}</p>
                                <p><strong>Payment ID:</strong> ${razorpay_payment_id}</p>
                            </div>
                            <p>Please log in at <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Internship Portal</a>.</p>
                            <p>Best regards,<br/>The Onboarding Team</p>
                        </div>
                    `,
                };
                await transporter.sendMail(mailOptions);
            }
        } catch (emailErr) {
            console.error("Email sending failed:", emailErr);
            // We don't return error here because the payment IS verified in DB
        }

        return NextResponse.json({
            success: true,
            message: "Payment verified and account activated",
        });

    } catch (error) {
        console.error("Error in verify-payment:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
