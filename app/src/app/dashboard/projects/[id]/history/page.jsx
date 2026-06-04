"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
    ArrowLeft,
    Clock,
    Eye,
    Calendar
} from "lucide-react";

export default function SubmissionHistoryExplorer() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id;

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        if (!id) return;

        const fetchProject = async () => {
            try {
                const res = await fetch(`/api/projects?id=${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setProject(data);

                    // Default to select the latest submission
                    if (data.submissionHistory && data.submissionHistory.length > 0) {
                        setSelectedIndex(data.submissionHistory.length - 1);
                    }
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

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading History Log...</p>
                </div>
            </div>
        );
    }

    if (!project) return null;

    const history = project.submissionHistory || [];
    const selectedSubmission = history[selectedIndex];

    return (
        <div className="animate-in fade-in duration-500 min-h-screen bg-white flex flex-col">
            {/* Standardized Tactical Header */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-3xl -mx-8 -mt-8 px-8 py-5 border-b border-gray-100 shadow-sm flex items-center justify-between mb-0">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push(`/dashboard/projects/${id}`)}
                        className="p-2 hover:bg-gray-50 rounded-xl transition-all border border-transparent hover:border-gray-100"
                        id="back_to_project_btn"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-800" />
                    </button>
                    <div className="w-1.5 h-8 bg-black rounded-full" />
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-black tracking-tight uppercase leading-none">
                                Submission History
                            </h1>
                            <span className="inline-block px-2 py-0.5 bg-gray-100 text-[10px] font-semibold uppercase text-gray-500 rounded-md tracking-wide">
                                {project.projectName}
                            </span>
                        </div>
                        <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-widest mt-1">ID: {id}</p>
                    </div>
                </div>

                <div>
                    <button
                        onClick={() => router.push(`/dashboard/projects/${id}`)}
                        className="px-5 py-2.5 bg-black text-white hover:bg-gray-800 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md"
                    >
                        Back to Workspace
                    </button>
                </div>
            </header>

            {/* Split Pane Explorer */}
            {history.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                        <Clock className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">No submission history found</h3>
                    <p className="text-xs text-gray-450 font-bold uppercase mt-1">Submit your first deliverable phase to log updates here.</p>
                </div>
            ) : (
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[calc(100vh-80px)]">
                    {/* Left Pane (List of updates, 30% width) */}
                    <div className="w-full md:w-[30%] border-r border-gray-150 overflow-y-auto bg-gray-50/50 p-6 space-y-3">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block ml-1 mb-4">Submission Logs</span>
                        <div className="space-y-2">
                            {history.map((hist, idx) => {
                                const isActive = idx === selectedIndex;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedIndex(idx)}
                                        className={`w-full text-left p-5 rounded-2xl border transition-all flex flex-col gap-1 ${
                                            isActive 
                                            ? 'bg-white border-black shadow-md ring-2 ring-black/5' 
                                            : 'bg-white/60 hover:bg-white border-gray-100'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center w-full">
                                            <span className="text-[11px] font-black text-gray-900 uppercase tracking-tight">
                                                Submission {idx + 1}
                                            </span>
                                            {isActive && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-black" />
                                            )}
                                        </div>
                                        <span className="text-[9px] text-gray-450 font-semibold uppercase tracking-wider">
                                            {new Date(hist.submittedAt).toLocaleDateString()} at {new Date(hist.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Pane (Selected details, 70% width) */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white">
                        {selectedSubmission ? (
                            <div className="space-y-6">
                                <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Submission details</h3>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Logged on {new Date(selectedSubmission.submittedAt).toLocaleString()}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-gray-400 text-xs font-semibold uppercase tracking-widest bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl">
                                        <Calendar className="w-4 h-4 text-gray-500" /> #{selectedIndex + 1}
                                    </div>
                                </div>

                                {selectedSubmission.dynamicFields && Object.keys(selectedSubmission.dynamicFields).length > 0 ? (
                                    <div className="space-y-6">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] block border-b border-gray-100 pb-2">Requirement Architecture Responses</span>
                                        <div className="grid grid-cols-1 gap-4">
                                            {Object.entries(selectedSubmission.dynamicFields).map(([lbl, val]) => (
                                                <div key={lbl} className="bg-gray-50 border border-gray-100 p-5 rounded-2xl text-[12px] space-y-2">
                                                    <span className="font-bold text-gray-400 uppercase text-[9px] tracking-widest block">{lbl}</span>
                                                    {val && (val.startsWith('http://') || val.startsWith('https://')) ? (
                                                        <a href={val} target="_blank" rel="noopener noreferrer" className="text-black hover:underline font-bold underline break-all inline-flex items-center gap-1 mt-1">
                                                            View Asset link <Eye className="w-3.5 h-3.5" />
                                                        </a>
                                                    ) : (
                                                        <p className="text-gray-700 font-normal leading-relaxed whitespace-pre-wrap mt-1">{val || <span className="italic text-gray-300">Empty response</span>}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center bg-gray-50 border border-dashed border-gray-200 rounded-2xl">
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">No custom deliverables responses captured in this log.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-center">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Select a log from the sidebar to view updates</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}</style>
        </div>
    );
}
