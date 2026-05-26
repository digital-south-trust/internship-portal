"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Calendar, Clock, Link as LinkIcon, CheckCircle2, 
    RefreshCw, Mail, LayoutList, CalendarDays, 
    Filter, ArrowRight, History, PlayCircle, 
    CalendarCheck, AlertCircle,
    ChevronDown, Activity 
} from "lucide-react";
import { FullScreenCalendar } from "@/components/ui/fullscreen-calendar";

export default function InternSchedulePage() {
    const [schedules, setSchedules] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState("all"); // all, past, today, future
    const [activeView, setActiveView] = useState('calendar'); // 'calendar' or 'intelligence'
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    useEffect(() => {
        const fetchSchedules = async () => {
            // Check all common localStorage keys for email
            const email = localStorage.getItem("userEmail") || localStorage.getItem("email");
            
            if (email) {
                try {
                    const res = await fetch(`/api/schedule?role=intern&email=${email}`);
                    if (res.ok) {
                        const data = await res.json();
                        setSchedules(data);
                    }
                } catch (err) {
                    console.error("Failed to fetch schedule data:", err);
                }
            } else {
                console.warn("User email not found in localStorage — cannot fetch schedule.");
            }
            setIsLoading(false);
        };
        fetchSchedules();
    }, []);

    const calendarData = Object.values(
        schedules.reduce((acc, schedule) => {
            const d = new Date(schedule.date);
            // Ensure local date for calendar comparison
            const localDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
            const dayKey = d.toISOString().split('T')[0];

            if (!acc[dayKey]) acc[dayKey] = { day: localDate, events: [] };
            acc[dayKey].events.push({
                id: schedule._id,
                name: schedule.tag === 'review' ? 'Weekly Review' : `Meeting with Admin`,
                description: schedule.description,
                time: schedule.time,
                datetime: `${dayKey}T${schedule.time}`,
                meetingLink: schedule.meetingLink,
                status: 'Scheduled',
                tag: schedule.tag || 'meeting'
            });
            return acc;
        }, {})
    );

    const filteredSchedules = schedules.filter(schedule => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const schedDate = new Date(schedule.date);
        schedDate.setHours(0, 0, 0, 0);

        if (filter === "past") return schedDate < today;
        if (filter === "today") return schedDate.getTime() === today.getTime();
        if (filter === "future") return schedDate > today;
        return true;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Stats for the filter buttons
    const counts = {
        all: schedules.length,
        past: schedules.filter(s => new Date(s.date).setHours(0,0,0,0) < new Date().setHours(0,0,0,0)).length,
        today: schedules.filter(s => new Date(s.date).setHours(0,0,0,0) === new Date().setHours(0,0,0,0)).length,
        future: schedules.filter(s => new Date(s.date).setHours(0,0,0,0) > new Date().setHours(0,0,0,0)).length,
    };

    return (
        <div className="space-y-12 pb-20">
            {/* Sticky Dual-View Header */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-3xl -mx-8 -mt-8 px-8 py-5 border-b border-gray-100 shadow-sm mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-8 bg-black rounded-full" />
                        <h1 className="text-2xl font-black text-black tracking-tighter uppercase leading-none">
                            {activeView === 'calendar' ? 'Schedule' : 'Schedule Hub'}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex bg-gray-50/50 p-1 rounded-xl border border-gray-100 shadow-sm">
                            {[
                                { id: 'calendar', label: 'Calendar ', icon: CalendarDays },
                                { id: 'intelligence', label: 'Schedule Hub', icon: LayoutList }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveView(item.id)}
                                    className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                                        activeView === item.id 
                                        ? 'bg-black text-white shadow-xl' 
                                        : 'text-gray-400 hover:text-black hover:bg-white'
                                    }`}
                                >
                                    <item.icon className="w-3.5 h-3.5" />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                        {isLoading && <RefreshCw className="w-4 h-4 text-gray-400 animate-spin ml-2" />}
                    </div>
                </div>
            </header>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeView}
                    initial={{ opacity: 0, x: activeView === 'calendar' ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: activeView === 'calendar' ? 20 : -20 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                    {activeView === 'calendar' ? (
                        /* Calendar View Container */
                        <section className="bg-white rounded-[2.5rem] border border-gray-100 p-4 shadow-xl shadow-gray-100/50 overflow-hidden">
                            <div className="p-4">
                                <FullScreenCalendar data={calendarData} />
                            </div>
                        </section>
                    ) : (
                        /* Meeting Intelligence Section */
                        <section className="space-y-8">
                            <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-visible">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-lg">
                                        <Activity className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-black uppercase tracking-widest">Feed Oversight</h3>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Reviewing {counts[filter]} total meeting nodes</p>
                                    </div>
                                </div>

                                {/* Custom Dropdown Filter */}
                                <div className="relative">
                                    <button 
                                        onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                        className="bg-gray-50 border border-gray-100 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-black flex items-center gap-3 hover:bg-white hover:shadow-xl transition-all active:scale-95"
                                    >
                                        <Filter className="w-4 h-4" />
                                        {filter === 'all' ? 'All Intelligence' : filter === 'past' ? 'Historical Data' : filter === 'today' ? 'Active Records' : 'Future Planning'}
                                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showFilterDropdown ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {showFilterDropdown && (
                                            <>
                                                <div 
                                                    className="fixed inset-0 z-40" 
                                                    onClick={() => setShowFilterDropdown(false)} 
                                                />
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className="absolute right-0 top-full mt-3 w-64 bg-white border border-gray-100 rounded-3xl shadow-2xl p-2 z-50 overflow-hidden"
                                                >
                                                    {[
                                                        { id: "all", label: "Full Spectrum", desc: "All system meeting records", icon: LayoutList },
                                                        { id: "future", label: "Future Alignment", desc: "Upcoming session schedule", icon: CalendarCheck },
                                                        { id: "today", label: "Active Nodes", desc: "Sessions live in real-time", icon: PlayCircle },
                                                        { id: "past", label: "Archive Access", desc: "Historical meeting retrieval", icon: History },
                                                    ].map((item) => (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => { setFilter(item.id); setShowFilterDropdown(false); }}
                                                            className={`w-full p-4 rounded-2xl flex items-start gap-3 text-left transition-all group ${filter === item.id ? 'bg-black text-white' : 'hover:bg-gray-50'}`}
                                                        >
                                                            <item.icon className={`w-4 h-4 mt-1 ${filter === item.id ? 'text-white' : 'text-gray-400 group-hover:text-black'}`} />
                                                            <div>
                                                                <p className="text-[10px] font-black uppercase tracking-widest">{item.label}</p>
                                                                <p className={`text-[8px] font-bold mt-0.5 ${filter === item.id ? 'text-white/40' : 'text-gray-300'}`}>{item.desc}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <motion.div
                                key={filter}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                {filteredSchedules.length === 0 ? (
                                    /* No Records View */
                                    <div className="bg-white/50 border-2 border-dashed border-gray-100 rounded-[3rem] p-24 flex flex-col items-center justify-center text-center">
                                        <div className="w-20 h-20 bg-white shadow-xl rounded-[2rem] flex items-center justify-center mb-6 border border-gray-50">
                                            <AlertCircle className="w-10 h-10 text-gray-200" />
                                        </div>
                                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Identity Gap Detected</h3>
                                        <p className="text-[11px] font-bold text-gray-400 mt-2 uppercase tracking-widest">No meeting telemetry matches the current filter.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-32">
                                        {filteredSchedules.map((schedule, idx) => {
                                            const dateObj = new Date(schedule.date);
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            const schedDate = new Date(schedule.date);
                                            schedDate.setHours(0, 0, 0, 0);
                                            const isPast = schedDate < today;
                                            const isToday = schedDate.getTime() === today.getTime();

                                            return (
                                                <motion.div
                                                    key={schedule._id}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className={`bg-white p-8 rounded-[3.5rem] border transition-all relative group flex flex-col h-full shadow-[0_4px_30px_rgb(0,0,0,0.02)] ${
                                                        isPast 
                                                        ? 'border-gray-100 opacity-60' 
                                                        : isToday 
                                                        ? 'border-black ring-1 ring-black shadow-2xl shadow-black/5' 
                                                        : 'border-gray-100 hover:border-black hover:shadow-2xl hover:shadow-black/5'
                                                    }`}
                                                >
                                                    {isToday && (
                                                        <div className="absolute top-8 right-10 flex items-center gap-1.5 px-3 py-1 bg-black text-white rounded-full">
                                                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                                            <span className="text-[8px] font-black uppercase tracking-widest">Node Active</span>
                                                        </div>
                                                    )}
                                                    {schedule.tag === 'review' && !isToday && (
                                                        <div className="absolute top-8 right-10 flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white rounded-full">
                                                            <Activity className="w-2 h-2" />
                                                            <span className="text-[8px] font-black uppercase tracking-widest">Review Mode</span>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-5 mb-10">
                                                        <div className={`w-16 h-16 rounded-3xl flex flex-col items-center justify-center border shadow-lg ${
                                                            isPast ? 'bg-gray-100 border-gray-200 text-gray-400' : 'bg-black border-black text-white'
                                                        }`}>
                                                            <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40 mb-0.5">
                                                                {dateObj.toLocaleString('default', { month: 'short' })}
                                                            </span>
                                                            <span className="text-2xl font-black leading-none">{dateObj.getDate()}</span>
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <Clock className={`w-4 h-4 ${isPast ? 'text-gray-300' : 'text-gray-400'}`} />
                                                                <p className="text-xl font-black text-gray-900 tracking-tighter leading-none">{schedule.time}</p>
                                                            </div>
                                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate max-w-[120px]">{schedule.adminEmail}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 space-y-6">
                                                        <div className="p-7 bg-gray-50/50 rounded-[2.5rem] border border-gray-100 group-hover:bg-white transition-colors min-h-[120px]">
                                                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-2.5">Agenda Protocol</label>
                                                            <p className="text-xs font-bold text-gray-700 leading-relaxed line-clamp-4">
                                                                {schedule.description}
                                                            </p>
                                                        </div>

                                                        <a
                                                            href={schedule.meetingLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`w-full py-4.5 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                                                                isPast 
                                                                ? 'bg-gray-100 text-gray-400 border border-gray-200' 
                                                                : 'bg-black text-white shadow-xl hover:scale-[1.02] active:scale-95'
                                                            }`}
                                                        >
                                                            <LinkIcon className="w-3.5 h-3.5" />
                                                            {isPast ? 'Archive Accessed' : 'Join Session'}
                                                            {!isPast && <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />}
                                                        </a>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        </section>
                    )}
                </motion.div>
            </AnimatePresence>
            
            <style jsx>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
