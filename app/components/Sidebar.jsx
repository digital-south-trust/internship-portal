"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
    LayoutDashboard,
    BookOpen,
    FolderGit2,
    Calendar,
    MessageSquare,
    Bug,
    Settings,
    LogOut,
    Sparkles,
    Award,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: BookOpen, label: "LiveBook", href: "/dashboard/livebook" },
    { icon: FolderGit2, label: "Projects", href: "/dashboard/projects" },
    { icon: Calendar, label: "Schedule", href: "/dashboard/schedule" },
    { icon: Award, label: "Certificate", href: "/dashboard/certificate" },
    { icon: MessageSquare, label: "AI Assistant", href: "/dashboard/ai-assistant" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export function Sidebar({ isShrinked, toggleShrink }) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            const email = localStorage.getItem("userEmail");
            if (email) {
                try {
                    const res = await fetch(`/api/user/me?email=${email}`);
                    if (res.ok) {
                        const data = await res.json();
                        setUser(data);
                    }
                } catch (error) {
                    console.error("Failed to fetch user data:", error);
                }
            }
        };
        fetchUser();
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        document.cookie = "userRole=; path=/; max-age=0";
        document.cookie = "userEmail=; path=/; max-age=0";
        router.push("/login");
    };

    const handleToggle = () => {
        toggleShrink();
    };

    return (
        <aside className={`sticky left-0 top-0 h-screen transition-all duration-300 bg-white text-gray-900 flex flex-col z-30 border-r border-gray-200 shadow-sm ${isShrinked ? 'w-20' : 'w-64'}`}>
            {/* Toggle Button - Precisely centered vertically with branding and horizontally on border */}
            <button
                onClick={handleToggle}
                className={`absolute right-5 top-8 w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all z-50 border border-gray-200 focus:outline-none`}
                title={isShrinked ? "Expand Sidebar" : "Shrink Sidebar"}
            >
                {isShrinked ?
                    <ChevronRight className="w-3.5 h-3.5" /> :
                    <ChevronLeft className="w-3.5 h-3.5" />
                }
            </button>

            {/* Logo Area */}
            <div className={`p-6 pb-4 flex items-center border-b border-gray-50 mb-2`}>
                <div className={`flex items-center gap-3 overflow-hidden ${isShrinked ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}>
                    <div className="whitespace-nowrap">
                        <h1 className="text-lg font-bold tracking-tight text-gray-900">Digital <span className="text-black">South</span></h1>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Intern Portal</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                {sidebarItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="relative group block"
                            title={isShrinked ? item.label : ""}
                        >
                            <div className={`relative px-4 py-3.5 flex items-center gap-3 rounded-xl transition-all duration-300 z-10 ${isActive ? 'text-white font-semibold' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'} ${isShrinked ? 'justify-center px-0' : ''}`}>
                                <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'group-hover:text-gray-900'}`} strokeWidth={isActive ? 2.5 : 2} />
                                {!isShrinked && <span className="whitespace-nowrap">{item.label}</span>}
                            </div>

                            {/* Active Indicator */}
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-black rounded-xl border border-gray-900"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile / Logout */}
            <div className={`p-4 transition-all duration-300 ${isShrinked ? 'mx-2' : 'm-4 bg-gray-50 rounded-2xl border border-gray-100'}`}>
                {!isShrinked && (
                    <div className="flex items-center gap-3 mb-4 p-2">
                        <div className="w-10 h-10 flex items-center justify-center text-white font-bold rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-white shadow-md flex-shrink-0">
                            {user?.fullName?.charAt(0) || "U"}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-gray-900 truncate">{user?.fullName || "Loading..."}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.track || "..."}</p>
                        </div>
                    </div>
                )}
                <div className={`flex items-center gap-3 ${isShrinked ? 'flex-col' : ''}`}>
                    <div className="relative group/report">
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('open-report-issue'))}
                            className="w-11 h-11 bg-black text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all z-10 relative"
                            title="Report Issue"
                        >
                            <Bug className="w-5.5 h-5.5" />
                        </button>
                    </div>
                    {isShrinked ? (
                        <button
                            onClick={handleLogout}
                            className="w-11 h-11 bg-gray-900 hover:bg-black text-white rounded-full flex items-center justify-center shadow-lg transition-all"
                            title="Log out"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            onClick={handleLogout}
                            className="flex-1 py-3 px-5 bg-gray-900 hover:bg-black text-[10px] font-black font-semibold tracking-widest text-white rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            Log out
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
}
