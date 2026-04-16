import { StreamletClient } from "@streamlet/sdk";

const client = new StreamletClient({
    baseUrl: "https://api.streamlet.in",
    apiKey: process.env.streamlet_api || process.env.STREAMLET_API_KEY,
    accountNumber: process.env.streamlet_accountid || process.env.STREAMLET_ACCOUNT_NUMBER
});


export async function uploadFile(file, fileName, contentType) {
    try {
        // Convert Buffer to Blob if necessary (Streamlet SDK expects File/Blob)
        let fileToUpload = file;
        if (Buffer.isBuffer(file)) {
            fileToUpload = new Blob([file], { type: contentType });
        }

        // Streamlet handles images and videos differently
        if (contentType.startsWith('image/')) {
            const result = await client.uploadImage({
                file: fileToUpload
            });
            return result.cdnUrl;
        } else if (contentType.startsWith('video/')) {
            const result = await client.uploadVideo({
                file: fileToUpload,
                videoTitle: fileName || "Internship_Video",
                keepOriginal: true
            });
            return result.videoId;
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
                console.error("Document upload failed, attempting image fallback:", err);
                const result = await client.uploadImage({ file: fileToUpload });
                return result.cdnUrl;
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
