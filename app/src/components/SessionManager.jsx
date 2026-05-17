"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "react-hot-toast";

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/internship/register", "/internship/verify-otp"];

export function SessionManager() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkSession = () => {
            // Skip check on public routes
            if (PUBLIC_ROUTES.some(route => pathname.startsWith(route)) || pathname === "/") {
                return;
            }

            const loginTimestamp = localStorage.getItem("loginTimestamp");
            const userEmail = localStorage.getItem("userEmail");

            // If no login info, redirect to login (unless on public route)
            if (!userEmail || !loginTimestamp) {
                localStorage.clear();
                document.cookie = "userRole=; path=/; max-age=0";
                document.cookie = "userEmail=; path=/; max-age=0";
                router.push("/login");
                return;
            }

            // Check for session expiry (3 hours)
            const now = Date.now();
            const threeHoursInMs = 3 * 60 * 60 * 1000;

            if (now - parseInt(loginTimestamp) > threeHoursInMs) {
                localStorage.clear();
                document.cookie = "userRole=; path=/; max-age=0";
                document.cookie = "userEmail=; path=/; max-age=0";
                toast.error("Session expired. Please log in again.");
                router.push("/login");
            }
        };

        // Check on mount and on route change
        checkSession();

        // Periodic check every minute
        const interval = setInterval(checkSession, 60000);
        return () => clearInterval(interval);
    }, [pathname, router]);

    return null;
}
