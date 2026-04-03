"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Link as LinkIcon, CheckCircle2, RefreshCw, Mail, LayoutList } from "lucide-react";
import { FullScreenCalendar } from "@/components/ui/fullscreen-calendar";

export default function InternSchedulePage() {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState("calendar");

    useEffect(() => {
        const fetchSchedules = async () => {
            const email = localStorage.getItem("userEmail");
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
            setLoading(false);
        };
        fetchSchedules();
    }, []);

    const calendarData = Object.values(
        schedules.reduce((acc, schedule) => {
            const d = new Date(schedule.date);
            const localDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
            const dayKey = d.toISOString().split('T')[0];

            if (!acc[dayKey]) acc[dayKey] = { day: localDate, events: [] };
            acc[dayKey].events.push({
                id: schedule._id,
                name: `Admin`,
                description: schedule.description,
                time: schedule.time,
                datetime: `${dayKey}T${schedule.time}`,
                meetingLink: schedule.meetingLink
            });
            return acc;
        }, {})
    );

    return (
        <div className="animate-in fade-in duration-500">
            {/* Sticky Header */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-3xl -mx-8 -mt-8 px-8 py-5 border-b border-gray-100 shadow-sm mb-8">
                <div className="flex items-center justify-between gap-6 w-full">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <h1 className="text-3xl font-black text-black tracking-tighter uppercase leading-none">
                            Schedule
                        </h1>

                        {loading && <RefreshCw className="w-4 h-4 text-gray-400 animate-spin shrink-0" />}
                    </div>
                </div>
            </header>

            <div className="px-8 pb-20">
                <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                    <AnimatePresence mode="wait">
                        {viewMode === "calendar" ? (
                            <motion.div
                                key="calendar"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col flex-1 overflow-auto bg-white rounded-3xl border border-gray-100 p-4"
                            >
                                <FullScreenCalendar data={calendarData} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="list"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="flex-1 overflow-auto py-8"
                            >
                                {schedules.length === 0 && !loading ? (
                                    <div className="bg-gray-50 border border-dashed border-gray-200 rounded-[2.5rem] p-20 flex flex-col items-center justify-center text-center">
                                        <Clock className="w-10 h-10 text-gray-300 mb-4" />
                                        <p className="text-sm font-black uppercase tracking-widest text-gray-400">No meetings scheduled.</p>
                                        <p className="text-[10px] font-bold text-gray-400 mt-2">Your admin will schedule meetings here.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                        <AnimatePresence>
                                            {schedules.map((schedule, idx) => {
                                                const dateObj = new Date(schedule.date);
                                                const isPast = dateObj < new Date();
                                                return (
                                                    <motion.div
                                                        key={schedule._id}
                                                        initial={{ opacity: 0, y: 16 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        className={`bg-white p-8 rounded-[2.5rem] border shadow-sm transition-all group ${isPast ? 'border-gray-100 opacity-60' : 'border-gray-100 hover:border-black hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-1'
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between mb-8">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`p-4 rounded-2xl ${isPast ? 'bg-gray-50' : 'bg-black text-white'} flex flex-col items-center justify-center min-w-[64px] border border-gray-100 shadow-lg`}>
                                                                    <span className="text-[8px] font-black uppercase tracking-widest leading-none mb-1 opacity-70">
                                                                        {dateObj.toLocaleString('default', { month: 'short' })}
                                                                    </span>
                                                                    <span className="text-2xl font-black leading-none">{dateObj.getDate()}</span>
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                                        <p className="text-base font-black uppercase tracking-tight text-gray-900">{schedule.time}</p>
                                                                    </div>
                                                                    <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mt-1 flex items-center gap-1.5 line-clamp-1">
                                                                        <Mail className="w-3.5 h-3.5" /> {schedule.adminEmail}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {isPast ? (
                                                                <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                                                            ) : (
                                                                <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
                                                            )}
                                                        </div>
                                                        <div className="space-y-6">
                                                            <p className="text-sm font-bold text-gray-500 leading-relaxed bg-gray-50/50 group-hover:bg-white p-5 rounded-2xl border border-gray-100 transition-colors">
                                                                {schedule.description}
                                                            </p>
                                                            <a
                                                                href={schedule.meetingLink}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className={`w-full py-4 text-[11px] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 transition-all ${isPast ? 'bg-gray-100 text-gray-400 hover:bg-gray-200' : 'bg-black text-white hover:shadow-xl hover:scale-[1.02] active:scale-95'
                                                                    }`}
                                                            >
                                                                <LinkIcon className="w-4 h-4" />
                                                                {isPast ? 'Meeting Concluded' : 'Join Intelligence Protocol'}
                                                            </a>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
