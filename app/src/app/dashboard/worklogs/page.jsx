"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { 
    Calendar, CheckCircle, XCircle, ExternalLink, Eye, 
    Loader2, ClipboardList, Plus, X 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Helper to format date string YYYY-MM-DD to "D MMM YYYY"
const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthName = months[parseInt(month, 10) - 1] || "";
    return `${parseInt(day, 10)} ${monthName} ${year}`;
};

// Helper to format ISO Date/Time to "D MMM YYYY h:mm A"
const formatDateTime = (dateObj) => {
    if (!dateObj) return "";
    const d = new Date(dateObj);
    if (isNaN(d.getTime())) return "";
    
    const day = d.getDate();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    
    return `${day} ${month} ${year} ${hours}:${minutes} ${ampm}`;
};

// Helper to format ISO time only to "h:mm A"
const formatTimeOnly = (dateObj) => {
    if (!dateObj) return "";
    const d = new Date(dateObj);
    if (isNaN(d.getTime())) return "";
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
};

// Client-side helper to get IST date string (YYYY-MM-DD)
const getISTDateString = (date = new Date()) => {
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const istDate = new Date(utc + (3600000 * 5.5));
    const year = istDate.getFullYear();
    const month = String(istDate.getMonth() + 1).padStart(2, '0');
    const day = String(istDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function InternWorklogsPage() {
    const [logs, setLogs] = useState([]);
    const [attendancePercentage, setAttendancePercentage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Form inputs
    const [content, setContent] = useState("");
    const [linksInput, setLinksInput] = useState("");

    // Selected log for View Modal
    const [selectedLog, setSelectedLog] = useState(null);

    const email = typeof window !== 'undefined' ? localStorage.getItem("userEmail") : null;
    const todayStr = getISTDateString();

    const fetchHistory = async () => {
        if (!email) return;
        try {
            const res = await fetch(`/api/worklogs?email=${encodeURIComponent(email)}`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs || []);
                setAttendancePercentage(data.attendancePercentage ?? 0);
            } else {
                toast.error("Failed to load worklog history.");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred while loading history.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [email]);

    const alreadySubmitted = logs.some(log => log.date === todayStr);
    
    // Filter to only display present/completed worklogs in the main completed logs list
    const completedLogs = logs.filter(log => log.status === 'Present');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) {
            toast.error("Please describe your work done.");
            return;
        }

        // Parse comma-separated links
        const links = linksInput
            .split(",")
            .map(link => link.trim())
            .filter(link => {
                if (!link) return false;
                try {
                    new URL(link);
                    return true;
                } catch (_) {
                    return false;
                }
            });

        if (linksInput.trim() && links.length === 0) {
            toast.error("Please enter valid URL links (starting with http/https).");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/worklogs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    content: content.trim(),
                    links
                })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Daily worklog submitted successfully!");
                setContent("");
                setLinksInput("");
                setIsDrawerOpen(false);
                fetchHistory(); // Refresh history
            } else {
                toast.error(data.error || "Failed to submit worklog.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Connection error. Try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="w-10 h-10 animate-spin text-black" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500">
            {/* Standardized Tactical Header */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-3xl -mx-8 -mt-8 px-8 py-5 border-b border-gray-100 shadow-sm mb-12">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-8 bg-black rounded-lg" />
                        <div>
                            <h1 className="text-2xl font-black text-black tracking-tighter uppercase leading-none">
                                Worklog 
                            </h1>
                         
                        </div>
                    </div>
                    {/* Small white box with only percentage in top right corner */}
                    <div className="bg-white border border-gray-200 px-5 py-3 rounded-lg shadow-sm text-right shrink-0 flex flex-col justify-center">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Attendance</span>
                        <span className="text-2xl font-black text-black leading-none">{attendancePercentage}%</span>
                        <span className="text-[10px] text-gray-400 font-medium mt-1">
                            ({logs.filter(l => l.status === 'Present').length} of {logs.length} sessions filled)
                        </span>
                    </div>
                </div>
            </header>

            {/* Layout Grid (Equal width columns, expanded to utilize remaining space) */}
            <div className="pb-20 w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                {/* Left Side: Completed Section */}
                <div className="bg-white rounded-lg border border-gray-100 p-8 shadow-sm">
                    <div>
                        <h2 className="font-semibold font-black text-gray-900 uppercase tracking-tight">Completed</h2>
                        <p className="text-xs text-gray-400 font-medium mt-1 mb-4">All your completed worklogs will appear here.</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 text-xs font-bold text-gray-400 pb-3">
                                    <th className="pb-3 font-bold text-gray-500 w-1/3">Date</th>
                                    <th className="pb-3 font-bold text-gray-500 w-1/3">Submitted at</th>
                                    <th className="pb-3 font-bold text-gray-500 w-1/3 text-right pr-4">Worklog</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {completedLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="text-center py-12 text-sm text-gray-400 font-medium">
                                            No completed worklogs found.
                                        </td>
                                    </tr>
                                ) : (
                                    completedLogs.map((log) => (
                                        <tr key={log._id} className="hover:bg-gray-50/30 transition-all">
                                            <td className="py-5 text-sm text-gray-900 font-medium">
                                                {formatDate(log.date)}
                                            </td>
                                            <td className="py-5 text-sm text-gray-900 font-medium">
                                                {formatDateTime(log.createdAt)}
                                            </td>
                                            <td className="py-5 text-sm text-right pr-4">
                                                <button
                                                    onClick={() => setSelectedLog(log)}
                                                    className="text-gray-900 hover:text-black font-medium underline underline-offset-4 decoration-dotted"
                                                >
                                                    view
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Side: Daily Submission Section */}
                <div className="bg-white rounded-lg border border-gray-100 p-8 shadow-sm">
                    <div className="mb-4">
                        <h2 className=" font-black font-semibold text-gray-900 uppercase tracking-tight flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-gray-400" /> Daily Submission
                        </h2>
                        <p className="text-xs text-gray-400 font-medium mt-1">
                            Log your daily work by 11:59 PM
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 font-black text-xs tracking-widest text-gray-400">
                                    <th className="pb-3 font-black">Date</th>
                                    <th className="pb-3 font-black text-right pr-2">Worklog</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="align-middle">
                                    <td className="py-4 text-sm font-semibold text-gray-900">
                                        {formatDate(todayStr)}
                                    </td>
                                    <td className="py-4 text-right pr-2">
                                        {alreadySubmitted ? (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-black uppercase tracking-widest border border-emerald-100">
                                                Completed
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => setIsDrawerOpen(true)}
                                                className="px-5 py-2.5 bg-black text-white hover:bg-neutral-800 rounded-lg text-xs font-black uppercase tracking-widest transition-all"
                                            >
                                                Complete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Slide-over Side Drawer for Today's Worklog Input */}
            <AnimatePresence>
                {isDrawerOpen && (
                    <div className="fixed inset-0 z-50 overflow-hidden">
                        {/* Blurred Backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDrawerOpen(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-md"
                        />
                        
                        {/* Drawer Panel */}
                        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
                            <motion.div 
                                initial={{ x: "100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col justify-between rounded-l-lg"
                            >
                                {/* Header */}
                                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                    <div>
                                             <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mt-1">Today's Worklog</h3>
                                        <p className="text-xs text-gray-400 font-medium mt-1">For {formatDate(todayStr)}</p>
                                    </div>
                                    <button 
                                        onClick={() => setIsDrawerOpen(false)}
                                        className="w-10 h-10 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition-all bg-white shadow-sm"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Body / Form */}
                                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                                    <form onSubmit={handleSubmit} id="worklog-drawer-form" className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">What did you accomplish today?</label>
                                            <textarea 
                                                rows={10}
                                                value={content}
                                                onChange={e => setContent(e.target.value)}
                                                placeholder="Write your work description here..."
                                                className="w-full bg-gray-50 border border-gray-200 focus:border-gray-300 rounded-lg px-5 py-4 text-sm font-medium text-gray-700 focus:outline-none focus:ring-4 focus:ring-black/5 transition-all resize-none leading-relaxed"
                                                disabled={submitting}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reference Links</label>
                                            <input 
                                                type="text"
                                                value={linksInput}
                                                onChange={e => setLinksInput(e.target.value)}
                                                placeholder="GitHub PR, deployed URL, loom video, etc. (comma-separated)"
                                                className="w-full bg-gray-50 border border-gray-200 focus:border-gray-300 rounded-lg px-5 py-4 text-sm font-medium text-gray-700 focus:outline-none focus:ring-4 focus:ring-black/5 transition-all"
                                                disabled={submitting}
                                            />
                                        </div>
                                    </form>
                                </div>

                                {/* Footer Actions */}
                                <div className="px-8 py-6 border-t border-gray-100 flex items-center gap-4 bg-gray-50/50">
                                    <button
                                        type="button"
                                        onClick={() => setIsDrawerOpen(false)}
                                        className="flex-1 py-4 border border-gray-200 hover:border-black rounded-lg text-xs font-black uppercase tracking-widest text-gray-500 hover:text-black transition-all bg-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        form="worklog-drawer-form"
                                        disabled={submitting}
                                        className="flex-1 bg-black text-white hover:bg-neutral-800 rounded-lg py-4 text-xs font-black uppercase tracking-widest shadow-lg shadow-black/10 transition-all flex items-center justify-center gap-2"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                                            </>
                                        ) : (
                                            <>
                                                 Submit Worklog
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* Drawer for viewing past logs details */}
            <AnimatePresence>
                {selectedLog && (
                    <div className="fixed inset-0 z-50 overflow-hidden">
                        {/* Blurred Backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedLog(null)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-md"
                        />
                        
                        {/* Drawer Panel */}
                        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
                            <motion.div 
                                initial={{ x: "100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col justify-between rounded-l-lg"
                            >
                                {/* Header */}
                                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                    <div className="flex items-center gap-3">
                                        <ClipboardList className="w-6 h-6 text-gray-500" />
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">My Worklog</h3>
                                            <p className="text-xs text-gray-400 font-bold mt-1">
                                                {formatDate(selectedLog.date)} <span className="mx-1.5 text-gray-300 font-normal">•</span> Submitted at {formatTimeOnly(selectedLog.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedLog(null)}
                                        className="w-10 h-10 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition-all bg-white shadow-sm"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                                    {/* Work Description */}
                                    <div>
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Your work description:</p>
                                        <div className="bg-gray-50 rounded-lg p-5 border border-gray-100/50">
                                            <p className="text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">{selectedLog.content}</p>
                                        </div>
                                    </div>

                                    {/* Links */}
                                    {selectedLog.links && selectedLog.links.length > 0 && (
                                        <div>
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Reference Links</p>
                                            <div className="space-y-2">
                                                {selectedLog.links.map((link, idx) => (
                                                    <a 
                                                        key={idx} 
                                                        href={link} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-between p-3.5 bg-white border border-gray-100 hover:border-black rounded-lg text-xs font-bold text-blue-600 hover:text-black transition-all group"
                                                    >
                                                        <span className="truncate pr-4 font-mono">{link}</span>
                                                        <ExternalLink className="w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-all" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer Actions */}
                                <div className="px-8 py-6 border-t border-gray-100 flex items-center bg-gray-50/50">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedLog(null)}
                                        className="w-full py-4 bg-black text-white hover:bg-neutral-800 rounded-lg text-xs font-black uppercase tracking-widest shadow-lg shadow-black/10 transition-all flex items-center justify-center"
                                    >
                                        Close
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
