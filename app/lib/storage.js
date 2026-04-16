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
            // Document Handler (PDF, Docs, etc.)
            try {
                const formData = new FormData();
                formData.append('document', fileToUpload);
                formData.append('documentTitle', fileName || "Internship_Doc");

                const res = await fetch(`https://api.streamlet.in/${process.env.streamlet_api || process.env.STREAMLET_API_KEY}/upload-document`, {
                    method: 'POST',
                    headers: {
                        'x-account-number': process.env.streamlet_accountid || process.env.STREAMLET_ACCOUNT_NUMBER
                    },
                    body: formData
                });
                
                if (!res.ok) throw new Error("Document upload failed");
                const result = await res.json();
                return result.cdnUrl || result.documentUrl;
            } catch (err) {
                // Fallback to uploadImage if API is unified but SDK is old
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
