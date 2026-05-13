"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, Link as LinkIcon, Edit3, Send, Search, RefreshCw, LayoutGrid, CalendarCheck, Plus, X, CheckCircle2, AlertCircle, Minus, ExternalLink, ChevronRight } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { FullScreenCalendar } from "@/components/ui/fullscreen-calendar";

export default function AdminSchedulePage() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [meetingLink, setMeetingLink] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [schedules, setSchedules] = useState([]);
    const [viewMode, setViewMode] = useState("dispatch"); // 'dispatch' | 'calendar' | 'weekly'

    // Weekly Review state
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduling, setScheduling] = useState(false);
    const [wrInternId, setWrInternId] = useState('');
    const [wrSearch, setWrSearch] = useState('');
    const [wrStartDate, setWrStartDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [wrTime, setWrTime] = useState('10:00');
    const [wrMeetLink, setWrMeetLink] = useState('https://meet.google.com/vcd-gfct-jqa');
    const [filterInternId, setFilterInternId] = useState(''); // '' = all

    // Postpone Modal State
    const [postponeEvent, setPostponeEvent] = useState(null);
    const [postponeDate, setPostponeDate] = useState("");
    const [postponeTime, setPostponeTime] = useState("");
    const [postponeLink, setPostponeLink] = useState("");
    const [postponing, setPostponing] = useState(false);
    const [selectedReviewIntern, setSelectedReviewIntern] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch("/api/admin/users");
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data.filter(u => u.role?.toLowerCase() === 'intern'));
                }
            } catch (err) {
                console.error("Failed to fetch interns:", err);
            }
        };

        const fetchSchedules = async () => {
            const adminEmail = localStorage.getItem("userEmail") || "admin@example.com";
            try {
                const res = await fetch(`/api/schedule?role=admin&email=${adminEmail}`);
                if (res.ok) {
                    const data = await res.json();
                    setSchedules(data);
                }
            } catch (err) {
                console.error("Failed to fetch schedules:", err);
            }
        };

        fetchUsers();
        fetchSchedules();
    }, []);

    const fetchReviews = async () => {
        setReviewsLoading(true);
        try {
            const res = await fetch('/api/admin/weekly-review');
            if (res.ok) setReviews(await res.json());
        } catch { /* silent */ }
        finally { setReviewsLoading(false); }
    };

    // Fetch reviews on tab-switch AND on first load (for calendar)
    useEffect(() => {
        fetchReviews();
    }, []);  // initial load
    useEffect(() => {
        if (viewMode === 'weekly') fetchReviews();
    }, [viewMode]);

    const handleAutoSchedule = async () => {
        if (!wrInternId) { toast.error('Please select an intern.'); return; }
        if (!wrStartDate) { toast.error('Please select a start date.'); return; }
        setScheduling(true);
        try {
            const res = await fetch('/api/admin/weekly-review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ internId: wrInternId, meetLink: wrMeetLink, startDate: wrStartDate, startTime: wrTime }),
            });
            const data = await res.json();
            if (res.ok || res.status === 201) {
                toast.success(data.message || 'Reviews scheduled!');
                setShowScheduleModal(false);
                setWrInternId('');
                fetchReviews();
            } else { toast.error(data.message || 'Failed to schedule.'); }
        } catch { toast.error('Error scheduling reviews.'); }
        finally { setScheduling(false); }
    };

    const STATUS_STYLE = {
        Scheduled: 'bg-blue-50 text-blue-600 border-blue-100',
        Completed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        Cancelled: 'bg-red-50 text-red-500 border-red-100',
    };
    const RATING_STYLE = {
        Excellent: 'bg-emerald-50 text-emerald-700',
        'On Track': 'bg-blue-50 text-blue-700',
        'Needs Attention': 'bg-amber-50 text-amber-700',
        Behind: 'bg-red-50 text-red-600',
    };

    const handleSchedule = async (e) => {
        e.preventDefault();
        if (!selectedUser || !date || !time || !meetingLink || !description) {
            toast.error("Please fill all fields to initiate connection.");
            return;
        }

        setIsSubmitting(true);
        const adminEmail = localStorage.getItem("userEmail") || "admin@system.com";

        try {
            const res = await fetch("/api/schedule", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: selectedUser, adminEmail, date, time, meetingLink, description }),
            });

            if (res.ok) {
                toast.success("Schedule Synchronized with User's Portal.");
                const newSchedule = await res.json();
                const matchedUser = users.find(u => u._id === selectedUser);
                setSchedules(prev => [...prev, {
                    ...newSchedule.schedule,
                    userId: { _id: selectedUser, fullName: matchedUser?.fullName, email: matchedUser?.email, track: matchedUser?.track }
                }].sort((a, b) => new Date(a.date) - new Date(b.date)));
                setSelectedUser(""); setDate(""); setTime(""); setMeetingLink(""); setDescription("");
            } else {
                const errorData = await res.json();
                toast.error(errorData.message || "Schedule Dispatch Failed.");
            }
        } catch (error) {
            toast.error("System Error during transmission.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEventAction = async (action, eventData) => {
        if (action === 'postpone_request') {
            setPostponeEvent(eventData);
            setPostponeDate(eventData.datetime.split('T')[0]);
            setPostponeTime(eventData.time);
            setPostponeLink(eventData.meetingLink || "");
            return;
        }
        if (action === 'cancel') {
            if (!confirm('Are you sure you want to cancel this meeting? The intern will be notified via email.')) return;
            try {
                const isReview = eventData.tag === 'review';
                const endpoint = isReview ? '/api/admin/weekly-review' : '/api/schedule';
                const res = await fetch(endpoint, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: eventData.id, status: 'Cancelled' })
                });
                if (res.ok) {
                    toast.success('Meeting Cancelled and User Notified.');
                    fetchReviews();
                    const adminEmail = localStorage.getItem("userEmail") || "admin@example.com";
                    const sRes = await fetch(`/api/schedule?role=admin&email=${adminEmail}`);
                    if (sRes.ok) setSchedules(await sRes.json());
                } else {
                    toast.error('Failed to cancel meeting.');
                }
            } catch (err) {
                toast.error('Server error during cancellation.');
            }
            return;
        }
        if (action === 'attended' || action === 'missed') {
            try {
                const res = await fetch('/api/admin/meetings/action', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reviewId: eventData.id, action })
                });
                const data = await res.json();
                if (res.ok) {
                    toast.success(data.message);
                    fetchReviews();
                    if (action === 'attended' && eventData.internId) {
                        router.push(`/admin/users/${eventData.internId}`);
                    }
                } else {
                    toast.error(data.message || 'Action failed');
                }
            } catch (err) {
                toast.error('Server error during action.');
            }
        }
    };

    const handlePostponeSubmit = async () => {
        if (!postponeEvent || !postponeDate || !postponeTime) return;
        setPostponing(true);
        try {
            const isReview = postponeEvent.tag === 'review';
            const endpoint = isReview ? '/api/admin/weekly-review' : '/api/schedule';
            const body = isReview ? {
                id: postponeEvent.id,
                scheduledDate: postponeDate,
                scheduledTime: postponeTime,
                meetLink: postponeLink,
                status: postponeEvent.status
            } : {
                id: postponeEvent.id,
                date: postponeDate,
                time: postponeTime,
                meetingLink: postponeLink
            };

            const res = await fetch(endpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Meeting updated successfully!');
                setPostponeEvent(null);
                fetchReviews();
                const adminEmail = localStorage.getItem("userEmail") || "admin@example.com";
                const sRes = await fetch(`/api/schedule?role=admin&email=${adminEmail}`);
                if (sRes.ok) setSchedules(await sRes.json());
            } else {
                toast.error(data.message || 'Failed to postpone.');
            }
        } catch {
            toast.error('Error postponing meeting.');
        } finally {
            setPostponing(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Merge regular schedules + weekly reviews into calendar data
    const calendarData = Object.values(
        [
            // Regular one-off meetings
            ...schedules.map(s => {
                const d = new Date(s.date);
                const localDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
                const dateStr = d.toISOString().split('T')[0];
                return {
                    _id: s._id,
                    dateStr,
                    dateObj: localDate,
                    event: {
                        id: s._id,
                        name: s.userId?.fullName || 'Intern',
                        description: s.description || 'Meeting',
                        time: s.time,
                        datetime: `${dateStr}T${s.time}`,
                        meetingLink: s.meetingLink,
                        tag: 'meeting',
                    },
                };
            }),
            // Weekly review sessions
            ...reviews.map(r => {
                const d = new Date(r.scheduledDate);
                const localDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
                const dateStr = d.toISOString().split('T')[0];
                return {
                    _id: r._id,
                    dateStr,
                    dateObj: localDate,
                    event: {
                        id: r._id,
                        name: r.internName || 'Intern',
                        description: `Weekly Review — ${r.weekLabel}`,
                        time: r.scheduledTime,
                        datetime: `${dateStr}T${r.scheduledTime}`,
                        meetingLink: r.meetLink,
                        status: r.status,
                        internEmail: r.internEmail,
                        internId: r.internId,
                        tag: 'review',
                    },
                };
            }),
        ].reduce((acc, item) => {
            if (!acc[item.dateStr]) acc[item.dateStr] = { day: item.dateObj, events: [] };
            acc[item.dateStr].events.push(item.event);
            return acc;
        }, {})
    );


    return (
        <div className="animate-in fade-in duration-500">
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-3xl -mx-8 -mt-8 px-8 py-5 border-b border-gray-100 shadow-sm mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-8 bg-black rounded-full" />
                        <h1 className="text-2xl font-black text-black tracking-tighter uppercase leading-none">
                            Schedule Hub
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <nav className="flex items-center bg-gray-50/50 p-1 rounded-xl border border-gray-100">
                            <button
                                onClick={() => setViewMode("dispatch")}
                                className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'dispatch' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-black hover:bg-white'}`}
                            >
                                Dispatch
                            </button>
                            <button
                                onClick={() => setViewMode("calendar")}
                                className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'calendar' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-black hover:bg-white'}`}
                            >
                                Calendar
                            </button>
                            <button
                                onClick={() => { setViewMode("weekly"); setSelectedReviewIntern(null); }}
                                className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'weekly' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-black hover:bg-white'}`}
                            >
                                Interns
                            </button>
                        </nav>
                    </div>
                </div>
            </header>

            <div className="px-8 pb-20 max-w-[1750px] mx-auto">
                <AnimatePresence mode="wait">
                    {viewMode === "dispatch" ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="flex-1 overflow-auto p-8"
                        >
                            <div className="w-full max-w-[1200px] mx-auto">
                                <form onSubmit={handleSchedule} className="bg-white rounded-[3.5rem] border border-gray-100 shadow-2xl p-10 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                                        <Clock className="w-48 h-48 -mr-16 -mt-16" />
                                    </div>

                                    <div className="flex flex-col lg:flex-row gap-8 relative z-10">
                                        {/* Left Column: Selector & Action */}
                                        <div className="w-full lg:w-[400px] flex flex-col gap-8">
                                            <div className="space-y-1 border-b border-gray-100 pb-4">
                                                <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">Schedule Meeting</h3>
                                                <p className="text-[9px] uppercase font-black tracking-widest text-gray-400">Initialize a new logistics connection.</p>
                                            </div>

                                            <div className="space-y-4 flex-1">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-2">Select Intern Target</label>
                                                <div className="bg-gray-50/50 border border-gray-100 rounded-[2rem] p-4 flex flex-col h-[350px]">
                                                    <div className="relative mb-3 sticky top-0 bg-gray-50/50 z-10 pb-2">
                                                        <Search className="absolute left-4 top-[35%] -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                        <input
                                                            placeholder="Search by name or email..."
                                                            value={searchTerm}
                                                            onChange={e => setSearchTerm(e.target.value)}
                                                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-[10px] font-bold outline-none focus:ring-8 focus:ring-black/5 transition-all shadow-sm"
                                                        />
                                                    </div>
                                                    <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-2">
                                                        {filteredUsers.length === 0 && <p className="text-[10px] text-gray-400 font-bold p-4 text-center">No active interns found.</p>}
                                                        {filteredUsers.map(user => (
                                                            <div
                                                                key={user._id}
                                                                onClick={() => setSelectedUser(user._id)}
                                                                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${selectedUser === user._id ? 'border-black bg-black text-white shadow-xl scale-[1.02]' : 'border-transparent bg-white hover:bg-gray-50 hover:shadow-sm'}`}
                                                            >
                                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm ${selectedUser === user._id ? 'bg-white text-black' : 'bg-gray-100 text-gray-400'}`}>
                                                                    {user.fullName?.charAt(0) || "U"}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className={`text-[11px] font-black uppercase truncate ${selectedUser === user._id ? 'text-white' : 'text-gray-900'}`}>{user.fullName}</p>
                                                                    <p className={`text-[8px] font-black tracking-widest uppercase truncate ${selectedUser === user._id ? 'text-white/50' : 'text-gray-400'}`}>{user.track || 'Unassigned'}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <button type="submit" disabled={isSubmitting}
                                                className={`w-full py-5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center gap-3 group transition-all ${isSubmitting ? 'opacity-70' : 'hover:bg-neutral-800'}`}>
                                                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <CalendarCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                                                Schedule Meeting
                                            </button>
                                        </div>

                                        {/* Right Column: Details */}
                                        <div className="flex-1 space-y-8 pt-4">
                                            <div className="grid grid-cols-2 gap-6 pt-4">
                                                <div className="space-y-3">
                                                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-2">Operation Date</label>
                                                    <div className="relative">
                                                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                                        <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                                                            className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-black focus:bg-white focus:ring-8 focus:ring-black/5 outline-none transition-all shadow-inner" />
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-2">Time Slot (09:00 - 20:00)</label>
                                                    <div className="relative">
                                                        <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                                        <input type="time" value={time} onChange={e => setTime(e.target.value)} required
                                                            min="09:00" max="20:00"
                                                            className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-black focus:bg-white focus:ring-8 focus:ring-black/5 outline-none transition-all shadow-inner" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-2">Mission Link (Zoom / Meet)</label>
                                                <div className="relative">
                                                    <LinkIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                                    <input type="url" placeholder="https://zoom.us/j/..." value={meetingLink} onChange={e => setMeetingLink(e.target.value)} required
                                                        className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-[11px] font-black focus:bg-white focus:ring-8 focus:ring-black/5 outline-none transition-all shadow-inner" />
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-2">Communication Blueprint / Purpose</label>
                                                <div className="relative">
                                                    <Edit3 className="absolute left-5 top-6 w-4 h-4 text-gray-300" />
                                                    <textarea rows="6" placeholder="Define the core objectives and expected outcomes of this meeting..." value={description}
                                                        onChange={e => setDescription(e.target.value)} required
                                                        className="w-full bg-gray-50/50 border border-gray-100 rounded-[2rem] pl-12 pr-6 py-6 text-[11px] font-bold focus:bg-white focus:ring-8 focus:ring-black/5 outline-none resize-none transition-all shadow-inner leading-relaxed" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    ) : viewMode === 'calendar' ? (
                        <motion.div
                            key="calendar"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="flex flex-col flex-1 overflow-auto"
                        >
                            <FullScreenCalendar data={calendarData} onEventAction={handleEventAction} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="weekly"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="flex-1 overflow-auto p-8"
                        >
                            {selectedReviewIntern ? (
                                /* ── INTERN DETAIL VIEW ── */
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => setSelectedReviewIntern(null)}
                                                className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-all text-gray-400 hover:text-black"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                            <div>
                                                <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900">{selectedReviewIntern.fullName}</h2>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{selectedReviewIntern.track} — Schedule Details</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setWrInternId(selectedReviewIntern._id);
                                                setWrSearch(selectedReviewIntern.fullName);
                                                setShowScheduleModal(true);
                                            }}
                                            className="flex items-center gap-2 px-5 py-3 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Auto-Schedule Week
                                        </button>
                                    </div>

                                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden">
                                        <div className="grid grid-cols-[1.2fr_1.5fr_1fr_1fr_auto] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100">
                                            {['Session / Type', 'Date / Time', 'Status', 'Rating', ''].map((h, i) => (
                                                <span key={i} className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]">{h}</span>
                                            ))}
                                        </div>
                                        <div className="divide-y divide-gray-50">
                                            {[
                                                ...reviews.filter(r => r.internId === selectedReviewIntern._id).map(r => ({ ...r, tag: 'review' })),
                                                ...schedules.filter(s => s.userId?._id === selectedReviewIntern._id).map(s => ({
                                                    ...s,
                                                    tag: 'meeting',
                                                    scheduledDate: s.date,
                                                    scheduledTime: s.time,
                                                    weekLabel: 'One-off Meeting',
                                                    meetLink: s.meetingLink
                                                }))
                                            ].sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate)).map(r => (
                                                <div key={r._id} className="grid grid-cols-[1.2fr_1.5fr_1fr_1fr_auto] gap-4 px-6 py-5 items-center hover:bg-gray-50/50 transition-colors">
                                                    <div>
                                                        <p className="text-[11px] font-black text-gray-900 uppercase">{r.weekLabel}</p>
                                                        <span className={`text-[7px] font-black uppercase tracking-[0.2em] px-1.5 py-0.5 rounded ${r.tag === 'review' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'}`}>
                                                            {r.tag}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-gray-700">{r.scheduledDate ? new Date(r.scheduledDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</p>
                                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{r.scheduledTime || '—'}</p>
                                                    </div>
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border w-fit ${STATUS_STYLE[r.status] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                                        {r.status || 'Scheduled'}
                                                    </span>
                                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest w-fit ${r.progressRating ? RATING_STYLE[r.progressRating] || 'bg-gray-50 text-gray-500' : 'bg-gray-50 text-gray-300'}`}>
                                                        {r.progressRating || '—'}
                                                    </span>
                                                    <div className="flex items-center gap-2 justify-end">
                                                        {r.meetLink && (
                                                            <a href={r.meetLink} target="_blank" rel="noreferrer" className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition-all">
                                                                <ExternalLink className="w-3.5 h-3.5" />
                                                            </a>
                                                        )}
                                                        <button
                                                            onClick={() => handleEventAction('cancel', {
                                                                id: r._id,
                                                                tag: r.tag
                                                            })}
                                                            className="p-2 bg-red-50 border border-red-100 rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-all"
                                                            title="Cancel Meeting"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEventAction('postpone_request', {
                                                                id: r._id,
                                                                name: selectedReviewIntern.fullName,
                                                                time: r.scheduledTime,
                                                                datetime: `${new Date(r.scheduledDate).toISOString().split('T')[0]}T${r.scheduledTime}`,
                                                                meetingLink: r.meetLink,
                                                                status: r.status,
                                                                tag: r.tag
                                                            })}
                                                            className="p-2 bg-gray-50 border border-gray-100 rounded-lg text-gray-400 hover:text-black transition-all"
                                                        >
                                                            <Edit3 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* ── INTERN LIST VIEW ── */
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Intern Schedules</h2>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Select an intern to manage their meetings</p>
                                        </div>
                                        <div className="relative w-72">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                placeholder="Search interns..."
                                                value={wrSearch}
                                                onChange={e => setWrSearch(e.target.value)}
                                                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-bold outline-none focus:ring-4 focus:ring-black/5"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {users.filter(u =>
                                            u.fullName?.toLowerCase().includes(wrSearch.toLowerCase()) ||
                                            u.email?.toLowerCase().includes(wrSearch.toLowerCase())
                                        ).map(user => {
                                            const userReviews = reviews.filter(r => r.internId === user._id);
                                            const userSchedules = schedules.filter(s => s.userId?._id === user._id);
                                            const total = userReviews.length + userSchedules.length;
                                            const completed = [...userReviews, ...userSchedules].filter(m => m.status === 'Completed').length;

                                            return (
                                                <motion.div
                                                    key={user._id}
                                                    whileHover={{ y: -4 }}
                                                    onClick={() => setSelectedReviewIntern(user)}
                                                    className="group cursor-pointer bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all relative overflow-hidden"
                                                >
                                                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                                        <CalendarCheck className="w-24 h-24 -mr-8 -mt-8" />
                                                    </div>

                                                    <div className="flex items-center gap-4 mb-6 relative z-10">
                                                        <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center font-black text-lg">
                                                            {user.fullName?.charAt(0)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h3 className="text-sm font-black text-gray-900 uppercase truncate">{user.fullName}</h3>
                                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate">{user.track || 'Unassigned'}</p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4 relative z-10">
                                                        <div className="flex justify-between items-end">
                                                            <div>
                                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]">Meetings</p>
                                                                <p className="text-xl font-black text-gray-900">{total} <span className="text-[10px] text-gray-300">Scheduled</span></p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]">Completed</p>
                                                                <p className="text-sm font-black text-emerald-500">{completed}/{total}</p>
                                                            </div>
                                                        </div>

                                                        {/* Simple progress bar */}
                                                        <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: total > 0 ? `${(completed / total) * 100}%` : 0 }}
                                                                className="h-full bg-black rounded-full"
                                                            />
                                                        </div>

                                                        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Active Status</span>
                                                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-black group-hover:translate-x-1 transition-all" />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}

                                        {/* Quick Add placeholder */}
                                        <button
                                            onClick={() => setShowScheduleModal(true)}
                                            className="group bg-gray-50/50 border-2 border-dashed border-gray-100 rounded-[2rem] p-6 flex flex-col items-center justify-center gap-3 hover:bg-white hover:border-black/10 transition-all text-gray-400 hover:text-black"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                                                <Plus className="w-5 h-5" />
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-widest">Schedule New Intern</p>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Schedule Intern Modal ── */}
            {mounted && createPortal(
            <AnimatePresence>
                {showScheduleModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowScheduleModal(false)} className="absolute inset-0 bg-black/50 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
                            className="relative bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-gray-100">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.4em] mb-1">Weekly Reviews</p>
                                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Schedule Intern</h3>
                                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">Creates 4 weekly meetings automatically</p>
                                </div>
                                <button onClick={() => setShowScheduleModal(false)} className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 transition-all border border-gray-100">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Intern picker */}
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Intern</label>
                                    <div className="border border-gray-100 rounded-2xl bg-gray-50 overflow-hidden">
                                        <div className="relative p-2">
                                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                            <input placeholder="Search intern..." value={wrSearch} onChange={e => setWrSearch(e.target.value)}
                                                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-black/5" />
                                        </div>
                                        <div className="max-h-40 overflow-y-auto divide-y divide-gray-50">
                                            {users.filter(u =>
                                                u.fullName?.toLowerCase().includes(wrSearch.toLowerCase()) ||
                                                u.email?.toLowerCase().includes(wrSearch.toLowerCase())
                                            ).map(u => (
                                                <button key={u._id} onClick={() => { setWrInternId(u._id); setWrSearch(u.fullName); }}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${wrInternId === u._id ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>
                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${wrInternId === u._id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                                        {u.fullName?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className={`text-[10px] font-black uppercase ${wrInternId === u._id ? 'text-white' : 'text-gray-900'}`}>{u.fullName}</p>
                                                        <p className={`text-[8px] font-bold ${wrInternId === u._id ? 'text-white/60' : 'text-gray-400'}`}>{u.track || 'No track'}</p>
                                                    </div>
                                                    {wrInternId === u._id && <CheckCircle2 className="w-4 h-4 ml-auto text-white/80" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Meet link */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Start Date</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                                <input type="date" value={wrStartDate} onChange={e => setWrStartDate(e.target.value)}
                                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-11 pr-4 py-3 text-[11px] font-bold focus:ring-4 focus:ring-black/5 outline-none" />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Start Time</label>
                                            <div className="relative">
                                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                                <input type="time" value={wrTime} onChange={e => setWrTime(e.target.value)}
                                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-11 pr-4 py-3 text-[11px] font-bold focus:ring-4 focus:ring-black/5 outline-none" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Meeting Link</label>
                                        <div className="relative">
                                            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                            <input type="url" value={wrMeetLink} onChange={e => setWrMeetLink(e.target.value)}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-11 pr-4 py-3 text-[11px] font-bold focus:ring-4 focus:ring-black/5 outline-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 space-y-2">
                                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">What happens next</p>
                                    <ul className="space-y-1.5">
                                        {[
                                            '4 weekly meetings created from selected date',
                                            `Slots start at ${wrTime} (spaced 20m per intern)`,
                                            'Confirmation emails sent to intern + admin',
                                            '24h + 1h before reminders sent automatically',
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-start gap-2 text-[10px] text-blue-700 font-medium">
                                                <span className="text-blue-400 font-black mt-0.5">→</span>{item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <button onClick={handleAutoSchedule} disabled={scheduling || !wrInternId}
                                    className="w-full py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 shadow-lg flex items-center justify-center gap-2">
                                    {scheduling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CalendarCheck className="w-4 h-4" />}
                                    {scheduling ? 'Scheduling...' : 'Schedule 4 Meetings'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>, document.body)}
            {/* ── Postpone Modal ── */}
            {mounted && createPortal(
            <AnimatePresence>
                {postponeEvent && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setPostponeEvent(null)} className="absolute inset-0 bg-black/50 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
                            className="relative bg-white rounded-[2.5rem] p-8 max-w-[360px] w-full shadow-2xl border border-gray-100">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.4em] mb-1">Update Schedule</p>
                                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Edit Meeting</h3>
                                </div>
                                <button onClick={() => setPostponeEvent(null)} className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 transition-all border border-gray-100">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">New Date</label>
                                    <input type="date" value={postponeDate} onChange={e => setPostponeDate(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[11px] font-bold outline-none" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">New Time</label>
                                    <input type="time" value={postponeTime} onChange={e => setPostponeTime(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[11px] font-bold outline-none" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Meeting Link</label>
                                    <input type="url" value={postponeLink} onChange={e => setPostponeLink(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[11px] font-bold outline-none" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status</label>
                                    <select
                                        value={postponeEvent.status || "Scheduled"}
                                        onChange={e => setPostponeEvent({ ...postponeEvent, status: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[11px] font-bold outline-none appearance-none"
                                    >
                                        <option value="Scheduled">Scheduled</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <button onClick={handlePostponeSubmit} disabled={postponing}
                                    className="w-full py-4 mt-2 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                    {postponing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                                    {postponing ? 'Saving...' : 'Update Schedule'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>, document.body)}
        </div>
    );
}
