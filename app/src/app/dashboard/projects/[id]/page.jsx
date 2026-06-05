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
                                {project.projectName}
                            </h1>
                          
                        </div>
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
                </div>
            </header>

            <main className="max-w-[1750px] mx-auto px-8">
                {/* Main Content Container - Borderless, White Background */}
                <div className="bg-white space-y-10">

                    {/* Briefing Display - Borderless, direct text display with proper gaps */}
                    <div className="space-y-3">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] block border-b border-gray-100 pb-2">Description</span>
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
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] block border-b border-gray-100 pb-2">Resources</span>
                            <div className={`grid grid-cols-1 ${project.topics.length === 2 ? 'md:grid-cols-2' : project.topics.length >= 3 ? 'md:grid-cols-2 lg:grid-cols-3' : ''} gap-8`}>
                                {project.topics.map((topic, ti) => (
                                    <div key={ti} className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm space-y-6">
                                        <div className="border-b border-gray-100 pb-3">
                                            <h4 className="text-base font-bold text-black uppercase tracking-tight">{topic.title || `Topic ${ti + 1}`}</h4>
                                        </div>
                                        <div className="space-y-6">
                                            {topic.subtopics && topic.subtopics.map((sub, si) => (
                                                <div key={si} className="space-y-3 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                                                    <div>
                                                        <h5 className="text-xs font-semibold text-black uppercase tracking-tight">{sub.title}</h5>
                                                    </div>
                                                    <div className="pt-2.5 border-t border-gray-200/50">
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
                    <div className="bg-white border border-gray-200 rounded-[2rem] p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 mt-10">
                        {/* Left Side: Workspace info and Submit button */}
                        <div className="flex-1 space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider">Submission WorkBook</h3>
                                <p className="text-xs text-gray-500 font-normal leading-relaxed">
                                    Complete and submit your deliverables. Updates can only be logged once every 24 hours.
                                </p>
                            </div>
                            <div>
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
                                        <Rocket className="w-3.5 h-3.5 " /> Submit
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Right Side: Purple and Green Book Artwork */}
                        <div className="shrink-0 w-24 h-24 md:w-32 md:h-32 flex items-center justify-center">
                            <svg className="w-full h-full" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <linearGradient id="purpleCover" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#A78BFA" />
                                        <stop offset="100%" stopColor="#7C3AED" />
                                    </linearGradient>
                                    <linearGradient id="greenSpine" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#34D399" />
                                        <stop offset="100%" stopColor="#059669" />
                                    </linearGradient>
                                    <linearGradient id="bookmarkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#34D399" />
                                        <stop offset="100%" stopColor="#059669" />
                                    </linearGradient>
                                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                        <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#7C3AED" floodOpacity="0.15" />
                                    </filter>
                                </defs>
                                {/* Spine */}
                                <path d="M25 20 C25 15, 30 15, 35 15 L35 105 C30 105, 25 105, 25 100 Z" fill="url(#greenSpine)" />
                                {/* Pages Block */}
                                <path d="M35 18 L90 18 C92 18, 94 20, 94 22 L94 102 C94 104, 92 106, 90 106 L35 106 Z" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1" />
                                <line x1="38" y1="25" x2="88" y2="25" stroke="#E5E7EB" strokeWidth="1.5" />
                                <line x1="38" y1="32" x2="88" y2="32" stroke="#E5E7EB" strokeWidth="1.5" />
                                <line x1="38" y1="39" x2="88" y2="39" stroke="#E5E7EB" strokeWidth="1.5" />
                                {/* Front Cover */}
                                <rect x="30" y="15" width="62" height="90" rx="4" fill="url(#purpleCover)" filter="url(#glow)" />
                                {/* Bookmark ribbon */}
                                <path d="M50 15 L50 45 L55 40 L60 45 L60 15 Z" fill="url(#bookmarkGrad)" />
                                {/* Cover Decor */}
                            </svg>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
