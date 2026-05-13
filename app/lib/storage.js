import { StreamletClient } from "@streamlet/sdk";

const client = new StreamletClient({
    baseUrl: "https://api.streamlet.in",
    apiKey: process.env.streamlet_api || process.env.STREAMLET_API_KEY,
    accountNumber: process.env.streamlet_accountid || process.env.STREAMLET_ACCOUNT_NUMBER
});

export async function uploadFile(file, fileName, contentType) {
    try {
        const formData = new FormData();
        const isImage = contentType.startsWith("image/");
        
        const endpoint = isImage ? "upload-image" : "upload-document";
        const fieldName = isImage ? "image" : "document";
        
        formData.append(fieldName, file, fileName);
        
        const res = await fetch(`https://api.streamlet.in/api-key/${endpoint}`, {
            method: 'POST',
            headers: {
                'x-streamlet-api-key': process.env.streamlet_api || process.env.STREAMLET_API_KEY,
                'x-streamlet-account-number': process.env.streamlet_accountid || process.env.STREAMLET_ACCOUNT_NUMBER
            },
            body: formData
        });
        
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Streamlet API failed with status ${res.status}: ${errorText}`);
        }
        
        const data = await res.json();
        return data.cdnUrl;
    } catch (error) {
        console.error("Upload error:", error);
        throw new Error(`Upload failed: ${error.message}`);
    }
}

/**
 * Placeholder for presigned URLs (Streamlet uses public CDN URLs)
 */
export async function getPresignedUrl(fileName) {
    return fileName;
}
