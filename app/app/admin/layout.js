"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/AdminSidebar";
import { toast } from "react-hot-toast";

export default function AdminLayout({ children }) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedState = localStorage.getItem('adminSidebarCollapsed');
            if (savedState) setIsCollapsed(JSON.parse(savedState));
        }
    }, []);

    const toggleSidebar = (state) => {
        setIsCollapsed(state);
        if (typeof window !== 'undefined') {
            localStorage.setItem('adminSidebarCollapsed', JSON.stringify(state));
        }
    };

    useEffect(() => {
        const checkAuth = async () => {
            const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
            if (!email) {
                toast.error("Unauthorized Access: Please log in.");
                router.push("/login?redirect=/admin");
                return;
            }

            // Verify with server
            try {
                const res = await fetch(`/api/user/me?email=${email}`);
                if (res.ok) {
                    const contentType = res.headers.get("content-type");
                    if (!contentType || !contentType.includes("application/json")) {
                        console.warn("Auth check: Non-JSON response received. Likely a redirect.");
                        router.push("/login?redirect=/admin");
                        return;
                    }
                    const user = await res.json();
                    if (user.role !== 'admin') {
                        toast.error("Unauthorized Access: Admins only.");
                        localStorage.clear();
                        document.cookie = "userRole=; path=/; max-age=0";
                        document.cookie = "userEmail=; path=/; max-age=0";
                        router.push("/login");
                        return;
                    }
                    localStorage.setItem('userRole', 'admin');
                    document.cookie = "userRole=admin; path=/; max-age=10800";
                    setAuthorized(true);
                } else {
                    localStorage.clear();
                    document.cookie = "userRole=; path=/; max-age=0";
                    document.cookie = "userEmail=; path=/; max-age=0";
                    router.push("/login");
                }
            } catch (error) {
                localStorage.clear();
                document.cookie = "userRole=; path=/; max-age=0";
                document.cookie = "userEmail=; path=/; max-age=0";
                router.push("/login");
            }
        };

        checkAuth();
    }, [router]);

    if (!authorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
            </div>
        );
    }


    return (
        <div className="flex bg-white min-h-screen relative overflow-hidden">
            {/* Admin Sidebar */}
            <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={toggleSidebar} />

            {/* Main Content Area */}
            <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'} min-h-screen bg-white shadow-[0_0_50px_rgba(0,0,0,0.05)] border-l border-gray-100`}>
                <div className="animate-fade-in h-full p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
