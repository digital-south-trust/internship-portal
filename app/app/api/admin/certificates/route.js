import dbConnect from "@/lib/mongodb";
import Certificate from "@/models/Certificate";
import { sendEmail } from "@/lib/mailer";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');
        
        let query = {};
        if (email) query.internEmail = email;

        const certificates = await Certificate.find(query).sort({ issuedDate: -1 });
        return NextResponse.json(certificates, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error fetching certificates", error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await dbConnect();
        const body = await req.json();
        const { internEmail, internName, title, track, type } = body;

        if (!internEmail || !internName || !title) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        // Generate a simple unique ID: DS-CERT-YYYY-UNIQUE
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const random = Math.floor(1000 + Math.random() * 9000); // random 4 digits
        const certificateId = `DS-CERT-${year}${month}-${random}`;

        const newCertificate = await Certificate.create({
            internEmail,
            internName,
            title,
            certificateId,
            track,
            type: type || 'Completion',
            issuedDate: date
        });

        // Send email notification to the intern
        try {
            const issuedDateStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            const portalUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

            const html = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #dcfce7; border-radius: 12px; padding: 32px; color: #1e293b; background: #ffffff;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <span style="background: #f0fdf4; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; color: #16a34a; border: 1px solid #dcfce7;">🏆 CERTIFICATE ISSUED</span>
                    </div>
                    <h2 style="color: #000; margin-bottom: 8px; font-size: 28px; font-weight: 800; text-align: center;">Congratulations, ${internName}!</h2>
                    <p style="font-size: 15px; line-height: 1.6; color: #64748b; text-align: center; margin-bottom: 28px;">
                        A new certificate has been issued to you by Digital South.
                    </p>
                    
                    <div style="background: #f8fafc; border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #e2e8f0;">
                        <table style="width: 100%; font-size: 14px; color: #334155;">
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; width: 120px; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Title</td>
                                <td style="padding: 8px 0; font-weight: 700;">${title}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Certificate ID</td>
                                <td style="padding: 8px 0; font-family: monospace; font-weight: 600; color: #64748b;">${certificateId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Date Issued</td>
                                <td style="padding: 8px 0;">${issuedDateStr}</td>
                            </tr>
                            ${track ? `<tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Track</td>
                                <td style="padding: 8px 0;">${track}</td>
                            </tr>` : ''}
                        </table>
                    </div>

                    <div style="text-align: center; margin: 32px 0;">
                        <a href="${portalUrl}/dashboard/certificate" style="display: inline-block; padding: 14px 36px; background-color: #000; color: #fff; text-decoration: none; font-weight: bold; border-radius: 12px; font-size: 13px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                            View & Download Certificate
                        </a>
                    </div>

                    <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                        This is an automated notification from Digital South Internship Portal.
                    </p>
                </div>
            `;

            await sendEmail(internEmail, `🏆 Certificate Issued: ${title}`, html);
        } catch (emailErr) {
            console.error("Certificate email notification failed:", emailErr);
            // Don't fail the request if email fails
        }

        return NextResponse.json(newCertificate, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: "Error issuing certificate", error: error.message }, { status: 500 });
    }
}
