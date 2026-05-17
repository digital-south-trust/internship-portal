
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// ---------------------------------------------------------
// CONFIGURE YOUR INITIAL ADMIN CREDENTIALS HERE
// ---------------------------------------------------------
const ADMIN_USER = {
    fullName: "System Admin",
    email: "gauthamram.um@gmail.com",
    phone: "9999999999",
    password: "12345678", // CHANGE THIS PASSWORD IN PRODUCTION
    role: "admin",

    // Additional required fields with defaults
    track: "System Administration",
    duration: "Permanent",
    mode: "Remote",
    gender: "Other",
    address: "HQ"
};
// ---------------------------------------------------------

export async function GET(req) {
    try {
        await dbConnect();

        // Check if this admin already exists
        let existing = await User.findOne({ email: ADMIN_USER.email });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(ADMIN_USER.password, salt);

        if (existing) {
            // Update existing user to admin and fix missing fields
            existing.role = ADMIN_USER.role;
            existing.password = hashedPassword;

            // Fix schema drift if any
            if (!existing.fullName) existing.fullName = existing.name || ADMIN_USER.fullName;
            if (!existing.duration) existing.duration = existing.courseDuration || ADMIN_USER.duration;
            if (!existing.track) existing.track = ADMIN_USER.track;
            if (!existing.mode) existing.mode = existing.courseMode || ADMIN_USER.mode;

            await existing.save();

            return NextResponse.json({
                message: "Existing user upgraded to Admin successfully.",
                user: { email: existing.email, role: existing.role }
            }, { status: 200 });
        }

        // Create the admin user with hashed password
        const newUser = await User.create({
            ...ADMIN_USER,
            password: hashedPassword
        });

        // Don't return the password in response
        const userResponse = newUser.toObject();
        delete userResponse.password;

        return NextResponse.json({
            message: "Admin user created successfully!",
            user: userResponse
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating admin user:", error);
        return NextResponse.json({
            message: "Error creating admin user",
            error: error.message
        }, { status: 500 });
    }
}
