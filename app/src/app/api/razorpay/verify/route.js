import { NextResponse } from "next/server";
import { verifyPayment } from "@/lib/razorpay";

export async function POST(req) {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json({ message: "Invalid payment details" }, { status: 400 });
        }

        const isValid = verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);

        if (isValid) {
            return NextResponse.json({ message: "Payment verified successfully" }, { status: 200 });
        } else {
            return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
        }
    } catch (error) {
        console.error("Razorpay Verification Error:", error);
        return NextResponse.json({ message: "Verification failed" }, { status: 500 });
    }
}
