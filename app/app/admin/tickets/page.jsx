"use client";

import { useState, useEffect, useRef } from "react";
import { Bug, RefreshCw, CheckCircle, AlertCircle, Clock, X, User, Calendar, MessageSquare, Ticket, Zap, ChevronDown, Send, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

const STATUS_CONFIG = {
    'Open':        { icon: AlertCircle,   color: 'text-yellow-600',     bg: 'bg-yellow-50',     border: 'border-yellow-200',     badge: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
    'In Progress': { icon: Clock,         color: 'text-red-500',   bg: 'bg-red-50',   border: 'border-red-200',   badge: 'bg-red-50 text-red-700 border-red-100' },
    'Resolved':    { icon: CheckCircle,   color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
};

const TYPE_CONFIG = {
    'Bug Report':                { color: 'bg-red-50 text-red-700 border-red-100',     dot: 'bg-red-500' },
    'Suggest a Feature (UI)':    { color: 'bg-violet-50 text-violet-700 border-violet-100', dot: 'bg-violet-500' },
    'Change Problem Statement':  { color: 'bg-blue-50 text-blue-700 border-blue-100',  dot: 'bg-blue-500' },
    'Intern Doubt':              { color: 'bg-orange-50 text-orange-700 border-orange-100', dot: 'bg-orange-500' },
    'Assessment Query':          { color: 'bg-blue-50 text-blue-700 border-blue-100', dot: 'bg-blue-500' },
    'Others':                    { color: 'bg-gray-50 text-gray-700 border-gray-100',   dot: 'bg-gray-400' },
};

const typeConfig = (type) => TYPE_CONFIG[type] || { color: 'bg-gray-50 text-gray-700 border-gray-100', dot: 'bg-gray-400' };
const statusConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG['Open'];

export default function AdminTicketsPage() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [filter, setFilter] = useState("All");
    const [filterOpen, setFilterOpen] = useState(false);
    const filterRef = useRef(null);

    // Reply and Resolve state
    const [replyText, setReplyText] = useState("");
    const [confirmingResolve, setConfirmingResolve] = useState(false);

    useEffect(() => { fetchTickets(); }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/tickets");
            if (res.ok) setTickets(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleStatusUpdate = async (id, newStatus, shouldEmail = false) => {
        if (newStatus === 'Resolved' && !confirmingResolve) {
            if (!replyText.trim()) {
                toast.error("Please write a resolution response first.");
                return;
            }
            setConfirmingResolve(true);
            return;
        }

        const tid = toast.loading(shouldEmail ? "Sending email & resolving..." : "Updating status...");
        try {
            if (newStatus === 'Resolved' && replyText.trim()) {
                const adminEmail = typeof window !== 'undefined' ? localStorage.getItem("userEmail") : "";
                await fetch("/api/tickets/reply", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        ticketId: id, 
                        replyMessage: replyText, 
                        adminEmail,
                        sendEmail: shouldEmail 
                    }),
                });
            }

            const res = await fetch("/api/tickets", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status: newStatus }),
            });

            if (res.ok) {
                const updatedTicket = await res.json();
                toast.success(shouldEmail ? "Resolved and email sent!" : "Status updated!", { id: tid });
                setTickets(prev => prev.map(t => t._id === id ? { ...t, ...updatedTicket } : t));
                if (selectedTicket?._id === id) {
                    setSelectedTicket({ ...selectedTicket, ...updatedTicket });
                    setReplyText("");
                    setConfirmingResolve(false);
                }
            } else toast.error("Update failed", { id: tid });
        } catch { toast.error("Error", { id: tid }); }
    };

    const FILTERS = ["All", "Open", "In Progress", "Resolved"];
    const filtered = filter === "All" ? tickets : tickets.filter(t => t.status === filter);
    const stats = {
        All: tickets.length,
        Open: tickets.filter(t => t.status === 'Open').length,
        'In Progress': tickets.filter(t => t.status === 'In Progress').length,
        Resolved: tickets.filter(t => t.status === 'Resolved').length,
    };

    const filterIcon = filter === "All" ? Ticket : statusConfig(filter).icon;
    const FilterIcon = filterIcon;

    return (
        <div className="animate-in fade-in duration-500">
            {/* Standardized Tactical Header */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-3xl -mx-8 -mt-8 px-8 py-5 border-b border-gray-100 shadow-sm mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-8 bg-black rounded-full" />
                        <h1 className="text-2xl font-black text-black tracking-tighter uppercase leading-none">
                            Support Hub
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <div ref={filterRef} className="relative">
                            <button
                                onClick={() => setFilterOpen(!filterOpen)}
                                className="flex items-center gap-3 px-5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-white hover:border-gray-200 transition-all shadow-sm min-w-[160px] justify-between"
                            >
                                <div className="flex items-center gap-2">
                                    <FilterIcon className="w-3.5 h-3.5" />
                                    {filter}
                                </div>
                                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {filterOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden z-[60]"
                                    >
                                        <div className="px-4 py-3 border-b border-gray-50">
                                            <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.3em]">Filter by Status</p>
                                        </div>
                                        {FILTERS.map(f => {
                                            const Icon = f === "All" ? Ticket : statusConfig(f).icon;
                                            const isActive = filter === f;
                                            return (
                                                <button
                                                    key={f}
                                                    onClick={() => { setFilter(f); setFilterOpen(false); }}
                                                    className={`w-full flex items-center justify-between px-4 py-3 text-[11px] font-bold uppercase tracking-widest transition-all ${
                                                        isActive ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Icon className="w-4 h-4" />
                                                        {f}
                                                    </div>
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                        {stats[f]}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <button
                            onClick={fetchTickets}
                            disabled={loading}
                            className={`p-2.5 bg-gray-50 hover:bg-black hover:text-white rounded-xl transition-all border border-gray-100 shadow-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </header>

            <div className="px-8 pb-20 max-w-[1750px] mx-auto space-y-4">

            {/* ── Tickets Row Layout ── */}
            {loading ? (
                <div className="space-y-4 animate-pulse">
                    <div className="grid grid-cols-12 gap-4 px-8 py-3 bg-gray-50/50 rounded-2xl border border-gray-100 mb-2">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className={`h-2 bg-gray-200 rounded ${i === 1 ? 'col-span-4' : 'col-span-2'}`} />
                        ))}
                    </div>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="grid grid-cols-12 gap-4 px-8 py-6 bg-white rounded-2xl border border-gray-100 shadow-sm items-center">
                            <div className="col-span-2 space-y-2">
                                <div className="h-4 bg-gray-100 rounded w-20" />
                                <div className="h-2.5 bg-gray-50 rounded w-12" />
                            </div>
                            <div className="col-span-4 h-4 bg-gray-100 rounded w-3/4" />
                            <div className="col-span-2 h-4 bg-gray-50 rounded w-16" />
                            <div className="col-span-2 h-6 bg-gray-100 rounded-xl w-24" />
                            <div className="col-span-2 text-right">
                                <div className="h-3 bg-gray-50 rounded w-20 ml-auto" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-3xl border border-gray-100">
                    <Ticket className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-bold text-sm">No tickets found.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Header for the list view */}
                    <div className="grid grid-cols-12 gap-4 px-8 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 rounded-2xl border border-gray-100 mb-2">
                        <div className="col-span-2">Type / ID</div>
                        <div className="col-span-4">Concern Summary</div>
                        <div className="col-span-2">Reporter</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2 text-right">Activity / Date</div>
                    </div>

                    <AnimatePresence>
                        {filtered.map((ticket, i) => {
                            const sc = statusConfig(ticket.status);
                            const tc = typeConfig(ticket.type);
                            const StatusIcon = sc.icon;
                            return (
                                <motion.div
                                    key={ticket._id}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    transition={{ delay: i * 0.03 }}
                                    onClick={() => { setSelectedTicket(ticket); setReplyText(""); setConfirmingResolve(false); }}
                                    className="grid grid-cols-12 gap-4 px-8 py-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-black/10 transition-all cursor-pointer group items-center"
                                >
                                    {/* Title / ID */}
                                    <div className="col-span-2 flex flex-col gap-1">
                                        <span className="text-[10px] font-black uppercase tracking-tight text-gray-900 group-hover:text-black line-clamp-1">
                                            {ticket.title || ticket.type}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${tc.dot}`} />
                                            <span className="text-[9px] font-bold text-gray-300">#{ticket._id?.slice(-6).toUpperCase()}</span>
                                        </div>
                                    </div>

                                    {/* Concern Summary */}
                                    <div className="col-span-4">
                                        <p className="text-sm font-semibold text-gray-800 line-clamp-1 group-hover:text-black">
                                            {ticket.description}
                                        </p>
                                    </div>

                                    {/* Reporter */}
                                    <div className="col-span-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center">
                                                <User className="w-3 h-3 text-gray-500" />
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-600 truncate max-w-full">
                                                {ticket.reportedBy?.split('@')[0] || "Anonymous"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-2">
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest w-fit ${sc.badge}`}>
                                            <StatusIcon className="w-3 h-3" />
                                            {ticket.status}
                                        </div>
                                    </div>

                                    {/* Activity / Date */}
                                    <div className="col-span-2 text-right space-y-1">
                                        <div className="flex items-center justify-end gap-1.5 text-[10px] font-black text-gray-900">
                                            <Calendar className="w-3 h-3 text-gray-400" />
                                            {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                        </div>
                                        {ticket.replies && ticket.replies.length > 0 && (
                                            <div className="flex items-center justify-end gap-1.5 text-[8px] font-black text-emerald-600 uppercase tracking-widest">
                                                <Mail className="w-2.5 h-2.5" />
                                                {ticket.replies.length} REPLIES
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* ── Detail Modal ── */}
            <AnimatePresence>
                {selectedTicket && (
                    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 md:p-8">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedTicket(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-3xl" />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 ${typeConfig(selectedTicket.type).color.split(' ')[0]} ${typeConfig(selectedTicket.type).color.split(' ')[2]}`}>
                                        <Bug className={`w-6 h-6 ${typeConfig(selectedTicket.type).color.split(' ')[1]}`} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">{selectedTicket.title || selectedTicket.type}</h2>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${typeConfig(selectedTicket.type).color}`}>
                                                {selectedTicket.type}
                                            </span>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">#{selectedTicket._id?.slice(-8).toUpperCase()}</p>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedTicket(null)}
                                    className="w-9 h-9 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-5">
                                {/* Reporter + Date */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3 border border-gray-100">
                                        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shrink-0">
                                            <User className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-gray-900">{selectedTicket.reportedBy || "Anonymous"}</p>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Reporter</p>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3 border border-gray-100">
                                        <div className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                                            <Calendar className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-gray-900">{new Date(selectedTicket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{new Date(selectedTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 relative overflow-hidden">
                                    <MessageSquare className="absolute top-4 right-4 w-6 h-6 text-gray-100" />
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Intern's Concern</p>
                                    <p className="text-sm font-medium text-gray-800 leading-relaxed">"{selectedTicket.description}"</p>
                                    
                                    {selectedTicket.type === 'Assessment Query' && (
                                        <div className="mt-6 flex justify-end">
                                            <a 
                                                href={`/admin/assessments?search=${encodeURIComponent(selectedTicket.reportedBy)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all"
                                            >
                                                <Target className="w-3.5 h-3.5 text-[#ccff00]" /> View Exam Intelligence
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {/* Previous Replies */}
                                {selectedTicket.replies && selectedTicket.replies.length > 0 && (
                                    <div className="space-y-3">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Previous Responses</p>
                                        {selectedTicket.replies.map((reply, idx) => (
                                            <div key={idx} className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 relative">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="w-3.5 h-3.5 text-emerald-600" />
                                                        <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">{reply.repliedBy || "Admin"}</span>
                                                    </div>
                                                    <span className="text-[9px] font-bold text-emerald-400">
                                                        {new Date(reply.repliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-medium text-emerald-900 leading-relaxed">{reply.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Email Reply Section */}
                                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-5 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center">
                                            <Mail className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-gray-900 uppercase tracking-tight">Resolution Response</p>
                                            <p className="text-[9px] font-bold text-gray-400">Write your final message to the intern below</p>
                                        </div>
                                    </div>
                                    <textarea
                                        rows={3}
                                        value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                        placeholder="Type your response to the intern's concern..."
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-200 resize-none transition-all"
                                    />
                                </div>

                                {/* Status Control */}
                                <div className="bg-black rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
                                    <AnimatePresence mode="wait">
                                        {confirmingResolve ? (
                                            <motion.div 
                                                key="options"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 z-10"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <p className="text-white text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Resolve & Continue?</p>
                                                </div>
                                                <div className="flex gap-2 w-full sm:w-auto">
                                                    <button
                                                        onClick={() => handleStatusUpdate(selectedTicket._id, 'Resolved', true)}
                                                        className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Mail className="w-3.5 h-3.5" /> 1. Send Email 
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(selectedTicket._id, 'Resolved', false)}
                                                        className="flex-1 sm:flex-none px-5 py-2.5 bg-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <CheckCircle className="w-3.5 h-3.5" /> 2. Just Close
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmingResolve(false)}
                                                        className="px-3 py-2.5 bg-white/5 text-gray-400 rounded-xl text-[9px] font-black uppercase hover:bg-white/10"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.div 
                                                key="status"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 z-10"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                                                        <Zap className="w-4 h-4 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-white uppercase tracking-widest">Update Status</p>
                                                        <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Current: {selectedTicket.status}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    {['Open', 'In Progress', 'Resolved'].map(s => {
                                                        const isResolvedBtn = s === 'Resolved';
                                                        const scBtn = statusConfig(s);
                                                        return (
                                                            <button
                                                                key={s}
                                                                disabled={selectedTicket.status === 'Resolved'}
                                                                onClick={() => handleStatusUpdate(selectedTicket._id, s)}
                                                                className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                                                    selectedTicket.status === s
                                                                        ? (isResolvedBtn ? 'bg-emerald-500 text-white' : 'bg-white text-black shadow-xl scale-105')
                                                                        : 'bg-white/5 text-white/40 hover:bg-white/15 hover:text-white border border-white/10'
                                                                } disabled:opacity-30 disabled:cursor-not-allowed`}
                                                            >
                                                                {s}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
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

