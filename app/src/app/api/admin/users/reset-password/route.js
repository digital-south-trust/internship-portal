import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/mailer";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        await dbConnect();
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ message: "User ID is required" }, { status: 400 });
        }

        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // Generate random password
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
        let newPassword = "";
        for (let i = 0; i < 12; i++) {
            newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
        }

        // Hash and save
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        // Send email to user
        const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #edf2f7; border-radius: 12px; padding: 40px; color: #1a202c; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px;">
                <span style="background: #fef3c7; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: bold; color: #d97706; border: 1px solid #fde68a;">PASSWORD RESET</span>
            </div>
            <h2 style="color: #000000; margin-bottom: 20px; font-size: 26px; font-weight: 800; text-align: center;">Your Password Has Been Reset</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #4a5568;">Hi <strong>${user.fullName}</strong>,</p>
            <p style="font-size: 16px; line-height: 1.6; color: #4a5568;">Your account password has been reset by an administrator. Please use the new credentials below to log in:</p>
            
            <div style="background-color: #f7fafc; padding: 24px; border-radius: 16px; margin: 30px 0; text-align: center; border: 2px dashed #e2e8f0;">
                <p style="font-size: 12px; color: #718096; margin: 0 0 8px 0; text-transform: uppercase; font-weight: bold; letter-spacing: 2px;">New Password</p>
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 28px; font-weight: 900; letter-spacing: 4px; color: #000000;">${newPassword}</span>
            </div>

            <p style="font-size: 14px; color: #e53e3e; text-align: center; font-weight: 600;">⚠️ Please change your password after logging in for security.</p>
            
            <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" style="display: inline-block; padding: 14px 32px; background-color: #000; color: #fff; text-decoration: none; font-weight: bold; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">Login Now</a>
            </div>

            <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #edf2f7; text-align: center;">
                <p style="font-size: 12px; color: #a0aec0;">Digital South Internship Program • India</p>
            </div>
        </div>
        `;

        await sendEmail(user.email, "🔑 Your Password Has Been Reset", html);

        return NextResponse.json({ 
            message: "Password reset successfully", 
            newPassword,
            email: user.email 
        }, { status: 200 });

    } catch (error) {
        console.error("Password reset error:", error);
        return NextResponse.json({ message: "Failed to reset password", error: error.message }, { status: 500 });
    }
}
