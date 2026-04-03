import dbConnect from "@/lib/mongodb";
import Certificate from "@/models/Certificate";
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

        return NextResponse.json(newCertificate, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: "Error issuing certificate", error: error.message }, { status: 500 });
    }
}
