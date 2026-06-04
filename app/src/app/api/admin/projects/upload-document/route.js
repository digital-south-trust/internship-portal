import { NextResponse } from "next/server";
import { uploadFile } from "@/lib/storage";

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get("document");

        if (!file) {
            return NextResponse.json({ message: "Document file is required" }, { status: 400 });
        }

        const contentType = file.type || "application/octet-stream";
        // Clean filename for safety and URL compatibility
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const uniqueName = `project_doc_${Date.now()}_${cleanName}`;

        // Perform upload securely using our storage client and server environment keys
        const fileUrl = await uploadFile(file, uniqueName, contentType);

        return NextResponse.json({ 
            success: true,
            cdnUrl: fileUrl,
            originalFilename: file.name
        }, { status: 200 });
    } catch (error) {
        console.error("Document upload error:", error);
        return NextResponse.json({ message: error.message || "Upload failed" }, { status: 500 });
    }
}
