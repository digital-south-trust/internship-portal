
import dbConnect from "@/lib/mongodb";
import Ticket from "@/models/Ticket";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

async function sendTicketConfirmation(ticket) {
    const smtpUser = process.env.EMAIL_USER || process.env.SMTP_USER;
    const smtpPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
    const smtpHost = process.env.EMAIL_HOST || process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || "587");

    if (!smtpUser || !smtpPass) {
        console.log("Email not configured — skipping ticket confirmation email.");
        return;
    }

    const internEmail = ticket.reportedBy;
    if (!internEmail || !internEmail.includes('@')) return;

    const ticketId = ticket._id.toString().slice(-8).toUpperCase();
    const ticketTitle = ticket.title || ticket.type;

    try {
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: { user: smtpUser, pass: smtpPass },
        });

        await transporter.sendMail({
            from: `"Digital South Support" <${smtpUser}>`,
            to: internEmail,
            subject: `Ticket Created — ${ticketTitle} (#${ticketId})`,
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #eee;">
                    <div style="background: #000; color: #fff; padding: 32px; text-align: center;">
                        <h1 style="margin: 0; font-size: 20px; letter-spacing: 2px; text-transform: uppercase;">Digital South</h1>
                        <p style="margin: 8px 0 0; font-size: 11px; letter-spacing: 3px; opacity: 0.6; text-transform: uppercase;">Ticket Confirmation</p>
                    </div>
                    <div style="padding: 32px;">
                        <p style="font-size: 14px; color: #333; margin-bottom: 20px;">Hello,</p>
                        <p style="font-size: 14px; color: #333; margin-bottom: 20px;">
                            Your support ticket has been successfully created. Our admin team will review it and get back to you.
                        </p>
                        
                        <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #eee;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #999; width: 120px;">Ticket ID</td>
                                    <td style="padding: 8px 0; font-size: 14px; font-weight: bold; color: #000;">#${ticketId}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #999;">Category</td>
                                    <td style="padding: 8px 0; font-size: 14px; color: #333;">${ticket.type}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #999;">Subject</td>
                                    <td style="padding: 8px 0; font-size: 14px; color: #333;">${ticketTitle}</td>
                                </tr>
                            </table>
                        </div>

                        <div style="background: #f8f9fa; border-left: 4px solid #000; padding: 16px 20px; border-radius: 0 12px 12px 0; margin-bottom: 24px;">
                            <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #999; margin: 0 0 8px;">Your Concern</p>
                            <p style="font-size: 13px; color: #555; margin: 0;">"${ticket.description}"</p>
                        </div>

                        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px 20px; border-radius: 0 12px 12px 0; margin-bottom: 24px;">
                            <p style="font-size: 13px; color: #1e40af; margin: 0; font-weight: 500;">
                                ⏳ Expected Resolution: <strong>3 to 4 business days</strong>
                            </p>
                        </div>

                        <p style="font-size: 13px; color: #666;">You will receive another email once the admin team responds to your ticket. Thank you for your patience.</p>
                        <p style="font-size: 13px; color: #666; margin-top: 24px;">Best regards,<br><strong>Digital South Admin Team</strong></p>
                    </div>
                    <div style="background: #f8f9fa; padding: 16px 32px; text-align: center; border-top: 1px solid #eee;">
                        <p style="font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 2px; margin: 0;">Digital South Internship Portal</p>
                    </div>
                </div>
            `,
        });
        console.log(`Ticket confirmation email sent to ${internEmail}`);
    } catch (err) {
        console.error("Failed to send ticket confirmation email:", err.message);
    }
}

export async function POST(req) {
    try {
        await dbConnect();
        const body = await req.json();

        // Basic validation
        if (!body.type || !body.description) {
            return NextResponse.json({ message: "Type and Description are required" }, { status: 400 });
        }

        const ticket = await Ticket.create(body);

        // Send confirmation email (non-blocking)
        sendTicketConfirmation(ticket).catch(err => console.error("Email background error:", err));

        return NextResponse.json({ message: "Ticket created successfully", ticket }, { status: 201 });
    } catch (error) {
        console.error("Error creating ticket:", error);
        return NextResponse.json({ message: "Error creating ticket", error: error.message }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        await dbConnect();
        // Fetch most recent first
        const tickets = await Ticket.find({}).sort({ createdAt: -1 });
        return NextResponse.json(tickets, { status: 200 });
    } catch (error) {
        console.error("Error fetching tickets:", error);
        return NextResponse.json({ message: "Error fetching tickets" }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        await dbConnect();
        const body = await req.json();
        const { id, status } = body;

        if (!id || !status) {
            return NextResponse.json({ message: "ID and Status required" }, { status: 400 });
        }

        const ticket = await Ticket.findByIdAndUpdate(id, { status }, { returnDocument: 'after' });

        if (!ticket) {
            return NextResponse.json({ message: "Ticket not found" }, { status: 404 });
        }

        return NextResponse.json(ticket, { status: 200 });
    } catch (error) {
        console.error("Error updating ticket:", error);
        return NextResponse.json({ message: "Error updating ticket" }, { status: 500 });
    }
}
