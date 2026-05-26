"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/AdminSidebar";
import { toast } from "react-hot-toast";

export default function AdminLayout({ children }) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            const savedState = localStorage.getItem('adminSidebarCollapsed');
            return savedState ? JSON.parse(savedState) : false;
        }
        return false;
    });

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
                    if (user.role?.toLowerCase() !== 'admin') {
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
            <div className="min-h-screen flex bg-gray-50/50 animate-pulse">
                {/* Sidebar skeleton */}
                <div className={`transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-100 flex flex-col p-6 space-y-8`}>
                    <div className="h-10 bg-gray-100 rounded-xl w-full" />
                    <div className="space-y-4 pt-8">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-10 bg-gray-50 rounded-xl w-full" />
                        ))}
                    </div>
                </div>
                {/* Main content skeleton */}
                <div className="flex-1 p-12 space-y-12">
                    <div className="h-16 bg-white rounded-[2rem] border border-gray-100 w-full" />
                    <div className="grid grid-cols-4 gap-8">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-32 bg-white rounded-[2.5rem] border border-gray-100" />
                        ))}
                    </div>
                    <div className="h-96 bg-white rounded-[3.5rem] border border-gray-100 w-full" />
                </div>
            </div>
        );
    }


    return (
        <div className="flex min-h-screen relative bg-gray-50/20">
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
            <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'} min-h-screen relative flex flex-col`}>
                <div className="animate-fade-in flex-1 p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
