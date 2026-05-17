"use client";

import {
    FolderGit2,
    Plus,
    Layout,
    Code,
    Database,
    X,
    Upload,
    Globe,
    Zap,
    Target,
    ArrowRight,
    ChevronRight,
    Search,
    Flame,
    FileText,
    ChevronLeft,
    Monitor,
    Link as LinkIcon,
    Image as ImageIcon,
    CheckCircle2,
    Calendar as CalendarIcon,
    Briefcase,
    Terminal,
    Rocket,
    Type,
    AlignLeft
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "react-hot-toast";

// Config & Mock Data
const submissionColors = [
    { name: "Violet", hex: "#8b5cf6", blob: "bg-violet-600", badge: "bg-violet-50 text-violet-700" },
    { name: "Emerald", hex: "#10b981", blob: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700" },
    { name: "Blue", hex: "#3b82f6", blob: "bg-blue-500", badge: "bg-blue-50 text-blue-700" },
    { name: "Amber", hex: "#f59e0b", blob: "bg-amber-500", badge: "bg-amber-50 text-amber-700" },
    { name: "Rose", hex: "#f43f5e", blob: "bg-rose-500", badge: "bg-rose-50 text-rose-700" },
];

const TRACK_TECH_STACKS = {
    "Web Development": ["Next.js", "React", "Node.js", "Playwright", "Tailwind CSS", "MongoDB", "PostgreSQL", "Firebase"],
    "App Development (React Native, Flutter)": ["Flutter", "React Native", "Swift", "Kotlin", "Firebase", "SQLite", "Node.js"],
    "Blockchain / Web3": ["Solidity", "Hardhat", "Truffle", "Ethers.js", "Web3.js", "IPFS", "Next.js"],
    "GenAI": ["LangChain", "OpenAI API", "Hugging Face", "Pinecone", "ChromaDB", "FastAPI", "Python"],
    "AI/ML": ["Python", "TensorFlow", "PyTorch", "Scikit-Learn", "Pandas", "NumPy", "Jupyter"],
    "Research and Development": ["Python", "TensorFlow", "PyTorch", "Flask", "D3.js", "Scikit-Learn", "FastAPI", "C++", "MATLAB"]
};

const ProjectCard = ({ p, onEdit }) => {
    const pathRef = useRef(null);
    const [firePos, setFirePos] = useState({ x: 0, y: 0, ang: 0 });

    const pathD = "M 32,1 L 368,1 A 31,31 0 0 1 399,32 L 399,298 A 31,31 0 0 1 368,329 L 32,329 A 31,31 0 0 1 1,298 L 1,32 A 31,31 0 0 1 32,1 Z";

    useEffect(() => {
        const updateFire = () => {
            if (pathRef.current && (p.progress ?? 0) < 100) {
                const path = pathRef.current;
                const totalLen = path.getTotalLength();
                if (totalLen === 0) return;
                const currentLen = totalLen * ((p.progress ?? 0) / 100);
                const pt = path.getPointAtLength(currentLen);
                const delta = 0.5;
                const nextPt = path.getPointAtLength(Math.min(totalLen, currentLen + delta));
                const angle = Math.atan2(nextPt.y - pt.y, nextPt.x - pt.x) * (180 / Math.PI);
                setFirePos({ x: pt.x, y: pt.y, ang: angle });
            }
        };
        const timer = setInterval(updateFire, 16);
        window.addEventListener('resize', updateFire);
        return () => { clearInterval(timer); window.removeEventListener('resize', updateFire); };
    }, [p.progress]);

    return (
        <div className="relative h-[330px] w-full group">
            <div className="absolute inset-0 pointer-events-none z-30 overflow-visible">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 400 330" preserveAspectRatio="none">
                    <path d={pathD} fill="none" stroke="#f3f4f6" strokeWidth="2" />
                    {(p.progress ?? 0) > 0 && (
                        <path
                            ref={pathRef}
                            d={pathD}
                            fill="none"
                            stroke={p.colorHex}
                            strokeWidth="4"
                            strokeDasharray="1400"
                            strokeDashoffset={1400 - (1400 * (p.progress ?? 0) / 100)}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.2, 0, 0, 1)' }}
                        />
                    )}
                    {(p.progress ?? 0) < 100 && (p.progress ?? 0) > 0 && firePos.x !== 0 && (
                        <foreignObject
                            x={firePos.x - 35}
                            y={firePos.y - 35}
                            width={70}
                            height={70}
                            style={{ overflow: 'visible' }}
                        >
                            <div
                                style={{ width: '100%', height: '100%', transform: `rotate(${firePos.ang}deg)` }}
                                className="flex items-center justify-center pointer-events-none"
                            >
                                <svg viewBox="-50 -50 100 100" className="w-[120%] h-[120%] drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)] filter">
                                    <g transform="rotate(90)">
                                        <motion.g
                                            animate={{ scaleY: [1, 1.4, 1], scaleX: [1, 1.1, 1] }}
                                            transition={{ duration: 0.1, repeat: Infinity, ease: "linear" }}
                                            style={{ transformOrigin: "0px 20px" }}
                                        >
                                            <path d="M -10,21 C -15,40 0,60 0,60 C 0,60 15,40 10,21 Z" fill="#ea580c" />
                                            <path d="M -6,21 C -8,35 0,50 0,50 C 0,50 8,35 6,21 Z" fill="#fbbf24" opacity="0.9" />
                                            <path d="M -2,21 C -3,28 0,35 0,35 C 0,35 3,28 2,21 Z" fill="#ffffff" opacity="0.8" />
                                        </motion.g>
                                        <path d="M -2,15 L 0,40 L 2,15 Z" fill="#9f1239" />
                                        <path d="M -14,5 Q -28,15 -28,25 C -28,30 -24,35 -14,35 L -10,20 Z" fill="#e11d48" />
                                        <path d="M 14,5 Q 28,15 28,25 C 28,30 24,35 14,35 L 10,20 Z" fill="#be123c" />
                                        <path d="M -14,20 C -14,-5 0,-30 0,-30 C 0,-30 14,-5 14,20 Q 0,25 -14,20 Z" fill="#f3f4f6" />
                                        <path d="M 0,-30 C 0,-30 14,-5 14,20 Q 0,22.5 0,20 Z" fill="#e5e7eb" opacity="0.6" />
                                        <path d="M -9.5,-15 C -5,-25 0,-30 0,-30 C 0,-30 5,-25 9.5,-15 Q 0,-13 -9.5,-15 Z" fill="#ef4444" />
                                        <path d="M 0,-30 C 0,-30 5,-25 9.5,-15 Q 0,-13 0,-15 Z" fill="#dc2626" opacity="0.6" />
                                        <circle cx="0" cy="-2" r="7" fill="#38bdf8" stroke="#ef4444" strokeWidth="2.5" />
                                        <path d="M -3,-5 A 4 4 0 0 1 1,-7" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                                    </g>
                                </svg>
                            </div>
                        </foreignObject>
                    )}
                </svg>
                {p.progress === 100 && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-0 left-0 -ml-1 -mt-1 z-50">
                        <div className="w-8 h-8 bg-white rounded-full border-2 border-emerald-500 flex items-center justify-center shadow-lg">
                            <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                <Target className="w-3 h-3 text-white" />
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            <div
                onClick={() => onEdit(p)}
                className="absolute inset-0 rounded-[2rem] p-6 overflow-hidden bg-white shadow-xl transition-all flex flex-col justify-between cursor-pointer hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] group/card border border-gray-50"
                style={{
                    background: `linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.95) 100%), linear-gradient(135deg, transparent 60%, ${p.colorHex}15 100%)`
                }}
            >
                <div className="flex justify-between items-start relative z-10">
                    <div className="space-y-1">
                        <h3 className="text-xl font-black text-gray-900 uppercase leading-none tracking-tighter line-clamp-1 group-hover/card:text-black transition-colors">
                            {p.title}
                        </h3>
                        <span className="inline-block px-2 py-0.5 bg-gray-100 text-[11px] font-black uppercase text-gray-500 rounded-md tracking-wide">{p.track}</span>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm flex items-center gap-1.5 ${p.progress === 100
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : p.status === 'Pending'
                            ? 'bg-amber-50 text-amber-600 border-amber-100'
                            : p.status === 'Rejected'
                                ? 'bg-rose-50 text-rose-600 border-rose-100'
                                : 'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                        {p.progress === 100 && <X className="w-2.5 h-2.5 rotate-45" strokeWidth={3} />}
                        {p.progress === 100
                            ? 'Completed'
                            : p.status === 'Pending'
                                ? 'Awaiting Review'
                                : p.status === 'Rejected'
                                    ? 'Rejected'
                                    : 'In Progress'}
                    </div>
                </div>

                <div className="flex items-end justify-between relative z-10 pt-6">
                    <div className="space-y-0.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Progress</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black leading-none" style={{ color: p.colorHex }}>{p.progress ?? 0}</span>
                            <span className="text-sm font-black text-gray-400">%</span>
                        </div>
                    </div>

                    <div className="text-right space-y-0.5">
                        <div className="flex items-center gap-1.5 justify-end text-gray-400">
                            <CalendarIcon className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">EOL</span>
                        </div>
                        <p className="text-[13px] font-black text-gray-800 uppercase tracking-wide">24 MAR 26</p>
                    </div>
                </div>
                <div className="absolute bottom-[-10px] right-[-10px] opacity-[0.02] group-hover/card:opacity-[0.05] transition-opacity pointer-events-none transform rotate-12">
                    <FolderGit2 className="w-32 h-32" />
                </div>
            </div>
        </div>
    );
};

export default function ProjectsPage() {
    const [projects, setProjects] = useState([]);
    const [availablePool, setAvailablePool] = useState([]);
    const [userTrack, setUserTrack] = useState("");
    const [trackConfig, setTrackConfig] = useState(null);

    const fetchUserData = async () => {
        const email = localStorage.getItem("userEmail");
        if (!email) return;

        let liveTrack = "";

        try {
            const userRes = await fetch(`/api/user/me?email=${email}`);
            if (userRes.ok) {
                const userData = await userRes.json();
                liveTrack = userData.track || "Web Development";
                setUserTrack(liveTrack);
            }
        } catch (err) {
            console.error("Fetch user error:", err);
        }

        if (liveTrack) {
            try {
                const tracksRes = await fetch('/api/admin/tracks');
                if (tracksRes.ok) {
                    const tracksData = await tracksRes.json();
                    const allTracks = [...(tracksData.CODING || []), ...(tracksData.RESEARCH || [])];
                    const currentTrack = allTracks.find(t => t.name.toLowerCase() === liveTrack.toLowerCase());
                    if (currentTrack) {
                        setTrackConfig(currentTrack);
                    }
                }
            } catch (err) {
                console.error("Fetch track config error:", err);
            }

            try {
                const poolRes = await fetch(`/api/admin/projects/pool?track=${encodeURIComponent(liveTrack)}`);
                if (poolRes.ok) {
                    const data = await poolRes.json();
                    setAvailablePool(data.map(p => ({
                        ...p,
                        id: p._id,
                        techStack: (p.techStack && typeof p.techStack === 'string') ? p.techStack.split(',').map(s => s.trim()) : (Array.isArray(p.techStack) ? p.techStack : [])
                    })));
                }
            } catch (err) {
                console.error("Fetch pool error:", err);
            }
        }

        try {
            const res = await fetch(`/api/projects?email=${email}`);
            if (res.ok) {
                const data = await res.json();
                setProjects(data.map(p => ({
                    ...p,
                    id: p._id,
                    title: p.projectName,
                    description: p.description,
                    status: p.status,
                    progress: p.progress,
                    colorHex: p.colorHex || "#8b5cf6",
                    track: p.track,
                    techStack: (p.techStack && typeof p.techStack === 'string') ? p.techStack.split(',').map(s => s.trim()) : (Array.isArray(p.techStack) ? p.techStack : []),
                    repoLink: p.repoLink,
                    deployLink: p.deployLink,
                    documentFile: p.documentFile,
                    documentLink: p.documentLink,
                    category: p.category,
                    solution: p.solution,
                    projectType: p.projectType,
                    dynamicFields: p.dynamicFields || {}
                })));
            }
        } catch (err) {
            console.error("Fetch projects error:", err);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalStep, setStep] = useState(1);
    const [projType, setProjType] = useState(null);

    const [formData, setFormData] = useState({
        id: null, title: "", description: "", color: submissionColors[0],
        repoLink: "", deployLink: "", solution: "", techStack: [], document: null, progress: 0,
        dynamicFields: {}, formPhases: []
    });

    useEffect(() => {
        if (availablePool.length > 0 && typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const viewId = params.get('viewId');
            if (viewId) {
                const targetProject = availablePool.find(p => p.id === viewId);
                const isAlreadyAdded = targetProject && projects.some(p => p.title === targetProject.title);

                if (targetProject && !isAlreadyAdded) {
                    setProjType('preset');
                    setFormData(prev => ({
                        ...prev,
                        title: targetProject.title,
                        description: targetProject.description,
                        techStack: targetProject.techStack,
                        category: targetProject.category,
                        formPhases: targetProject.formPhases || []
                    }));
                    setStep(3);
                    setIsModalOpen(true);
                    window.history.replaceState({}, '', '/dashboard/projects');
                } else if (targetProject && isAlreadyAdded) {
                    const existingProject = projects.find(p => p.title === targetProject.title);
                    if (existingProject) {
                        handleEdit(existingProject);
                    }
                    window.history.replaceState({}, '', '/dashboard/projects');
                }
            }
        }
    }, [availablePool, projects]);

    const isReadOnly = formData.id && formData.progress === 100;

    const handleEdit = (project) => {
        if (project.progress === 100) {
            toast.error("Intelligence Locked: Completed deployments cannot be modified.");
            return;
        }

        const isPreset = project.projectType === 'preset' || (!project.projectType && availablePool.some(s => s.title === project.title));

        setProjType(isPreset ? 'preset' : 'custom');
        setFormData({
            ...project,
            color: submissionColors.find(c => c.hex === project.colorHex) || submissionColors[0],
            dynamicFields: project.dynamicFields || {}
        });
        setStep(isPreset ? 3 : 2);
        setIsModalOpen(true);
    };

    const resetModal = () => {
        setIsModalOpen(false);
        setStep(1);
        setProjType(null);
        setFormData({ id: null, title: "", description: "", color: submissionColors[0], repoLink: "", deployLink: "", solution: "", techStack: [], document: null, progress: 0, dynamicFields: {}, formPhases: [] });
    };

    const handleSubmission = async (e) => {
        e.preventDefault();
        if (isReadOnly) return;
        const email = localStorage.getItem("userEmail");

        const payload = {
            ...formData,
            projectName: formData.title,
            colorHex: formData.color.hex,
            dynamicFields: formData.dynamicFields,
            formPhases: formData.formPhases || (projType === 'custom' ? (trackConfig?.formPhases || []) : [])
        };

        try {
            if (formData.id) {
                const res = await fetch('/api/projects', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    setProjects(prev => prev.map(p => p.id === formData.id ? { ...p, ...payload, colorHex: formData.color.hex } : p));
                    toast.success("Intelligence Updated Successfully.");
                }
            } else {
                const res = await fetch('/api/projects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...payload,
                        internEmail: email,
                        progress: 10,
                        track: userTrack,
                        category: formData.category || (userTrack?.toUpperCase() === 'RESEARCH' ? 'RESEARCH' : 'CODING'),
                        isPreset: projType === 'preset'
                    })
                });
                if (res.ok) {
                    const { project } = await res.json();
                    setProjects(prev => [{
                        ...project,
                        id: project._id,
                        title: project.projectName,
                        colorHex: project.colorHex
                    }, ...prev]);
                    toast.success("Deployment Initiated Successfully.");
                } else {
                    toast.error("Deployment failed");
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("Internal Error");
        }
        resetModal();
    };

    const myStatements = availablePool.filter(s => {
        const adminTrack = (s.track || "").toLowerCase();
        const uTrack = (userTrack || "").toLowerCase();
        if (uTrack.includes("blockchain") && adminTrack.includes("blockchain")) return true;
        if (uTrack.includes("gen") && adminTrack.includes("gen")) return true;
        if (uTrack.includes("app development") && adminTrack.includes("app development")) return true;
        if ((uTrack === "ai/ml" || uTrack === "artificial intelligence") && (adminTrack === "ai/ml" || adminTrack === "artificial intelligence")) return true;
        return adminTrack === uTrack;
    });

    return (
        <div className="animate-in fade-in duration-500">
            {/* Standardized Tactical Header */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-3xl -mx-8 -mt-8 px-8 py-5 border-b border-gray-100 shadow-sm mb-12">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-8 bg-black rounded-full" />
                        <h1 className="text-2xl font-black text-black tracking-tighter uppercase leading-none">
                            Projects Hub
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                  
                        <button
                            onClick={() => {
                                setFormData(prev => ({ 
                                    ...prev, 
                                    formPhases: trackConfig?.formPhases || [] 
                                }));
                                setIsModalOpen(true);
                            }}
                            className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10 group"
                        >
                            <Plus className="w-4 h-4" /> Initialize Deployment
                        </button>
                    </div>
                </div>
            </header>

            <div className="px-8 pb-20 max-w-[1400px] mx-auto space-y-12">
                    <div className="space-y-12">
                        {projects.length === 0 ? (
                            <div className="py-32 text-center border-2 border-dashed border-gray-100 rounded-[3rem]">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Rocket className="w-10 h-10 text-gray-200" />
                                </div>
                                <h3 className="text-xl font-black text-gray-300 uppercase tracking-widest">No Active Missions</h3>
                                <p className="text-gray-400 font-bold text-xs mt-2 uppercase">Initiate a project to begin your deployment.</p>
                            </div>
                        ) : (
                            <motion.div initial={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                {projects.map(p => <ProjectCard key={p.id} p={p} onEdit={handleEdit} />)}
                            </motion.div>
                        )}
                </div>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={resetModal} className="absolute inset-0 bg-black/70 backdrop-blur-3xl" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            className="relative w-full max-w-5xl bg-white rounded-[3rem] p-10 shadow-[0_80px_160px_-30px_rgba(0,0,0,0.6)] overflow-hidden"
                        >
                            <div className="flex justify-between items-center mb-10 relative z-10">
                                <div className="flex items-center gap-6">
                                    {modalStep > 1 && (
                                        <button onClick={() => setStep(prev => prev - 1)} className="p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all">
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                    )}
                                    <div>
                                        <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">
                                            {formData.id ? "System Asset Control" : (modalStep === 1 ? "Mission Select" : projType === 'custom' ? "Custom Intel" : (modalStep === 2 ? "Mission Command" : "Assigned Scope"))}
                                        </h3>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] mt-3 ml-1">Stage {modalStep} of {formData.id ? 2 : (projType === 'preset' ? 3 : 2)}</p>
                                    </div>
                                </div>
                                <button onClick={resetModal} className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-100 transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="max-h-[75vh] overflow-y-auto pr-6 custom-scrollbar relative z-10 scroll-smooth">
                                {modalStep === 1 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div
                                            onClick={() => { setProjType('custom'); setFormData(f => ({ ...f, formPhases: trackConfig?.formPhases || [] })); setStep(2); }}
                                            className="p-10 bg-gray-50 rounded-[2.5rem] border-4 border-transparent hover:border-black hover:bg-white transition-all cursor-pointer group shadow-sm hover:shadow-xl flex flex-col items-center text-center"
                                        >
                                            <div className="w-20 h-20 bg-white rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:scale-110 shadow-lg transition-all">
                                                <Terminal className="w-10 h-10 text-gray-400 group-hover:text-black" />
                                            </div>
                                            <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Custom Project</h4>
                                            <p className="text-[12px] text-gray-400 font-medium mt-4 leading-relaxed max-w-[200px]">Propose a unique scope tailored to your strengths.</p>
                                        </div>
                                        <div
                                            onClick={() => { setProjType('preset'); setStep(2); }}
                                            className="p-10 bg-gray-50 rounded-[2.5rem] border-4 border-transparent hover:border-black hover:bg-white transition-all cursor-pointer group shadow-sm hover:shadow-xl flex flex-col items-center text-center"
                                        >
                                            <div className="w-20 h-20 bg-white rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:scale-110 shadow-lg transition-all">
                                                <Target className="w-10 h-10 text-gray-400 group-hover:text-emerald-500" />
                                            </div>
                                            <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Problem Pool</h4>
                                            <p className="text-[12px] text-gray-400 font-medium mt-4 leading-relaxed max-w-[200px]">Deploy solutions for pre-validated challenges.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmission} className="space-y-12 pb-8 px-2">
                                        {projType === 'custom' ? (
                                            <div className="space-y-10">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Project Title</label>
                                                        <input required disabled={isReadOnly} className="w-full bg-gray-50 border-0 rounded-[1.5rem] px-6 py-4 text-sm font-bold focus:ring-8 focus:ring-black/5 outline-none disabled:opacity-50" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Project Name" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Signature Theme</label>
                                                        <div className="flex gap-3">
                                                            {submissionColors.map(c => (
                                                                <button key={c.name} type="button" disabled={isReadOnly} onClick={() => setFormData({ ...formData, color: c })} className={`w-10 h-10 rounded-xl ${c.blob} transition-all ${formData.color.name === c.name ? 'ring-4 ring-black/5 scale-110 shadow-lg' : 'hover:scale-105'}`} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Technical Description</label>
                                                    <textarea required rows="3" disabled={isReadOnly} className="w-full bg-gray-50 border-0 rounded-[2rem] px-8 py-6 text-sm font-bold focus:ring-8 focus:ring-black/5 outline-none resize-none disabled:opacity-50" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Project scope and mission goals..." />
                                                </div>

                                                {/* Dynamic Mission Architecture (Phases from Admin Track) */}
                                                {(formData.formPhases || []).length > 0 && (
                                                    <div className="space-y-10 pt-6 border-t border-gray-100/50">
                                                        {(formData.formPhases || []).map((phase, pi) => (
                                                            <div key={pi} className="space-y-6">
                                                                <div className="space-y-1 ml-2">
                                                                    <div className="flex items-center gap-4">
                                                                        <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] shrink-0">{phase.name || `Phase ${pi + 1}`}</label>
                                                                        <div className="h-px bg-indigo-100 flex-1" />
                                                                    </div>
                                                                    {phase.description && (
                                                                        <p className="text-[10px] font-bold text-gray-400 leading-relaxed">{phase.description}</p>
                                                                    )}
                                                                </div>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                                    {phase.fields.map((field, fi) => (
                                                                        <div key={fi} className="space-y-2">
                                                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">{field.label}</label>
                                                                            {field.type === 'textarea' ? (
                                                                                <textarea 
                                                                                    disabled={isReadOnly}
                                                                                    rows="2"
                                                                                    className="w-full bg-gray-50 border-0 rounded-[1.5rem] px-6 py-4 text-sm font-bold focus:ring-8 focus:ring-indigo-500/5 outline-none resize-none disabled:opacity-50"
                                                                                    value={formData.dynamicFields?.[field.label] || ""}
                                                                                    onChange={e => setFormData({ 
                                                                                        ...formData, 
                                                                                        dynamicFields: { 
                                                                                            ...(formData.dynamicFields || {}), 
                                                                                            [field.label]: e.target.value 
                                                                                        } 
                                                                                    })}
                                                                                    placeholder={`Specify ${field.label}...`}
                                                                                />
                                                                            ) : (
                                                                                <input 
                                                                                    disabled={isReadOnly}
                                                                                    type={field.type === 'link' ? 'url' : 'text'}
                                                                                    className="w-full bg-gray-50 border-0 rounded-[1.5rem] px-6 py-4 text-sm font-bold focus:ring-8 focus:ring-indigo-500/5 outline-none disabled:opacity-50"
                                                                                    value={formData.dynamicFields?.[field.label] || ""}
                                                                                    onChange={e => setFormData({ 
                                                                                        ...formData, 
                                                                                        dynamicFields: { 
                                                                                            ...(formData.dynamicFields || {}), 
                                                                                            [field.label]: e.target.value 
                                                                                        } 
                                                                                    })}
                                                                                    placeholder={field.type === 'file' ? 'Link to asset' : `Enter ${field.label}...`}
                                                                                />
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Tech Stack Utilization</label>
                                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                                            {(TRACK_TECH_STACKS[userTrack] || TRACK_TECH_STACKS["Web Development"]).map(tech => (
                                                                <button
                                                                    key={tech}
                                                                    type="button"
                                                                    disabled={isReadOnly}
                                                                    onClick={() => {
                                                                        const currentStack = Array.isArray(formData.techStack) ? formData.techStack : [];
                                                                        const exists = currentStack.includes(tech);
                                                                        const newStack = exists ? currentStack.filter(t => t !== tech) : [...currentStack, tech];
                                                                        setFormData({ ...formData, techStack: newStack });
                                                                    }}
                                                                    className={`px-3 py-1.5 rounded-lg text-[8px] font-bold uppercase transition-all border ${(Array.isArray(formData.techStack) ? formData.techStack : []).includes(tech) ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'}`}
                                                                >
                                                                    {tech}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">GitHub / Documentation</label>
                                                            <input disabled={isReadOnly} className="w-full bg-gray-50 border-0 rounded-[1.5rem] px-6 py-4 text-sm font-bold focus:ring-8 focus:ring-black/5 outline-none disabled:opacity-50" value={formData.repoLink || ""} onChange={e => setFormData({ ...formData, repoLink: e.target.value })} placeholder="Cloud URL / Docs Link" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Live Demo / Artifact</label>
                                                            <input disabled={isReadOnly} className="w-full bg-gray-50 border-0 rounded-[1.5rem] px-6 py-4 text-sm font-bold focus:ring-8 focus:ring-black/5 outline-none disabled:opacity-50" value={formData.deployLink || ""} onChange={e => setFormData({ ...formData, deployLink: e.target.value })} placeholder="Vercel / Drive / Live URL" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Implementation Roadmap</label>
                                                    <textarea required rows="4" disabled={isReadOnly} className="w-full bg-gray-50 border-0 rounded-[2rem] px-8 py-6 text-sm font-bold focus:ring-8 focus:ring-black/5 outline-none resize-none disabled:opacity-50" value={formData.solution} onChange={e => setFormData({ ...formData, solution: e.target.value })} placeholder="Describe the steps you will take to achieve the mission objectives..." />
                                                </div>
                                            </div>
                                        ) : modalStep === 2 ? (
                                            <div className="space-y-12 mb-10">
                                                {!formData.id && (
                                                    <div className="space-y-4 w-full">
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Select Mission Statement</label>
                                                            <span className="text-[8px] font-bold text-gray-400 italic">Pre-approved problem pool for your track</span>
                                                        </div>
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
                                                            {myStatements.map(s => {
                                                                const isAlreadyAdded = projects.some(p => p.title === s.title);
                                                                const hasOtherPreset = projects.some(p => (p.projectType === 'preset' || availablePool.some(pool => pool.title === p.title)) && p.title !== s.title);
                                                                const isDisabled = isReadOnly || isAlreadyAdded || hasOtherPreset;

                                                                return (
                                                                    <div
                                                                        key={s.id}
                                                                        onClick={() => {
                                                                            if (!isDisabled) {
                                                                                setFormData({ ...formData, ...s, id: null, formPhases: s.formPhases || [] });
                                                                                setStep(3);
                                                                            }
                                                                        }}
                                                                        className={`p-8 rounded-[2.5rem] flex flex-col justify-between border-2 transition-all group/s ${isAlreadyAdded
                                                                            ? 'opacity-70 cursor-default shadow-none bg-gray-50/50'
                                                                            : hasOtherPreset
                                                                                ? 'opacity-50 cursor-not-allowed grayscale bg-gray-50/80'
                                                                                : 'cursor-pointer'
                                                                            } ${formData.title === s.title ? 'bg-black text-white border-black shadow-2xl scale-[1.02]' : 'bg-gray-50 border-gray-100 hover:border-black/50 hover:bg-white shadow-sm'}`}
                                                                    >
                                                                        <div>
                                                                            <div className="flex justify-between items-start mb-4 gap-4">
                                                                                <h4 className="text-xl font-black uppercase tracking-tighter leading-tight">{s.title}</h4>
                                                                                {isAlreadyAdded && <CheckCircle2 className={`w-8 h-8 shrink-0 ${formData.title === s.title ? 'text-white' : 'text-emerald-500'}`} />}
                                                                            </div>
                                                                            <p className={`text-sm font-semibold mb-8 leading-relaxed line-clamp-2 ${formData.title === s.title ? 'text-gray-300' : 'text-gray-500'}`}>{s.description}</p>
                                                                            <div className="flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-widest mb-8">
                                                                                {(s.techStack || []).map(t => (
                                                                                    <span key={t} className={`px-2.5 py-1 rounded-md shadow-sm border ${formData.title === s.title ? 'bg-white/10 text-white border-transparent' : 'bg-white text-gray-600 border-gray-200'}`}>{t}</span>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            disabled={isDisabled}
                                                                            className={`w-full py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-sm ${isAlreadyAdded
                                                                                ? 'bg-emerald-500 text-white shadow-emerald-500/20 cursor-default'
                                                                                : formData.title === s.title
                                                                                    ? 'bg-white text-black'
                                                                                    : isDisabled
                                                                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                                                        : 'bg-black text-white group-hover/s:scale-105 active:scale-95'
                                                                                }`}
                                                                        >
                                                                            {isAlreadyAdded ? 'Active Mission' : 'Accept Assignment'}
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })}

                                                            {myStatements.length === 0 && (
                                                                <div className="col-span-full py-20 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                                                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                                                                        <Rocket className="w-8 h-8 text-gray-200" />
                                                                    </div>
                                                                    <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-2">No statements found</h4>
                                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Awaiting deployment for {userTrack}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-12">
                                                <AnimatePresence mode="wait">
                                                    {formData.title && (
                                                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="space-y-10">
                                                            <div className="space-y-4 w-full">
                                                                <div className="flex items-center justify-between ml-2">
                                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Protocol Details</label>
                                                                    {!formData.id && (
                                                                        <button type="button" onClick={() => setStep(2)} className="text-[9px] font-black text-black uppercase tracking-widest px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">Switch Statement</button>
                                                                    )}
                                                                </div>
                                                                <div className="p-8 rounded-[2.5rem] bg-gray-50 border border-gray-100 shadow-sm relative overflow-hidden">
                                                                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                                                                        <Target className="w-32 h-32 -mr-8 -mt-8" />
                                                                    </div>
                                                                    <div className="space-y-8">
                                                                        <div>
                                                                            <h4 className="text-2xl font-black uppercase tracking-tighter text-gray-900 mb-2">{formData.title}</h4>
                                                                            <p className="text-sm font-bold text-gray-500 leading-relaxed max-w-2xl">{formData.description}</p>
                                                                        </div>

                                                                        {/* Dynamic Mission Architecture */}
                                                                        {(formData.formPhases || []).length > 0 && (
                                                                            <div className="space-y-10 pt-8 border-t border-gray-100/50">
                                                                                {(formData.formPhases || []).map((phase, pi) => (
                                                                                    <div key={pi} className="space-y-6">
                                                                                        <div className="space-y-1 ml-2">
                                                                                            <div className="flex items-center gap-4">
                                                                                                <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] shrink-0 font-bold">{phase.name || `Phase ${pi + 1}`}</label>
                                                                                                <div className="h-px bg-indigo-100 flex-1" />
                                                                                            </div>
                                                                                            {phase.description && (
                                                                                                <p className="text-[10px] font-bold text-gray-400 leading-relaxed">{phase.description}</p>
                                                                                            )}
                                                                                        </div>
                                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                                                            {phase.fields.map((field, fi) => (
                                                                                                <div key={fi} className="space-y-2">
                                                                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">{field.label}</label>
                                                                                                    {field.type === 'textarea' ? (
                                                                                                        <textarea 
                                                                                                            disabled={isReadOnly}
                                                                                                            rows="2"
                                                                                                            className="w-full bg-white border border-gray-100 rounded-[1.5rem] px-6 py-4 text-sm font-bold focus:ring-8 focus:ring-indigo-500/5 outline-none resize-none disabled:opacity-50"
                                                                                                            value={formData.dynamicFields?.[field.label] || ""}
                                                                                                            onChange={e => setFormData({ 
                                                                                                                ...formData, 
                                                                                                                dynamicFields: { 
                                                                                                                    ...(formData.dynamicFields || {}), 
                                                                                                                    [field.label]: e.target.value 
                                                                                                                } 
                                                                                                            })}
                                                                                                            placeholder={`Provide ${field.label}...`}
                                                                                                        />
                                                                                                    ) : (
                                                                                                        <input 
                                                                                                            disabled={isReadOnly}
                                                                                                            type={field.type === 'link' ? 'url' : 'text'}
                                                                                                            className="w-full bg-white border border-gray-100 rounded-[1.5rem] px-6 py-4 text-sm font-bold focus:ring-8 focus:ring-indigo-500/5 outline-none disabled:opacity-50"
                                                                                                            value={formData.dynamicFields?.[field.label] || ""}
                                                                                                            onChange={e => setFormData({ 
                                                                                                                ...formData, 
                                                                                                                dynamicFields: { 
                                                                                                                    ...(formData.dynamicFields || {}), 
                                                                                                                    [field.label]: e.target.value 
                                                                                                                } 
                                                                                                            })}
                                                                                                            placeholder={field.type === 'file' ? 'Asset Link / Path' : `Enter ${field.label}...`}
                                                                                                        />
                                                                                                    )}
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}

                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-100/50">
                                                                            <div className="space-y-2">
                                                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Assigned Tech Stack</label>
                                                                                <div className="flex flex-wrap gap-2">
                                                                                    {(formData.techStack || []).map(t => (
                                                                                        <span key={t} className="px-3 py-1.5 rounded-lg bg-black text-white text-[9px] font-bold uppercase tracking-widest shadow-sm">{t}</span>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                            <div className="space-y-4">
                                                                                <div className="space-y-2">
                                                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Work Repository</label>
                                                                                    <input disabled={isReadOnly} className="w-full bg-white border border-gray-100 rounded-[1.5rem] px-6 py-4 text-sm font-bold focus:ring-8 focus:ring-black/5 outline-none disabled:opacity-50" value={formData.repoLink || ""} onChange={e => setFormData({ ...formData, repoLink: e.target.value })} placeholder="Deployment URL" />
                                                                                </div>
                                                                                <div className="space-y-2">
                                                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Live Demo URL</label>
                                                                                    <input disabled={isReadOnly} className="w-full bg-white border border-gray-100 rounded-[1.5rem] px-6 py-4 text-sm font-bold focus:ring-8 focus:ring-black/5 outline-none disabled:opacity-50" value={formData.deployLink || ""} onChange={e => setFormData({ ...formData, deployLink: e.target.value })} placeholder="Artifact URL" />
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="space-y-2 pt-6 border-t border-gray-100/50">
                                                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Solution Architecture</label>
                                                                            <textarea required rows="4" disabled={isReadOnly} className="w-full bg-white border border-gray-100 rounded-[2rem] px-8 py-6 text-sm font-bold focus:ring-8 focus:ring-black/5 outline-none resize-none disabled:opacity-50" value={formData.solution} onChange={e => setFormData({ ...formData, solution: e.target.value })} placeholder="Explain your plan for this statement..." />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-2 mb-8 mt-6">
                                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Interface Theme</label>
                                                                <div className="flex gap-3">
                                                                    {submissionColors.map(c => (
                                                                        <button key={c.name} type="button" onClick={() => !isReadOnly && setFormData({ ...formData, color: c })} className={`w-10 h-10 rounded-xl ${c.blob} transition-all ${isReadOnly ? 'cursor-not-allowed opacity-50' : ''} ${formData.color.name === c.name ? 'ring-4 ring-black/5 scale-110 shadow-lg' : 'hover:scale-105'}`} disabled={isReadOnly} />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        )}
                                        <div className="pt-8 flex gap-6 sticky bottom-0 bg-white py-6 border-t border-gray-50 z-20">
                                            <button type="button" onClick={resetModal} className="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-colors">Terminate</button>
                                            {!(projType === 'preset' && modalStep === 2) && (
                                                <button 
                                                    type="submit" 
                                                    disabled={!formData.title} 
                                                    className="flex-[3] py-5 bg-black text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.4em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                                >
                                                    {formData.id ? (
                                                        <><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Sync Intelligence</>
                                                    ) : (
                                                        <><Zap className="w-4 h-4 text-emerald-500 animate-pulse" /> Initiate Deployment</>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #f3f4f6; border-radius: 20px; border: 4px solid white; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #e5e7eb; }
            `}</style>
        </div >
    );
}
