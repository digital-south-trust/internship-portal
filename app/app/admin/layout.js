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
        <div className="flex min-h-screen relative overflow-hidden bg-gray-50/20">
            {/* Global Background Pattern */}
            <div 
                className="fixed inset-0 z-0 pointer-events-none opacity-20" 
                style={{ 
                    backgroundImage: "url('/background7.svg')", 
                    backgroundSize: '100px',
                    backgroundRepeat: 'repeat'
                }} 
            />

            {/* Admin Sidebar */}
            <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={toggleSidebar} />

            {/* Main Content Area */}
            <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'} min-h-screen relative z-10 flex flex-col`}>
                <div className="animate-fade-in flex-1 p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
