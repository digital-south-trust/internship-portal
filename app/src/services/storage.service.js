import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Utilizing AWS S3 SDK for Streamlet's S3-compatible Signed URLs
const s3Client = new S3Client({
    region: process.env.STREAMLET_REGION || 'ap-south-1',
    endpoint: process.env.STREAMLET_ENDPOINT || 'https://s3.streamlet.in',
    credentials: {
        accessKeyId: process.env.STREAMLET_ACCESS_KEY || 'dummy',
        secretAccessKey: process.env.STREAMLET_SECRET_KEY || 'dummy',
    }
});

/**
 * Service for generating secure upload URLs (Streamlet.io).
 */
export const StorageService = {
    /**
     * Generate a signed URL for client-side direct upload.
     * Offloads bandwidth from our Node.js servers directly to Streamlet.
     * 
     * @param {string} fileName - The name of the file to upload.
     * @param {string} fileType - The MIME type (e.g., 'image/png').
     * @returns {Promise<{uploadUrl: string, fileUrl: string}>}
     */
    async generateSignedUrl(fileName, fileType) {
        const uniqueKey = `${Date.now()}-${fileName.replace(/\s+/g, '-')}`;
        const bucket = process.env.STREAMLET_BUCKET_NAME || 'interns-portal';

        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: uniqueKey,
            ContentType: fileType,
        });

        // URL expires in 1 hour
        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        
        return {
            uploadUrl,
            fileUrl: `${process.env.STREAMLET_CDN_URL || 'https://cdn.streamlet.in'}/${bucket}/${uniqueKey}` 
        };
    }
};
