import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const email = searchParams.get("state"); // Extract email from state

    if (!code || !email) {
        return NextResponse.json({ error: "Authorization failed" }, { status: 400 });
    }

    try {
        await dbConnect();

        // 1. Exchange Auth Code for Access Token
        const tokenRes = await fetch("https://digilocker.meripehchaan.gov.in/public/oauth2/1/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code: code,
                client_id: process.env.DIGILOCKER_CLIENT_ID,
                client_secret: process.env.DIGILOCKER_CLIENT_SECRET,
                redirect_uri: process.env.DIGILOCKER_REDIRECT_URI,
                grant_type: "authorization_code",
            })
        });

        const tokenData = await tokenRes.json();
        
        if (!tokenData.access_token) {
            throw new Error("Failed to obtain access token");
        }

        const accessToken = tokenData.access_token;

        // 2. Fetch User Documents or Profile
        // Note: Real DigiLocker may require additional scopes or endpoints depending on the exact document needed
        // Here we simulate the extraction as defined in the flow
        const userRes = await fetch("https://digilocker.meripehchaan.gov.in/public/oauth2/2/files", {
            headers: { "Authorization": `Bearer ${accessToken}` }
        });

        const userDataRes = await userRes.json();
        
        // Mocking metadata extraction from DigiLocker profile for the frontend
        // In a real scenario, you'd find the Aadhaar XML/PDF and parse it
        const name = tokenData.name || "Verified Intern"; // DigiLocker usually returns basic profile with token
        const dob = tokenData.dob || "";
        const aadhaar = "123456789012"; // Usually obtained via /user or parsed from xml

        // 3. Update Database (Mark User as Verified)
        await User.findOneAndUpdate({ email }, {
            isVerified: true,
            verificationMethod: "DigiLocker"
        });

        // 4. Redirect to Frontend Profile Page with Success Params
        const params = new URLSearchParams({
            verified: "true",
            name: name,
            dob: dob,
            aadhaar: aadhaar
        });

        const redirectUrl = new URL(`/dashboard/complete-profile?${params.toString()}`, req.url);
        return NextResponse.redirect(redirectUrl);

    } catch (error) {
        console.error("DigiLocker Callback Error:", error);
        // Error redirection
        return NextResponse.redirect(new URL("/dashboard/complete-profile?error=verification_failed", req.url));
    }
}
