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
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminProjectsPage() {
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
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [projectToDelete, setProjectToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("CODING");
    const [selectedTrackName, setSelectedTrackName] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [formStep, setFormStep] = useState(1); 
    const [formPhases, setFormPhases] = useState([]); 
    const [searchQuery, setSearchQuery] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const searchInputRef = useRef(null);

    const resetAddModal = () => {
        setIsAddModalOpen(false);
        setFormStep(1);
        setFormPhases([]);
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
            formPhases: formPhases
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
            formPhases: formPhases
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
                                <button onClick={() => setIsAddModalOpen(true)} className="px-6 py-3 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-[1.02] transition-all">
                                    <Plus className="w-4 h-4" /> New Project
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50 text-gray-400 uppercase font-black text-[8px] tracking-[0.3em]"><tr className="px-8"><th className="px-8 py-4">Descriptor</th><th className="px-4 py-4">Domain</th><th className="px-4 py-4">Interns</th><th className="px-4 py-4">Status</th><th className="px-8 py-4 text-right">Settings</th></tr></thead>
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
                                                <tr key={item._id || item.id} onClick={() => handleEditProjectOpen(item)} className="hover:bg-gray-50/30 transition-all cursor-pointer group">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-3.5">
                                                            <div className="p-2.5 bg-gray-50 rounded-lg group-hover:bg-white border border-transparent transition-all"><Briefcase className="w-4 h-4 text-gray-900" /></div>
                                                            <div><p className="text-[12px] font-black text-gray-900 uppercase tracking-tight">{item.title}</p><p className="text-[8px] text-gray-300 font-black uppercase mt-0.5">TTL: {item.deadline}</p></div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-5"><span className="px-3 py-1 bg-gray-50 text-[8px] font-black uppercase rounded-full border border-gray-100 text-gray-500">{item.track}</span></td>
                                                    <td className="px-4 py-5 font-black text-[11px] text-gray-800">{item.enrolled}</td>
                                                    <td className="px-4 py-5"><div className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-emerald-500" /><span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Active</span></div></td>
                                                    <td className="px-8 py-5 text-right"><div className="flex justify-end gap-2"><button onClick={(e) => { e.stopPropagation(); handleEditProjectOpen(item); }} className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-50"><Edit3 className="w-4 h-4 text-gray-400 hover:text-black" /></button><button onClick={(e) => { e.stopPropagation(); setProjectToDelete(item._id || item.id); }} className="p-2 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4 text-gray-400 hover:text-rose-600" /></button></div></td>
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
                            <div key={req._id || req.id} onClick={() => { setSelectedRequest(req); setIsDetailsModalOpen(true); }} className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/20 relative group cursor-pointer hover:border-black/5 hover:shadow-2xl transition-all">
                                <div className="relative z-10 space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Protocol Request • {new Date(req.requestedAt).toLocaleDateString()}</p>
                                            <h3 className="text-xl font-black text-gray-900 uppercase leading-tight tracking-tighter">{req.projectName}</h3>
                                            <div className="flex items-center gap-2 mt-2"><div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[7px] font-black uppercase">{req.internName?.substring(0, 2) || 'JD'}</div><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{req.internName}</p></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100/50"><div className="p-2 bg-white rounded-lg shadow-sm"><FileText className="w-3.5 h-3.5 text-rose-500" /></div><div className="flex-1"><p className="text-[10px] font-black text-gray-900 uppercase">{req.track || "Project Submission"}</p></div></div>
                                    <div className="flex gap-3 pt-2"><div className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:bg-black transition-all"><Zap className="w-3 h-3 text-amber-400" /> View Detailed Protocol</div><button onClick={(e) => { e.stopPropagation(); handleAction(req._id, 'reject'); }} className="px-4 py-3 bg-gray-50 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border border-transparent hover:border-rose-100">Reject</button></div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                ) : activeTab === 'preset' ? (
                     <motion.div key="preset" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {presetRequests.length === 0 && <div className="col-span-full py-20 text-center"><p className="text-gray-400 font-black uppercase tracking-widest">No preset allocations found.</p></div>}
                        {presetRequests.map(req => (
                            <div key={req.id || req._id} onClick={() => { setSelectedRequest(req); setIsDetailsModalOpen(true); }} className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/20 group cursor-pointer hover:border-black/5 hover:shadow-2xl transition-all">
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

            {/* Add Project Modal */}
            {mounted && createPortal(
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-2xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="relative bg-white rounded-[2.5rem] p-8 max-w-6xl w-full shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.4em] mb-1">
                                        {formStep === 2 ? `${selectedTrackName} Specifications` : "Asset Integration"}
                                    </p>
                                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">New Base Project</h3>
                                    <div className="flex items-center gap-2 mt-3">
                                        <div className={`flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest ${formStep === 1 ? 'text-black' : 'text-gray-300'}`}><div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black transition-all ${formStep === 1 ? 'bg-black text-white' : 'bg-gray-200 text-gray-400'}`}>1</div>Classification</div>
                                        <div className={`w-6 h-px ${formStep === 2 ? 'bg-black' : 'bg-gray-200'}`} />
                                        <div className={`flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest ${formStep === 2 ? 'text-black' : 'text-gray-300'}`}><div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black transition-all ${formStep === 2 ? 'bg-black text-white' : 'bg-gray-200 text-gray-400'}`}>2</div>Specifications</div>
                                    </div>
                                </div>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-2.5 bg-gray-100 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all border border-gray-200"><XCircle className="w-5 h-5" /></button>
                            </div>

                            <form className="space-y-6 overflow-y-auto pr-4 custom-scrollbar" onSubmit={handleAddProjectSubmit}>
                                <div className={`${formStep !== 1 ? 'hidden' : 'space-y-6 animate-in fade-in duration-300'}`}>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Asset Category (Main Track)</label>
                                            <select 
                                                value={selectedCategory} 
                                                onChange={(e) => {
                                                    const cat = e.target.value;
                                                    setSelectedCategory(cat);
                                                    if (tracks[cat]?.[0]) setSelectedTrackName(tracks[cat][0].name);
                                                    else setSelectedTrackName("");
                                                }} 
                                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 text-sm font-bold outline-none cursor-pointer"
                                            >
                                                {Object.keys(tracks).map(cat => (
                                                    <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Specific Track</label>
                                            <select 
                                                name="track"
                                                value={selectedTrackName} 
                                                onChange={(e) => setSelectedTrackName(e.target.value)} 
                                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 text-sm font-bold outline-none cursor-pointer"
                                            >
                                                {(tracks[selectedCategory] || []).map(t => (
                                                    <option key={t.name} value={t.name}>{t.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Difficulty Matrix</label>
                                            <select name="difficulty" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 text-sm font-bold outline-none">
                                                <option value="Beginner">Beginner</option>
                                                <option value="Intermediate">Intermediate</option>
                                                <option value="Advanced">Advanced</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">TTL / Duration</label>
                                            <input name="deadline" defaultValue="1 Month" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 text-sm font-bold outline-none" />
                                        </div>
                                    </div>
                                    <div className="pt-2"><button type="button" onClick={() => setFormStep(2)} className="w-full py-4 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">Continue to Specifications <ArrowRight className="w-3.5 h-3.5" /></button></div>
                                </div>

                                <div className={`${formStep !== 2 ? 'hidden' : 'space-y-8 animate-in fade-in duration-300'}`}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <h4 className="text-[10px] font-black text-black uppercase tracking-[0.2em] border-l-4 border-black pl-3 mb-4">Project Identity</h4>
                                            <div className="space-y-1.5"><label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Problem Descriptor</label><input name="title" required className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[12px] font-bold outline-none" placeholder="Project Name..." /></div>
                                            <div className="space-y-1.5"><label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Detailed Description</label><textarea name="description" rows="5" required className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[12px] font-bold outline-none resize-none" placeholder="Detailed mission briefing..." /></div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="text-[10px] font-black text-black uppercase tracking-[0.2em] border-l-4 border-black pl-3">Requirement Architecture</h4>
                                                <button type="button" onClick={handleAddPhase} className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-md"><Plus className="w-3 h-3" /> Add Phase</button>
                                            </div>

                                            <div className="space-y-4">
                                                {formPhases.map((phase, pi) => (
                                                    <div key={pi} className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 space-y-3">
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex-1">
                                                                <input value={phase.name} onChange={(e) => handlePhaseNameChange(pi, e.target.value)} placeholder="Topic / Area Title" className="bg-transparent text-[11px] font-black text-indigo-500 uppercase tracking-widest outline-none w-full mb-1" />
                                                                <input value={phase.description} onChange={(e) => handlePhaseDescriptionChange(pi, e.target.value)} placeholder="Instructions..." className="bg-transparent text-[8px] font-medium text-gray-400 outline-none w-full" />
                                                            </div>
                                                            <button type="button" onClick={() => handleRemovePhase(pi)} className="text-rose-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                                                        </div>
                                                        <div className="space-y-4 pt-2">
                                                            {phase.fields.map((field, fi) => (
                                                                <div key={fi} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                                                                    <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="p-2 bg-indigo-50 rounded-xl">
                                                                                {field.type === 'text' && <Type className="w-3.5 h-3.5 text-indigo-600" />}
                                                                                {field.type === 'textarea' && <AlignLeft className="w-3.5 h-3.5 text-indigo-600" />}
                                                                                {field.type === 'link' && <Link className="w-3.5 h-3.5 text-indigo-600" />}
                                                                                {field.type === 'file' && <FileText className="w-3.5 h-3.5 text-indigo-600" />}
                                                                            </div>
                                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Requirement #{fi + 1}</span>
                                                                        </div>
                                                                        <button type="button" onClick={() => handleRemoveFieldFromPhase(pi, fi)} className="text-gray-300 hover:text-rose-500 transition-all"><XCircle className="w-4 h-4" /></button>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-6">
                                                                        <div className="space-y-1.5"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Topic / Label</label><input value={field.label} onChange={(e) => handleFieldChange(pi, fi, 'label', e.target.value)} placeholder="E.g. GitHub URL" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-[11px] font-bold outline-none shadow-sm" /></div>
                                                                        <div className="space-y-1.5"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Input Format</label><select value={field.type} onChange={(e) => handleFieldChange(pi, fi, 'type', e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-[10px] font-black uppercase outline-none shadow-sm cursor-pointer"><option value="text">Single Line</option><option value="textarea">Deep Block</option><option value="link">Hyperlink</option><option value="file">Asset/Doc</option></select></div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            <div className="grid grid-cols-3 gap-2">
                                                                <button type="button" onClick={() => handleAddFieldToPhase(pi, 'text')} className="py-1.5 border border-dashed border-gray-200 rounded-xl text-[8px] font-black text-gray-400 hover:text-indigo-500 transition-all flex items-center justify-center gap-1.5"><Type className="w-2.5 h-2.5" /> Text</button>
                                                                <button type="button" onClick={() => handleAddFieldToPhase(pi, 'link')} className="py-1.5 border border-dashed border-gray-200 rounded-xl text-[8px] font-black text-gray-400 hover:text-indigo-500 transition-all flex items-center justify-center gap-1.5"><Link className="w-2.5 h-2.5" /> Link</button>
                                                                <button type="button" onClick={() => handleAddFieldToPhase(pi, 'file')} className="py-1.5 border border-dashed border-gray-200 rounded-xl text-[8px] font-black text-gray-400 hover:text-indigo-500 transition-all flex items-center justify-center gap-1.5"><FileText className="w-2.5 h-2.5" /> File</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                                        <button type="button" onClick={() => setFormStep(1)} className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-xl text-[9px] font-black transition-all">← Back</button>
                                        <button type="submit" className="flex-[2] py-4 bg-black text-white rounded-xl text-[9px] font-black uppercase shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-3">Deploy project <ArrowRight className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>, document.body)}

            {/* Edit Project Modal */}
            {mounted && createPortal(
            <AnimatePresence>
                {isEditModalOpen && editingProject && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-2xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="relative bg-white rounded-[2.5rem] p-8 max-w-6xl w-full shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
                            <div className="flex justify-between items-center mb-6">
                                <div><h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Modify Asset</h3></div>
                                <button onClick={() => setIsEditModalOpen(false)} className="p-2 bg-gray-50 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all border border-gray-100"><XCircle className="w-5 h-5" /></button>
                            </div>

                            <form className="space-y-8 overflow-y-auto pr-4 custom-scrollbar" onSubmit={handleEditProjectSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black text-black uppercase tracking-[0.2em] border-l-4 border-black pl-3 mb-4">Phase I: Classification</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5"><label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Asset Category</label><div className="w-full bg-gray-100 rounded-xl px-4 py-3 text-[12px] font-black text-gray-500 uppercase">{editingProject.category || "CODING"}</div></div>
                                            <div className="space-y-1.5"><label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Specific Track</label><select name="track" defaultValue={editingProject.track} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[12px] font-bold outline-none">{(tracks[editingProject.category || "CODING"] || []).map(t => <option key={t.name} value={t.name}>{t.name}</option>)}</select></div>
                                        </div>
                                        <div className="space-y-1.5"><label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Problem Descriptor</label><input name="title" defaultValue={editingProject.title} required className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[12px] font-bold outline-none" /></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5"><label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Difficulty Matrix</label><select name="difficulty" defaultValue={editingProject.difficulty} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[12px] font-bold outline-none"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></div>
                                            <div className="space-y-1.5"><label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">TTL / Duration</label><input name="deadline" defaultValue={editingProject.deadline} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[12px] font-bold outline-none" /></div>
                                        </div>
                                        <div className="space-y-1.5"><label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Detailed Briefing</label><textarea name="description" defaultValue={editingProject.description} rows="4" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[12px] font-bold outline-none resize-none" /></div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-[10px] font-black text-black uppercase tracking-[0.2em] border-l-4 border-black pl-3">Requirement Architecture</h4>
                                            <button type="button" onClick={handleAddPhase} className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"><Plus className="w-3 h-3" /> Add Phase</button>
                                        </div>
                                        <div className="space-y-4">
                                            {formPhases.map((phase, pi) => (
                                                <div key={pi} className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex-1">
                                                            <input value={phase.name} onChange={(e) => handlePhaseNameChange(pi, e.target.value)} placeholder="Topic / Area Title" className="bg-transparent text-[11px] font-black text-indigo-500 uppercase tracking-widest outline-none w-full mb-1" />
                                                            <input value={phase.description} onChange={(e) => handlePhaseDescriptionChange(pi, e.target.value)} placeholder="Instructions..." className="bg-transparent text-[8px] font-medium text-gray-400 outline-none w-full" />
                                                        </div>
                                                        <button type="button" onClick={() => handleRemovePhase(pi)} className="text-rose-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                    <div className="space-y-4 pt-2">
                                                        {phase.fields.map((field, fi) => (
                                                            <div key={fi} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                                                                <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="p-2 bg-indigo-50 rounded-xl">
                                                                            {field.type === 'text' && <Type className="w-3.5 h-3.5 text-indigo-600" />}
                                                                            {field.type === 'textarea' && <AlignLeft className="w-3.5 h-3.5 text-indigo-600" />}
                                                                            {field.type === 'link' && <Link className="w-3.5 h-3.5 text-indigo-600" />}
                                                                            {field.type === 'file' && <FileText className="w-3.5 h-3.5 text-indigo-600" />}
                                                                        </div>
                                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Requirement #{fi + 1}</span>
                                                                    </div>
                                                                    <button type="button" onClick={() => handleRemoveFieldFromPhase(pi, fi)} className="text-gray-300 hover:text-rose-500 transition-all"><XCircle className="w-4 h-4" /></button>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-6">
                                                                    <div className="space-y-1.5"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Topic / Label</label><input value={field.label} onChange={(e) => handleFieldChange(pi, fi, 'label', e.target.value)} placeholder="E.g. GitHub URL" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-[11px] font-bold outline-none shadow-sm" /></div>
                                                                    <div className="space-y-1.5"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Input Format</label><select value={field.type} onChange={(e) => handleFieldChange(pi, fi, 'type', e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-[10px] font-black uppercase outline-none shadow-sm cursor-pointer"><option value="text">Single Line</option><option value="textarea">Deep Block</option><option value="link">Hyperlink</option><option value="file">Asset/Doc</option></select></div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <div className="grid grid-cols-3 gap-2">
                                                            <button type="button" onClick={() => handleAddFieldToPhase(pi, 'text')} className="py-1.5 border border-dashed border-gray-200 rounded-xl text-[8px] font-black text-gray-400 hover:text-indigo-500 transition-all flex items-center justify-center gap-1.5"><Type className="w-2.5 h-2.5" /> Text</button>
                                                            <button type="button" onClick={() => handleAddFieldToPhase(pi, 'link')} className="py-1.5 border border-dashed border-gray-200 rounded-xl text-[8px] font-black text-gray-400 hover:text-indigo-500 transition-all flex items-center justify-center gap-1.5"><Link className="w-2.5 h-2.5" /> Link</button>
                                                            <button type="button" onClick={() => handleAddFieldToPhase(pi, 'file')} className="py-1.5 border border-dashed border-gray-200 rounded-xl text-[8px] font-black text-gray-400 hover:text-indigo-500 transition-all flex items-center justify-center gap-1.5"><FileText className="w-2.5 h-2.5" /> File</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-6 flex gap-4 border-t border-gray-100">
                                    <button type="button" onClick={() => setProjectToDelete(editingProject._id || editingProject.id)} className="px-6 py-4 bg-rose-50 text-rose-600 rounded-2xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2 border border-rose-100"><Trash2 className="w-4 h-4" /> Remove Asset</button>
                                    <button type="submit" className="flex-1 py-4 bg-black text-white rounded-2xl text-[9px] font-black uppercase shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2">Sync Protocol Changes <ArrowRight className="w-3.5 h-3.5" /></button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>, document.body)}

            {/* Proposal Details Modal omitted for brevity, same as original structure but using formPhases */}
             {mounted && createPortal(
             <AnimatePresence>
                {isDetailsModalOpen && selectedRequest && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDetailsModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="relative bg-white rounded-[2rem] max-w-4xl w-full shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]">
                            <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 ${selectedRequest.projectType === 'preset' ? 'bg-indigo-600' : 'bg-black'} text-white text-[6px] font-black uppercase tracking-[0.2em] rounded-full`}>
                                                {selectedRequest.projectType === 'preset' ? 'Preset Selection' : 'Custom Proposal'}
                                            </span>
                                            <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">{selectedRequest.requestedAt ? new Date(selectedRequest.requestedAt).toLocaleDateString() : 'Active'}</span>
                                        </div>
                                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight leading-tight">{selectedRequest.projectName || selectedRequest.title}</h2>
                                        <div className="flex items-center gap-1.5 text-gray-500">
                                            <div className="w-5 h-5 rounded-full bg-gray-100 border border-white shadow-sm flex items-center justify-center text-[7px] font-black">{selectedRequest.internName?.substring(0, 2) || 'JD'}</div>
                                            <p className="text-[8px] font-black uppercase tracking-widest">{selectedRequest.internName}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsDetailsModalOpen(false)} className="p-2 bg-white rounded-xl border border-gray-100 hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm"><XCircle className="w-5 h-5" /></button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                <div className="space-y-2">
                                    <h4 className="text-[7px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-1.5"><FileText className="w-3 h-3" /> Scope Overview</h4>
                                    <p className="text-[11px] text-gray-600 font-bold leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100/50">{selectedRequest.description}</p>
                                </div>

                                {selectedRequest.formPhases && selectedRequest.formPhases.length > 0 && (
                                    <div className="space-y-6 pt-6 border-t border-gray-100">
                                        <h4 className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-4">Mission Implementation Protocol</h4>
                                        <div className="space-y-8">
                                            {selectedRequest.formPhases.map((phase, pi) => (
                                                <div key={pi} className="space-y-3 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100/50 transition-all hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 group">
                                                    <div className="space-y-2 mb-4 ml-9">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">{pi + 1}</div>
                                                            <h5 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{phase.name}</h5>
                                                        </div>
                                                        {phase.description && <p className="text-[9px] font-bold text-gray-400 leading-relaxed max-w-6xl px-1">{phase.description}</p>}
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-9 pb-2">
                                                        {phase.fields.map((field, fi) => (
                                                            <div key={fi} className="space-y-1">
                                                                <p className="text-[7px] font-black text-gray-400 uppercase tracking-[0.2em]">{field.label}</p>
                                                                <div className="text-[11px] font-bold text-gray-700 break-words leading-relaxed">
                                                                    {field.type === 'link' ? (
                                                                        <a href={selectedRequest.dynamicFields?.[field.label]} target="_blank" rel="noreferrer" className="text-indigo-500 hover:text-indigo-700 underline underline-offset-4 decoration-indigo-200 decoration-2">{selectedRequest.dynamicFields?.[field.label] || "Missing Link"}</a>
                                                                    ) : (
                                                                        selectedRequest.dynamicFields?.[field.label] || "Not Specified"
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-5 border-t border-gray-50 bg-gray-50/30 flex gap-3">
                                <button onClick={() => handleAction(selectedRequest._id || selectedRequest.id, 'reject')} className="px-4 py-3 bg-white hover:bg-rose-50 hover:text-rose-600 rounded-lg text-[8px] font-black uppercase transition-all border border-gray-200">Dismiss</button>
                                <button onClick={() => handleAction(selectedRequest._id || selectedRequest.id, 'approve')} className="flex-1 py-3 bg-black hover:bg-emerald-600 text-white rounded-lg text-[8px] font-black uppercase transition-all flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02]"><CheckCircle2 className="w-3.5 h-3.5" /> Confirm Deployment</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>, document.body)}

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
