"use client";

import {
    Activity, BarChart2, Users, UserCheck, TrendingUp,
    CheckCircle2, Clock, ArrowUpRight,
    Zap, Award, Calendar, ChevronRight, User 
} from "lucide-react";
import MacOSFolder from "@/components/MacOSFolder";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUsers } from "@/hooks/useUsers";

const dicebear = (seed) => `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent`;

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay, ease: "easeOut" }
});

export default function AdminDashboard() {
    const router = useRouter();
    const [adminName, setAdminName] = useState("Admin");
    const [stats, setStats] = useState({ totalInterns: 0, activeNow: 0, placements: 0, completion: 0 });
    const [recentActivity, setRecentActivity] = useState([]);
    const [trackData, setTrackData] = useState([]);
    const { users: allUsersFromApi, isLoading: usersLoading } = useUsers(1, 1000); // Fetch a large batch for stats
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const name = localStorage.getItem("userName") || localStorage.getItem("userEmail")?.split("@")[0] || "Admin";
        setAdminName(name.split(" ")[0]);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const projectsRes = await fetch('/api/projects?role=admin');

                if (allUsersFromApi && projectsRes.ok) {
                    const users = allUsersFromApi;
                    const projects = await projectsRes.json();

                    const interns = users.filter(u => 
                        u.role?.toLowerCase() === 'intern' && 
                        (u.selectionStatus?.toLowerCase() === 'selected' || u.status?.toLowerCase() === 'active' || u.selectionStatus === 'Access given by admin')
                    );
                    const activeInterns = interns.filter(u => u.status?.toLowerCase() === 'active');
                    const completedProjects = projects.filter(p => p.progress === 100 || p.status === 'Approved');
                    const completionRate = projects.length > 0
                        ? ((completedProjects.length / projects.length) * 100).toFixed(1)
                        : 0;

                    setStats({
                        totalInterns: interns.length,
                        activeNow: activeInterns.length,
                        placements: completedProjects.length,
                        completion: completionRate
                    });

                    // Build track distribution from interns
                    const trackCounts = interns.reduce((acc, u) => {
                        const t = u.track || "Other";
                        acc[t] = (acc[t] || 0) + 1;
                        return acc;
                    }, {});
                    const total = interns.length || 1;
                    const colors = ['bg-black', 'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500'];
                    setTrackData(Object.entries(trackCounts).slice(0, 5).map(([name, count], i) => ({
                        name,
                        count,
                        pct: Math.round((count / total) * 100),
                        color: colors[i % colors.length]
                    })));

                    // Recent project activity
                    const logs = projects.slice(0, 6).map(p => ({
                        user: p.internName || 'Unknown',
                        action: p.status === 'Pending' ? `Requested "${p.projectName}"` : `${p.status} "${p.projectName}"`,
                        status: p.status === 'Pending' ? 'Pending' : p.status === 'Approved' ? 'Approved' : 'Rejected',
                        date: new Date(p.requestedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                        track: p.track || '—',
                        photo: p.internId?.profilePicture,
                        seed: p.internId?.avatarSeed
                    }));
                    setRecentActivity(logs);
                    setLoading(usersLoading);
                }
            } catch (err) {
                console.error("Dashboard fetch error:", err);
            }
        };

        if (!usersLoading) fetchData();
    }, [allUsersFromApi, usersLoading]);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

    const STAT_CARDS = [
        {
            label: "Total Interns", value: stats.totalInterns, icon: Users,
            accent: "from-blue-500 to-blue-600", badge: "Active programme",
            link: "/admin/users"
        },
        {
            label: "Projects Done", value: stats.placements, icon: MacOSFolder,
            accent: "from-violet-500 to-violet-600", badge: "Completed",
            link: "/admin/projects"
        },
        {
            label: "Completion Rate", value: `${stats.completion}%`, icon: BarChart2,
            accent: "from-amber-500 to-amber-600", badge: "Overall rate",
            link: "/admin/projects"
        },
    ];

    const STATUS_STYLE = {
        Approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        Pending: 'bg-amber-50 text-amber-700 border-amber-100',
        Rejected: 'bg-red-50 text-red-700 border-red-100',
    };

    return (
        <div className="space-y-8 pb-8">

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {STAT_CARDS.map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <motion.div key={card.label} {...fadeUp(0.05 + i * 0.06)}
                            onClick={() => router.push(card.link)}
                            className="bg-white rounded-[1.75rem] p-6 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group relative overflow-hidden"
                        >
                            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${card.accent} opacity-[0.06] rounded-full -translate-y-1/3 translate-x-1/3`} />
                            {Icon === MacOSFolder ? (
                                <div className="mb-4">
                                    <Icon size={44} />
                                </div>
                            ) : (
                                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${card.accent} flex items-center justify-center mb-4 shadow-lg`}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                            )}
                            <p className="text-3xl font-black text-gray-900 tracking-tighter leading-none">
                                {loading ? <span className="inline-block w-12 h-8 bg-gray-100 rounded-lg animate-pulse" /> : card.value}
                            </p>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-1.5">{card.label}</p>
                            <div className="flex items-center gap-1 mt-3 text-[10px] font-black text-gray-300 uppercase tracking-widest group-hover:text-gray-500 transition-colors">
                                {card.badge} <ArrowUpRight className="w-3 h-3" />
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* ── Lower Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Activity Feed — 2 cols */}
                <motion.div {...fadeUp(0.25)} className="lg:col-span-2 bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
                        <div>
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Recent Activity</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Latest project submissions & updates</p>
                        </div>
                        <button onClick={() => router.push('/admin/projects')}
                            className="text-[10px] font-black text-gray-400 hover:text-black uppercase tracking-widest flex items-center gap-1 transition-colors">
                            View All <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>

                    {loading ? (
                        <div className="p-6 space-y-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-14 bg-gray-50 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : recentActivity.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                            <Activity className="w-10 h-10 mb-3" />
                            <p className="text-xs font-black uppercase tracking-widest">No recent activity</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {recentActivity.map((row, i) => (
                                <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm transition-transform group-hover:scale-105">
                                            <img 
                                                src={row.photo || dicebear(row.seed || row.user?.split(' ')[0] || "User")} 
                                                alt="User" 
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.target.src = dicebear("User"); }}
                                            />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-gray-900">{row.user}</p>
                                            <p className="text-[10px] font-medium text-gray-400 truncate max-w-[240px]">{row.action}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-[9px] font-bold text-gray-300 hidden sm:block">{row.date}</span>
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${STATUS_STYLE[row.status] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                            {row.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Track Split — 1 col */}
                <motion.div {...fadeUp(0.3)} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 flex flex-col gap-5">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Track Split</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Intern track distribution</p>
                        </div>
                        <button onClick={() => router.push('/admin/tracks')} className="text-[10px] font-black text-blue-500 hover:text-blue-700 uppercase tracking-widest px-4 py-2 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all shadow-sm">
                            Manage Tracks
                        </button>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-50 rounded-2xl animate-pulse" />)}
                        </div>
                    ) : trackData.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-200 gap-2">
                            <Award className="w-10 h-10" />
                            <p className="text-[10px] font-black uppercase tracking-widest">No data yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3 flex-1">
                            {trackData.map((t, i) => (
                                <div key={t.name}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${t.color}`} />
                                            <span className="text-xs font-bold text-gray-700 truncate max-w-[120px]">{t.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-gray-900">{t.count}</span>
                                            <span className="text-[9px] font-bold text-gray-300">{t.pct}%</span>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${t.pct}%` }}
                                            transition={{ duration: 0.8, delay: 0.4 + i * 0.08, ease: "easeOut" }}
                                            className={`h-full rounded-full ${t.color}`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Quick links */}
                    <div className="border-t border-gray-50 pt-4 space-y-2">
                        {[
                            { label: "Manage Users", icon: Users, link: "/admin/users" },
                            { label: "View Projects", icon: MacOSFolder, link: "/admin/projects" },
                            { label: "Manage Tracks", icon: Award, link: "/admin/tracks" },
                            { label: "Open Tickets", icon: CheckCircle2, link: "/admin/tickets" },
                        ].map(({ label, icon: Icon, link }) => (
                            <button key={label} onClick={() => router.push(link)}
                                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-black hover:text-white rounded-2xl transition-all group text-xs font-black uppercase tracking-widest text-gray-500">
                                <div className="flex items-center gap-2.5">
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
