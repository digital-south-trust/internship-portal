import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

/**
 * Verify that a request comes from an authenticated admin user.
 * Checks the x-user-email header or email query param against the database.
 * Returns the user object if authorized, null otherwise.
 */
export async function verifyAdmin(req) {
    try {
        await dbConnect();

        // Support both header and query param for flexibility
        const url = new URL(req.url);
        const email = req.headers.get('x-user-email') || url.searchParams.get('adminEmail');

        if (!email) return null;

        const user = await User.findOne({ email });
        if (!user || user.role !== 'admin') return null;

        return user;
    } catch (error) {
        console.error("Auth verification error:", error);
        return null;
    }
}

/**
 * Verify that a request comes from an authenticated user (any role).
 * Returns the user object if found, null otherwise.
 */
export async function verifyUser(req) {
    try {
        await dbConnect();

        const url = new URL(req.url);
        const email = req.headers.get('x-user-email') || url.searchParams.get('email');

        if (!email) return null;

        const user = await User.findOne({ email });
        if (!user) return null;

        return user;
    } catch (error) {
        console.error("Auth verification error:", error);
        return null;
    }
}
