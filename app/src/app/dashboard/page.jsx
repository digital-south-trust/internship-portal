"use client";

import { useState, useEffect } from "react";
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    Award,
    ArrowRight,
    Briefcase,
    Calendar,
    CheckCircle2,
    CheckSquare,
    ChevronRight,
    Clock,
    Code,
    Cpu,
    ExternalLink,
    FileText,
    Flag,
    FolderGit2,
    Github,
    History,
    Layout,
    LifeBuoy,
    MapPin,
    MessageSquare,
    MonitorSmartphone,
    Rocket,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    TicketIcon,
    Timer,
    Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const TRACK_RESOURCES = {
    // ── Coding Tracks ──────────────────────────────────────────────────────
    "Web Development": {
        overview: "Build full-stack real-world applications. You will learn frontend UI development, backend logic, APIs, secure authentication, database management, and cloud deployment pipelines.",
        skills: ["React / Next.js", "Node.js / APIs", "Tailwind CSS", "Databases", "Authentication"],
        career: "Prepares you for roles like Full-Stack Developer, Frontend Engineer, and Systems Architect.",
    },
    "Blockchain / Web3": {
        overview: "Step into the decentralised future. Learn smart contract development, dApp integration, blockchain fundamentals, and wallet interactions on Ethereum and beyond.",
        skills: ["Solidity", "Ethers.js / Web3.js", "Smart Contracts", "Hardhat", "IPFS"],
        career: "Prepares you for roles like Blockchain Developer, Web3 Engineer, and Smart Contract Auditor.",
    },
    "GenAI": {
        overview: "Master large language models, retrieval-augmented generation apps, and prompt engineering. Build production-grade AI pipelines integrating LLMs, vector databases, and agents.",
        skills: ["LangChain", "OpenAI API", "HuggingFace", "Vector DBs", "Prompt Engineering"],
        career: "Prepares you for roles like AI Engineer, ML Consultant, and Solutions Architect.",
    },
    "AI/ML": {
        overview: "Dive deep into statistical learning, neural networks, predictive modelling, and model training methodologies. Take models from research to production.",
        skills: ["Python", "TensorFlow / PyTorch", "Scikit-Learn", "Pandas", "Model Deployment"],
        career: "Prepares you for roles like Machine Learning Engineer and Data Scientist.",
    },
    "App Development": {
        overview: "Create robust, cross-platform mobile applications. Explore mobile architectures, responsive layouts, device integrations, and App Store readiness.",
        skills: ["Flutter / React Native", "State Management", "REST APIs", "Firebase", "UI Animation"],
        career: "Prepares you for roles like Mobile Developer, iOS/Android Engineer.",
    },

    // ── Research Tracks ────────────────────────────────────────────────────
    "Robotics & Autonomous System Track": {
        overview: "Design and build autonomous systems — from sensor fusion and path planning to real-time control systems. Bridge software intelligence with physical hardware.",
        skills: ["ROS / ROS2", "Computer Vision", "Sensor Fusion", "Path Planning", "Embedded C++"],
        career: "Prepares you for roles like Robotics Engineer, Autonomous Systems Developer, and Control Systems Researcher.",
    },
    "Cybersecurity": {
        overview: "Explore ethical hacking, threat modelling, secure system design, and vulnerability research. Learn to defend systems against modern adversarial attacks.",
        skills: ["Penetration Testing", "Network Security", "Cryptography", "OSINT", "Forensics"],
        career: "Prepares you for roles like Security Analyst, Penetration Tester, and SOC Engineer.",
    },
    "Semiconductor": {
        overview: "Investigate semiconductor physics, chip architecture, fabrication processes, and VLSI design. Work at the intersection of physics and digital electronics.",
        skills: ["VLSI Design", "VHDL / Verilog", "Spice Simulation", "Semiconductor Physics", "EDA Tools"],
        career: "Prepares you for roles like IC Design Engineer, Chip Architect, and Fab Process Engineer.",
    },
    "Biotechnology": {
        overview: "Apply computational and engineering principles to biological systems — from genomics and protein modelling to lab-on-chip devices and synthetic biology.",
        skills: ["Bioinformatics", "CRISPR Concepts", "Protein Modelling", "Lab Techniques", "Python (BioPython)"],
        career: "Prepares you for roles like Bioinformatics Analyst, Research Scientist, and Biotech Engineer.",
    },
    "Renewable Energy": {
        overview: "Research sustainable energy technologies — solar, wind, battery storage, and smart grid architectures. Contribute to the clean energy transition through applied engineering.",
        skills: ["Energy Systems Modelling", "MATLAB / Simulink", "Power Electronics", "Grid Analysis", "Solar/Wind Tech"],
        career: "Prepares you for roles like Energy Systems Engineer, Sustainability Consultant, and Power Electronics Designer.",
    },
    "Artificial Intelligence": {
        overview: "Conduct foundational AI research spanning reinforcement learning, knowledge representation, multi-agent systems, and AI safety. Push the boundaries of general intelligence research.",
        skills: ["Deep Learning", "Reinforcement Learning", "Knowledge Graphs", "Research Methods", "Python / JAX"],
        career: "Prepares you for roles like AI Research Scientist, ML Researcher, and Research Engineer.",
    },
    "Quantum Computing": {
        overview: "Explore quantum algorithms, quantum circuits, and error correction. Implement and simulate quantum programs using platforms like Qiskit and understand the path to quantum advantage.",
        skills: ["Qiskit / Cirq", "Quantum Gates", "Quantum Algorithms", "Linear Algebra", "Error Correction"],
        career: "Prepares you for roles like Quantum Engineer, Quantum Algorithm Researcher, and Quantum Software Developer.",
    },

    // ── Generic fallbacks ──────────────────────────────────────────────────
    "__RESEARCH__": {
        overview: "Conduct in-depth research, develop prototypes, and produce technical documentation in your specialist field. Drive innovation through rigorous scientific methodology.",
        skills: ["Research Methods", "Prototyping", "Scientific Analysis", "Technical Writing", "Literature Review"],
        career: "Prepares you for roles like R&D Engineer, Research Scientist, and Domain Specialist.",
    },
    "__CODING__": {
        overview: "Apply software engineering principles to build, test, and deploy real-world technical projects. Grow your skills across the full development lifecycle.",
        skills: ["Software Engineering", "Version Control", "Testing", "APIs", "Deployment"],
        career: "Prepares you for various engineering roles in the tech industry.",
    },
};

// Research track names (used to detect category when user.category is unavailable)
const RESEARCH_TRACKS = ["Robotics & Autonomous System Track", "Cybersecurity", "Semiconductor", "Biotechnology", "Renewable Energy", "Artificial Intelligence", "Quantum Computing"];


import { Skeleton } from "@/components/ui/skeleton";

function DashboardSkeleton() {
    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-5 -mx-8 px-8">
                <div className="flex items-center gap-4">
                    <Skeleton className="w-1.5 h-8 bg-gray-100 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                    </div>
                </div>
                <Skeleton className="h-10 w-32 rounded-full" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-32 rounded-3xl" />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Skeleton className="lg:col-span-2 h-96 rounded-3xl" />
                <Skeleton className="h-96 rounded-3xl" />
            </div>
        </div>
    );
}

import Script from "next/script";

export default function StudentDashboard() {
    const [user, setUser] = useState(null);
    const [projects, setProjects] = useState([]);
    const [poolProjects, setPoolProjects] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    const [nextSync, setNextSync] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const email = typeof window !== 'undefined' ? localStorage.getItem("userEmail") : null;
            if (!email) return;

            try {
                const [userRes, projectsRes, ticketsRes, scheduleRes] = await Promise.all([
                    fetch(`/api/user/me?email=${email}`),
                    fetch(`/api/projects?email=${email}`),
                    fetch(`/api/tickets`),
                    fetch(`/api/schedule?role=intern&email=${email}`)
                ]);

                if (userRes.ok) {
                    const userData = await userRes.json();
                    setUser(userData);

                    try {
                        const poolRes = await fetch(`/api/admin/projects/pool?track=${encodeURIComponent(userData.track || 'Web Development')}`);
                        if (poolRes.ok) {
                            const pData = await poolRes.json();
                            setPoolProjects(pData);
                        }
                    } catch (e) { console.error(e); }
                }
                if (projectsRes.ok) {
                    const projData = await projectsRes.json();
                    setProjects(projData);
                }
                if (ticketsRes.ok) {
                    const ticketsData = await ticketsRes.json();
                    if (Array.isArray(ticketsData)) {
                        setTickets(ticketsData.filter(t => t.reportedBy === email));
                    }
                }
                if (scheduleRes.ok) {
                    const scheduleData = await scheduleRes.json();
                    if (Array.isArray(scheduleData)) {
                        const now = new Date();
                        const upcoming = scheduleData
                            .map(s => ({ ...s, dateObj: new Date(s.date) }))
                            .filter(s => s.dateObj >= new Date(now.setHours(0, 0, 0, 0)))
                            .sort((a, b) => a.dateObj - b.dateObj);

                        if (upcoming.length > 0) {
                            setNextSync(upcoming[0]);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, []);

    if (loading) return <DashboardSkeleton />;

    if (!user) return null;

    const hasProjects = projects && projects.length > 0;
    const trackName = user.track || "Web Development";
    const trackData = TRACK_RESOURCES[trackName]
        || (RESEARCH_TRACKS.includes(trackName) || user.category === 'RESEARCH'
            ? TRACK_RESOURCES["__RESEARCH__"]
            : TRACK_RESOURCES["__CODING__"]);
    const mainProject = projects ? projects[0] : null;
    const missedReviews = user.missedMeetings || 0;

    // ---- STATE 2 VARIABLES (PRE-CALCULATED) ----
    let avatarSeed = "Mentor" + user.fullName;
    let assistantMessage = "You're making steady progress. Make sure your live link is working!";
    let nextAction = "Submit your next 10% progress update.";
    let healthColor = "blue";
    let healthText = "On Track";
    let healthSubtext = "No blockers reported";

    if (mainProject) {
        if (mainProject.progress === 0 || !mainProject.progress) {
            assistantMessage = "You haven't started making progress yet. Let's get your repo set up.";
            nextAction = "Initialize repository and push first commit.";
            healthColor = "gray";
            healthText = "Inactive";
            healthSubtext = "Awaiting first update";
        } else if (missedReviews >= 2) {
            avatarSeed = "Concerned" + user.fullName;
            assistantMessage = "You've missed 2 review meetings. Your progress may be adjusted by admin.";
            nextAction = "Contact your mentor immediately to schedule a makeup sync.";
            healthColor = "red";
            healthText = "At Risk";
            healthSubtext = "Action required";
        } else if (mainProject.progress >= 100) {
            avatarSeed = "Winner" + user.fullName;
            assistantMessage = "Great job! Your project is complete and ready for final verification.";
            nextAction = "Request final admin approval for certification.";
            healthColor = "emerald";
            healthText = "Completed";
            healthSubtext = "Awaiting sign-off";
        } else if (mainProject.status === 'Rejected') {
            avatarSeed = "Thinking" + user.fullName;
            assistantMessage = "Your last submission was rejected. Please review admin feedback.";
            nextAction = "Review feedback and apply necessary changes.";
            healthColor = "red";
            healthText = "Action Needed";
            healthSubtext = "Submission rejected";
        }
    }

    // Support ticket stats
    const openTickets = tickets.filter(t => t.status === 'Open').length;
    const resolvedTickets = tickets.filter(t => t.status === 'Resolved').length;

    return (
        <div className="space-y-8 pb-20">

            {!user.isAssessmentDone ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-black text-white rounded-[2.5rem] p-12 shadow-2xl relative overflow-hidden flex flex-col items-center text-center space-y-8"
                >
                    <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
                    
                    <div className="relative z-10 max-w-2xl space-y-6">
                        <h2 className="text-5xl font-extrabold leading-tight">Ready to Begin Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Journey?</span></h2>
                        
                        <p className="text-xl text-gray-400 font-medium">
                            To unlock your personal dashboard and project statement, you need to complete a short eligibility assessment for the <span className="text-white font-bold">{user.track}</span> track.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 pb-4">
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                                <Clock className="w-8 h-8 text-blue-400 mb-3 mx-auto" />
                                <h4 className="text-sm font-bold">20 Minutes</h4>
                                <p className="text-xs text-gray-500">Timed Assessment</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                                <FileText className="w-8 h-8 text-purple-400 mb-3 mx-auto" />
                                <h4 className="text-sm font-bold">Concept-Based</h4>
                                <p className="text-xs text-gray-500">Multiple Choice</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                                <ShieldAlert className="w-8 h-8 text-red-400 mb-3 mx-auto" />
                                <h4 className="text-sm font-bold">Proctored</h4>
                                <p className="text-xs text-gray-500">Security Enabled</p>
                            </div>
                        </div>

                        <Link 
                            href="/assessment" 
                            className="inline-flex items-center gap-3 bg-white text-black px-12 py-5 rounded-2xl font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] group"
                        >
                            Start Assessment <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </motion.div>
            ) : (
            <AnimatePresence mode="wait">
                {!hasProjects ? (
                    <motion.div
                        key="onboarding"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                    >
                        {/* TOP ROW: Welcome & Mentor Avatar */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Welcome Header */}
                            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                <div className="relative z-10 space-y-4">
                                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                                        Hi {user.fullName?.split(' ')[0]} 👋
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold border border-blue-100">
                                            <Sparkles className="w-4 h-4" /> {trackName} Track
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium border border-gray-200">
                                            <Clock className="w-4 h-4" /> {user.duration || "N/A"} Duration
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium border border-gray-200">
                                            <MapPin className="w-4 h-4" /> {user.mode || "Remote"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Mentor Cartoon Avatar Card */}
                            <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-5 relative overflow-hidden group">
                                <div className="w-24 h-24 shrink-0 bg-gray-50/80 rounded-full border border-gray-200 overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <img src={`https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(avatarSeed)}&backgroundColor=transparent`} className="w-full h-full object-cover mt-2 scale-110" alt="Mentor" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-base font-semibold text-gray-900 mb-1">Getting Started</h3>
                                    <p className="text-sm text-gray-500 leading-snug mb-3">
                                        "Start by exploring your track projects below. Pick a problem statement!"
                                    </p>
                                    <Link href="/dashboard/projects" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors shadow-sm">
                                        Explore Projects <ChevronRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* MIDDLE ROW: Content & Rules */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <MonitorSmartphone className="w-5 h-5 text-gray-400" /> About Your Track
                                    </h2>
                                    <p className="text-base text-gray-600 leading-relaxed mb-6">
                                        {trackData.overview}
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-widest mb-3">Skills Acquired</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {trackData.skills.map((skill, idx) => (
                                                    <span key={idx} className="px-3 py-1 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-xs font-medium">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-widest mb-3">Career Relevance</h4>
                                            <p className="text-sm text-gray-600">{trackData.career}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Briefcase className="w-5 h-5 text-gray-400" /> Recommended Projects
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {poolProjects.slice(0, 4).map((stmt, idx) => (
                                            <div key={idx} className="p-5 border border-gray-100 rounded-xl bg-gray-50 flex flex-col justify-between">
                                                <div>
                                                    <h3 className="text-base font-semibold text-gray-900 mb-2">{stmt.title}</h3>
                                                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{stmt.description}</p>
                                                </div>
                                                <Link href={`/dashboard/projects?viewId=${stmt._id || stmt.id}`} className="text-xs font-bold text-black border-b border-black w-fit">View Details</Link>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-1 space-y-8">
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-5 flex items-center gap-2">
                                        <Flag className="w-5 h-5 text-emerald-500" /> Objectives
                                    </h2>
                                    <ul className="space-y-4">
                                        {["Build one working project", "Submit repo / design / deployment", "Attend weekly reviews", "Complete milestones", "Stay active"].map((obj, i) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <CheckCircle2 className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
                                                <span className="text-sm text-gray-700 font-medium">{obj}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="active"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                    >
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                            Hello {user.fullName?.split(' ')[0]} 👋
                        </h1>
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                            {/* Project Main Card */}
                            <div className="lg:col-span-3 bg-white rounded-[2rem] p-10 shadow-sm border border-gray-100 flex flex-col justify-between min-h-[350px] relative overflow-hidden">
                                <div className="relative z-10 w-full">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-4">
                                            <h2 className="text-4xl font-bold text-gray-900 tracking-tight">{mainProject.projectName}</h2>
                                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-black uppercase tracking-widest border border-emerald-100">
                                                {mainProject.status}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-lg text-gray-500 font-medium mb-12">{mainProject.description}</p>

                                    <div className="flex justify-between items-end mb-4">
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-gray-900">Milestone Progress</p>
                                            <p className="text-xs text-gray-400 font-medium">Target completion: {mainProject.targetDate || "Pending"}</p>
                                        </div>
                                        <div className="text-5xl font-black text-gray-900 tracking-tighter">{mainProject.progress || 0}%</div>
                                    </div>

                                    <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-50 shadow-inner">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${mainProject.progress || 0}%` }}
                                            transition={{ duration: 1.5, ease: "anticipate" }}
                                            className="h-full bg-blue-600 rounded-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Mentor Motivation Card */}
                            <div className="lg:col-span-2 bg-white rounded-[2rem] p-10 shadow-sm border border-gray-100 flex items-center justify-center relative overflow-hidden">
                                <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                                    <div className="w-40 h-40 bg-indigo-50/50 rounded-full flex items-center justify-center border border-indigo-100/50 shadow-lg overflow-hidden">
                                        <img
                                            src={`https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(avatarSeed)}&backgroundColor=transparent`}
                                            className="w-full h-full object-cover mt-4 scale-110"
                                            alt="Mentor"
                                        />
                                    </div>
                                    <p className="text-xl text-gray-600 font-medium leading-relaxed max-w-[280px]">
                                        "{assistantMessage}"
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Row: Links, Tech, Sync */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Project Links */}
                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                                <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                                    <ExternalLink className="w-4 h-4" /> Project Links
                                </h3>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                                            <Github className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Repository</p>
                                            {mainProject.repoLink ? (
                                                <a href={mainProject.repoLink} target="_blank" className="text-sm font-bold text-blue-600 hover:underline">View Code</a>
                                            ) : (
                                                <span className="text-sm font-bold text-gray-300 italic">Not Linked</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                                            <Rocket className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Live App</p>
                                            {mainProject.deployLink ? (
                                                <a href={mainProject.deployLink} target="_blank" className="text-sm font-bold text-rose-600 hover:underline">View Live</a>
                                            ) : (
                                                <Link href="/dashboard/projects" className="text-sm font-bold text-rose-600 hover:underline">Add link</Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tech Stack */}
                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                                <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                                    <Cpu className="w-4 h-4" /> Tech Stack
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {mainProject.techStack?.length > 0 ? (
                                        mainProject.techStack.map(tech => (
                                            <span key={tech} className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700">
                                                {tech}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-sm font-medium text-gray-400 italic">No stack defined yet</span>
                                    )}
                                </div>
                            </div>

                            {/* Reviews / Next Sync */}
                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 relative group cursor-pointer" onClick={() => window.location.href = '/dashboard/schedule'}>
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4" /> Reviews
                                    </h3>
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:translate-x-1 transition-transform" />
                                </div>

                                <div className="flex flex-col items-center justify-center py-4 text-center">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Next Sync</p>
                                    {nextSync ? (
                                        <>
                                            <p className="text-xl font-bold text-gray-900 mb-1">{nextSync.description || 'Admin Sync'}</p>
                                            <p className="text-sm font-medium text-blue-600">
                                                {new Date(nextSync.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {nextSync.time}
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-xl font-bold text-gray-900 mb-1">No Upcoming Sync</p>
                                            <p className="text-sm font-medium text-gray-400">Schedule will appear here</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            )}
        </div>
    );
}

// Helpers
