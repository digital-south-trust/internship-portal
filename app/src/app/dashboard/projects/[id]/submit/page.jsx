"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
    ArrowLeft,
    Rocket,
    X,
    Upload,
    Eye,
    Clock
} from "lucide-react";

export default function SubmitDeliverables() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id;

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    // Form inputs state
    const [dynamicFields, setDynamicFields] = useState({});

    // Lockout remaining seconds
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        if (!id) return;

        const fetchProject = async () => {
            try {
                const res = await fetch(`/api/projects?id=${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setProject(data);
                    setDynamicFields(data.dynamicFields || {});

                    // Lockout check
                    if (data.lastSubmittedAt) {
                        const lastSubmitted = new Date(data.lastSubmittedAt).getTime();
                        const diff = Date.now() - lastSubmitted;
                        const lockoutMs = 24 * 60 * 60 * 1000;
                        if (diff < lockoutMs) {
                            const remaining = Math.ceil((lockoutMs - diff) / 1000);
                            setTimeLeft(remaining);
                            toast.error("Submission is locked. You will be redirected.");
                            router.push(`/dashboard/projects/${id}`);
                        }
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

    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const formatTimeLeft = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const handleFormSubmit = async () => {
        if (timeLeft > 0) {
            toast.error("Submissions are locked. Please wait for the lockout to expire.");
            return;
        }

        setSaving(true);

        const formPhases = project.formPhases || [];
        const payload = {
            id: id,
            title: project.projectName,
            description: project.description,
            category: project.category,
            track: project.track,
            difficulty: project.difficulty,
            duration: project.duration || project.deadline,
            colorHex: project.colorHex || "#8b5cf6",
            dynamicFields,
            formPhases: formPhases,
            topics: project.topics || [],
            status: project.status,
            isSubmission: true
        };

        try {
            const res = await fetch('/api/projects', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success("Deliverables submitted successfully!");
                router.push(`/dashboard/projects/${id}`);
            } else {
                const errData = await res.json();
                toast.error(errData.message || "Failed to submit deliverables.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Network error submitting deliverables.");
        } finally {
            setSaving(false);
            setIsConfirmOpen(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading Workspace...</p>
                </div>
            </div>
        );
    }

    if (!project) return null;

    const phases = project.formPhases || [];

    // Calculate grid columns dynamically based on the number of phases
    const getGridColsClass = () => {
        if (phases.length === 2) return "md:grid-cols-2";
        if (phases.length >= 3) return "md:grid-cols-2 lg:grid-cols-3";
        return "grid-cols-1";
    };

    return (
        <div className="animate-in fade-in duration-500 min-h-screen bg-white pb-20">
            {/* Standardized Tactical Header */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-3xl -mx-8 -mt-8 px-8 py-5 border-b border-gray-100 shadow-sm flex items-center justify-between mb-10">
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
                               Submission WorkBook
                            </h1>
                    
                        </div>
                        <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-widest mt-1"> {project.projectName}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push(`/dashboard/projects/${id}`)}
                        className="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        id="cancel_btn"
                    >
                        Cancel
                    </button>
                    {timeLeft > 0 ? (
                        <div className="px-4 py-2.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> submitted: {formatTimeLeft(timeLeft)}
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsConfirmOpen(true)}
                            className="px-5 py-2.5 bg-black text-white hover:bg-gray-800 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-md"
                            id="submit_btn"
                        >
                            <Rocket className="w-3.5 h-3.5 " /> Submit
                        </button>
                    )}
                </div>
            </header>

            <main className="max-w-[1750px] mx-auto px-8">
                <div className="space-y-8 bg-white">
                

                    {/* Dynamic Phase fields in responsive split grid */}
                    <div className="pt-4 ">
                        {phases.length > 0 ? (
                            <div className={`grid grid-cols-1 ${getGridColsClass()} gap-8`}>
                                {phases.map((phase, pi) => (
                                    <div key={pi} className="space-y-5 bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm flex flex-col justify-between">
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-black text-black uppercase tracking-[0.2em]">{phase.name || `Phase ${pi + 1}`}</span>
                                                {phase.description && (
                                                    <p className="text-[10px] font-normal text-gray-405 leading-relaxed">{phase.description}</p>
                                                )}
                                            </div>
                                            <div className="space-y-4">
                                                {phase.fields && phase.fields.map((field, fi) => {
                                                    const fieldValue = dynamicFields[field.label] || "";
                                                    return (
                                                        <div key={fi} className="space-y-1.5">
                                                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">{field.label}</label>
                                                            
                                                            {field.type === 'file' ? (
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-xl p-3">
                                                                        <input 
                                                                            type="file" 
                                                                            onChange={async (e) => {
                                                                                const file = e.target.files[0];
                                                                                if (!file) return;
                                                                                const uploadForm = new FormData();
                                                                                uploadForm.append("document", file);
                                                                                
                                                                                const toastId = toast.loading(`Uploading file for ${field.label}...`);
                                                                                try {
                                                                                    const res = await fetch("/api/admin/projects/upload-document", {
                                                                                        method: "POST",
                                                                                        body: uploadForm
                                                                                    });
                                                                                    if (res.ok) {
                                                                                        const data = await res.json();
                                                                                        setDynamicFields(prev => ({
                                                                                            ...prev,
                                                                                            [field.label]: data.cdnUrl
                                                                                        }));
                                                                                        toast.success("File uploaded successfully", { id: toastId });
                                                                                    } else {
                                                                                        toast.error("Upload failed", { id: toastId });
                                                                                    }
                                                                                } catch (err) {
                                                                                    console.error(err);
                                                                                    toast.error("Upload error", { id: toastId });
                                                                                }
                                                                            }}
                                                                            className="text-[10px] text-gray-500 file:mr-4 file:py-1.5 file:px-2.5 file:rounded-lg file:border-0 file:text-[9px] file:font-semibold file:bg-white file:text-black hover:file:opacity-90 cursor-pointer w-full"
                                                                        />
                                                                    </div>
                                                                    {fieldValue && (
                                                                        <div className="text-[10px] font-semibold text-gray-700 flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-250">
                                                                            <span className="truncate max-w-[250px] font-mono">{fieldValue}</span>
                                                                            <div className="flex items-center gap-2">
                                                                                <a href={fieldValue} target="_blank" rel="noopener noreferrer" className="underline uppercase tracking-wider text-[9px] hover:text-black flex items-center gap-0.5"><Eye className="w-3 h-3" /> View</a>
                                                                                <button 
                                                                                    type="button" 
                                                                                    onClick={() => {
                                                                                        setDynamicFields(prev => {
                                                                                            const copy = { ...prev };
                                                                                            delete copy[field.label];
                                                                                            return copy;
                                                                                        });
                                                                                    }} 
                                                                                    className="text-rose-600 hover:underline uppercase tracking-wider text-[9px]"
                                                                                >
                                                                                    Remove
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : field.type === 'textarea' ? (
                                                                <textarea 
                                                                    rows="4"
                                                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold focus:ring-8 focus:ring-black/5 outline-none resize-none"
                                                                    value={fieldValue}
                                                                    onChange={e => setDynamicFields({ 
                                                                        ...dynamicFields, 
                                                                        [field.label]: e.target.value 
                                                                    })}
                                                                    placeholder={`Provide details for ${field.label}...`}
                                                                />
                                                            ) : (
                                                                <input 
                                                                    type={field.type === 'link' ? 'url' : 'text'}
                                                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold focus:ring-8 focus:ring-black/5 outline-none"
                                                                    value={fieldValue}
                                                                    onChange={e => setDynamicFields({ 
                                                                        ...dynamicFields, 
                                                                        [field.label]: e.target.value 
                                                                    })}
                                                                    placeholder={`Enter ${field.label}...`}
                                                                />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 animate-pulse">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">No Requirement Architecture Fields configured for this track.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Confirmation Alert Dialog popup */}
            {isConfirmOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsConfirmOpen(false)} />
                    <div className="relative bg-white rounded-[2rem] max-w-sm w-full shadow-2xl p-8 border border-gray-100 text-center animate-in fade-in zoom-in duration-200">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Rocket className="w-8 h-8 text-black" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-2">Confirm Submission</h3>
                        <p className="text-xs font-bold text-gray-500 mb-8 px-4">Are you sure you want to submit your deliverables? Once submitted, you cannot edit or re-submit them for 24 hours.</p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setIsConfirmOpen(false)} 
                                className="flex-1 py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                                id="confirm_cancel_btn"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleFormSubmit} 
                                className="flex-1 py-3.5 bg-black hover:bg-gray-800 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
                                id="confirm_submit_btn"
                                disabled={saving}
                            >
                                {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : 'Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
