// import { StreamletClient } from "@streamlet/sdk";

// const client = new StreamletClient({
//     baseUrl: "https://api.streamlet.in",
//     apiKey: process.env.streamlet_api || process.env.STREAMLET_API_KEY,
//     accountNumber: process.env.streamlet_accountid || process.env.STREAMLET_ACCOUNT_NUMBER
// });
import { NextResponse } from "next/server"; // actually not needed here but just in case


export async function uploadFile(file, fileName, contentType) {
    try {
        // Convert Buffer to Blob if necessary (Streamlet SDK expects File/Blob)
        let fileToUpload = file;
        if (Buffer.isBuffer(file)) {
            fileToUpload = new Blob([file], { type: contentType });
        }

        // Streamlet handles images and videos differently
        if (contentType.startsWith('image/')) {
            // Fallback for when SDK is missing
            try {
                const imgData = new FormData();
                imgData.append('document', fileToUpload); // Streamlet unify api often uses 'document' for everything
                const res = await fetch(`https://api.streamlet.in/api-key/upload-document`, {
                    method: 'POST',
                    headers: {
                        'x-streamlet-api-key': process.env.streamlet_api || process.env.STREAMLET_API_KEY,
                        'x-streamlet-account-number': process.env.streamlet_accountid || process.env.STREAMLET_ACCOUNT_NUMBER
                    },
                    body: imgData
                });
                const result = await res.json();
                return result.cdnUrl;
            } catch (err) {
                console.error("Image upload failed:", err);
                throw err;
            }
        } else if (contentType.startsWith('video/')) {
            return "video_upload_placeholder"; // Simplified for debug
        } else {
            // Document Handler (PDF, Docs, etc.) - matching user provided endpoint format
            try {
                const docData = new FormData();
                docData.append('document', fileToUpload);

                const res = await fetch(`https://api.streamlet.in/api-key/upload-document`, {
                    method: 'POST',
                    headers: {
                        'x-streamlet-api-key': process.env.streamlet_api || process.env.STREAMLET_API_KEY,
                        'x-streamlet-account-number': process.env.streamlet_accountid || process.env.STREAMLET_ACCOUNT_NUMBER
                    },
                    body: docData
                });
                
                if (!res.ok) throw new Error("Document upload failed");
                const result = await res.json();
                return result.cdnUrl;
            } catch (err) {
                console.error("Document upload failed:", err);
                throw err;
            }
        }
    } catch (error) {
        console.error("Streamlet upload error:", error);
        throw error;
    }
}

/**
 * Placeholder for presigned URLs (Streamlet uses public CDN URLs)
 */
export async function getPresignedUrl(fileName) {
    return fileName;
}
