import crypto from 'crypto';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a new Razorpay order
 * @param {number} amount - Amount in INR (will be converted to Paise internally)
 * @param {string} currency - Currency (default INR)
 * @param {string} receiptId - Unique identifier for the transaction
 * @returns {Promise<Object>} - The order object
 */
export async function createOrder(amount, receiptId, currency = 'INR') {
    const options = {
        amount: Math.round(amount * 100), // convert to paise
        currency: currency,
        receipt: receiptId,
    };

    try {
        const order = await razorpay.orders.create(options);
        return order;
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        throw error;
    }
}

/**
 * Verify Razorpay payment signature
 * @param {string} orderId - The order ID from Razorpay
 * @param {string} paymentId - The payment ID from Razorpay
 * @param {string} signature - The signature from Razorpay
 * @returns {boolean} - True if signature is valid
 */
export function verifyPayment(orderId, paymentId, signature) {
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(orderId + "|" + paymentId);
    const generatedSignature = hmac.digest('hex');
    return generatedSignature === signature;
}
