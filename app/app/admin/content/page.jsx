
"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Youtube,
    FileText, Globe,
    Eye,
    CheckCircle2,
    Trash2,
    ExternalLink,
    Play,
    BookOpen,
    Save,
    Send,
    ChevronRight,
    Search,
    Brain,
    Monitor,
    Database,
    Cpu,
    Sparkles,
    Clock,
    User,
    ChevronLeft,
    Layers,
    Link as LinkIcon2,
    Minus,
    Image as ImageIcon,
    Zap,
    Blocks,
    ArrowUp,
    ArrowDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { createPortal } from "react-dom";

export default function AdminLiveBookPage() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: '', id: null, title: '', message: '' });
    const [view, setView] = useState("library"); // library, course, module, editor
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedModule, setSelectedModule] = useState(null);
    const [topics, setTopics] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
    const [isAddModuleModalOpen, setIsAddModuleModalOpen] = useState(false);
    const [newCourseData, setNewCourseData] = useState({ id: "", title: "", desc: "", tracks: [], icon: "BookOpen" });
    const [newModuleData, setNewModuleData] = useState({ id: "", title: "", desc: "" });
    const [editingCourseId, setEditingCourseId] = useState(null);
    const [editingModuleId, setEditingModuleId] = useState(null);
    const [courses, setCourses] = useState([]);
    const [availableTracks, setAvailableTracks] = useState({ CODING: [], RESEARCH: [] });
    const [sortBy, setSortBy] = useState("name"); // name, track
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const [cRes, tRes, trRes] = await Promise.all([
                    fetch('/api/admin/content/courses'),
                    fetch('/api/admin/content/topics'),
                    fetch('/api/admin/tracks')
                ]);
                if (cRes.ok) setCourses(await cRes.json());
                if (tRes.ok) setTopics(await tRes.json());
                if (trRes.ok) {
                    const data = await trRes.json();
                    setAvailableTracks({
                        CODING: data.CODING?.map(t => t.name) || [],
                        RESEARCH: data.RESEARCH?.map(t => t.name) || []
                    });
                }
            } catch (err) {
                console.error("Fetch content error:", err);
            }
        };
        fetchContent();
    }, []);

    const [activeTopic, setActiveTopic] = useState({
        id: null,
        topicId: "",
        title: "",
        status: "Draft",
        course: "",
        module: "",
        blocks: [{ type: "text", content: "", width: 100, theme: "transparent" }]
    });

    const [editorLayout, setEditorLayout] = useState("side-by-side"); // editing, side-by-side
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [projectionSize, setProjectionSize] = useState("phone"); // phone or laptop

    const [isRehydrated, setIsRehydrated] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('intern_admin_livebook_state');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.view) setView(parsed.view);
                if (parsed.selectedCourse) setSelectedCourse(parsed.selectedCourse);
                if (parsed.selectedModule) setSelectedModule(parsed.selectedModule);
                if (parsed.activeTopic) {
                    // Migrate old layout field to new width field
                    const migratedTopic = {
                        ...parsed.activeTopic,
                        blocks: (parsed.activeTopic.blocks || []).map(b => ({
                            ...b,
                            width: b.width || (b.layout === 'half' ? 50 : 100),
                            theme: b.theme || 'transparent'
                        }))
                    };
                    setActiveTopic(migratedTopic);
                }
                if (parsed.editorLayout) setEditorLayout(parsed.editorLayout);
                if (parsed.projectionSize) setProjectionSize(parsed.projectionSize);
            } catch (e) {
                console.error("Failed to parse cached livebook state", e);
            }
        }
        setIsRehydrated(true);
    }, []);

    useEffect(() => {
        if (isRehydrated) {
            localStorage.setItem('intern_admin_livebook_state', JSON.stringify({
                view, selectedCourse, selectedModule, activeTopic, editorLayout, projectionSize
            }));
        }
    }, [view, selectedCourse, selectedModule, activeTopic, editorLayout, projectionSize, isRehydrated]);

    useEffect(() => {
        if (showPreviewModal || isAddCourseModalOpen || isAddModuleModalOpen) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => document.body.classList.remove('modal-open');
    }, [showPreviewModal, isAddCourseModalOpen, isAddModuleModalOpen]);

    const addBlock = (type) => {
        const defaultContent = type === 'link' ? JSON.stringify({ label: '', url: '' }) : '';
        setActiveTopic(prev => ({
            ...prev,
            blocks: [...prev.blocks, { type, content: defaultContent, width: 100, theme: "transparent" }]
        }));
    };

    // Helper: update a sub-field of a JSON block (for link)
    const updateLinkField = (index, field, value) => {
        const newBlocks = [...activeTopic.blocks];
        const parsed = (() => { try { return JSON.parse(newBlocks[index].content); } catch { return { label: '', url: '' }; } })();
        parsed[field] = value;
        newBlocks[index].content = JSON.stringify(parsed);
        setActiveTopic(prev => ({ ...prev, blocks: newBlocks }));
    };

    const parseLinkBlock = (content) => {
        try { return JSON.parse(content); } catch { return { label: content, url: '' }; }
    };

    const updateBlock = (index, value) => {
        const newBlocks = [...activeTopic.blocks];
        newBlocks[index].content = value;
        setActiveTopic(prev => ({ ...prev, blocks: newBlocks }));
    };

    const updateBlockField = (index, field, value) => {
        const newBlocks = [...activeTopic.blocks];
        newBlocks[index] = { ...newBlocks[index], [field]: value };
        setActiveTopic(prev => ({ ...prev, blocks: newBlocks }));
    };

    const removeBlock = (index) => {
        const newBlocks = activeTopic.blocks.filter((_, i) => i !== index);
        setActiveTopic(prev => ({ ...prev, blocks: newBlocks }));
    };

    const moveBlock = (index, direction) => {
        const newBlocks = [...activeTopic.blocks];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newBlocks.length) return;
        [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
        setActiveTopic(prev => ({ ...prev, blocks: newBlocks }));
    };

    const freezeCourse = async () => {
        if (!selectedCourse || selectedCourse.status === 'Frozen') return;
        try {
            const res = await fetch('/api/admin/content/courses', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedCourse._id, status: 'Frozen' })
            });
            if (res.ok) {
                const updated = await res.json();
                setCourses(prev => prev.map(c => c._id === updated._id ? updated : c));
                setSelectedCourse(updated);
            }
        } catch (e) { /* silent */ }
    };

    const handleSaveTopic = async (e) => {
        e.preventDefault();
        const payload = { ...activeTopic, course: selectedCourse.title, module: selectedModule.title };

        try {
            // Auto-freeze course while editing
            await freezeCourse();

            if (activeTopic._id) {
                const res = await fetch('/api/admin/content/topics', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...payload, id: activeTopic._id })
                });
                if (res.ok) {
                    const updated = await res.json();
                    setTopics(prev => prev.map(t => t._id === updated._id ? updated : t));
                    toast.success("Saved & Frozen — Release when ready.");
                }
            } else {
                const res = await fetch('/api/admin/content/topics', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    const created = await res.json();
                    setTopics(prev => [created, ...prev]);
                    toast.success("Created & Frozen — Release when ready.");
                }
            }
            setIsEditing(false);
            setView("module");
        } catch (err) {
            toast.error("Failed to Sync Memory.");
        }
    };

    const handlePublish = async (id) => {
        try {
            const res = await fetch('/api/admin/content/topics', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'Published' })
            });
            if (res.ok) {
                const updated = await res.json();
                setTopics(prev => prev.map(t => t._id === id ? updated : t));
                toast.success("Intelligence Distributed to LiveBook.");
            }
        } catch (e) {
            toast.error("Failed to distribute intel.");
        }
    };

    const handleCourseStatusToggle = async (course) => {
        const newStatus = course.status === 'Published' ? 'Frozen' : 'Published';
        try {
            const res = await fetch('/api/admin/content/courses', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: course._id, status: newStatus })
            });
            if (res.ok) {
                const updated = await res.json();
                setCourses(prev => prev.map(c => c._id === updated._id ? updated : c));
                toast.success(newStatus === 'Published' ? "LiveBook Live." : "LiveBook Frozen.");
            }
        } catch (e) {
            toast.error("Status Sync Failed.");
        }
    };

    const confirmDeleteAction = async () => {
        const { type, id } = deleteConfirm;
        if (type === 'topic') {
            try {
                const res = await fetch(`/api/admin/content/topics?id=${id}`, { method: 'DELETE' });
                if (res.ok) {
                    setTopics(prev => prev.filter(t => t._id !== id));
                    toast.success("Topic deleted.");
                }
            } catch (e) {
                toast.error("Failed to delete topic.");
            }
        } else if (type === 'course') {
            try {
                const res = await fetch(`/api/admin/content/courses?id=${id}`, { method: 'DELETE' });
                if (res.ok) {
                    setCourses(prev => prev.filter(c => c._id !== id));
                    setSelectedCourse(null);
                    setView("library");
                    toast.success("LiveBook deleted.");
                }
            } catch (e) {
                toast.error("Failed to delete course.");
            }
        } else if (type === 'module') {
            try {
                const newModules = selectedCourse.modules.filter(m => m.id !== id);
                const res = await fetch('/api/admin/content/courses', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: selectedCourse._id, modules: newModules })
                });
                if (res.ok) {
                    const updated = await res.json();
                    setCourses(prev => prev.map(c => c._id === updated._id ? updated : c));
                    setSelectedCourse(updated);
                    toast.success("Module deleted.");
                }
            } catch (e) {
                toast.error("Failed to delete module.");
            }
        }
        setDeleteConfirm({ isOpen: false, type: '', id: null, title: '', message: '' });
    };

    const handleDeleteTopic = (topicId) => {
        setDeleteConfirm({ isOpen: true, type: 'topic', id: topicId, title: 'Delete Topic', message: 'Are you sure you want to permanently delete this topic?' });
    };

    const handleDeleteCourse = (courseId) => {
        setDeleteConfirm({ isOpen: true, type: 'course', id: courseId, title: 'Delete LiveBook', message: 'Delete entire LiveBook? All embedded modules will be lost.' });
    };

    const handleDeleteModule = (moduleId) => {
        setDeleteConfirm({ isOpen: true, type: 'module', id: moduleId, title: 'Remove Module', message: 'Remove this module? Topics will remain but will be unlinked.' });
    };

    const getYoutubeId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url?.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const renderHeader = () => (
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-3xl -mx-8 -mt-8 px-8 py-5 border-b border-gray-100 shadow-sm mb-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-1.5 h-8 bg-black rounded-full" />
                    <div className="flex flex-col gap-1.5">
                        <h1 className="text-2xl font-black text-black tracking-tighter uppercase leading-none">
                            {view === "library" ? "LiveBook" : view === "course" ? selectedCourse?.title : selectedModule?.title || "LiveBook"}
                        </h1>
                        <nav className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-400">
                            <span className="cursor-pointer hover:text-black transition-colors" onClick={() => { setView("library"); setSelectedCourse(null); setSelectedModule(null); }}>LiveBook</span>
                            {selectedCourse && (
                                <>
                                    <ChevronRight className="w-3 h-3 opacity-20" />
                                    <span className="cursor-pointer hover:text-black transition-colors" title={selectedCourse.title} onClick={() => { setView("course"); setSelectedModule(null); }}>
                                        {selectedCourse.title.length > 20 ? selectedCourse.title.substring(0, 20) + "..." : selectedCourse.title}
                                    </span>
                                </>
                            )}
                            {selectedModule && (
                                <>
                                    <ChevronRight className="w-3 h-3 opacity-20" />
                                    <span className="text-black" title={selectedModule.title}>
                                        {selectedModule.title.length > 20 ? selectedModule.title.substring(0, 20) + "..." : selectedModule.title}
                                    </span>
                                </>
                            )}
                        </nav>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    {view === "library" && (
                        <div className="relative group w-full md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-black transition-colors" />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Locate Intel..."
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-11 pr-4 py-3 text-[11px] font-bold outline-none focus:ring-4 focus:ring-black/5 transition-all shadow-inner"
                            />
                        </div>
                    )}

                    <div className="h-8 w-px bg-gray-100 hidden md:block" />

                    <div className="flex gap-4">
                        {view === "library" && (
                            <button
                                onClick={() => { setEditingCourseId(null); setNewCourseData({ id: "", title: "", desc: "", tracks: [], icon: "BookOpen" }); setIsAddCourseModalOpen(true); }}
                                className="bg-black text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black uppercase text-[11px] tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all group"
                            >
                                <Plus className="w-4 h-4" /> New LiveBook
                            </button>
                        )}
                        {view === "course" && (
                            <button
                                onClick={() => { setEditingModuleId(null); setNewModuleData({ id: "", title: "", desc: "" }); setIsAddModuleModalOpen(true); }}
                                className="bg-black text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black uppercase text-[11px] tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all group"
                            >
                                <Plus className="w-4 h-4" /> Integrate Module
                            </button>
                        )}
                        {view === "module" && (
                            <button
                                onClick={() => {
                                    setActiveTopic({ id: null, topicId: "", title: "", status: "Draft", blocks: [{ type: "text", content: "" }] });
                                    setIsEditing(true);
                                    setView("editor");
                                }}
                                className="bg-black text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black uppercase text-[11px] tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all group"
                            >
                                <Plus className="w-4 h-4" /> Deploy 
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );

    if (!isRehydrated) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <Blocks className="w-8 h-8 text-black animate-pulse opacity-20" />
            </div>
        );
    }

    return (
        <div className={`animate-in fade-in duration-500 min-h-screen ${showPreviewModal ? 'modal-open' : ''}`}>
            {renderHeader()}

            <div className="px-8 lg:px-12 py-6 space-y-10 max-w-[1750px] mx-auto">
                <AnimatePresence mode="wait">
                    {view === "library" && (
                        <motion.div key="library" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {courses
                                .filter(c =>
                                    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    c.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    (c.tracks || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
                                )
                                .sort((a, b) => {
                                    if (sortBy === "name") return a.title.localeCompare(b.title);
                                    if (sortBy === "track") return (a.tracks?.[0] || "").localeCompare(b.tracks?.[0] || "");
                                    return 0;
                                })
                                .map(course => (
                                    <div key={course._id} onClick={() => { setSelectedCourse(course); setView("course"); }} className="group bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:translate-y-[-5px] transition-all cursor-pointer relative overflow-hidden">
                                        <div className="absolute top-4 right-4 flex gap-2 transition-all z-20">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleCourseStatusToggle(course); }}
                                                className={`p-2 rounded-lg shadow-md border transition-all ${course.status === 'Published' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-orange-500 hover:text-white' : 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-emerald-500 hover:text-white'}`}
                                                title={course.status === 'Published' ? "Freeze LiveBook" : "Distribute to Interns"}
                                            >
                                                {course.status === 'Published' ? <Zap className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setNewCourseData({ id: course.id || "", title: course.title, desc: course.desc, tracks: course.tracks || [], icon: course.icon || "BookOpen" });
                                                    setEditingCourseId(course._id);
                                                    setIsAddCourseModalOpen(true);
                                                }}
                                                className="p-2 bg-white text-black rounded-lg shadow-md border border-gray-100 hover:bg-black hover:text-white transition-all"
                                            >
                                                <Sparkles className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course._id); }}
                                                className="p-2 bg-white text-red-500 rounded-lg shadow-md border border-red-50 hover:bg-red-500 hover:text-white transition-all"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <div className="absolute top-0 left-0 p-8 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity">
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
                                        <div className="mb-6 relative z-10">
                                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
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
                                                    return <Icon className="w-6 h-6 text-black" />;
                                                })()}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`w-2 h-2 rounded-full animate-pulse ${course.status === 'Published' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-orange-400'}`} />
                                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400">
                                                {course.status === 'Published' ? 'DEPLOYED' : 'DRAFT'}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-2">{course.title}</h3>
                                        <p className="text-xs text-gray-400 font-medium mb-6">{course.desc}</p>
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                                <Layers className="w-4 h-4" /> {course.modules.length} Modules
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {(!course.tracks || course.tracks.length === 0) ? (
                                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded text-[8px] font-black uppercase tracking-widest shadow-sm">All Tracks</span>
                                                ) : (
                                                    course.tracks.map((t, idx) => (
                                                        <span key={`${course._id}-${t}-${idx}`} className="px-2 py-0.5 bg-black text-white rounded text-[8px] font-black uppercase tracking-widest shadow-sm">{t}</span>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </motion.div>
                    )}

                    {view === "course" && (
                        <motion.div key="course" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                            <button onClick={() => { setView("library"); setSelectedCourse(null); }} className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black hover:bg-gray-50 transition-all shadow-sm group">
                                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                Return
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {selectedCourse.modules.map((mod, i) => (
                                    <div key={mod._id || mod.id || i} onClick={() => { setSelectedModule(mod); setView("module"); }} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg hover:border-black transition-all cursor-pointer group relative">
                                        <div className="absolute top-3 right-3 flex gap-1 transition-all">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setNewModuleData({ id: mod.id || "", title: mod.title, desc: mod.desc || "" });
                                                    setEditingModuleId(mod.id);
                                                    setIsAddModuleModalOpen(true);
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-black"
                                            >
                                                <Sparkles className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteModule(mod.id); }}
                                                className="p-1.5 text-gray-300 hover:text-red-500"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1 block">Module {i + 1}</span>
                                        <h4 className="text-lg font-black text-gray-900 uppercase tracking-tighter">{mod.title}</h4>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {view === "module" && (
                        <motion.div key="module" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                            <button onClick={() => { setView("course"); setSelectedModule(null); }} className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black hover:bg-gray-50 transition-all shadow-sm group">
                                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                Return
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {topics.filter(t => t.course === selectedCourse.title && t.module === selectedModule.title).map(topic => (
                                    <div
                                        key={topic._id || topic.id}
                                        onClick={() => { setActiveTopic(topic); setView("preview"); }}
                                        className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl flex flex-col justify-between group h-full hover:shadow-2xl hover:border-black transition-all cursor-pointer"
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-6">
                                                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-black/5 flex items-center gap-2 ${topic.status === 'Published' ? 'bg-emerald-500 text-white' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                                                    {topic.status === 'Published' && <CheckCircle2 className="w-3 h-3" />}
                                                    {topic.status}
                                                </div>
                                                <span className="text-[10px] font-black text-gray-200 uppercase tracking-widest">v{topic._id?.toString().slice(-4) || '1'}</span>
                                            </div>
                                            <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-tight mb-4">{topic.title}</h4>
                                            <p className="text-[12px] text-gray-400 font-medium line-clamp-2 mb-6">
                                                {topic.blocks?.find(b => b.type === 'text')?.content || "Dynamic Content Architecture Block"}
                                            </p>
                                        </div>

                                        <div className="space-y-4 pt-6 border-t border-gray-50">
                                            <div className="flex items-center justify-between text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                                <span>Updated {new Date(topic.updatedAt).toLocaleDateString()}</span>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setActiveTopic(topic); setIsEditing(true); setView("editor"); }}
                                                    className="flex-[2] py-3.5 bg-gray-50 text-gray-900 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" /> Modify Intel
                                                </button>

                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteTopic(topic._id); }}
                                                    className="flex-1 py-3 bg-red-50 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center justify-center"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            <div className="flex gap-3">
                                                {topic.status === 'Draft' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handlePublish(topic._id || topic.id); }}
                                                        className="w-full py-3.5 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Send className="w-3.5 h-3.5" /> Distribute
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div onClick={() => { setActiveTopic({ id: null, topicId: "", title: "", status: "Draft", blocks: [{ type: "text", content: "", width: 100, theme: "transparent" }] }); setIsEditing(true); setView("editor"); freezeCourse(); }} className="bg-gray-50 border-4 border-dashed border-gray-100 rounded-[3rem] p-12 flex flex-col items-center justify-center text-gray-300 hover:text-black hover:border-black transition-all cursor-pointer group hover:bg-white hover:shadow-2xl">
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                                        <Plus className="w-8 h-8" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Init New Topic</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {view === "editor" && (
                        <motion.div key="editor" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-8">
                            <button onClick={() => setView("module")} className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black hover:bg-gray-50 transition-all shadow-sm group self-start">
                                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                Return
                            </button>

                            <div className={`grid grid-cols-1 ${editorLayout === 'side-by-side' ? 'xl:grid-cols-2' : ''} gap-12`}>
                                <div className={`bg-white p-6 lg:p-8 rounded-[2.5rem] border border-gray-100 shadow-xl space-y-6 ${editorLayout === 'editing' ? 'max-w-4xl mx-auto w-full' : ''}`}>
                                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-50 pb-5">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setEditorLayout(prev => prev === 'editing' ? 'side-by-side' : 'editing')}
                                                className="px-3 py-1.5 bg-gray-100 text-gray-900 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-sm">
                                                {editorLayout === 'editing' ? 'Side Preview' : 'Expand Editor'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowPreviewModal(true)}
                                                className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                                View Projection
                                            </button>
                                        </div>
                                        <div className="relative group/dropdown">
                                            <button type="button" className="px-4 py-2 bg-black text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg hover:translate-y-[-2px] transition-all">
                                                <Plus className="w-3.5 h-3.5" /> Insert Block
                                            </button>
                                            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 shadow-2xl rounded-2xl py-3 opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible translate-y-2 group-hover/dropdown:translate-y-0 transition-all z-50">
                                                <div className="px-4 mb-2 pb-2 border-b border-gray-50">
                                                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Select Block Type</span>
                                                </div>
                                                <button type="button" onClick={() => addBlock('text')} className="w-full text-left px-5 py-2.5 hover:bg-gray-50 text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-3"><FileText className="w-3.5 h-3.5 text-gray-400" /> Text Box</button>
                                                <button type="button" onClick={() => addBlock('image')} className="w-full text-left px-5 py-2.5 hover:bg-gray-50 text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-3"><ImageIcon className="w-3.5 h-3.5 text-blue-400" /> Photo / Image</button>
                                                <button type="button" onClick={() => addBlock('youtube')} className="w-full text-left px-5 py-2.5 hover:bg-gray-50 text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-3"><Youtube className="w-3.5 h-3.5 text-red-400" /> YouTube Video</button>
                                                <button type="button" onClick={() => addBlock('link')} className="w-full text-left px-5 py-2.5 hover:bg-blue-50 text-blue-600 text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-3"><LinkIcon2 className="w-3.5 h-3.5" /> Link Box</button>
                                                <button type="button" onClick={() => addBlock('gap')} className="w-full text-left px-5 py-2.5 hover:bg-gray-50 text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-3"><Minus className="w-3.5 h-3.5 text-gray-300" /> Gap / Spacer</button>
                                            </div>
                                        </div>
                                    </div>

                                    <form onSubmit={handleSaveTopic} className="space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Topic ID</label>
                                                <input
                                                    className="w-full bg-gray-50 border border-gray-100 focus:border-black/10 focus:bg-white rounded-xl px-4 py-3 text-[12px] font-bold outline-none transition-all shadow-inner"
                                                    value={activeTopic.topicId}
                                                    onChange={e => setActiveTopic({ ...activeTopic, topicId: e.target.value })}
                                                    placeholder="e.g. intro-to-codex"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Topic Title</label>
                                                <input
                                                    className="w-full bg-gray-50 border border-gray-100 focus:border-black/10 focus:bg-white rounded-xl px-4 py-3 text-[12px] font-bold outline-none transition-all shadow-inner"
                                                    value={activeTopic.title}
                                                    onChange={e => setActiveTopic({ ...activeTopic, title: e.target.value })}
                                                    placeholder="Analysis Header..."
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap -mx-2 gap-y-4 items-start max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                            {activeTopic.blocks.map((block, idx) => {
                                                const w = block.width || 100;
                                                const basis = `${w}%`;
                                                return (
                                                    <div key={idx} style={{ flexBasis: basis, maxWidth: basis }} className="relative px-2 group/block transition-all">
                                                        <div className="bg-gray-50/50 p-4 pt-10 rounded-2xl border border-transparent hover:border-black/5 hover:bg-white hover:shadow-xl transition-all relative">
                                                            <div className="absolute top-2 left-3 right-10 flex items-center justify-between opacity-0 group-hover/block:opacity-100 transition-all z-20">
                                                                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1 shadow-lg">
                                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Size</span>
                                                                    <input
                                                                        type="number"
                                                                        min="10"
                                                                        max="100"
                                                                        value={block.width || 100}
                                                                        onChange={(e) => updateBlockField(idx, 'width', Math.min(100, Math.max(10, parseInt(e.target.value) || 0)))}
                                                                        className="w-10 bg-transparent text-[11px] font-black outline-none border-b border-gray-100 text-center focus:border-black"
                                                                    />
                                                                    <span className="text-[9px] font-black text-gray-400 -ml-1">%</span>
                                                                    <div className="w-px h-3 bg-gray-100 mx-1" />
                                                                    <input type="range" min="20" max="100" step="5" value={block.width || 100} onChange={(e) => updateBlockField(idx, 'width', parseInt(e.target.value))} className="w-16 h-1 accent-black cursor-pointer" />
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <button type="button" onClick={() => moveBlock(idx, 'up')} disabled={idx === 0} className="w-7 h-7 bg-white border border-gray-100 rounded-lg shadow-sm flex items-center justify-center text-gray-400 hover:text-black hover:border-black disabled:opacity-30 transition-all"><ArrowUp className="w-3.5 h-3.5" /></button>
                                                                    <button type="button" onClick={() => moveBlock(idx, 'down')} disabled={idx === activeTopic.blocks.length - 1} className="w-7 h-7 bg-white border border-gray-100 rounded-lg shadow-sm flex items-center justify-center text-gray-400 hover:text-black hover:border-black disabled:opacity-30 transition-all"><ArrowDown className="w-3.5 h-3.5" /></button>
                                                                    {block.type === 'text' && (
                                                                        <select value={block.theme || 'transparent'} onChange={(e) => updateBlockField(idx, 'theme', e.target.value)} className="bg-white border border-gray-200 text-gray-900 text-[9px] font-black uppercase tracking-widest rounded-lg px-2 py-1.5 outline-none shadow-sm cursor-pointer hover:border-black transition-all">
                                                                            <option value="transparent">Theme: Clear</option>
                                                                            <option value="white">White</option>
                                                                            <option value="yellow">Yellow</option>
                                                                            <option value="green">Green</option>
                                                                            <option value="red">Red</option>
                                                                            <option value="blue">Blue</option>
                                                                            <option value="black">Dark</option>
                                                                        </select>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <button type="button" onClick={() => removeBlock(idx)} className="absolute right-2 top-2 w-7 h-7 bg-white border border-red-100 shadow-lg rounded-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white hover:scale-110 opacity-0 group-hover/block:opacity-100 transition-all z-20"><Trash2 className="w-3.5 h-3.5" /></button>

                                                            <div className="mt-2 relative z-10">
                                                                {block.type === 'text' ? (
                                                                    <textarea className={`w-full border-0 text-[12px] font-medium focus:ring-0 outline-none resize-none rounded-xl p-3 ${block.theme === 'yellow' ? 'bg-yellow-50 text-yellow-900 border border-yellow-100' :
                                                                            block.theme === 'green' ? 'bg-emerald-50 text-emerald-900 border border-emerald-100' :
                                                                                block.theme === 'red' ? 'bg-red-50 text-red-900 border border-red-100' :
                                                                                    block.theme === 'blue' ? 'bg-blue-50 text-blue-900 border border-blue-100' :
                                                                                        block.theme === 'black' ? 'bg-gray-900 text-white' :
                                                                                            block.theme === 'white' ? 'bg-white shadow-sm border border-gray-100' :
                                                                                                'bg-transparent'
                                                                        }`} rows="4" value={block.content} onChange={(e) => updateBlock(idx, e.target.value)} placeholder="Type payload contents..." />
                                                                ) : block.type === 'image' ? (
                                                                    <div className="flex items-center gap-3">
                                                                        <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                                                                        <input className="flex-1 bg-transparent border-0 text-[10px] font-bold focus:ring-0 outline-none" value={block.content} onChange={(e) => updateBlock(idx, e.target.value)} placeholder="Image URL (Direct Link)" />
                                                                    </div>
                                                                ) : block.type === 'youtube' ? (
                                                                    <div className="flex items-center gap-3">
                                                                        <Youtube className="w-3.5 h-3.5 text-red-500" />
                                                                        <input className="flex-1 bg-transparent border-0 text-[10px] font-bold focus:ring-0 outline-none" value={block.content} onChange={(e) => updateBlock(idx, e.target.value)} placeholder="YouTube Link" />
                                                                    </div>
                                                                ) : block.type === 'link' ? (
                                                                    <div className="space-y-1.5">
                                                                        <div className="flex items-center gap-2">
                                                                            <LinkIcon2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                                                            <input
                                                                                className="flex-1 bg-white border border-blue-100 rounded-lg px-2.5 py-1.5 text-[10px] font-bold focus:ring-2 focus:ring-blue-100 outline-none"
                                                                                value={parseLinkBlock(block.content).label}
                                                                                onChange={e => updateLinkField(idx, 'label', e.target.value)}
                                                                                placeholder="Label (e.g. React Docs)"
                                                                            />
                                                                        </div>
                                                                        <input
                                                                            className="w-full bg-white border border-blue-100 rounded-lg px-2.5 py-1.5 text-[10px] font-medium text-blue-600 focus:ring-2 focus:ring-blue-100 outline-none ml-[22px]"
                                                                            value={parseLinkBlock(block.content).url}
                                                                            onChange={e => updateLinkField(idx, 'url', e.target.value)}
                                                                            placeholder="https://..."
                                                                        />
                                                                    </div>
                                                                ) : block.type === 'gap' ? (
                                                                    <div className="flex items-center gap-3 py-1">
                                                                        <Minus className="w-3.5 h-3.5 text-gray-300" />
                                                                        <div className="flex-1 border-t-2 border-dashed border-gray-200" />
                                                                        <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Gap / Spacer</span>
                                                                        <div className="flex-1 border-t-2 border-dashed border-gray-200" />
                                                                        <Minus className="w-3.5 h-3.5 text-gray-300" />
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="flex gap-4 pt-4 border-t border-gray-50">
                                            <button type="button" onClick={() => setView("module")} className="flex-1 py-3 text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-black hover:bg-gray-50 rounded-xl transition-all">Return</button>
                                            <button type="submit" className="flex-[2] py-4 bg-black text-white rounded-xl text-[12px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Sync Memory</button>
                                        </div>
                                    </form>
                                </div>

                                {editorLayout === 'side-by-side' && (
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center justify-between px-4">
                                            <div className="text-[9px] font-black text-gray-300 uppercase tracking-[0.4em] flex items-center gap-2"><Monitor className="w-3 h-3" /> Live Preview</div>
                                        </div>
                                        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-lg flex-1 overflow-y-auto custom-scrollbar min-h-[550px] max-h-[80vh]">
                                            <div className="p-8 space-y-8">
                                                <div className="space-y-3">
                                                    <h3 className="text-[24px] font-black text-gray-900 uppercase tracking-tighter leading-none">{activeTopic.title || "Subject"}</h3>
                                                </div>
                                                <div className="h-px bg-gray-100 w-full" />
                                                <div className="flex flex-wrap gap-4 items-start">
                                                    {activeTopic.blocks.map((block, idx) => {
                                                        const w = block.width || 100;
                                                        const basis = w === 100 ? '100%' : `calc(${w}% - 0.5rem)`;
                                                        return (
                                                            <div key={idx} style={{ flexBasis: basis, maxWidth: basis }}>
                                                                {block.type === 'text' ? (
                                                                    <div className={`leading-relaxed whitespace-pre-wrap transition-all ${block.theme === 'yellow' ? 'bg-[#fff9c4] text-[#827717] p-5 rounded-2xl border border-[#fff59d]' :
                                                                            block.theme === 'green' ? 'bg-[#e8f5e9] text-[#1b5e20] p-5 rounded-2xl border border-[#c8e6c9]' :
                                                                                block.theme === 'red' ? 'bg-[#ffebee] text-[#b71c1c] p-5 rounded-2xl border border-[#ffcdd2]' :
                                                                                    block.theme === 'blue' ? 'bg-[#e3f2fd] text-[#0d47a1] p-5 rounded-2xl border border-[#bbdefb]' :
                                                                                        block.theme === 'black' ? 'bg-gray-900 text-white p-5 rounded-2xl' :
                                                                                            block.theme === 'white' ? 'bg-white text-gray-900 p-5 rounded-2xl shadow-md border border-gray-100' :
                                                                                                'text-gray-600'
                                                                        }`}>
                                                                        <p className="text-[13px] font-medium">{block.content || "..."}</p>
                                                                    </div>
                                                                ) : block.type === 'image' && block.content ? (
                                                                    <div className="w-full rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                                                                        <img src={block.content} alt="Content" className="w-full h-auto object-cover" />
                                                                    </div>
                                                                ) : block.type === 'youtube' && getYoutubeId(block.content) ? (
                                                                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-lg">
                                                                        <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${getYoutubeId(block.content)}`} frameBorder="0" allowFullScreen />
                                                                    </div>
                                                                ) : block.type === 'link' ? (() => {
                                                                    const lnk = parseLinkBlock(block.content);
                                                                    return lnk.url ? (
                                                                        <a href={lnk.url} target="_blank" rel="noopener noreferrer"
                                                                            className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 hover:bg-blue-100 transition-colors group">
                                                                            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                                                                                <LinkIcon2 className="w-3.5 h-3.5 text-white" />
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-[12px] font-black text-blue-700 truncate">{lnk.label || lnk.url}</p>
                                                                                <p className="text-[9px] text-blue-400 font-medium truncate">{lnk.url}</p>
                                                                            </div>
                                                                        </a>
                                                                    ) : (
                                                                        <div className="bg-blue-50 border-2 border-dashed border-blue-100 rounded-xl px-4 py-3 flex items-center gap-2 text-blue-300">
                                                                            <LinkIcon2 className="w-4 h-4" />
                                                                            <span className="text-[9px] font-black uppercase tracking-widest">Link — enter URL</span>
                                                                        </div>
                                                                    );
                                                                })() : block.type === 'gap' ? (
                                                                    <div style={{ height: '1cm' }} />
                                                                ) : null}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                    {view === "preview" && (
                        <motion.div key="preview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="space-y-8">
                            <button onClick={() => setView("module")} className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black hover:bg-gray-50 transition-all shadow-sm group self-start">
                                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                Return
                            </button>

                            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-lg overflow-hidden">
                                <div className="p-8 lg:p-16 space-y-12 max-w-5xl mx-auto">
                                    <div className="space-y-4">
                                        <h3 className="text-[42px] font-black text-gray-900 uppercase tracking-tighter leading-none">{activeTopic.title || "Subject"}</h3>
                                    </div>
                                    <div className="h-px bg-gray-100 w-full" />
                                    <div className="flex flex-wrap gap-6 items-start">
                                        {activeTopic.blocks.map((block, idx) => {
                                            const w = block.width || 100;
                                            const basis = w === 100 ? '100%' : `calc(${w}% - 0.75rem)`;
                                            return (
                                                <div key={idx} style={{ flexBasis: basis, maxWidth: basis }}>
                                                    {block.type === 'text' ? (
                                                        <div className={`leading-relaxed whitespace-pre-wrap transition-all ${block.theme === 'yellow' ? 'bg-[#fff9c4] text-[#827717] p-6 rounded-2xl border border-[#fff59d]' :
                                                                block.theme === 'green' ? 'bg-[#e8f5e9] text-[#1b5e20] p-6 rounded-2xl border border-[#c8e6c9]' :
                                                                    block.theme === 'red' ? 'bg-[#ffebee] text-[#b71c1c] p-6 rounded-2xl border border-[#ffcdd2]' :
                                                                        block.theme === 'blue' ? 'bg-[#e3f2fd] text-[#0d47a1] p-6 rounded-2xl border border-[#bbdefb]' :
                                                                            block.theme === 'black' ? 'bg-gray-900 text-white p-6 rounded-2xl' :
                                                                                block.theme === 'white' ? 'bg-white text-gray-900 p-6 rounded-2xl shadow-lg border border-gray-100' :
                                                                                    'text-gray-600'
                                                            }`}>
                                                            <p className="text-[18px] font-medium">{block.content || "..."}</p>
                                                        </div>
                                                    ) : block.type === 'image' && block.content ? (
                                                        <div className="w-full rounded-2xl overflow-hidden border border-gray-100 shadow-xl">
                                                            <img src={block.content} alt="Content" className="w-full h-auto object-cover" />
                                                        </div>
                                                    ) : block.type === 'youtube' && getYoutubeId(block.content) ? (
                                                        <div className="aspect-video w-full rounded-[2.5rem] overflow-hidden bg-black shadow-2xl">
                                                            <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${getYoutubeId(block.content)}`} frameBorder="0" allowFullScreen />
                                                        </div>
                                                    ) : block.type === 'link' ? (() => {
                                                        const lnk = parseLinkBlock(block.content);
                                                        return lnk.url ? (
                                                            <a href={lnk.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-blue-50 border border-blue-100 rounded-2xl px-6 py-4 hover:bg-blue-100 transition-colors group">
                                                                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0"><LinkIcon2 className="w-5 h-5 text-white" /></div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[16px] font-black text-blue-700 truncate">{lnk.label || lnk.url}</p>
                                                                    <p className="text-[11px] text-blue-400 font-medium truncate mt-0.5">{lnk.url}</p>
                                                                </div>
                                                                <ExternalLink className="w-4 h-4 text-blue-400" />
                                                            </a>
                                                        ) : null;
                                                    })() : block.type === 'gap' ? (
                                                        <div style={{ height: '1cm' }} />
                                                    ) : null}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {mounted && createPortal(
            <AnimatePresence>
                {isAddCourseModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddCourseModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-2xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="relative bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-gray-100">
                            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-6">Initialize New LiveBook</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">LiveBook ID</label>
                                        <input
                                            value={newCourseData.id}
                                            onChange={(e) => setNewCourseData({ ...newCourseData, id: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold focus:ring-4 focus:ring-black/5 outline-none"
                                            placeholder="e.g. blockchain-101"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">LiveBook Title</label>
                                        <input
                                            autoFocus
                                            value={newCourseData.title}
                                            onChange={(e) => setNewCourseData({ ...newCourseData, title: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold focus:ring-4 focus:ring-black/5 outline-none"
                                            placeholder="E.g. Quantum Computing..."
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Directive / Description</label>
                                    <textarea
                                        value={newCourseData.desc}
                                        onChange={(e) => setNewCourseData({ ...newCourseData, desc: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 text-sm font-bold focus:ring-4 focus:ring-black/5 outline-none resize-none"
                                        rows="3"
                                        placeholder="Core objective of this asset..."
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Symbol / Icon</label>
                                    <div className="grid grid-cols-5 gap-2 pb-2">
                                        {[
                                            { name: 'Blocks', icon: Blocks, label: 'Blockchain' },
                                            { name: 'Brain', icon: Brain, label: 'AI' },
                                            { name: 'Monitor', icon: Monitor, label: 'Full Stack' },
                                            { name: 'Database', icon: Database, label: 'Data' },
                                            { name: 'Zap', icon: Zap, label: 'Performance' },
                                            { name: 'Layers', icon: Layers, label: 'Infras' },
                                            { name: 'Cpu', icon: Cpu, label: 'Systems' },
                                            { name: 'Sparkles', icon: Sparkles, label: 'GenAI' },
                                            { name: 'BookOpen', icon: BookOpen, label: 'General' }
                                        ].map((item) => (
                                            <button
                                                key={item.name}
                                                type="button"
                                                onClick={() => setNewCourseData({ ...newCourseData, icon: item.name })}
                                                className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all border ${newCourseData.icon === item.name ? 'bg-black text-white border-black shadow-md' : 'bg-gray-50 text-gray-400 border-gray-100 hover:text-black hover:border-black'}`}
                                            >
                                                <item.icon className="w-4 h-4" />
                                                <span className="text-[8px] font-black tracking-tighter truncate w-full uppercase">{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Deployment Status</label>
                                    <div className="flex gap-2">
                                        {["Draft", "Published", "Frozen"].map(stat => (
                                            <button
                                                key={stat}
                                                type="button"
                                                onClick={() => setNewCourseData({ ...newCourseData, status: stat })}
                                                className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${newCourseData.status === stat ? 'bg-black text-white border-black shadow-lg' : 'bg-gray-50 text-gray-400 border-gray-100 hover:text-black'}`}
                                            >
                                                {stat}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4 pt-1 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                                    <div className="space-y-2">
                                        <label className="text-[8px] font-black text-gray-300 uppercase tracking-widest ml-1">Universal Deployment</label>
                                        <button
                                            type="button"
                                            onClick={() => setNewCourseData({ ...newCourseData, tracks: [] })}
                                            className={`w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md group border-2 ${newCourseData.tracks.length === 0 ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-50 hover:border-black hover:text-black'}`}
                                        >
                                            <div className="flex items-center justify-center gap-3">
                                                <Globe className="w-3.5 h-3.5" />
                                                Global Asset — All Tracks
                                            </div>
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[8px] font-black text-gray-300 uppercase tracking-widest ml-1">Coding Architecture</label>
                                        <div className="flex flex-wrap gap-2">
                                            {availableTracks.CODING.map(track => {
                                                const isSelected = newCourseData.tracks.includes(track);
                                                return (
                                                    <button
                                                        key={track}
                                                        type="button"
                                                        onClick={() => {
                                                            const fresh = [...newCourseData.tracks];
                                                            if (isSelected) {
                                                                fresh.splice(fresh.indexOf(track), 1);
                                                            } else {
                                                                fresh.push(track);
                                                            }
                                                            setNewCourseData({ ...newCourseData, tracks: fresh });
                                                        }}
                                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-sm ${isSelected ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                                    >
                                                        {track}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[8px] font-black text-gray-300 uppercase tracking-widest ml-1">Research Strategy</label>
                                        <div className="flex flex-wrap gap-2">
                                            {availableTracks.RESEARCH.map(track => {
                                                const isSelected = newCourseData.tracks.includes(track);
                                                return (
                                                    <button
                                                        key={track}
                                                        type="button"
                                                        onClick={() => {
                                                            const fresh = [...newCourseData.tracks];
                                                            if (isSelected) {
                                                                fresh.splice(fresh.indexOf(track), 1);
                                                            } else {
                                                                fresh.push(track);
                                                            }
                                                            setNewCourseData({ ...newCourseData, tracks: fresh });
                                                        }}
                                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-sm ${isSelected ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                                    >
                                                        {track}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    {(availableTracks.CODING.length === 0 && availableTracks.RESEARCH.length === 0) && <span className="text-xs text-gray-400">Syncing tracks...</span>}
                                </div>
                                <button
                                    onClick={async () => {
                                        if (newCourseData.title.trim()) {
                                            try {
                                                if (editingCourseId) {
                                                    const res = await fetch('/api/admin/content/courses', {
                                                        method: 'PUT',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ id: editingCourseId, ...newCourseData })
                                                    });
                                                    if (res.ok) {
                                                        const saved = await res.json();
                                                        setCourses(prev => prev.map(c => c._id === saved._id ? saved : c));
                                                        setNewCourseData({ title: "", desc: "", tracks: [] });
                                                        setEditingCourseId(null);
                                                        setIsAddCourseModalOpen(false);
                                                        toast.success("Intelligence Refined.");
                                                    }
                                                } else {
                                                    const res = await fetch('/api/admin/content/courses', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ ...newCourseData, modules: [] })
                                                    });
                                                    if (res.ok) {
                                                        const saved = await res.json();
                                                        setCourses(prev => [...prev, saved]);
                                                        setNewCourseData({ title: "", desc: "", tracks: [] });
                                                        setIsAddCourseModalOpen(false);
                                                        toast.success("Intelligence Asset Initialized.");
                                                    }
                                                }
                                            } catch (e) {
                                                toast.error("Network Error.");
                                            }
                                        }
                                    }}
                                    className="w-full py-4 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:scale-[1.01] transition-all"
                                >
                                    {editingCourseId ? "Update Intelligence" : "Confirm Protocol"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>, document.body)}

            {mounted && createPortal(
            <AnimatePresence>
                {isAddModuleModalOpen && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModuleModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-2xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="relative bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-gray-100">
                            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-6">Create New Module</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Module ID</label>
                                        <input
                                            value={newModuleData.id}
                                            onChange={(e) => setNewModuleData({ ...newModuleData, id: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold focus:ring-4 focus:ring-black/5 outline-none"
                                            placeholder="e.g. phase-1-crypto"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Module Title</label>
                                        <input
                                            autoFocus
                                            value={newModuleData.title}
                                            onChange={(e) => setNewModuleData({ ...newModuleData, title: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold focus:ring-4 focus:ring-black/5 outline-none"
                                            placeholder="E.g. Advanced Cryptography..."
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5 mt-4">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Module Description</label>
                                    <textarea
                                        value={newModuleData.desc}
                                        onChange={(e) => setNewModuleData({ ...newModuleData, desc: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 text-sm font-bold focus:ring-4 focus:ring-black/5 outline-none resize-none"
                                        rows="3"
                                        placeholder="Summarize the core topics in this module..."
                                    />
                                </div>
                                <button
                                    onClick={async () => {
                                        if (newModuleData.title.trim() && newModuleData.desc.trim()) {
                                            try {
                                                let updatedModules;
                                                if (editingModuleId) {
                                                    updatedModules = selectedCourse.modules.map(m => m.id === editingModuleId ? { ...m, title: newModuleData.title.trim(), desc: newModuleData.desc.trim() } : m);
                                                } else {
                                                    const newModule = { id: Date.now().toString(), title: newModuleData.title.trim(), desc: newModuleData.desc.trim() };
                                                    updatedModules = [...selectedCourse.modules, newModule];
                                                }

                                                const res = await fetch('/api/admin/content/courses', {
                                                    method: 'PUT',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ id: selectedCourse._id, modules: updatedModules })
                                                });
                                                if (res.ok) {
                                                    const saved = await res.json();
                                                    setCourses(prev => prev.map(c => c._id === saved._id ? saved : c));
                                                    setSelectedCourse(saved);
                                                    setNewModuleData({ title: "", desc: "" });
                                                    setEditingModuleId(null);
                                                    setIsAddModuleModalOpen(false);
                                                    toast.success(editingModuleId ? "Module Logic Refined." : "Intelligence Module Integrated.");
                                                }
                                            } catch (e) {
                                                toast.error("Network Error.");
                                            }
                                        } else {
                                            toast.error("Please fill all fields.");
                                        }
                                    }}
                                    className="w-full py-3 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:scale-[1.01] transition-all"
                                >
                                    {editingModuleId ? "Update Logic" : "Confirm Integration"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>, document.body)}

            <AnimatePresence>
                {showPreviewModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPreviewModal(false)} className="absolute inset-0 bg-black/70 backdrop-blur-2xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-[2.5rem] w-[95vw] max-w-5xl max-h-[85vh] overflow-hidden shadow-2xl border border-gray-100 flex flex-col">
                            <div className="flex items-center justify-between p-6 border-b border-gray-100">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Full Screen Projection</h3>
                                <button onClick={() => setShowPreviewModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-black">
                                    <Plus className="w-5 h-5 rotate-45" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 lg:p-16">
                                <div className="max-w-4xl mx-auto space-y-10">
                                    <div className="space-y-4">
                                        <h3 className="text-[42px] font-black text-gray-900 uppercase tracking-tighter leading-none">{activeTopic.title || "Subject"}</h3>
                                    </div>
                                    <div className="h-px bg-gray-100 w-full" />
                                    <div className="flex flex-wrap gap-6 items-start">
                                        {activeTopic.blocks.map((block, idx) => {
                                            const w = block.width || 100;
                                            const basis = w === 100 ? '100%' : `calc(${w}% - 0.75rem)`;
                                            return (
                                                <div key={idx} style={{ flexBasis: basis, maxWidth: basis }}>
                                                    {block.type === 'text' ? (
                                                        <div className={`leading-relaxed transition-all ${block.theme === 'yellow' ? 'bg-[#fff9c4] text-[#827717] p-6 rounded-2xl border border-[#fff59d]' :
                                                                block.theme === 'green' ? 'bg-[#e8f5e9] text-[#1b5e20] p-6 rounded-2xl border border-[#c8e6c9]' :
                                                                    block.theme === 'red' ? 'bg-[#ffebee] text-[#b71c1c] p-6 rounded-2xl border border-[#ffcdd2]' :
                                                                        block.theme === 'blue' ? 'bg-[#e3f2fd] text-[#0d47a1] p-6 rounded-2xl border border-[#bbdefb]' :
                                                                            block.theme === 'black' ? 'bg-gray-900 text-white p-6 rounded-2xl' :
                                                                                block.theme === 'white' ? 'bg-white text-gray-900 p-6 rounded-2xl shadow-lg border border-gray-100' :
                                                                                    'text-gray-600'
                                                            }`}>
                                                            <p className="text-[16px] font-medium whitespace-pre-wrap">{block.content || "..."}</p>
                                                        </div>
                                                    ) : block.type === 'image' && block.content ? (
                                                        <div className="w-full rounded-2xl overflow-hidden border border-gray-100 shadow-lg">
                                                            <img src={block.content} alt="Content" className="w-full h-auto object-cover" />
                                                        </div>
                                                    ) : block.type === 'youtube' && getYoutubeId(block.content) ? (
                                                        <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-xl">
                                                            <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${getYoutubeId(block.content)}`} frameBorder="0" allowFullScreen />
                                                        </div>
                                                    ) : block.type === 'link' ? (() => {
                                                        const lnk = parseLinkBlock(block.content);
                                                        return lnk.url ? (
                                                            <a href={lnk.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-blue-50 border border-blue-100 rounded-2xl px-6 py-4 hover:bg-blue-100 transition-colors group">
                                                                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0"><LinkIcon2 className="w-5 h-5 text-white" /></div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[16px] font-black text-blue-700 truncate">{lnk.label || lnk.url}</p>
                                                                    <p className="text-[11px] text-blue-400 font-medium truncate mt-0.5">{lnk.url}</p>
                                                                </div>
                                                                <ExternalLink className="w-4 h-4 text-blue-400" />
                                                            </a>
                                                        ) : null;
                                                    })() : block.type === 'gap' ? (
                                                        <div style={{ height: '1cm' }} />
                                                    ) : null}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {mounted && createPortal(
                <AnimatePresence>
                    {deleteConfirm.isOpen && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })} className="absolute inset-0 bg-black/60 backdrop-blur-2xl" />
                            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="relative bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-gray-100 flex flex-col">
                                <div className="mb-6">
                                    <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4">
                                        <Trash2 className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-2">{deleteConfirm.title}</h3>
                                    <p className="text-[12px] font-bold text-gray-400">{deleteConfirm.message}</p>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })} className="flex-1 py-4 bg-gray-50 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all">Cancel</button>
                                    <button onClick={confirmDeleteAction} className="flex-1 py-4 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 shadow-xl shadow-rose-500/20 transition-all flex items-center justify-center gap-2">Confirm <Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #f3f4f6; border-radius: 20px; border: 4px solid white; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #e5e7eb; }
            `}</style>
        </div>
    );
}
