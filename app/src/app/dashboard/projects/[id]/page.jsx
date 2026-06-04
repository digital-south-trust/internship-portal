"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
    ArrowLeft,
    Rocket,
    Download,
    History,
    Clock
} from "lucide-react";

export default function InternProjectDetail() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id;

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        if (!id) return;

        const fetchProject = async () => {
            try {
                const res = await fetch(`/api/projects?id=${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setProject(data);
                } else {
                    toast.error("Project request not found.");
                    router.push("/dashboard/projects");
                }
            } catch (err) {
                console.error("Error loading project:", err);
                toast.error("Error loading project data.");
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [id]);

    // Check lockout remaining time
    useEffect(() => {
        if (!project || !project.lastSubmittedAt) {
            setTimeLeft(0);
            return;
        }

        const checkLockout = () => {
            const lastSubmitted = new Date(project.lastSubmittedAt).getTime();
            const now = Date.now();
            const diff = now - lastSubmitted;
            const lockoutMs = 24 * 60 * 60 * 1000;
            if (diff < lockoutMs) {
                setTimeLeft(Math.ceil((lockoutMs - diff) / 1000));
            } else {
                setTimeLeft(0);
            }
        };

        checkLockout();
        const interval = setInterval(checkLockout, 1000);
        return () => clearInterval(interval);
    }, [project]);

    const formatTimeLeft = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading Assigned Scope...</p>
                </div>
            </div>
        );
    }

    if (!project) return null;

    return (
        <div className="animate-in fade-in duration-500 min-h-screen bg-white pb-20">
            {/* Standardized Tactical Header */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-3xl -mx-8 -mt-8 px-8 py-5 border-b border-gray-100 shadow-sm flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push("/dashboard/projects")}
                        className="p-2 hover:bg-gray-50 rounded-xl transition-all border border-transparent hover:border-gray-100"
                        id="back_to_projects_btn"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-800" />
                    </button>
                    <div className="w-1.5 h-8 bg-black rounded-full" />
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-black tracking-tight uppercase leading-none">
                                System Asset Control
                            </h1>
                            <span className="inline-block px-2 py-0.5 bg-gray-100 text-[10px] font-semibold uppercase text-gray-500 rounded-md tracking-wide">
                                {project.track}
                            </span>
                        </div>
                        <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-widest mt-1">ID: {id}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push(`/dashboard/projects/${id}/history`)}
                        className="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-sm"
                        id="top_history_btn"
                    >
                        <History className="w-3.5 h-3.5" /> History
                    </button>
                    {timeLeft > 0 ? (
                        <div className="px-4 py-2.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 animate-pulse" /> Locked: {formatTimeLeft(timeLeft)}
                        </div>
                    ) : (
                        <button
                            onClick={() => router.push(`/dashboard/projects/${id}/submit`)}
                            className="px-5 py-2.5 bg-black text-white hover:bg-gray-800 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-md hover:scale-[1.02]"
                            id="top_submit_btn"
                        >
                            <Rocket className="w-3.5 h-3.5 text-[#ccff00]" /> Submit / Update
                        </button>
                    )}
                </div>
            </header>

            <main className="max-w-[1750px] mx-auto px-8">
                {/* Main Content Container - Borderless, White Background */}
                <div className="bg-white space-y-10">
                    {/* Project Name and Track Info */}
                    <div>
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest font-black">Active Assignment</span>
                        <h2 className="text-3xl font-black text-gray-900 uppercase leading-tight tracking-tight mt-1">
                            {project.projectName}
                        </h2>
                    </div>

                    {/* Briefing Display - Borderless, direct text display with proper gaps */}
                    <div className="space-y-3">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] block border-b border-gray-100 pb-2">Briefing Specification</span>
                        <p className="text-sm text-gray-600 leading-relaxed font-normal whitespace-pre-wrap">
                            {project.description}
                        </p>
                    </div>

                    {/* Reference Document */}
                    {project.documentLink && (
                        <div className="space-y-3">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] block border-b border-gray-100 pb-2">Reference Material</span>
                            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                                <span className="text-xs text-gray-700 font-semibold truncate max-w-[500px]">
                                    {project.documentFile || "Reference Specification Document"}
                                </span>
                                <a 
                                    href={project.documentLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="px-5 py-2.5 bg-black text-white text-[9px] font-bold uppercase tracking-wider rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                                    id="download_ref_doc_btn"
                                >
                                    <Download className="w-3.5 h-3.5" /> Download File
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Tech Stack */}
                    {project.techStack && project.techStack.length > 0 && (
                        <div className="space-y-3">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] block border-b border-gray-100 pb-2">Assigned Tech Stack</span>
                            <div className="flex flex-wrap gap-2 pt-1">
                                {project.techStack.map(t => (
                                    <span key={t} className="px-4 py-2 rounded-xl bg-gray-900 text-white text-[9px] font-semibold uppercase tracking-widest shadow-sm">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Study Topics & Reference Materials - Borderless */}
                    {project.topics && project.topics.length > 0 && (
                        <div className="space-y-6">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] block border-b border-gray-100 pb-2">Study Topics & Resources</span>
                            <div className={`grid grid-cols-1 ${project.topics.length === 2 ? 'md:grid-cols-2' : project.topics.length >= 3 ? 'md:grid-cols-2 lg:grid-cols-3' : ''} gap-8`}>
                                {project.topics.map((topic, ti) => (
                                    <div key={ti} className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm space-y-6">
                                        <div className="border-b border-gray-100 pb-3">
                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Topic Name</span>
                                            <h4 className="text-base font-black text-black uppercase tracking-tight mt-1">{topic.title || `Topic ${ti + 1}`}</h4>
                                        </div>
                                        <div className="space-y-6">
                                            {topic.subtopics && topic.subtopics.map((sub, si) => (
                                                <div key={si} className="space-y-3 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                                                    <div>
                                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Subtopic Title</span>
                                                        <h5 className="text-xs font-bold text-black uppercase tracking-tight mt-1">{sub.title}</h5>
                                                    </div>
                                                    <div className="pt-2.5 border-t border-gray-200/50">
                                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Content / Resources</span>
                                                        <div className="text-xs text-gray-700 font-normal">
                                                            {sub.contentType === 'text' && (
                                                                <p className="leading-relaxed whitespace-pre-wrap bg-white p-3 rounded-xl border border-gray-150 text-gray-600 shadow-sm">{sub.contentValue}</p>
                                                            )}
                                                            {sub.contentType === 'link' && (
                                                                <div className="bg-white p-3 rounded-xl border border-gray-150 shadow-sm">
                                                                    <a href={sub.contentValue} target="_blank" rel="noopener noreferrer" className="text-black font-bold underline hover:text-gray-600 break-all flex items-center gap-1">
                                                                        Reference link &rarr;
                                                                    </a>
                                                                    <span className="text-[9px] text-gray-400 block mt-1.5 break-all">{sub.contentValue}</span>
                                                                </div>
                                                            )}
                                                            {sub.contentType === 'image' && (
                                                                <div className="bg-white p-3 rounded-xl border border-gray-150 shadow-sm space-y-2">
                                                                    <img src={sub.contentValue} alt={sub.title} className="rounded-lg border border-gray-200 max-h-[200px] w-auto object-cover" />
                                                                    <a href={sub.contentValue} target="_blank" rel="noopener noreferrer" className="text-[10px] text-black font-semibold underline block hover:text-gray-600">Open full image &rarr;</a>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Down the page submission portal controls */}
                    <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-1">
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Submission Workspace</h3>
                            <p className="text-xs text-gray-500 font-normal">Complete and submit your deliverables. Updates can only be logged once every 24 hours.</p>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                            <button
                                onClick={() => router.push(`/dashboard/projects/${id}/history`)}
                                className="px-5 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-sm"
                                id="bottom_history_btn"
                            >
                                <History className="w-3.5 h-3.5" /> History Log
                            </button>
                            {timeLeft > 0 ? (
                                <button
                                    disabled
                                    className="px-6 py-3 bg-gray-100 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed flex items-center gap-1.5 border border-gray-200"
                                >
                                    <Clock className="w-3.5 h-3.5" /> Locked: {formatTimeLeft(timeLeft)}
                                </button>
                            ) : (
                                <button
                                    onClick={() => router.push(`/dashboard/projects/${id}/submit`)}
                                    className="px-6 py-3 bg-black text-white hover:bg-gray-800 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-md hover:scale-[1.02]"
                                    id="bottom_submit_btn"
                                >
                                    <Rocket className="w-3.5 h-3.5 text-[#ccff00]" /> Submit 
                                </button>
                            )}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
