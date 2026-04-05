import dbConnect from "@/lib/mongodb";
import Ticket from "@/models/Ticket";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req) {
    try {
        await dbConnect();
        const { ticketId, replyMessage, adminEmail, sendEmail } = await req.json();

        if (!ticketId || !replyMessage) {
            return NextResponse.json({ message: "Ticket ID and reply message are required" }, { status: 400 });
        }

        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            return NextResponse.json({ message: "Ticket not found" }, { status: 404 });
        }

        const internEmail = ticket.reportedBy;
        if (!internEmail || !internEmail.includes('@')) {
            return NextResponse.json({ message: "No valid email found for this ticket reporter" }, { status: 400 });
        }

        // Save reply to ticket
        const reply = {
            message: replyMessage,
            repliedBy: adminEmail || "Admin",
            repliedAt: new Date()
        };
        
        if (!ticket.replies) ticket.replies = [];
        ticket.replies.push(reply);
        ticket.status = ticket.status === 'Open' ? 'In Progress' : ticket.status;
        await ticket.save();

        // Send email only if admin chose to
        if (!sendEmail) {
            return NextResponse.json({ message: "Reply saved! (No email sent — admin chose to just close)", ticket }, { status: 200 });
        }

        const smtpUser = process.env.EMAIL_USER || process.env.SMTP_USER;
        const smtpPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
        const smtpHost = process.env.EMAIL_HOST || process.env.SMTP_HOST || "smtp.gmail.com";
        const smtpPort = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || "587");

        if (smtpUser && smtpPass) {
            const transporter = nodemailer.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: smtpPort === 465,
                auth: { user: smtpUser, pass: smtpPass },
            });

            await transporter.sendMail({
                from: `"Digital South Support" <${smtpUser}>`,
                to: internEmail,
                subject: `Re: Your Support Ticket — ${ticket.type}`,
                html: `
                    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #eee;">
                        <div style="background: #000; color: #fff; padding: 32px; text-align: center;">
                            <h1 style="margin: 0; font-size: 20px; letter-spacing: 2px; text-transform: uppercase;">Digital South</h1>
                            <p style="margin: 8px 0 0; font-size: 11px; letter-spacing: 3px; opacity: 0.6; text-transform: uppercase;">Support Response</p>
                        </div>
                        <div style="padding: 32px;">
                            <p style="font-size: 14px; color: #333; margin-bottom: 20px;">Hello,</p>
                            <p style="font-size: 14px; color: #333; margin-bottom: 20px;">We have reviewed your support ticket regarding <strong>"${ticket.type}"</strong> and here is our response:</p>
                            
                            <div style="background: #f8f9fa; border-left: 4px solid #000; padding: 16px 20px; border-radius: 0 12px 12px 0; margin-bottom: 20px;">
                                <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #999; margin: 0 0 8px;">Your Concern</p>
                                <p style="font-size: 13px; color: #555; margin: 0;">"${ticket.description}"</p>
                            </div>
                            
                            <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px 20px; border-radius: 0 12px 12px 0; margin-bottom: 20px;">
                                <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #16a34a; margin: 0 0 8px;">Description from Team</p>
                                <p style="font-size: 13px; color: #333; margin: 0;">${replyMessage}</p>
                            </div>
                            
                            <p style="font-size: 13px; color: #666;">If you have further questions, please raise another ticket through the portal.</p>
                            <p style="font-size: 13px; color: #666; margin-top: 24px;">Best regards,<br><strong>Digital South Admin Team</strong></p>
                        </div>
                        <div style="background: #f8f9fa; padding: 16px 32px; text-align: center; border-top: 1px solid #eee;">
                            <p style="font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 2px; margin: 0;">Digital South Internship Portal</p>
                        </div>
                    </div>
                `,
            });

            return NextResponse.json({ message: "Reply sent and email delivered!", ticket }, { status: 200 });
        } else {
            // No SMTP configured — just save the reply
            return NextResponse.json({ message: "Reply saved! (Email not configured — set SMTP_USER and SMTP_PASS in .env.local)", ticket }, { status: 200 });
        }
    } catch (error) {
        console.error("Error replying to ticket:", error);
        return NextResponse.json({ message: "Error sending reply", error: error.message }, { status: 500 });
    }
}
