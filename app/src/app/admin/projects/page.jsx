"use client";

import {
    Layout,
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    CheckCircle2,
    XCircle,
    FileText,
    Calendar,
    Users,
    ArrowRight,
    ChevronRight,
    ArrowLeft,
    Briefcase,
    Zap,
    Download,
    Mail,
    Bell,
    RefreshCw,
    Trash2,
    Edit3,
    PlusSquare,
    Type,
    AlignLeft,
    Link,
    X
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminProjectsPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const [activeTab, setActiveTab] = useState('available'); 
    const [available, setAvailable] = useState([]);
    const [requests, setRequests] = useState([]);
    const [presetRequests, setPresetRequests] = useState([]);

    // --- State Persistence ---
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedTab = sessionStorage.getItem('pj_activeTab');
            if (savedTab) setActiveTab(savedTab);
        }
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('pj_activeTab', activeTab);
        }
    }, [activeTab]);
    const [tracks, setTracks] = useState({ CODING: [], RESEARCH: [] });
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [projectToDelete, setProjectToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("CODING");
    const [selectedTrackName, setSelectedTrackName] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [uploadedDocUrl, setUploadedDocUrl] = useState("");
    const [uploadedDocName, setUploadedDocName] = useState("");
    const [formStep, setFormStep] = useState(1); 
    const [formPhases, setFormPhases] = useState([]); 
    const [formTopics, setFormTopics] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const searchInputRef = useRef(null);

    const resetAddModal = () => {
        setIsAddModalOpen(false);
        setFormStep(1);
        setFormPhases([]);
        setFormTopics([]);
        setUploadedDocUrl("");
        setUploadedDocName("");
        const firstCat = Object.keys(tracks)[0];
        if (firstCat && tracks[firstCat]?.[0]) {
            setSelectedCategory(firstCat);
            setSelectedTrackName(tracks[firstCat][0].name);
            setFormPhases(tracks[firstCat][0].formPhases || []);
        }
    };

    const handleEditProjectOpen = (item) => {
        setEditingProject(item);
        setFormPhases(item.formPhases || []);
        setFormTopics(item.topics || []);
        setUploadedDocUrl(item.documentLink || "");
        setUploadedDocName(item.documentFile || "");
        setIsEditModalOpen(true);
    };

    const handleAddPhase = () => setFormPhases([...formPhases, { name: "New Phase", description: "", fields: [] }]);
    const handleRemovePhase = (pi) => setFormPhases(formPhases.filter((_, i) => i !== pi));
    
    const handlePhaseNameChange = (pi, name) => {
        const newList = [...formPhases];
        newList[pi] = { ...newList[pi], name };
        setFormPhases(newList);
    };

    const handlePhaseDescriptionChange = (pi, description) => {
        const newList = [...formPhases];
        newList[pi] = { ...newList[pi], description };
        setFormPhases(newList);
    };

    const handleAddFieldToPhase = (pi, type = 'text') => {
        const newList = [...formPhases];
        newList[pi] = { ...newList[pi] };
        newList[pi].fields = [...(newList[pi].fields || []), { label: "", type }];
        setFormPhases(newList);
    };

    const handleRemoveFieldFromPhase = (pi, fi) => {
        const newList = [...formPhases];
        newList[pi] = { ...newList[pi] };
        newList[pi].fields = newList[pi].fields.filter((_, i) => i !== fi);
        setFormPhases(newList);
    };

    const handleFieldChange = (pi, fi, key, val) => {
        const newList = [...formPhases];
        newList[pi] = { ...newList[pi] };
        newList[pi].fields = [...newList[pi].fields];
        newList[pi].fields[fi] = { ...newList[pi].fields[fi], [key]: val };
        setFormPhases(newList);
    };

    const handleAddTopic = () => setFormTopics([...formTopics, { title: "", subtopics: [] }]);
    const handleRemoveTopic = (ti) => setFormTopics(formTopics.filter((_, i) => i !== ti));
    
    const handleTopicTitleChange = (ti, title) => {
        const newList = [...formTopics];
        newList[ti] = { ...newList[ti], title };
        setFormTopics(newList);
    };

    const handleAddSubtopic = (ti) => {
        const newList = [...formTopics];
        newList[ti] = { ...newList[ti] };
        newList[ti].subtopics = [...(newList[ti].subtopics || []), { title: "", contentType: "text", contentValue: "" }];
        setFormTopics(newList);
    };

    const handleRemoveSubtopic = (ti, si) => {
        const newList = [...formTopics];
        newList[ti] = { ...newList[ti] };
        newList[ti].subtopics = newList[ti].subtopics.filter((_, i) => i !== si);
        setFormTopics(newList);
    };

    const handleSubtopicChange = (ti, si, key, val) => {
        const newList = [...formTopics];
        newList[ti] = { ...newList[ti] };
        newList[ti].subtopics = [...newList[ti].subtopics];
        newList[ti].subtopics[si] = { ...newList[ti].subtopics[si], [key]: val };
        setFormTopics(newList);
    };

    const fetchAll = async () => {
        setIsRefreshing(true);
        try {
            const [reqRes, poolRes, tracksRes] = await Promise.all([
                fetch('/api/projects?role=admin'),
                fetch('/api/admin/projects/pool'),
                fetch('/api/admin/tracks')
            ]);

            if (tracksRes.ok) {
                const tracksData = await tracksRes.json();
                const groupedTracks = {};
                tracksData.forEach(track => {
                    const cat = track.category || 'OTHER';
                    if (!groupedTracks[cat]) groupedTracks[cat] = [];
                    groupedTracks[cat].push(track);
                });
                setTracks(groupedTracks);
                if (!selectedTrackName) {
                    const firstCat = Object.keys(groupedTracks)[0];
                    if (firstCat) {
                        setSelectedCategory(firstCat);
                        if (groupedTracks[firstCat]?.[0]) {
                            setSelectedTrackName(groupedTracks[firstCat][0].name);
                        }
                    }
                }
            }

            let poolData = [];
            if (poolRes.ok) {
                poolData = await poolRes.json();
                setAvailable(poolData);
            }

            if (reqRes.ok) {
                const reqData = await reqRes.json();
                const poolTitles = poolData.map(p => p.title);
                const isPresetReq = (p) => p.projectType === 'preset' || (!p.projectType && poolTitles.includes(p.projectName));

                setRequests(reqData.filter(p => p.status === 'Pending' && !isPresetReq(p)));
                setPresetRequests(reqData.filter(isPresetReq));
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    useEffect(() => {
        if (isAddModalOpen && !isEditModalOpen && tracks[selectedCategory]) {
            const trackObj = tracks[selectedCategory].find(t => t.name === selectedTrackName);
            if (trackObj) {
                setFormPhases(trackObj.formPhases || []);
            }
        }
    }, [selectedTrackName, selectedCategory, tracks, isAddModalOpen, isEditModalOpen]);

    const handleDeleteProject = async () => {
        if (!projectToDelete) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/admin/projects/pool?id=${projectToDelete}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setAvailable(prev => prev.filter(p => (p._id || p.id) !== projectToDelete));
                toast.success("Project Removed from Pool");
                setIsEditModalOpen(false);
                setProjectToDelete(null);
            } else {
                toast.error("Deletion Failed");
            }
        } catch (err) {
            console.error(err);
            toast.error("Network Error");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleAction = async (id, type) => {
        try {
            const status = type === 'approve' ? 'Approved' : 'Rejected';
            const res = await fetch('/api/projects', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            });
            if (res.ok) {
                if (type === 'approve') {
                    toast.success("Project Request Approved.");
                } else {
                    toast.error("Project Request Rejected.");
                }
                setRequests(prev => prev.filter(r => r._id !== id));
                setIsDetailsModalOpen(false);
                setSelectedRequest(null);
            } else {
                toast.error("Failed to update status.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Could not complete action");
        }
    };

    const handleAddProjectSubmit = async (e) => {
        e.preventDefault();
        if (formStep === 1) { setFormStep(2); return; }
        const formData = new FormData(e.target);

        const newProject = {
            category: selectedCategory,
            track: selectedTrackName,
            difficulty: formData.get('difficulty'),
            type: formData.get('type') || "Coding Project",
            status: "Active",
            deadline: formData.get('deadline') || "1 Month",
            enrolled: 0,
            formPhases: formPhases,
            topics: formTopics,
            documentFile: uploadedDocName,
            documentLink: uploadedDocUrl
        };

        for (let [key, value] of formData.entries()) {
            if (['track', 'category', 'difficulty', 'type', 'deadline'].includes(key)) continue;
            newProject[key] = value;
        }

        try {
            const res = await fetch('/api/admin/projects/pool', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProject)
            });
            const data = await res.json();
            if (res.ok) {
                setAvailable(prev => [data, ...prev]);
                toast.success("Project Deployed to Pool");
                setIsAddModalOpen(false);
                setFormStep(1);
            } else {
                toast.error(data.message || "Deployment Failed");
            }
        } catch (err) {
            console.error(err);
            toast.error("Internal Error");
        }
    };

    const handleEditProjectSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const updatedData = {
            id: editingProject._id || editingProject.id,
            category: editingProject.category,
            formPhases: formPhases,
            topics: formTopics,
            documentFile: uploadedDocName,
            documentLink: uploadedDocUrl
        };

        for (let [key, value] of formData.entries()) {
            updatedData[key] = value;
        }

        try {
            const res = await fetch('/api/admin/projects/pool', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });

            if (res.ok) {
                const savedProject = await res.json();
                setAvailable(prev => prev.map(p => (p._id || p.id) === (editingProject._id || editingProject.id) ? { ...savedProject, id: savedProject._id } : p));
                toast.success("Project Configuration Synced");
                setIsEditModalOpen(false);
            } else {
                toast.error("Failed to Sync Configuration");
            }
        } catch (err) {
            console.error(err);
            toast.error("Network Error");
        }
    };

    const filteredAvailable = available.filter(item => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (item.title || '').toLowerCase().includes(q) || (item.track || '').toLowerCase().includes(q);
    });

    return (
        <div className="animate-in fade-in duration-500">
            {/* Standardized Tactical Header */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-3xl -mx-8 -mt-8 px-8 py-5 border-b border-gray-100 shadow-sm mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-8 bg-black rounded-full" />
                        <h1 className="text-2xl font-black text-black tracking-tighter uppercase leading-none">
                            Projects
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex bg-gray-50/50 p-1 rounded-xl border border-gray-100 shadow-sm">
                            {[
                                { id: 'available', label: 'Projects' },
                                { id: 'requests', label: 'Proposals' },
                                { id: 'preset', label: 'Presets' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                        activeTab === tab.id 
                                        ? 'bg-black text-white shadow-xl' 
                                        : 'text-gray-400 hover:text-black hover:bg-white'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={fetchAll}
                            disabled={isRefreshing}
                            className={`p-2.5 bg-gray-50 hover:bg-black hover:text-white rounded-xl transition-all border border-gray-100 shadow-sm ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </header>

            <div className="px-8 pb-20 max-w-[1750px] mx-auto">

            <AnimatePresence mode="wait">
                {activeTab === 'available' ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden">
                            <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                                <motion.div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl overflow-hidden" animate={{ width: searchOpen ? 280 : 40 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }} style={{ minWidth: 40 }}>
                                    <button onClick={() => { setSearchOpen(!searchOpen); if (!searchOpen) setTimeout(() => searchInputRef.current?.focus(), 150); else setSearchQuery(''); }} className="shrink-0 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-black">
                                        {searchOpen ? <X className="w-3.5 h-3.5" /> : <Search className="w-3.5 h-3.5" />}
                                    </button>
                                    {searchOpen && <input ref={searchInputRef} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className="flex-1 bg-transparent pr-3 text-[11px] font-bold outline-none" />}
                                </motion.div>
                                <button 
                                    onClick={async () => {
                                        const toastId = toast.loading("Initializing project template...");
                                        try {
                                            const res = await fetch('/api/admin/projects/pool', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    title: "New Project",
                                                    category: "CODING",
                                                    track: "Web Development",
                                                    description: "Provide detailed project briefing...",
                                                    difficulty: "Intermediate",
                                                    deadline: "1 Month",
                                                    type: "Coding Project",
                                                    formPhases: [],
                                                    topics: []
                                                })
                                            });
                                            if (res.ok) {
                                                const data = await res.json();
                                                toast.success("Project template created", { id: toastId });
                                                router.push(`/admin/projects/${data._id || data.id}`);
                                            } else {
                                                toast.error("Failed to initialize project template", { id: toastId });
                                            }
                                        } catch (err) {
                                            console.error(err);
                                            toast.error("Network error initializing project template", { id: toastId });
                                        }
                                    }} 
                                    className="px-6 py-3 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-[1.02] transition-all"
                                >
                                    <Plus className="w-4 h-4" /> New Project
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50 text-gray-400 uppercase font-black text-[8px] tracking-[0.3em]"><tr className="px-8"><th className="px-8 py-4">Project Name</th><th className="px-4 py-4">Domain</th><th className="px-4 py-4">Interns</th><th className="px-4 py-4">Status</th><th className="px-8 py-4 text-right">Settings</th></tr></thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {available.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-20 text-center">
                                                    <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">
                                                        projects are yet to add
                                                    </p>
                                                </td>
                                            </tr>
                                        ) : filteredAvailable.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-20 text-center">
                                                    <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">
                                                        No matching projects found
                                                    </p>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredAvailable.map(item => (
                                                <tr key={item._id || item.id} onClick={() => router.push(`/admin/projects/${item._id || item.id}`)} className="hover:bg-gray-50/30 transition-all cursor-pointer group">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-3.5">
                                                            <div className="p-2.5 bg-gray-50 rounded-lg group-hover:bg-white border border-transparent transition-all"><Briefcase className="w-4 h-4 text-gray-900" /></div>
                                                            <div><p className="text-[12px] font-black text-gray-900 uppercase tracking-tight">{item.title}</p><p className="text-[8px] text-gray-300 font-black uppercase mt-0.5">TTL: {item.deadline}</p></div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-5"><span className="px-3 py-1 bg-gray-50 text-[8px] font-black uppercase rounded-full border border-gray-100 text-gray-500">{item.track}</span></td>
                                                    <td className="px-4 py-5 font-black text-[11px] text-gray-800">{item.enrolled}</td>
                                                    <td className="px-4 py-5"><div className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-emerald-500" /><span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Active</span></div></td>
                                                     <td className="px-8 py-5 text-right"><div className="flex justify-end gap-2"><button onClick={(e) => { e.stopPropagation(); router.push(`/admin/projects/${item._id || item.id}`); }} className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-50"><Edit3 className="w-4 h-4 text-gray-400 hover:text-black" /></button><button onClick={(e) => { e.stopPropagation(); setProjectToDelete(item._id || item.id); }} className="p-2 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4 text-gray-400 hover:text-rose-600" /></button></div></td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                ) : activeTab === 'requests' ? (
                    <motion.div key="requests" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {requests.length === 0 && <div className="col-span-full py-20 text-center"><p className="text-gray-400 font-black uppercase tracking-widest">No pending proposals found.</p></div>}
                        {requests.map(req => (
                             <div key={req._id || req.id} onClick={() => router.push(`/admin/projects/request/${req._id || req.id}`)} className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/20 relative group cursor-pointer hover:border-black/5 hover:shadow-2xl transition-all">
                                <div className="relative z-10 space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Protocol Request • {new Date(req.requestedAt).toLocaleDateString()}</p>
                                            <h3 className="text-xl font-black text-gray-900 uppercase leading-tight tracking-tighter">{req.projectName}</h3>
                                            <div className="flex items-center gap-2 mt-2"><div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[7px] font-black uppercase">{req.internName?.substring(0, 2) || 'JD'}</div><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{req.internName}</p></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100/50"><div className="p-2 bg-white rounded-lg shadow-sm"><FileText className="w-3.5 h-3.5 text-rose-500" /></div><div className="flex-1"><p className="text-[10px] font-black text-gray-900 uppercase">{req.track || "Project Submission"}</p></div></div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                ) : activeTab === 'preset' ? (
                     <motion.div key="preset" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {presetRequests.length === 0 && <div className="col-span-full py-20 text-center"><p className="text-gray-400 font-black uppercase tracking-widest">No preset allocations found.</p></div>}
                        {presetRequests.map(req => (
                             <div key={req.id || req._id} onClick={() => router.push(`/admin/projects/request/${req.id || req._id}`)} className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/20 group cursor-pointer hover:border-black/5 hover:shadow-2xl transition-all">
                                <div className="relative z-10 space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Preset Allocation • {new Date(req.requestedAt).toLocaleDateString()}</p>
                                            <h3 className="text-xl font-black text-gray-900 uppercase leading-tight tracking-tighter">{req.projectName}</h3>
                                            <div className="flex items-center gap-2 mt-2"><div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[7px] font-black uppercase">{req.internName?.substring(0, 2) || 'JD'}</div><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{req.internName}</p></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100/50"><div className="p-2 bg-white rounded-lg shadow-sm"><FileText className="w-3.5 h-3.5 text-emerald-500" /></div><div className="flex-1"><p className="text-[10px] font-black text-gray-900 uppercase">{req.track || "Project Allocation"}</p></div></div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                ) : null}
            </AnimatePresence>

            {null}

            {mounted && createPortal(
            <AnimatePresence>
                {projectToDelete && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isDeleting && setProjectToDelete(null)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-[2rem] max-w-sm w-full shadow-2xl p-8 border border-gray-100 text-center">
                            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trash2 className="w-8 h-8 text-rose-500" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-2">Delete Project</h3>
                            <p className="text-xs font-bold text-gray-500 mb-8 px-4">Are you absolutely sure you want to permanently remove this project from the available pool? This action cannot be undone.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setProjectToDelete(null)} disabled={isDeleting} className="flex-1 py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Cancel</button>
                                <button onClick={handleDeleteProject} disabled={isDeleting} className="flex-1 py-3.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-rose-500/25 flex items-center justify-center gap-2">
                                    {isDeleting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : 'Delete Project'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>, document.body)}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}</style>
            </div>
        </div>
    );
}
