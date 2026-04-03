import { NextResponse } from "next/server";

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
        return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const clientId = process.env.DIGILOCKER_CLIENT_ID;
    const redirectUri = process.env.DIGILOCKER_REDIRECT_URI;
    
    // Construct real DigiLocker OAuth URL
    const authorizeUrl = `https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize?` + 
        `response_type=code` + 
        `&client_id=${clientId}` + 
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${email}`; // Using state to pass email back

    return NextResponse.redirect(authorizeUrl);
}
