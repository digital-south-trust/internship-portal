"use client";

import { useState, useEffect } from "react";
import { Bug, RefreshCw, CheckCircle, AlertCircle, Clock, X, User, Calendar, MessageSquare, Ticket, Zap, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

const STATUS_CONFIG = {
    'Open':        { icon: AlertCircle,   color: 'text-red-500',     bg: 'bg-red-50',     border: 'border-red-200',     badge: 'bg-red-50 text-red-700 border-red-100' },
    'In Progress': { icon: Clock,         color: 'text-amber-500',   bg: 'bg-amber-50',   border: 'border-amber-200',   badge: 'bg-amber-50 text-amber-700 border-amber-100' },
    'Resolved':    { icon: CheckCircle,   color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
};

const TYPE_CONFIG = {
    'Bug Report':                { color: 'bg-red-50 text-red-700 border-red-100',     dot: 'bg-red-500' },
    'Suggest a Feature (UI)':    { color: 'bg-violet-50 text-violet-700 border-violet-100', dot: 'bg-violet-500' },
    'Change Problem Statement':  { color: 'bg-blue-50 text-blue-700 border-blue-100',  dot: 'bg-blue-500' },
};

const typeConfig = (type) => TYPE_CONFIG[type] || { color: 'bg-gray-50 text-gray-700 border-gray-100', dot: 'bg-gray-400' };
const statusConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG['Open'];

export default function AdminTicketsPage() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [filter, setFilter] = useState("All");

    useEffect(() => { fetchTickets(); }, []);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/tickets");
            if (res.ok) setTickets(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        const tid = toast.loading("Updating...");
        try {
            const res = await fetch("/api/tickets", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status: newStatus }),
            });
            if (res.ok) {
                toast.success("Status updated!", { id: tid });
                setTickets(prev => prev.map(t => t._id === id ? { ...t, status: newStatus } : t));
                if (selectedTicket?._id === id) setSelectedTicket(prev => ({ ...prev, status: newStatus }));
            } else toast.error("Update failed", { id: tid });
        } catch { toast.error("Error", { id: tid }); }
    };

    const FILTERS = ["All", "Open", "In Progress", "Resolved"];
    const filtered = filter === "All" ? tickets : tickets.filter(t => t.status === filter);
    const stats = {
        Open: tickets.filter(t => t.status === 'Open').length,
        'In Progress': tickets.filter(t => t.status === 'In Progress').length,
        Resolved: tickets.filter(t => t.status === 'Resolved').length,
    };

    return (
        <div className="animate-in fade-in duration-500">
            {/* Sticky Header */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-3xl -mx-8 -mt-8 px-8 py-5 border-b border-gray-100 shadow-sm mb-8">
                <div className="flex items-center justify-between gap-6 w-full px-4">
                    <h1 className="text-xl font-bold text-black tracking-tight uppercase leading-none">
                        Support Hub
                    </h1>

                    <div className="flex items-center gap-6">
                        <nav className="flex items-center bg-gray-50/50 p-1 rounded-xl border border-gray-100">
                            {FILTERS.map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-black hover:bg-white'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </nav>

                        <button
                            onClick={fetchTickets}
                            disabled={loading}
                            className={`p-2.5 bg-gray-50 hover:bg-black hover:text-white rounded-xl transition-all border border-gray-100 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Reload Tickets"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </header>

            <div className="px-8 pb-20 max-w-[1750px] mx-auto space-y-8">

            {/* ── Tickets Grid ── */}
            {loading && tickets.length === 0 ? (
                <div className="flex items-center justify-center py-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-black" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-3xl border border-gray-100">
                    <Ticket className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-bold text-sm">No tickets found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {filtered.map((ticket, i) => {
                            const sc = statusConfig(ticket.status);
                            const tc = typeConfig(ticket.type);
                            const StatusIcon = sc.icon;
                            return (
                                <motion.div
                                    key={ticket._id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.96 }}
                                    transition={{ delay: i * 0.04 }}
                                    onClick={() => setSelectedTicket(ticket)}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group overflow-hidden"
                                >
                                    {/* Top color stripe by type */}
                                    <div className={`h-1 w-full ${tc.dot}`} />

                                    <div className="p-5 space-y-4">
                                        {/* Type badge + Status */}
                                        <div className="flex items-center justify-between">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${tc.color}`}>
                                                {ticket.type}
                                            </span>
                                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${sc.badge}`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {ticket.status}
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <p className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2 group-hover:text-black transition-colors">
                                            {ticket.description}
                                        </p>

                                        {/* Meta */}
                                        <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold pt-2 border-t border-gray-50">
                                            <div className="flex items-center gap-1.5">
                                                <User className="w-3 h-3" />
                                                <span className="truncate max-w-[120px]">{ticket.reportedBy || "Anonymous"}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3 h-3" />
                                                <span>{new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                            </div>
                                        </div>

                                        {/* Quick status selector */}
                                        <div onClick={e => e.stopPropagation()}>
                                            <select
                                                value={ticket.status}
                                                onChange={e => handleStatusUpdate(ticket._id, e.target.value)}
                                                className="w-full text-[10px] font-black uppercase tracking-widest bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 focus:outline-none focus:ring-4 focus:ring-black/5 cursor-pointer hover:border-gray-200 transition-all"
                                            >
                                                <option value="Open">Open</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Resolved">Resolved</option>
                                            </select>
                                        </div>
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
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedTicket(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md" />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 ${typeConfig(selectedTicket.type).color.split(' ')[0]} ${typeConfig(selectedTicket.type).color.split(' ')[2]}`}>
                                        <Bug className={`w-6 h-6 ${typeConfig(selectedTicket.type).color.split(' ')[1]}`} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">{selectedTicket.type}</h2>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">#{selectedTicket._id?.slice(-8)}</p>
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
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Description</p>
                                    <p className="text-sm font-medium text-gray-800 leading-relaxed">"{selectedTicket.description}"</p>
                                </div>

                                {/* Status Control */}
                                <div className="bg-black rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
                                        {['Open', 'In Progress', 'Resolved'].map(s => (
                                            <button
                                                key={s}
                                                onClick={() => handleStatusUpdate(selectedTicket._id, s)}
                                                className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                                    selectedTicket.status === s
                                                        ? 'bg-white text-black shadow-xl scale-105'
                                                        : 'bg-white/5 text-white/40 hover:bg-white/15 hover:text-white border border-white/10'
                                                }`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
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
