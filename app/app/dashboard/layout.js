"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { toast } from "react-hot-toast";
import { Skeleton } from "@/components/ui/skeleton";

function GenericSkeleton() {
    return (
        <div className="min-h-screen bg-white p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex gap-8">
                <Skeleton className="w-64 h-screen hidden md:block rounded-3xl" />
                <div className="flex-1 space-y-8">
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-10 w-48" />
                        <Skeleton className="h-10 w-10 rounded-full" />
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                        <Skeleton className="h-32 rounded-3xl" />
                        <Skeleton className="h-32 rounded-3xl" />
                        <Skeleton className="h-32 rounded-3xl" />
                    </div>
                    <Skeleton className="h-96 rounded-3xl w-full" />
                </div>
            </div>
        </div>
    );
}

export default function DashboardLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);
    
    // Hide sidebar for profile completion
    const isCompleteProfile = pathname?.includes('/complete-profile');

    useEffect(() => {
        const checkAuth = async () => {
            const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
            const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;

            if (!email) {
                toast.error("Please login first.");
                router.push("/login");
                return;
            }

            if (role === 'admin') {
                setAuthorized(true);
                return;
            }

            try {
                const res = await fetch(`/api/user/me?email=${email}`);
                if (res.ok) {
                    const user = await res.json();

                    if (user.role === 'admin') {
                        setAuthorized(true);
                        return;
                    }

                    if (user.role === 'intern' || user.role === 'user') {
                        // Bypass these checks for /complete-profile for testing
                        if (!window.location.pathname.includes('/complete-profile')) {
                            // 2. Check selection status
                            // Check both selectionStatus field and status field for backwards compatibility
                            const isActuallySelected = user.selectionStatus === 'Selected' || ['SELECTED', 'PROFILE_PENDING', 'VERIFIED', 'ACTIVE'].includes(user.status);
                            
                            if (user.selectionStatus === 'Pending Selection (24h Buffer)' && !isActuallySelected) {
                                toast.error("Assessment submitted. Result will be announced after 24 hours.");
                                router.push('/login');
                                return;
                            }

                            if (user.selectionStatus === 'Rejected') {
                                toast.error("We're sorry, you were not eligible for this session.");
                                router.push('/login');
                                return;
                            }

                            // 3. Check profile completion
                            if (!user.isProfileComplete) {
                                router.push('/dashboard/complete-profile');
                                return;
                            }
                        }

                        setAuthorized(true);
                    } else {
                        setAuthorized(true); // Fallback for other roles if any
                    }
                } else {
                    localStorage.clear();
                    router.push("/login");
                }
            } catch (error) {
                localStorage.clear();
                router.push("/login");
            }
        };

        checkAuth();
    }, [router]);

    const [isSidebarShrinked, setIsSidebarShrinked] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('sidebarShrinked');
        if (saved !== null) {
            setIsSidebarShrinked(saved === 'true');
        }
    }, []);

    const toggleSidebar = () => {
        const newState = !isSidebarShrinked;
        setIsSidebarShrinked(newState);
        localStorage.setItem('sidebarShrinked', newState.toString());
        window.dispatchEvent(new CustomEvent('sidebar-shrink', { detail: newState }));
    };

    if (!authorized) {
        return <GenericSkeleton />;
    }

    if (isCompleteProfile) {
        return (
            <div className="min-h-screen bg-transparent">
                <main className="w-full">
                    {children}
                </main>
            </div>
        );
    }

    return (
        <div className="flex bg-transparent min-h-screen relative">
            <Sidebar isShrinked={isSidebarShrinked} toggleShrink={toggleSidebar} />
            <main className="flex-1 transition-all duration-300">
                <div className="p-8 space-y-8 w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}


