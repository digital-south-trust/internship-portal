import { NextResponse } from "next/server";
import { uploadFile } from "@/lib/storage";

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get("file");
        const type = formData.get("type"); // Expecting: 'Aadhar', 'profile_photo', or 'resume'
        const email = formData.get("email");

        if (!file || !email || !type) {
            return NextResponse.json({ message: "File, email, and type (folder) are required" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Ensure folder names exactly match user's R2 structure
        const folderMapping = {
            'aadhaar': 'Aadhar',
            'passport': 'profile_photo',
            'profile': 'profile_photo',
            'resume': 'resume',
            'pancardphoto': 'Identification',
            'educationcertificate': 'Academics',
            'experienceletter': 'Professional_Docs'
        };
        const folder = folderMapping[type.toLowerCase()] || type;

        const timestamp = Date.now();
        const safeEmail = email.replace(/[@.]/g, '_');
        const fileName = `${folder}/${safeEmail}_${timestamp}_${file.name.replace(/\s+/g, '_')}`;
        const contentType = file.type;

        const fileUrl = await uploadFile(buffer, fileName, contentType);

        return NextResponse.json({ url: fileUrl }, { status: 200 });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ message: "Upload failed" }, { status: 500 });
    }
}
