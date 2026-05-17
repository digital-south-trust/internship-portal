import { NextResponse } from "next/server";
import { createOrder } from "@/lib/razorpay";

export async function POST(req) {
    try {
        const { amount, currency = "INR", receipt } = await req.json();

        if (!amount) {
            return NextResponse.json({ message: "Amount is required" }, { status: 400 });
        }

        const order = await createOrder(amount, receipt || `receipt_${Date.now()}`, currency);

        return NextResponse.json(order, { status: 200 });
    } catch (error) {
        console.error("Razorpay Order Error:", error);
        return NextResponse.json({ message: "Failed to create order" }, { status: 500 });
    }
}
