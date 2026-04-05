
"use client";

import { useState, useEffect, useRef } from "react";
import {
    BookOpen,
    Play,
    ArrowRight,
    ChevronLeft,
    Clock,
    User,
    Sparkles,
    Search,
    ChevronRight,
    ChevronDown,
    MoreHorizontal,
    LayoutGrid,
    Layers,
    FileText,
    Brain,
    Monitor,
    Database,
    Cpu,
    CheckCircle2,
    Diamond,
    Zap,
    GraduationCap,
    Lightbulb,
    Target,
    Blocks
} from "lucide-react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";

// Configuration for Categories/Semesters (Kalvium Style)
const SIDEBAR_CATEGORIES = [
    { id: 4, name: "Semester 4", status: "Current", icons: [<GraduationCap key="4-1" className="w-4 h-4" />, <Brain key="4-2" className="w-4 h-4" />, <Cpu key="4-3" className="w-4 h-4" />], colors: ["bg-gray-100 text-gray-500", "bg-gray-200/50 text-gray-600", "bg-gray-100 text-gray-900"] },
    { id: 3, name: "Semester 3", status: "Completed", icons: [<Monitor key="3-1" className="w-4 h-4" />, <Layers key="3-2" className="w-4 h-4" />, <Database key="3-3" className="w-4 h-4" />], colors: ["bg-gray-50 text-gray-400", "bg-gray-100/50 text-gray-500", "bg-gray-50 text-gray-900"] },
    { id: 2, name: "Semester 2", status: "Completed", icons: [<Lightbulb key="2-1" className="w-4 h-4" />, <Target key="2-2" className="w-4 h-4" />, <Cpu key="2-3" className="w-4 h-4" />], colors: ["bg-gray-50 text-gray-400", "bg-gray-100/50 text-gray-500", "bg-gray-50 text-gray-900"] },
    { id: 1, name: "Semester 1", status: "Completed", icons: [<FileText key="1-1" className="w-4 h-4" />, <LayoutGrid key="1-2" className="w-4 h-4" />, <Database key="1-3" className="w-4 h-4" />], colors: ["bg-gray-50 text-gray-400", "bg-gray-100/50 text-gray-500", "bg-gray-50 text-gray-900"] },
];

const CARD_ICONS = [Brain, Lightbulb, Monitor, Cpu, Database, Layers];

const formatBlockContent = (content, theme = 'transparent') => {
    if (!content) return null;
    
    let normalText = "text-gray-700";
    let boldText = "text-gray-900";
    
    if (theme === 'black') {
        normalText = "text-gray-300";
        boldText = "text-white";
    } else if (theme !== 'transparent' && theme !== 'white') {
        normalText = "opacity-80 text-inherit";
        boldText = "opacity-100 font-bold text-inherit";
    }

    if (/<[a-z][\s\S]*>/i.test(content)) {
        return <div dangerouslySetInnerHTML={{ __html: content }} className={`prose max-w-none ${normalText}`} />;
    }
    return (
        <div className="space-y-2">
            {content.split('\n').map((line, j) => {
                if (!line.trim()) return <div key={j} className="h-2" />;
                if (line.includes(':') && line.split(':')[0].split(' ').length <= 4) {
                    const parts = line.split(':');
                    const key = parts[0];
                    const rest = parts.slice(1).join(':');
                    if (rest.trim()) {
                        return (
                            <p key={j} className={`text-[15px] leading-relaxed ${normalText}`}>
                                <strong className={`font-bold ${boldText}`}>{key}:</strong>{rest}
                            </p>
                        );
                    } else {
                        return <h4 key={j} className={`text-[16px] font-black mt-4 tracking-tight uppercase ${boldText}`}>{line}</h4>;
                    }
                }
                if (line.trim().match(/^[-*•]\s+/)) {
                    return <li key={j} className={`ml-6 text-[15px] leading-relaxed list-disc ${normalText}`}>{line.replace(/^[-*•]\s+/, '')}</li>;
                }
                if (line.trim().match(/^\d+\.\s+/)) {
                    return <li key={j} className={`ml-6 text-[15px] leading-relaxed list-decimal ${normalText}`}>{line.replace(/^\d+\.\s+/, '')}</li>;
                }
                // Short lines without punctuation might be headers
                if (line.length > 2 && line.length < 40 && !line.includes('.') && !line.includes(',')) {
                    return <h4 key={j} className={`text-[16px] font-black mt-4 tracking-tight uppercase ${boldText}`}>{line}</h4>;
                }
                return <p key={j} className={`text-[15px] leading-relaxed ${normalText}`}>{line}</p>;
            })}
        </div>
    );
};

function LessonView({ selectedLesson, selectedCourse, topics, setView, formatBlockContent }) {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({ 
        container: containerRef,
        layoutEffect: false // Helps with hydration timing
    });
    
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    return (
        <motion.div
            key="lesson"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: 30 }}
            className="flex flex-col h-screen"
        >
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-3xl -mx-8 -mt-8 px-8 py-5 border-b border-gray-100 shadow-sm mb-8">
                <div className="max-w-5xl mx-auto px-8 w-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-8 bg-black rounded-full" />
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 ml-0.5">
                                <span className="cursor-pointer hover:text-black transition-colors" onClick={() => setView("library")}>Livebook</span>
                                {selectedCourse && (
                                    <>
                                        <ChevronRight className="w-3 h-3 opacity-20" />
                                        <span className="cursor-pointer hover:text-black transition-colors" onClick={() => setView("overview")} title={selectedCourse?.title}>
                                            {selectedCourse?.title.length > 20 ? selectedCourse.title.substring(0, 20) + "..." : selectedCourse?.title}
                                        </span>
                                    </>
                                )}
                                {selectedLesson && (
                                    <>
                                        <ChevronRight className="w-3 h-3 opacity-20" />
                                        <span className="text-black" title={selectedLesson?.title}>
                                            {selectedLesson?.title.length > 15 ? selectedLesson.title.substring(0, 15) + "..." : selectedLesson?.title}
                                        </span>
                                    </>
                                )}
                            </div>
                            <h1 className="text-2xl font-black text-black tracking-tighter uppercase leading-none mt-1">
                                {selectedLesson?.title}
                            </h1>
                        </div>
                    </div>
                </div>
                <motion.div 
                    className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 origin-left z-[60]"
                    style={{ scaleX }}
                />
            </header>

            <div ref={containerRef} className="flex-1 p-4 overflow-y-auto style-scrollbar scroll-smooth">
                <div className="max-w-5xl mx-auto px-4 mb-25 text-left">
                    <button onClick={() => setView("overview")} className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black hover:bg-gray-50 transition-all shadow-sm group mb-4">
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Return
                    </button>
                    <div className="relative z-10 space-y-16">
                        <div className="flex items-center gap-8 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center text-xl font-black tracking-tighter shadow-xl shadow-emerald-500/20 shrink-0">
                                {(() => {
                                    const moduleIdx = selectedCourse?.modules?.findIndex(m => m.title === selectedLesson?.module) ?? 0;
                                    const lessonIdx = topics.filter(t => t.course === selectedCourse?.title && t.module === selectedLesson?.module).findIndex(t => t._id === selectedLesson?._id) ?? 0;
                                    return `${moduleIdx + 1}.${lessonIdx + 1}`;
                                })()}
                            </div>
                            <h1 className="text-6xl font-black text-gray-900 tracking-tighter uppercase leading-[0.9]">{selectedLesson?.title}</h1>
                        </div>

                        <div className="flex flex-wrap gap-8 items-start w-full">
                            {selectedLesson?.blocks?.map((block, i) => {
                                const w = block.width || 100;
                                const flexBasis = w === 100 ? '100%' : `calc(${w}% - 1rem)`;
                                
                                return (
                                <div key={i} className="animate-fade-in group/block relative" style={{ flexBasis, maxWidth: flexBasis }}>
                                    {block.type === 'text' ? (
                                        <div className={`prose prose-xl max-w-none leading-relaxed transition-all ${
                                            block.theme === 'yellow' ? 'bg-[#fff9c4] text-[#827717] p-8 rounded-3xl border border-[#fff59d] shadow-sm' :
                                            block.theme === 'green' ? 'bg-[#e8f5e9] text-[#1b5e20] p-8 rounded-3xl border border-[#c8e6c9] shadow-sm' :
                                            block.theme === 'red' ? 'bg-[#ffebee] text-[#b71c1c] p-8 rounded-3xl border border-[#ffcdd2] shadow-sm' :
                                            block.theme === 'blue' ? 'bg-[#e3f2fd] text-[#0d47a1] p-8 rounded-3xl border border-[#bbdefb] shadow-sm' :
                                            block.theme === 'black' ? 'bg-gray-900 text-white p-8 rounded-3xl shadow-xl border border-black' :
                                            block.theme === 'white' ? 'bg-white text-gray-900 p-8 rounded-3xl shadow-xl border border-gray-100' :
                                            'bg-transparent text-gray-700 p-0'
                                        }`}>
                                            {formatBlockContent(block.content, block.theme)}
                                        </div>
                                    ) : block.type === 'image' && block.content ? (
                                        <div className="rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-xl transition-all hover:shadow-2xl">
                                            <img src={block.content} className="w-full" alt="Content schematic" />
                                        </div>
                                    ) : block.type === 'youtube' && block.content ? (
                                        <div className="aspect-video w-full rounded-[2.5rem] overflow-hidden bg-black shadow-xl ring-1 ring-gray-100">
                                            <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${block.content.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/)?.[2]}`} frameBorder="0" allowFullScreen title="Technical Briefing" />
                                        </div>
                                    ) : block.type === 'gap' ? (
                                        <div style={{ height: '1cm' }} />
                                    ) : block.type === 'link' ? (() => {
                                        const parts = (block.content || "").split('|');
                                        const label = parts[0] || "Reference Link";
                                        const url = parts[1] || parts[0];
                                        return (
                                            <a href={url} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-6 bg-slate-50 border border-gray-100 rounded-[2rem] px-8 py-6 hover:bg-black hover:text-white transition-all group shadow-sm">
                                                <div className="w-12 h-12 bg-white group-hover:bg-gray-800 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-colors">
                                                    <Sparkles className="w-6 h-6 text-black group-hover:text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-lg font-black tracking-tight truncate">{label}</p>
                                                    <p className="text-xs opacity-50 font-medium truncate mt-1">{url}</p>
                                                </div>
                                                <ArrowRight className="w-5 h-5 opacity-20 group-hover:opacity-100 transition-opacity" />
                                            </a>
                                        );
                                    })() : null}
                                </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default function LiveBookDashboard() {
    const [view, setView] = useState("library"); // library, overview, lesson
    const [selectedCategory, setSelectedCategory] = useState(4);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [expandedModule, setExpandedModule] = useState(null);

    const [courses, setCourses] = useState([]);
    const [topics, setTopics] = useState([]);
    const [userTrack, setUserTrack] = useState("");

    useEffect(() => {
        const fetchContent = async () => {
            const email = localStorage.getItem("userEmail");
            let uTrack = "";
            try {
                if (email) {
                    const userRes = await fetch(`/api/user/me?email=${email}`);
                    if (userRes.ok) {
                        const userData = await userRes.json();
                        uTrack = userData.track || "";
                        setUserTrack(uTrack);
                    }
                }
            } catch (e) {
                console.error(e);
            }

            try {
                const [cRes, tRes] = await Promise.all([
                    fetch('/api/admin/content/courses'),
                    fetch('/api/admin/content/topics')
                ]);
                if (cRes.ok) {
                    const allCourses = await cRes.json();

                    const filteredCourses = allCourses.filter(c => {
                        if (c.status !== 'Published') return false;
                        if (!c.tracks || c.tracks.length === 0) return true;
                        return c.tracks.some(adminT => adminT?.toLowerCase().includes(uTrack?.toLowerCase()));
                    });

                    setCourses(filteredCourses);
                }
                if (tRes.ok) setTopics((await tRes.json()).filter(t => t.status === "Published"));
            } catch (err) {
                console.error("Fetch content error:", err);
            }
        };
        fetchContent();
    }, []);

    return (
        <div className="relative min-h-screen selection:bg-black selection:text-white">
            <div className="relative z-10 flex flex-col min-h-screen">
                <AnimatePresence mode="wait">
                    {view === "library" && (
                        <motion.div
                            key="library"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="flex flex-col h-screen"
                        >
                            {/* Standardized Sticky Header */}
                            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-3xl -mx-8 -mt-8 px-8 py-5 border-b border-gray-100 shadow-sm mb-8">
                                <div className="flex items-center justify-between gap-6 w-full">
                                    <div className="flex items-center gap-6">
                                        <div className="w-1.5 h-8 bg-black rounded-full" />
                                        <div className="flex flex-col">
                                            <h1 className="text-2xl font-black text-black tracking-tighter uppercase leading-none">
                                                Livebooks
                                            </h1>
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mt-2 ml-1">
                                                <span className="text-black uppercase">Livebook</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative w-80 group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-black transition-colors" />
                                        <input 
                                            placeholder="SEARCH LIVEBOOKS..."
                                            className="w-full bg-gray-50 border-0 rounded-xl pl-10 pr-4 py-3 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-8 focus:ring-black/5 transition-all text-gray-900 placeholder:text-gray-300"
                                        />
                                    </div>
                                </div>
                            </header>

                            <div className="px-4 pb-20">
                                {/* Simple Course Grid */}
                                <main className="w-full">
                                    <div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                            {courses.map((course, idx) => {
                                                const Icon = CARD_ICONS[idx % CARD_ICONS.length];
                                                const moduleCount = course.modules?.length || 0;
                                                const topicCount = topics.filter(t => t.course === course.title).length;
                                                const unitCount = topics.filter(t => t.course === course.title).reduce((acc, b) => acc + (b.blocks?.length || 0), 0);
                                                
                                                return (
                                                    <div
                                                        key={course._id}
                                                        onClick={() => { setSelectedCourse(course); setView("overview"); }}
                                                        className="bg-white border border-gray-100 rounded-[1.5rem] p-8 shadow-sm hover:shadow-xl hover:shadow-black/5 hover:border-gray-300 transition-all duration-500 cursor-pointer group relative flex flex-col justify-between h-[360px]"
                                                    >
                                                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity">
                                                            {(() => {
                                                                    const Icon = {
                                                                        'Brain': Brain,
                                                                        'Monitor': Monitor,
                                                                        'Database': Database,
                                                                        'Blocks': Blocks,
                                                                        'Zap': Zap,
                                                                        'Layers': Layers,
                                                                        'Cpu': Cpu,
                                                                        'Sparkles': Sparkles,
                                                                        'BookOpen': BookOpen
                                                                    }[course.icon] || BookOpen;
                                                                    return <Icon className="w-32 h-32" />;
                                                                })()}
                                                        </div>
                                                        <div className="space-y-6">
                                                            <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm transition-all group-hover:scale-110 group-hover:border-black group-hover:bg-white">
                                                                {(() => {
                                                                    const Icon = {
                                                                        'Brain': Brain,
                                                                        'Monitor': Monitor,
                                                                        'Database': Database,
                                                                        'Blocks': Blocks,
                                                                        'Zap': Zap,
                                                                        'Layers': Layers,
                                                                        'Cpu': Cpu,
                                                                        'Sparkles': Sparkles,
                                                                        'BookOpen': BookOpen
                                                                    }[course.icon] || BookOpen;
                                                                    return <Icon className="w-7 h-7 text-black" />;
                                                                })()}
                                                            </div>
                                                            <div className="space-y-3">
                                                                <h3 className="text-lg md:text-xl font-bold text-gray-900 leading-tight tracking-tight group-hover:text-black">{course.title}</h3>
                                                                <p className="text-sm text-gray-400 font-medium leading-relaxed line-clamp-3">
                                                                    {course.desc || 'Comprehensive knowledge base covering high-impact concepts and practical industry implementations.'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col gap-4">
                                                            <div className="flex items-center gap-6 pt-6 opacity-60">
                                                                <div className="flex items-center gap-2">
                                                                    <Diamond className="w-3.5 h-3.5 text-gray-400" />
                                                                    <span className="text-[12px] font-bold text-gray-500">{unitCount}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Layers className="w-3.5 h-3.5 text-gray-400" />
                                                                    <span className="text-[12px] font-bold text-gray-500">{moduleCount}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                                                                    <span className="text-[12px] font-bold text-gray-500">{topicCount}</span>
                                                                </div>
                                                                <div className="ml-auto flex items-center gap-2">
                                                                    <div className="w-3 h-3 rounded-full bg-white border-2 border-black" />
                                                                    <span className="text-[12px] font-black text-gray-900">0%</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </main>
                            </div>
                        </motion.div>
                    )}

                    {view === "overview" && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col"
                        >
                            {/* Standardized Sticky Header (Overview) */}
                            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-3xl -mx-8 -mt-8 px-8 py-5 border-b border-gray-100 shadow-sm mb-8">
                                <div className="flex items-center justify-between gap-6 w-full px-4">
                                    <div className="flex items-center gap-6">
                                        <button onClick={() => setView("library")} className="p-3 bg-white border border-gray-100 rounded-xl hover:bg-black hover:text-white transition-all shadow-sm">
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <div className="flex items-center gap-4">
                                            <div className="w-[1.5px] h-8 bg-black rounded-full" />
                                            <div className="flex flex-col">
                                                <h1 className="text-2xl font-black text-black tracking-tighter uppercase leading-none">{selectedCourse?.title}</h1>
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mt-2 ml-1">
                                                    <span className="cursor-pointer hover:text-black transition-colors" onClick={() => setView("library")}>Livebook</span>
                                                    <ChevronRight className="w-3 h-3 opacity-20" />
                                                    <span className="text-black">{selectedCourse?.title}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </header>

                            <div className="flex-1 p-12 flex flex-col items-center overflow-y-auto">
                                <div className="w-full max-w-4xl space-y-8">
                                    {selectedCourse?.modules?.map((mod, idx) => (
                                        <div key={mod.id || idx} className="bg-white/80 backdrop-blur-2xl border border-gray-100 shadow-xl shadow-gray-200/30 rounded-[2.5rem] p-10 group overflow-hidden relative">
                                             <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-all pointer-events-none transform -rotate-12 translate-x-10 -translate-y-10">
                                                <Layers className="w-64 h-64" />
                                            </div>

                                            <div className="flex gap-8 items-start relative z-10 w-full mb-8">
                                                <div className="w-20 h-20 bg-gray-900 border border-black rounded-[1.5rem] flex flex-col items-center justify-center shadow-2xl shrink-0">
                                                    <span className="text-[7px] font-black uppercase tracking-[0.2em] text-gray-400 mb-0.5">Module</span>
                                                    <span className="text-3xl font-black text-white leading-none">{idx + 1}</span>
                                                </div>
                                                <div className="flex-1 space-y-3 pt-3">
                                                    <div
                                                        onClick={() => setExpandedModule(expandedModule === (mod.id || mod.title) ? null : (mod.id || mod.title))}
                                                        className="flex items-center justify-between cursor-pointer group/header"
                                                    >
                                                        <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight group-hover:text-black">{mod.title}</h3>
                                                        <div className={`p-3 rounded-2xl transition-all shadow-sm border ${expandedModule === (mod.id || mod.title) ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-100'}`}>
                                                            <ChevronDown className={`w-5 h-5 transition-transform duration-500 ${expandedModule === (mod.id || mod.title) ? 'rotate-180' : ''}`} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <AnimatePresence>
                                                {expandedModule === (mod.id || mod.title) && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="space-y-4 pt-10 border-t border-gray-50 h-full overflow-hidden"
                                                    >
                                                        {topics.filter(t => t.course === selectedCourse.title && t.module === mod.title).map((lesson, lIdx) => (
                                                            <div
                                                                key={lesson._id}
                                                                onClick={() => { setSelectedLesson(lesson); setView("lesson"); }}
                                                                className="flex gap-8 items-start group cursor-pointer relative p-6 bg-transparent hover:bg-slate-50 border border-transparent hover:border-gray-100 rounded-[2rem] transition-all"
                                                            >
                                                                <div className="w-12 h-12 bg-white border border-gray-100 group-hover:bg-black group-hover:border-black group-hover:text-white text-gray-400 rounded-2xl flex items-center justify-center text-sm font-black transition-all shadow-sm shrink-0">
                                                                    {idx + 1}.{lIdx + 1}
                                                                </div>
                                                                <div className="flex-1 pt-1.5">
                                                                    <h4 className="text-base font-black text-gray-700 group-hover:text-black uppercase tracking-tight mb-2">{lesson.title}</h4>
                                                                    <p className="text-xs text-gray-400 font-medium line-clamp-2">Exploring core architectural nodes and essential protocol dynamics.</p>
                                                                </div>
                                                                <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                                                                    <ArrowRight className="w-4 h-4 text-black" />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {view === "lesson" && (
                        <LessonView 
                            selectedLesson={selectedLesson}
                            selectedCourse={selectedCourse}
                            topics={topics}
                            setView={setView}
                            formatBlockContent={formatBlockContent}
                        />
                    )}
                </AnimatePresence>
            </div>

            <style jsx global>{`
                .style-scrollbar::-webkit-scrollbar { width: 4px; }
                .style-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .style-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}

