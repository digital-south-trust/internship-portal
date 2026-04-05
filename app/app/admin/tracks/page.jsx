"use client";

import { useState, useEffect } from "react";
import { 
    Plus, 
    Edit3, 
    Trash2, 
    ArrowRight, 
    ChevronRight, 
    RefreshCw, 
    Layout, 
    Search,
    ChevronDown,
    X,
    ArrowLeft,
    Snowflake,
    Play
} from "lucide-react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminTracksPage() {
    const [tracks, setTracks] = useState([]);
    const [isAddTrackModalOpen, setIsAddTrackModalOpen] = useState(false);
    const [isTrackEditModalOpen, setIsTrackEditModalOpen] = useState(false);
    const [editingTrack, setEditingTrack] = useState(null);
    const [deleteTrackTarget, setDeleteTrackTarget] = useState(null);
    const [newTrackCategory, setNewTrackCategory] = useState("");
    const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [categorySource, setCategorySource] = useState("CHOICE"); // CHOICE or MANAGE
    const [newCategoryName, setNewCategoryName] = useState("");
    const [apiCategories, setApiCategories] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isCategoryManageModalOpen, setIsCategoryManageModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [editCategoryName, setEditCategoryName] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL');
    const [trackForm, setTrackForm] = useState({ name: "", description: "" });

    // --- State Persistence ---
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedFilter = sessionStorage.getItem('tr_activeCategoryFilter');
            if (savedFilter) setActiveCategoryFilter(savedFilter);
        }
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('tr_activeCategoryFilter', activeCategoryFilter);
        }
    }, [activeCategoryFilter]);

    const fetchTracks = async () => {
        setIsRefreshing(true);
        try {
            const [tracksRes, catsRes] = await Promise.all([
                fetch("/api/admin/tracks"),
                fetch("/api/admin/tracks/categories")
            ]);
            if (tracksRes.ok) {
                const tracksText = await tracksRes.text();
                try {
                    const data = JSON.parse(tracksText);
                    setTracks(data);
                } catch (err) {
                    console.error("SyntaxError: /api/admin/tracks response is not valid JSON.", tracksText.substring(0, 500));
                    throw err;
                }
            }
            if (catsRes.ok) {
                const catsText = await catsRes.text();
                try {
                    const catsData = JSON.parse(catsText);
                    setApiCategories(catsData);
                } catch (err) {
                    console.error("SyntaxError: /api/admin/tracks/categories response is not valid JSON.", catsText.substring(0, 500));
                    throw err;
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTracks();
    }, []);

    const handleAddTrackSubmit = async (e) => {
        if (e) e.preventDefault();
        const { name, description } = trackForm;
        const category = newTrackCategory;
        if (!name || !description || !category) {
            toast.error("Please fill in all fields.");
            return;
        }
        try {
            const res = await fetch("/api/admin/tracks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, description, category })
            });
            if (res.ok) {
                toast.success("New Academic Track Added.");
                fetchTracks();
                setIsAddTrackModalOpen(false);
                setTrackForm({ name: "", description: "" });
                setNewTrackCategory("");
            } else {
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const data = await res.json();
                    toast.error(`Track could not be added: ${data.message || data.error || 'Server error'}`); 
                } else {
                    toast.error("Track could not be added: Server returned an HTML error page.");
                }
            }
        } catch (err) { toast.error("Error creating track."); }
    };

    const handleEditTrackSubmit = async (e) => {
        if (e) e.preventDefault();
        const { name, description } = trackForm;
        if (!name || !description || !newTrackCategory) {
            toast.error("Please fill in all fields.");
            return;
        }
        try {
            const res = await fetch("/api/admin/tracks", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    id: editingTrack._id || editingTrack.id, 
                    name, 
                    description, 
                    category: newTrackCategory,
                    status: editingTrack.status // Preserve current status
                })
            });
            if (res.ok) {
                toast.success("Track Configuration Updated.");
                fetchTracks();
                setIsTrackEditModalOpen(false);
                setEditingTrack(null);
                setTrackForm({ name: "", description: "" });
            } else { toast.error("Could not update track."); }
        } catch (err) { toast.error("Error updating track."); }
    };

    const handleDeleteTrack = async (id) => {
        try {
            const res = await fetch(`/api/admin/tracks?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Track successfully removed.");
                fetchTracks();
                setDeleteTrackTarget(null);
            } else { toast.error("Could not delete track."); }
        } catch (err) { toast.error("Error deleting track."); }
    };

    const handleToggleTrackStatus = async (track) => {
        const newStatus = track.status === 'FROZEN' ? 'ACTIVE' : 'FROZEN';
        const tid = toast.loading(`${newStatus === 'FROZEN' ? 'Freezing' : 'Activating'} track...`);
        try {
            const res = await fetch("/api/admin/tracks", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    id: track._id || track.id, 
                    status: newStatus 
                })
            });
            if (res.ok) {
                toast.success(`Track ${newStatus === 'FROZEN' ? 'Frozen' : 'Activated'}`, { id: tid });
                fetchTracks();
            } else { toast.error("Update failed", { id: tid }); }
        } catch (err) { toast.error("Error", { id: tid }); }
    };

    const allTracksList = Array.isArray(tracks) ? tracks : Object.values(tracks).flat();
    const trackDerivedCategories = allTracksList.map(t => t.category).filter(Boolean);
    const explicitCategories = apiCategories.map(c => c.name).filter(Boolean);
    const distinctCategories = Array.from(new Set([...trackDerivedCategories, ...explicitCategories]));

    const handleAddCategorySubmit = async (e) => {
        e.preventDefault();
        if (!newCategoryName) { toast.error("Provide a valid title."); return; }
        const tid = toast.loading("Saving Track Title...");
        try {
            const res = await fetch("/api/admin/tracks/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newCategoryName })
            });
            if (res.ok) {
                toast.success(`Title "${newCategoryName}" created!`, { id: tid });
                setIsCategoryModalOpen(false);
                setNewCategoryName("");
                fetchTracks();
            } else {
                toast.error("Title may already exist.", { id: tid });
            }
        } catch (err) {
            toast.error("Network Error", { id: tid });
        }
    };

    const handleEditCategory = async (e) => {
        e.preventDefault();
        if (!editCategoryName) return;
        const tid = toast.loading("Updating Title...");
        try {
            const res = await fetch("/api/admin/tracks/categories", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: editingCategory._id, name: editCategoryName })
            });
            if (res.ok) {
                toast.success("Title Updated", { id: tid });
                setEditingCategory(null);
                fetchTracks();
            } else toast.error("Failed to update", { id: tid });
        } catch (err) { toast.error("Error", { id: tid }); }
    };

    const handleDeleteCategory = async (id) => {
        if (!confirm("Warning: Deleting a Title will NOT delete the tracks inside it, but they will become uncategorized. Proceed?")) return;
        const tid = toast.loading("Removing Title...");
        try {
            const res = await fetch(`/api/admin/tracks/categories?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Title Removed", { id: tid });
                fetchTracks();
            } else toast.error("Failed to remove", { id: tid });
        } catch (err) { toast.error("Error", { id: tid }); }
    };

    const filteredTracks = allTracksList
        .filter(t => {
            const matchesSearch = (t.name || "").toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategoryFilter === 'ALL' || t.category === activeCategoryFilter;
            return matchesSearch && matchesCategory;
        })
        .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    return (
        <div className="animate-in fade-in duration-500">
            <AnimatePresence mode="wait">
                {/* Standardized Tactical Header */}
                <header key="header" className="sticky top-0 z-50 bg-white/95 backdrop-blur-3xl -mx-8 -mt-8 px-8 py-5 border-b border-gray-100 shadow-sm mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-8 bg-black rounded-full" />
                        <h1 className="text-2xl font-black text-black tracking-tighter uppercase leading-none">
                            Tracks
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative w-56">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search tracks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-11 pr-4 py-2.5 text-[10px] font-bold focus:ring-4 focus:ring-black/5 outline-none transition-all shadow-sm"
                            />
                        </div>
                        <div className="relative">
                            <select
                                value={activeCategoryFilter}
                                onChange={(e) => setActiveCategoryFilter(e.target.value)}
                                className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-black/5 transition-all appearance-none cursor-pointer pr-10 shadow-sm"
                            >
                                <option value="ALL">All Categories</option>
                                {distinctCategories.map((cat, idx) => (
                                    <option key={`filter-${cat}-${idx}`} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        </div>
                        <button
                            onClick={fetchTracks}
                            className="p-2.5 bg-gray-50 hover:bg-black hover:text-white rounded-xl transition-all border border-gray-100 shadow-sm"
                        >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={() => setIsCategoryManageModalOpen(true)}
                            className="px-6 py-3 bg-white border border-gray-100 text-black rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm"
                        >
                            <Layout className="w-4 h-4" /> Titles
                        </button>
                        <button
                            onClick={() => { 
                                setIsAddTrackModalOpen(true); 
                                setEditingTrack(null); 
                                setNewTrackCategory(""); 
                                setTrackForm({ name: "", description: "" });
                            }}
                            className="px-6 py-3 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/10"
                        >
                            <Plus className="w-4 h-4" /> New Track
                        </button>
                    </div>
                </div>
                </header>

                {/* Track Table */}
                <div className="px-4 pb-20 max-w-[1750px] mx-auto">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Table Header Row */}
                    <div className="grid grid-cols-[2fr_1fr_1fr_120px] gap-4 px-6 py-3 bg-gray-50/60 border-b border-gray-100">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Track Name</span>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Category</span>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</span>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-right pr-4">Actions</span>
                    </div>

                    {/* Rows */}
                    {filteredTracks.length === 0 ? (
                        <div className="py-24 text-center">
                            <Layout className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No matching tracks found</p>
                        </div>
                    ) : (
                        filteredTracks.map((track, i) => (
                            <motion.div
                                key={track._id || track.id || i}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="grid grid-cols-[2fr_1fr_1fr_120px] gap-4 px-6 py-4 border-b border-gray-50 last:border-0 items-center hover:bg-gray-50/50 transition-colors group"
                            >
                                <div key={`track-info-${track._id || track.id || i}`}>
                                    <p className="text-sm font-black text-black uppercase tracking-wide">{track.name}</p>
                                    {track.description && (
                                        <p className="text-[10px] text-gray-400 font-medium mt-0.5 line-clamp-1">{track.description}</p>
                                    )}
                                </div>
                                <div key={`track-cat-${track._id || track.id || i}`}>
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                        track.category === 'CODING'
                                            ? 'bg-blue-50 text-blue-600 border-blue-100'
                                            : track.category === 'RESEARCH'
                                            ? 'bg-violet-50 text-violet-600 border-violet-100'
                                            : 'bg-black text-white border-black shadow-sm'
                                    }`}>
                                        {track.category}
                                    </span>
                                </div>
                                <div key={`track-status-${track._id || track.id || i}`}>
                                    <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${track.status === 'FROZEN' ? 'text-amber-500' : 'text-emerald-600'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${track.status === 'FROZEN' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                        {track.status || 'ACTIVE'}
                                    </span>
                                </div>
                                <div key={`track-actions-${track._id || track.id || i}`} className="flex items-center justify-end gap-1">
                                    <button
                                        onClick={() => handleToggleTrackStatus(track)}
                                        title={track.status === 'FROZEN' ? 'Start Track' : 'Freeze Track'}
                                        className={`p-2 transition-all hover:scale-125 ${track.status === 'FROZEN' ? 'text-emerald-500' : 'text-amber-500'}`}
                                    >
                                        {track.status === 'FROZEN' ? <Play className="w-4 h-4 fill-current" /> : <Snowflake className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => { 
                                            setEditingTrack(track); 
                                            setNewTrackCategory(track.category || ""); 
                                            setTrackForm({ name: track.name || "", description: track.description || "" });
                                            setIsTrackEditModalOpen(true); 
                                        }}
                                        className="p-2 text-gray-400 hover:text-black hover:scale-125 transition-all"
                                        title="Edit Track"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteTrackTarget(track)}
                                        className="p-2 text-gray-300 hover:text-rose-500 hover:scale-125 transition-all"
                                        title="Delete Track"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
                {filteredTracks.length > 0 && (
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-4 text-right">
                        {filteredTracks.length} track{filteredTracks.length !== 1 ? 's' : ''} found
                    </p>
                )}
                </div>



                {isCategoryManageModalOpen && (
                    <div key="manage-titles-overlay" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCategoryManageModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden">
                            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shadow-lg shadow-black/10">
                                        <Layout className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black uppercase tracking-tighter text-black">Manage Titles</h2>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Edit or remove parent categories</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsCategoryManageModalOpen(false)} className="w-10 h-10 bg-white border border-gray-100 text-gray-400 hover:text-black rounded-xl flex items-center justify-center transition-all hover:bg-gray-50"><X className="w-4 h-4" /></button>
                            </div>
                            <div className="p-8 max-h-[400px] overflow-y-auto space-y-3">
                                {apiCategories.map((cat, idx) => (
                                    <div key={cat._id || `cat-${idx}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                                        {editingCategory?._id === cat._id ? (
                                            <form onSubmit={handleEditCategory} className="flex items-center gap-3 w-full">
                                                <input 
                                                    value={editCategoryName} 
                                                    onChange={(e) => setEditCategoryName(e.target.value)}
                                                    className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs font-bold outline-none uppercase"
                                                    autoFocus
                                                />
                                                <button type="submit" className="px-4 py-2 bg-black text-white rounded-xl text-[9px] font-black uppercase">Save</button>
                                                <button type="button" onClick={() => setEditingCategory(null)} className="text-[9px] font-black text-gray-400 uppercase">Cancel</button>
                                            </form>
                                        ) : (
                                            <>
                                                <span className="text-xs font-black text-black uppercase tracking-wide">{cat.name}</span>
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => { setEditingCategory(cat); setEditCategoryName(cat.name); }} className="p-2 text-gray-400 hover:text-black transition-colors">
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => handleDeleteCategory(cat._id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="p-8 bg-gray-50/50 border-t border-gray-100">
                                <button onClick={() => { setIsCategoryManageModalOpen(false); setIsCategoryModalOpen(true); setCategorySource("MANAGE"); }} className="w-full py-4 bg-white border border-gray-200 text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                                    <Plus className="w-4 h-4" /> Add New Title
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {isCategoryModalOpen && (
                    <div key="academic-title-overlay" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCategoryModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl relative z-10 overflow-hidden">
                            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                                <div className="flex items-center gap-5">
                                    <button type="button" onClick={() => { 
                                        setIsCategoryModalOpen(false); 
                                        if (categorySource === "MANAGE") {
                                            setIsCategoryManageModalOpen(true);
                                        }
                                    }} className="w-10 h-10 bg-white border border-gray-100 text-gray-400 hover:text-black rounded-full flex items-center justify-center transition-all hover:bg-gray-50 hover:scale-105 active:scale-95 shadow-sm" title="Back">
                                        <ArrowLeft className="w-4 h-4" />
                                    </button>
                                    <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg shadow-black/10">
                                        <Layout className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black uppercase tracking-tighter text-black">Academic Title</h2>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Initialize parent category</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsCategoryModalOpen(false)} className="w-10 h-10 bg-white border border-gray-100 text-gray-400 hover:text-black rounded-xl flex items-center justify-center transition-all hover:bg-gray-50"><X className="w-4 h-4" /></button>
                            </div>
                            <form onSubmit={handleAddCategorySubmit} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Title Name (e.g. MARKETING)</label>
                                    <input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Enter title name..." className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:ring-4 focus:ring-black/5 transition-all uppercase" required autoFocus />
                                </div>
                                <button type="submit" className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all shadow-xl shadow-black/10">Establish Title</button>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Add / Edit Form Modal */}
                {(isAddTrackModalOpen || isTrackEditModalOpen) && (
                <div key="track-form-overlay" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => { setIsAddTrackModalOpen(false); setIsTrackEditModalOpen(false); }}
                    />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden"
                        >
                            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                                <div className="flex items-center gap-5">

                                    <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg shadow-black/10">
                                        {isTrackEditModalOpen ? <Edit3 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black uppercase tracking-tighter text-black">
                                            {isTrackEditModalOpen ? 'Edit Configuration' : 'Initialize Track'}
                                        </h2>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                            Primary Track Setup
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => { setIsAddTrackModalOpen(false); setIsTrackEditModalOpen(false); }} className="w-10 h-10 bg-white border border-gray-100 text-gray-400 hover:text-black rounded-xl flex items-center justify-center transition-all hover:bg-gray-50">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={e => { e.preventDefault(); isTrackEditModalOpen ? handleEditTrackSubmit(e) : handleAddTrackSubmit(e); }} className="p-8">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Track Designation</label>
                                            <input
                                                name="name"
                                                value={trackForm.name}
                                                onChange={(e) => setTrackForm({ ...trackForm, name: e.target.value })}
                                                placeholder="e.g., Fullstack Engineering"
                                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:ring-4 focus:ring-black/5 transition-all"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Functional Category</label>
                                            <div className="relative">
                                                <select
                                                    value={newTrackCategory}
                                                    onChange={(e) => setNewTrackCategory(e.target.value)}
                                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:ring-4 focus:ring-black/5 transition-all appearance-none cursor-pointer pr-10"
                                                    required
                                                >
                                                    <option value="" disabled>Select parent title...</option>
                                                    {distinctCategories.map((cat, idx) => (
                                                        <option key={`form-cat-${cat}-${idx}`} value={cat}>{cat}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Description</label>
                                        <textarea
                                            name="description"
                                            value={trackForm.description}
                                            onChange={(e) => setTrackForm({ ...trackForm, description: e.target.value })}
                                            placeholder="Primary objectives and focus areas..."
                                            rows={4}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:ring-4 focus:ring-black/5 transition-all resize-none"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="mt-8 flex items-center justify-end pt-6 border-t border-gray-50">
                                    <button type="submit" className="px-10 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-black/10 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                                        {isTrackEditModalOpen ? 'Update Track' : 'Establish Track'}
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {/* Delete Confirm */}
                {deleteTrackTarget && (
                    <div key="delete-confirm-overlay" className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setDeleteTrackTarget(null)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-md rounded-[2.5rem] p-10 text-center relative z-10">
                            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trash2 className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tighter">Decommission Track</h3>
                            <p className="text-xs font-bold text-gray-400 mt-2 mb-8 leading-relaxed">
                                Are you absolutely sure you want to remove <span className="text-black">{deleteTrackTarget.name}</span>? This action is irreversible.
                            </p>
                            <div className="flex gap-4">
                                <button onClick={() => setDeleteTrackTarget(null)} className="flex-1 py-4 bg-gray-50 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all">Cancel</button>
                                <button onClick={() => handleDeleteTrack(deleteTrackTarget._id || deleteTrackTarget.id)} className="flex-1 py-4 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20">Remove</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
