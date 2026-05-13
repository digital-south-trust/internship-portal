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

        // Use the original File object instead of converting to Buffer
        const contentType = file.type;

        const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_');
        let baseName = type.toLowerCase();
        
        if (baseName.includes('passport') || baseName.includes('profile')) {
            baseName = 'passport_photo';
        } else if (baseName.includes('aadhaar') || baseName.includes('aadhar')) {
            baseName = 'aadharcard';
        }

        const ext = file.name.split('.').pop() || '';
        const fileName = `${baseName}_${username}.${ext}`;

        const fileUrl = await uploadFile(file, fileName, contentType);

        return NextResponse.json({ url: fileUrl }, { status: 200 });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ message: error.message || "Upload failed" }, { status: 500 });
    }
}
