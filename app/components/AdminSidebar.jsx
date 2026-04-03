"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    BookOpen,
    Users,
    Layout,
    BarChart2,
    Settings,
    LogOut,
    Shield,
    Calendar,
    CalendarCheck,
    Bug,
    FileText,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const sidebarItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/admin" },
    { icon: Layout, label: "Projects", href: "/admin/projects" },
    { icon: Users, label: "Users", href: "/admin/users" },
    { icon: BookOpen, label: "LiveBook", href: "/admin/content" },
    { icon: Shield, label: "Tracks", href: "/admin/tracks" },
    { icon: FileText, label: "Assessments", href: "/admin/assessments" },
    { icon: Calendar, label: "Schedule", href: "/admin/schedule" },
    { icon: Bug, label: "Tickets", href: "/admin/tickets" },
];

export function AdminSidebar({ isCollapsed, setIsCollapsed }) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        localStorage.clear();
        document.cookie = "userRole=; path=/; max-age=0";
        document.cookie = "userEmail=; path=/; max-age=0";
        router.push("/login");
    };

    return (
        <aside className={`fixed left-0 top-0 h-screen transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'} bg-white text-gray-900 flex flex-col z-40 border-r border-gray-100 shadow-sm overflow-hidden`}>
            
            {/* Collapse Toggle */}
            <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute right-7 top-12 z-50 w-6 h-6 bg-black text-white rounded-xl flex items-center justify-center hover:bg-gray-800 transition-all shadow-xl border border-white/20"
            >
                {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            </button>

            {/* Logo Area */}
            <div className={`pt-10 pb-4 transition-all duration-300 ${isCollapsed ? 'flex justify-center' : 'px-[30px] text-left'}`}>
                <div className="flex flex-col">
                    {!isCollapsed ? (
                        <>
                            <h1 className="text-lg font-black tracking-tight text-gray-900 uppercase">Digital South</h1>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Administrator Access</p>
                        </>
                    ) : (
                        <div ></div>
                    )}
                </div>
            </div>


            {/* Navigation */}
            <nav className={`flex-1 ${isCollapsed ? 'px-2' : 'px-4'} py-6 space-y-1.5 overflow-hidden hover:overflow-y-auto custom-scrollbar`}>
                {sidebarItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`group relative flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3.5'} py-3 rounded-xl transition-all duration-300 z-10 ${isActive ? 'text-white' : 'text-gray-400 hover:text-black hover:bg-gray-50'}`}
                            title={isCollapsed ? item.label : ""}
                        >
                            <div className="relative z-20 flex items-center gap-3">
                                <item.icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                                <AnimatePresence mode="wait">
                                    {!isCollapsed && (
                                        <motion.span 
                                            initial={{ opacity: 0, x: -10 }} 
                                            animate={{ opacity: 1, x: 0 }} 
                                            exit={{ opacity: 0, x: -10 }}
                                            className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Active Indicator */}
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabAdmin"
                                    className="absolute inset-0 bg-black rounded-xl shadow-lg shadow-black/5"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Admin Profile / Logout */}
            <div className={`${isCollapsed ? 'px-2' : 'px-4'} mb-6 mt-auto`}>
                <div className={`p-1.5 bg-gray-50/50 rounded-[2rem] border border-gray-100 flex flex-col gap-1.5`}>
                    <button
                        onClick={() => router.push('/admin/settings')}
                        className={`h-11 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-[14px]'} rounded-2xl hover:bg-white hover:shadow-sm transition-all group w-full`}
                    >
                        <div className="w-8 h-8 rounded-xl bg-blue-50 border-2 border-white shadow-sm overflow-hidden shrink-0">
                            <img src="https://api.dicebear.com/7.x/micah/svg?seed=admin&backgroundColor=transparent" alt="Admin" className="w-full h-full object-cover" />
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col text-left overflow-hidden">
                                <span className="text-[10px] font-black text-gray-900 uppercase leading-none">Admin Profile</span>
                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter truncate">Identity Overseer</span>
                            </div>
                        )}
                    </button>
                    <button
                        onClick={handleLogout}
                        className={`h-11 flex items-center ${isCollapsed ? 'justify-center' : 'px-[14px] gap-4'} transition-all bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-2xl border border-gray-100 shadow-sm w-full`}
                    >
                        <LogOut className="w-5 h-5 shrink-0" />
                        {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>}
                    </button>
                </div>
            </div>
        </aside>
    );
}
