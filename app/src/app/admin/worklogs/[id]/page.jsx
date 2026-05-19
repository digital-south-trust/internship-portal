"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { 
    ArrowLeft, Loader2, Calendar, ClipboardList, 
    ExternalLink, Mail, ShieldAlert, CheckCircle2, Award
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminWorklogDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id;

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null); // { worklog, attendancePercentage }

    useEffect(() => {
        const fetchDetails = async () => {
            if (!id) return;
            try {
                const res = await fetch(`/api/admin/worklogs/${id}`);
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                } else {
                    toast.error("Failed to load worklog details.");
                    router.push("/admin/worklogs");
                }
            } catch (error) {
                console.error(error);
                toast.error("An error occurred while loading details.");
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [id, router]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="w-10 h-10 animate-spin text-black" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-12">
                <p className="text-sm text-gray-400 font-medium">Worklog not found.</p>
                <button 
                    onClick={() => router.push("/admin/worklogs")}
                    className="mt-4 px-4 py-2 bg-black text-white rounded-xl text-xs font-black uppercase"
                >
                    Back to Worklogs
                </button>
            </div>
        );
    }

    const { worklog, attendancePercentage } = data;
    const intern = worklog.userId;

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-12">
            
            {/* Header / Back Navigation */}
            <div className="flex items-center justify-between">
                <button 
                    onClick={() => router.push("/admin/worklogs")}
                    className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-black transition-all"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </button>

                <span className="text-xs bg-gray-50 border border-gray-100 text-gray-400 px-3 py-1 rounded-lg font-bold">
                    Log ID: {worklog._id}
                </span>
            </div>

            {/* Profile Summary Card */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-gray-700">
                        {intern?.fullName?.charAt(0) || "I"}
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{intern?.fullName}</h2>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-400 font-medium">
                            <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {intern?.email}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span className="font-bold uppercase tracking-wider text-blue-600">{intern?.track}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-black text-white px-6 py-4 rounded-2xl shadow-md flex items-center gap-4">
                    <div>
                        <span className="text-[9px] font-black text-[#ccff00] uppercase tracking-wider">Attendance Rate</span>
                        <h4 className="text-2xl font-black text-white">{attendancePercentage}%</h4>
                    </div>
                    <CheckCircle2 className="w-6 h-6 text-[#ccff00]" />
                </div>
            </div>

            {/* Log Details Container */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm space-y-8">
                
                {/* Date & Status */}
                <div className="flex justify-between items-center border-b border-gray-50 pb-5">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-black text-gray-900">{worklog.date}</span>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        worklog.status === "Present" 
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-100" 
                            : "bg-red-50 text-red-800 border border-red-100"
                    }`}>
                        {worklog.status}
                    </span>
                </div>

                {/* Content */}
                <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-2">
                        <ClipboardList className="w-4 h-4" /> Worklog Content
                    </h3>
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100/50">
                        <p className="text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">
                            {worklog.content || "No work description logged."}
                        </p>
                    </div>
                </div>

                {/* References */}
                {worklog.links && worklog.links.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">
                            Logged Links
                        </h3>
                        <div className="grid grid-cols-1 gap-2.5">
                            {worklog.links.map((link, idx) => (
                                <a 
                                    key={idx}
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-4 bg-white border border-gray-100 hover:border-black rounded-2xl text-xs font-bold text-blue-600 hover:text-black transition-all group shadow-sm"
                                >
                                    <span className="truncate pr-4 font-mono">{link}</span>
                                    <ExternalLink className="w-4 h-4 shrink-0 group-hover:scale-110 transition-all" />
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
