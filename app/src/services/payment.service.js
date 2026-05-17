import crypto from 'crypto';

/**
 * Service for Payment gateway logic (Razorpay).
 */
export const PaymentService = {
    /**
     * Securely verify Razorpay webhook signature.
     * Prevents malicious actors from spoofing payment success events.
     * 
     * @param {string} webhookBody - The raw text body of the request.
     * @param {string} signature - The 'x-razorpay-signature' header.
     * @returns {boolean} True if the signature is valid.
     */
    verifyWebhookSignature(webhookBody, signature) {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        
        if (!secret) {
            console.warn("RAZORPAY_WEBHOOK_SECRET is not defined.");
            return false;
        }

        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(webhookBody)
            .digest('hex');
            
        return expectedSignature === signature;
    }
};
