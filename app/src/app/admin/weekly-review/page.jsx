"use client";

import { useState, useEffect, useCallback } from "react";
import {
    CalendarCheck, Clock, Link as LinkIcon, Users, CheckCircle2,
    AlertTriangle, RefreshCw, ChevronDown, X, Edit3, Send,
    Zap, Star, TrendingUp, ArrowRight, Mail, BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

const DEFAULT_LINK = "https://meet.google.com/vcd-gfct-jqa";

const RATING_CONFIG = {
    "Excellent": { color: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
    "On Track": { color: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-500" },
    "Needs Attention": { color: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-500" },
    "Behind": { color: "bg-red-50 text-red-700 border-red-100", dot: "bg-red-500" },
    "": { color: "bg-gray-50 text-gray-400 border-gray-100", dot: "bg-gray-300" },
};

const STATUS_CONFIG = {
    Scheduled: { color: "bg-blue-50 text-blue-700 border-blue-100" },
    Completed: { color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    Cancelled: { color: "bg-gray-50 text-gray-400 border-gray-100" },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function getMonday(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1 - day);
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function toDateInput(date) {
    return date.toISOString().slice(0, 10);
}

export default function WeeklyReviewPage() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [scheduling, setScheduling] = useState(false);

    // Schedule form
    const [weekStart, setWeekStart] = useState(toDateInput(getMonday()));
    const [scheduledDate, setScheduledDate] = useState(toDateInput(getMonday()));
    const [scheduledTime, setScheduledTime] = useState("10:00");
    const [meetLink, setMeetLink] = useState(DEFAULT_LINK);
    const [showScheduleForm, setShowScheduleForm] = useState(false);

    // Progress edit modal
    const [editReview, setEditReview] = useState(null);
    const [editRating, setEditRating] = useState("");
    const [editNote, setEditNote] = useState("");
    const [editStatus, setEditStatus] = useState("");
    const [editLink, setEditLink] = useState("");
    const [saving, setSaving] = useState(false);

    // Week filter
    const [filterWeek, setFilterWeek] = useState(toDateInput(getMonday()));

    const loadReviews = useCallback(async (week) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/weekly-review?weekStart=${week}`);
            if (res.ok) setReviews(await res.json());
        } catch { toast.error("Failed to load reviews"); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadReviews(filterWeek); }, [filterWeek, loadReviews]);

    // ── Auto-schedule ─────────────────────────────────────────────────────────
    const handleSchedule = async () => {
        if (!weekStart || !scheduledDate || !scheduledTime) {
            toast.error("Please fill all fields"); return;
        }
        setScheduling(true);
        try {
            const adminEmail = localStorage.getItem("userEmail") || "gauthamram.um@gmail.com";
            const res = await fetch("/api/admin/weekly-review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ weekStart, scheduledDate, scheduledTime, meetLink, adminEmail }),
            });
            const data = await res.json();
            if (res.ok || res.status === 201) {
                toast.success(data.message);
                setShowScheduleForm(false);
                setFilterWeek(weekStart);
                loadReviews(weekStart);
            } else {
                toast.error(data.message || "Failed to schedule");
            }
        } catch { toast.error("Network error"); }
        finally { setScheduling(false); }
    };

    // ── Save progress ─────────────────────────────────────────────────────────
    const openEdit = (r) => {
        setEditReview(r);
        setEditRating(r.progressRating || "");
        setEditNote(r.progressNote || "");
        setEditStatus(r.status || "Scheduled");
        setEditLink(r.meetLink || DEFAULT_LINK);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/admin/weekly-review", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editReview._id,
                    progressRating: editRating,
                    progressNote: editNote,
                    status: editStatus,
                    meetLink: editLink,
                }),
            });
            if (res.ok) {
                const updated = await res.json();
                setReviews(prev => prev.map(r => r._id === updated._id ? updated : r));
                toast.success("Progress saved!");
                setEditReview(null);
            } else {
                toast.error("Failed to save");
            }
        } catch { toast.error("Network error"); }
        finally { setSaving(false); }
    };

    // ── Stats ─────────────────────────────────────────────────────────────────
    const stats = {
        total: reviews.length,
        completed: reviews.filter(r => r.status === "Completed").length,
        excellent: reviews.filter(r => r.progressRating === "Excellent").length,
        behind: reviews.filter(r => r.progressRating === "Behind" || r.progressRating === "Needs Attention").length,
    };

    return (
        <div className="animate-in fade-in duration-500">
            {/* Sticky Header */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-3xl -mx-8 -mt-8 px-8 py-5 border-b border-gray-100 shadow-sm mb-8">
                <div className="flex items-center justify-between gap-6 w-full px-4">
                    <h1 className="text-xl font-bold text-black tracking-tight uppercase leading-none">
                        Review Hub
                    </h1>

                    <div className="flex items-center gap-4">
                        <button onClick={() => loadReviews(filterWeek)}
                            className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-gray-400 hover:text-black hover:border-black transition-all shadow-sm">
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={() => setShowScheduleForm(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-[1.05] active:scale-95 transition-all shadow-lg">
                            <Zap className="w-4 h-4" /> Auto-Schedule Week
                        </button>
                    </div>
                </div>
            </header>

            <div className="px-8 pb-20 max-w-[1750px] mx-auto space-y-8">

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Reviews", val: stats.total, icon: Users, from: "from-gray-500 to-gray-700" },
                    { label: "Completed", val: stats.completed, icon: CheckCircle2, from: "from-emerald-500 to-emerald-600" },
                    { label: "Excellent", val: stats.excellent, icon: Star, from: "from-violet-500 to-violet-600" },
                    { label: "Need Attention", val: stats.behind, icon: AlertTriangle, from: "from-amber-500 to-amber-600" },
                ].map(s => {
                    const Icon = s.icon;
                    return (
                        <div key={s.label} className="bg-white rounded-[1.75rem] p-5 border border-gray-100 shadow-sm relative overflow-hidden">
                            <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${s.from} opacity-[0.07] rounded-full -translate-y-1/3 translate-x-1/3`} />
                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.from} flex items-center justify-center mb-3 shadow-md`}>
                                <Icon className="w-4 h-4 text-white" />
                            </div>
                            <p className="text-2xl font-black text-gray-900">{s.val}</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{s.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* ── Week Filter ── */}
            <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <CalendarCheck className="w-4 h-4 text-gray-400" />
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Week starting</label>
                <input type="date" value={filterWeek} onChange={e => setFilterWeek(e.target.value)}
                    className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/10" />
                <span className="text-xs text-gray-300 font-medium">Showing {reviews.length} intern{reviews.length !== 1 ? 's' : ''}</span>
            </div>

            {/* ── Review Table ── */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                    <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" /> Review Sessions
                    </h2>
                </div>

                {loading ? (
                    <div className="p-6 space-y-3">
                        {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-50 rounded-2xl animate-pulse" />)}
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-300 gap-3">
                        <CalendarCheck className="w-12 h-12" />
                        <p className="text-xs font-black uppercase tracking-widest">No reviews for this week</p>
                        <button onClick={() => setShowScheduleForm(true)}
                            className="mt-2 px-4 py-2 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                            Auto-Schedule Now
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {reviews.map(r => {
                            const rc = RATING_CONFIG[r.progressRating || ""];
                            const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG.Scheduled;
                            return (
                                <div key={r._id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors group">
                                    {/* Avatar initial */}
                                    <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center font-black text-gray-500 text-sm shrink-0">
                                        {r.internName?.charAt(0).toUpperCase()}
                                    </div>

                                    {/* Name + track */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-gray-900 truncate">{r.internName}</p>
                                        <p className="text-[10px] font-medium text-gray-400 truncate">{r.internEmail}</p>
                                        {r.track && <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{r.track}</span>}
                                    </div>

                                    {/* Date + time */}
                                    <div className="hidden md:flex flex-col items-end">
                                        <p className="text-xs font-bold text-gray-700">{new Date(r.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                        <p className="text-[10px] text-gray-400">{r.scheduledTime}</p>
                                    </div>

                                    {/* Meet link */}
                                    <a href={r.meetLink} target="_blank" rel="noopener noreferrer"
                                        className="hidden md:flex items-center gap-1 text-[10px] font-black text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 shrink-0 transition-colors"
                                        onClick={e => e.stopPropagation()}>
                                        <LinkIcon className="w-3 h-3" /> Join
                                    </a>

                                    {/* Progress rating badge */}
                                    <span className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shrink-0 ${rc.color}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${rc.dot}`} />
                                        {r.progressRating || "Not Rated"}
                                    </span>

                                    {/* Status */}
                                    <span className={`hidden md:flex px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shrink-0 ${sc.color}`}>
                                        {r.status}
                                    </span>

                                    {/* Edit button */}
                                    <button onClick={() => openEdit(r)}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-black hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0">
                                        <Edit3 className="w-3 h-3" /> Update
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ════ MODALS ════ */}
            <AnimatePresence>

                {/* ── Auto-Schedule Modal ── */}
                {showScheduleForm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowScheduleForm(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">

                            <div className="px-7 pt-7 pb-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/40">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Auto-Schedule Weekly Review</h3>
                                        <p className="text-[10px] text-gray-400 font-medium">Sends email to all active interns + their admins</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowScheduleForm(false)}
                                    className="w-8 h-8 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-7 space-y-5">
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Week Starting (Monday)</label>
                                    <input type="date" value={weekStart} onChange={e => setWeekStart(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 focus:outline-none focus:ring-4 focus:ring-black/5" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Meeting Date</label>
                                        <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 focus:outline-none focus:ring-4 focus:ring-black/5" />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Time</label>
                                        <input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 focus:outline-none focus:ring-4 focus:ring-black/5" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Google Meet Link</label>
                                    <input type="url" value={meetLink} onChange={e => setMeetLink(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-blue-600 focus:outline-none focus:ring-4 focus:ring-black/5"
                                        placeholder="https://meet.google.com/..." />
                                    <p className="text-[9px] text-gray-400 font-medium mt-1 ml-1">Default: {DEFAULT_LINK}</p>
                                </div>

                                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                                    <p className="text-[10px] font-black text-amber-700 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> What happens:</p>
                                    <ul className="text-[10px] text-amber-600 font-medium mt-1 space-y-0.5 list-disc list-inside">
                                        <li>Creates a review entry for every active intern</li>
                                        <li>Sends meeting reminder email to each intern</li>
                                        <li>Sends copy to their assigned admin</li>
                                        <li>Skips interns already scheduled this week</li>
                                    </ul>
                                </div>

                                <button onClick={handleSchedule} disabled={scheduling}
                                    className="w-full py-4 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 shadow-lg flex items-center justify-center gap-2">
                                    {scheduling ? <><RefreshCw className="w-4 h-4 animate-spin" /> Scheduling...</> : <><Zap className="w-4 h-4" /> Schedule All Interns</>}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* ── Progress Edit Modal ── */}
                {editReview && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setEditReview(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">

                            <div className="px-7 pt-7 pb-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/40">
                                <div>
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Update Progress</h3>
                                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">{editReview.internName} · {editReview.weekLabel}</p>
                                </div>
                                <button onClick={() => setEditReview(null)}
                                    className="w-8 h-8 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-7 space-y-5">
                                {/* Progress Rating */}
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Progress Rating</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {["Excellent", "On Track", "Needs Attention", "Behind"].map(r => (
                                            <button key={r} onClick={() => setEditRating(r)}
                                                className={`py-2.5 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${editRating === r ? RATING_CONFIG[r].color + ' scale-[1.02] shadow-md' : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-gray-200'}`}>
                                                <div className="flex items-center gap-2 justify-center">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${RATING_CONFIG[r].dot}`} />
                                                    {r}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Review Status</label>
                                    <div className="relative">
                                        <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                                            className="w-full appearance-none bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 focus:outline-none focus:ring-4 focus:ring-black/5">
                                            <option>Scheduled</option>
                                            <option>Completed</option>
                                            <option>Cancelled</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Meet Link override */}
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Meeting Link</label>
                                    <input type="url" value={editLink} onChange={e => setEditLink(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-blue-600 focus:outline-none focus:ring-4 focus:ring-black/5" />
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Progress Notes</label>
                                    <textarea value={editNote} onChange={e => setEditNote(e.target.value)} rows={3}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-4 focus:ring-black/5 resize-none"
                                        placeholder="Add review observations, blockers, accomplishments..." />
                                </div>

                                <div className="flex gap-3">
                                    <button onClick={() => setEditReview(null)}
                                        className="flex-1 py-3 bg-gray-50 text-gray-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all">
                                        Cancel
                                    </button>
                                    <button onClick={handleSave} disabled={saving}
                                        className="flex-[2] py-3 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 shadow-lg flex items-center justify-center gap-2">
                                        {saving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><CheckCircle2 className="w-4 h-4" /> Save Progress</>}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            </div>
        </div>
    );
}
