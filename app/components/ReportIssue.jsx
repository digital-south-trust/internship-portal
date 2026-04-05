
"use client";

import { useState, useEffect } from "react";
import { Bug, Send, X, MessageSquare, Lightbulb, Settings, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "react-hot-toast";

export function ReportIssue() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState("Bug Report");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    const options = [
        { id: "Bug Report", label: "Bug Report", icon: Bug, color: "text-rose-500", bg: "bg-rose-50" },
        { id: "Suggest a Feature (UI)", label: "Suggest a Feature (UI)", icon: Lightbulb, color: "text-amber-500", bg: "bg-amber-50" },
        { id: "Change Problem Statement", label: "Change Problem Statement", icon: Settings, color: "text-blue-500", bg: "bg-blue-50" },
        { id: "Others", label: "Others", icon: HelpCircle, color: "text-gray-500", bg: "bg-gray-50" },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = {
                type,
                title: type === "Others" ? title : type, // Use custom title for Others, else use type as title
                description,
                reportedBy: typeof window !== 'undefined' ? localStorage.getItem('userEmail') : 'Anonymous'
            };

            const res = await fetch("/api/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success("Thank you! Your report has been submitted.");
                setIsOpen(false);
                setDescription("");
                setTitle("");
                setType("Bug Report");
            } else {
                toast.error("Something went wrong. Please try again.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error submitting report.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('open-report-issue', handleOpen);
        return () => window.removeEventListener('open-report-issue', handleOpen);
    }, []);

    return (
        <>
            {/* Float Trigger removed as per user request to place it beside signout */}

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110]"
                        />

                        {/* Sliding Panel */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-screen w-full md:w-[600px] bg-white z-[120] shadow-2xl flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Submit Report</h2>
                                    <p className="text-[11px] font-medium text-gray-400 mt-0.5">Help us build a better experience.</p>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-3 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Form Body */}
                            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Issue Category</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {options.map((opt) => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => setType(opt.id)}
                                                className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${type === opt.id
                                                    ? 'border-black bg-black text-white shadow-xl'
                                                    : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200'
                                                    }`}
                                            >
                                                <div className={`p-2 rounded-xl ${type === opt.id ? 'bg-white/20' : opt.bg} ${type === opt.id ? 'text-white' : opt.color}`}>
                                                    <opt.icon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[10px] leading-tight uppercase tracking-tight">{opt.label}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {type === "Others" && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-3"
                                    >
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Issue Title</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full bg-gray-50 border-0 rounded-2xl p-4 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-black transition-all shadow-inner"
                                            placeholder="What is this regarding?"
                                            required={type === "Others"}
                                        />
                                    </motion.div>
                                )}

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Detailed Description</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full min-h-[180px] bg-gray-50 border-0 rounded-2xl p-6 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-black transition-all resize-none shadow-inner"
                                        placeholder="Please provide as much detail as possible..."
                                        required
                                    />
                                </div>
                            </form>

                            {/* Footer Action */}
                            <div className="p-6 border-t border-gray-100 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 py-4 bg-gray-50 text-gray-400 hover:text-black hover:bg-gray-100 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="flex-[2] py-4 bg-black text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:shadow-black/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white animate-spin rounded-full" />
                                    ) : (
                                        <>
                                            Submit Report
                                            <Send className="w-3 h-3" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
