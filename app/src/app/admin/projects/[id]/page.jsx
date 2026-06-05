"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
    ArrowLeft,
    Save,
    Trash2,
    Plus,
    X,
    Type,
    AlignLeft,
    Link,
    FileText,
    Download
} from "lucide-react";

export default function AdminProjectDetail() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id;

    const [project, setProject] = useState(null);
    const [tracks, setTracks] = useState({ CODING: [], RESEARCH: [] });
    const [loading, setLoading] = useState(true);

    const [selectedCategory, setSelectedCategory] = useState("CODING");
    const [selectedTrackName, setSelectedTrackName] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [difficulty, setDifficulty] = useState("Intermediate");
    const [deadline, setDeadline] = useState("1 Month");
    const [projectType, setProjectType] = useState("Coding Project");

    const [formPhases, setFormPhases] = useState([]);
    const [formTopics, setFormTopics] = useState([]);
    const [uploadedDocUrl, setUploadedDocUrl] = useState("");
    const [uploadedDocName, setUploadedDocName] = useState("");
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!id) return;
        
        const fetchData = async () => {
            try {
                // Fetch tracks and project
                const [projectRes, tracksRes] = await Promise.all([
                    fetch(`/api/admin/projects/pool?id=${id}`),
                    fetch("/api/admin/tracks")
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
                }

                if (projectRes.ok) {
                    const data = await projectRes.json();
                    setProject(data);
                    
                    // Populate fields
                    setTitle(data.title || "");
                    setDescription(data.description || "");
                    setSelectedCategory(data.category || "CODING");
                    setSelectedTrackName(data.track || "");
                    setDifficulty(data.difficulty || "Intermediate");
                    setDeadline(data.deadline || data.duration || "1 Month");
                    setProjectType(data.type || "Coding Project");
                    setFormPhases(data.formPhases || []);
                    setFormTopics(data.topics || []);
                    setUploadedDocUrl(data.documentLink || "");
                    setUploadedDocName(data.documentFile || "");
                } else {
                    toast.error("Project not found in pool.");
                    router.push("/admin/projects");
                }
            } catch (err) {
                console.error("Error loading data:", err);
                toast.error("Error loading project data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    // Track state helpers
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

    // Form Submit
    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);

        const updatedData = {
            id: id,
            title,
            description,
            category: selectedCategory,
            track: selectedTrackName,
            difficulty,
            deadline,
            type: projectType,
            formPhases: formPhases,
            topics: formTopics,
            documentFile: uploadedDocName,
            documentLink: uploadedDocUrl
        };

        try {
            const res = await fetch('/api/admin/projects/pool', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });

            if (res.ok) {
                toast.success("Project Configuration Synced Successfully");
                router.push("/admin/projects");
            } else {
                toast.error("Failed to Sync Configuration");
            }
        } catch (err) {
            console.error(err);
            toast.error("Network error saving project.");
        } finally {
            setSaving(false);
        }
    };

    // Delete project
    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this project template from the pool?")) return;
        setDeleting(true);

        try {
            const res = await fetch(`/api/admin/projects/pool?id=${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                toast.success("Project Template Deleted");
                router.push("/admin/projects");
            } else {
                toast.error("Deletion Failed");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error deleting project.");
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading Configuration...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500 min-h-screen bg-gray-50/50 pb-20">
            
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-3xl -mx-8 -mt-8 px-8 py-5 border-b border-gray-100 shadow-sm flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push("/admin/projects")}
                        className="p-2 hover:bg-gray-50 rounded-xl transition-all border border-transparent hover:border-gray-100"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-800" />
                    </button>
                   
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleDelete}
                        disabled={deleting || saving}
                        className="px-5 py-3 bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5"
                    >
                        <Trash2 className="w-3.5 h-3.5" /> Delete 
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || deleting}
                        className="px-6 py-3 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-[1.02] transition-all shadow-md"
                    >
                        <Save className="w-3.5 h-3.5" /> {saving ? "Saving Changes..." : "Save"}
                    </button>
                </div>
            </header>

            <main className="max-w-[1750px] mx-auto px-8 -mt-10 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* Left Column - Classification & Basic Details */}
                    <div className="lg:col-span-6 bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/10 p-8 space-y-6">
                         
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Asset Category</label>
                                <select 
                                    value={selectedCategory} 
                                    onChange={(e) => {
                                        const cat = e.target.value;
                                        setSelectedCategory(cat);
                                        if (tracks[cat]?.[0]) setSelectedTrackName(tracks[cat][0].name);
                                        else setSelectedTrackName("");
                                    }} 
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none cursor-pointer"
                                >
                                    {Object.keys(tracks).map(cat => (
                                        <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Specific Track</label>
                                <select 
                                    value={selectedTrackName} 
                                    onChange={(e) => setSelectedTrackName(e.target.value)} 
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none cursor-pointer"
                                >
                                    {(tracks[selectedCategory] || []).map(t => (
                                        <option key={t.name} value={t.name}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Project Name</label>
                            <input 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required 
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none" 
                                placeholder="Project title..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Difficulty Matrix</label>
                                <select 
                                    value={difficulty} 
                                    onChange={(e) => setDifficulty(e.target.value)} 
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none cursor-pointer"
                                >
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">TTL / Duration</label>
                                <input 
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none" 
                                    placeholder="e.g. 1 Month"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Detailed Description</label>
                            <textarea 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows="12" 
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none resize-none min-h-[220px]" 
                                placeholder="Detailed project mission briefing..."
                            />
                        </div>

                        {/* Reference Document Upload */}
                        <div className="space-y-1.5 pt-4 border-t border-gray-100">
                            <label className="text-[10px] font-black text-black uppercase tracking-[0.2em] border-l-4 border-black pl-3 mb-2 block">Reference Document</label>
                            <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-xl p-4">
                                <input 
                                    type="file" 
                                    accept=".pdf,.doc,.docx,.xls,.xlsx" 
                                    onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        const uploadForm = new FormData();
                                        uploadForm.append("document", file);
                                        
                                        const toastId = toast.loading("Uploading document to storage...");
                                        try {
                                            const res = await fetch("/api/admin/projects/upload-document", {
                                                method: "POST",
                                                body: uploadForm
                                            });
                                            if (res.ok) {
                                                const data = await res.json();
                                                setUploadedDocUrl(data.cdnUrl);
                                                setUploadedDocName(file.name);
                                                toast.success("Document uploaded successfully", { id: toastId });
                                            } else {
                                                toast.error("Upload failed", { id: toastId });
                                            }
                                        } catch (err) {
                                            console.error(err);
                                            toast.error("Upload error", { id: toastId });
                                        }
                                    }}
                                    className="text-[10px] text-gray-500 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-[9px] file:font-semibold file:bg-black file:text-white hover:file:opacity-90 cursor-pointer w-full"
                                />
                            </div>
                            {uploadedDocUrl && (
                                <div className="mt-2 text-[10px] font-semibold text-emerald-600 flex items-center justify-between bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                                    <span className="truncate max-w-[250px]">{uploadedDocName || "Document Uploaded"}</span>
                                    <div className="flex items-center gap-2">
                                        <a href={uploadedDocUrl} target="_blank" rel="noopener noreferrer" className="underline uppercase tracking-wider text-[9px] hover:text-emerald-700">View</a>
                                        <button 
                                            type="button" 
                                            onClick={() => { setUploadedDocUrl(""); setUploadedDocName(""); }} 
                                            className="text-rose-500 hover:underline uppercase tracking-wider text-[9px]"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Study Topics & Requirement Architecture */}
                    <div className="lg:col-span-6 space-y-10 bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/10 p-8">
                        
                        {/* Study Topics & Resources */}
                        <div className="space-y-6">
                            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                                <h4 className="text-[10px] font-black text-black uppercase tracking-[0.2em] border-l-4 border-black pl-3">Study Topics & Resources</h4>
                                <button 
                                    type="button" 
                                    onClick={handleAddTopic} 
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-md"
                                >
                                    <Plus className="w-3 h-3 text-[#ccff00]" /> Add Topic
                                </button>
                            </div>

                            <div className="space-y-4 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
                                {formTopics.length === 0 ? (
                                    <div className="p-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">No study topics added yet</p>
                                        <p className="text-[9px] text-gray-400 mt-1">Add topics to guide interns during this project.</p>
                                    </div>
                                ) : (
                                    formTopics.map((topic, ti) => (
                                        <div key={ti} className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 space-y-4">
                                            <div className="space-y-1">
                                                <label className="block text-[8px] font-black text-black uppercase tracking-[0.2em] border-b border-black/10 pb-1">Topic Title</label>
                                                <input 
                                                    value={topic.title} 
                                                    onChange={(e) => handleTopicTitleChange(ti, e.target.value)} 
                                                    placeholder="Topic Title (e.g., Intro to Blockchain)" 
                                                    className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-[11px] font-black text-black uppercase tracking-widest outline-none w-full shadow-sm" 
                                                />
                                            </div>
                                            <div className="flex justify-between items-center pt-1 border-t border-gray-200/40">
                                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Subtopics</span>
                                                <div className="flex items-center gap-3">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleAddSubtopic(ti)} 
                                                        className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 bg-black text-white rounded-lg hover:scale-105 transition-all"
                                                    >
                                                        + Subtopic
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleRemoveTopic(ti)} 
                                                        className="text-rose-450 hover:text-rose-650 transition-all p-1"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-3 pt-2">
                                                {topic.subtopics && topic.subtopics.map((sub, si) => (
                                                    <div key={si} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                                                        <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Subtopic #{si + 1}</span>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => handleRemoveSubtopic(ti, si)} 
                                                                className="text-gray-300 hover:text-rose-500 transition-all"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="space-y-1">
                                                                <label className="text-[8px] text-gray-400 uppercase tracking-widest">Subtopic Title</label>
                                                                <input 
                                                                    value={sub.title} 
                                                                    onChange={(e) => handleSubtopicChange(ti, si, 'title', e.target.value)} 
                                                                    placeholder="Subtopic Title..." 
                                                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-[10px] font-semibold outline-none shadow-sm" 
                                                                />
                                                            </div>

                                                            <div className="space-y-1">
                                                                <label className="text-[8px] text-gray-400 uppercase tracking-widest">Content Type</label>
                                                                <select 
                                                                    value={sub.contentType} 
                                                                    onChange={(e) => handleSubtopicChange(ti, si, 'contentType', e.target.value)} 
                                                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-[8px] font-semibold uppercase outline-none shadow-sm cursor-pointer"
                                                                >
                                                                    <option value="text">Text Instruction</option>
                                                                    <option value="link">Hyperlink / Reference</option>
                                                                    <option value="image">Image URL</option>
                                                                </select>
                                                            </div>

                                                            <div className="space-y-1 col-span-2">
                                                                <label className="text-[8px] text-gray-400 uppercase tracking-widest">Content Value</label>
                                                                {sub.contentType === 'text' ? (
                                                                    <textarea 
                                                                        value={sub.contentValue} 
                                                                        onChange={(e) => handleSubtopicChange(ti, si, 'contentValue', e.target.value)} 
                                                                        placeholder="Explain details..." 
                                                                        rows="3"
                                                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-[10px] font-semibold outline-none resize-none shadow-sm" 
                                                                    />
                                                                ) : (
                                                                    <input 
                                                                        value={sub.contentValue} 
                                                                        onChange={(e) => handleSubtopicChange(ti, si, 'contentValue', e.target.value)} 
                                                                        placeholder={sub.contentType === 'link' ? "https://example.com/doc" : "https://example.com/image.png"} 
                                                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-[10px] font-semibold outline-none shadow-sm" 
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Requirement Architecture */}
                        <div className="space-y-6 pt-6 border-t border-gray-100">
                            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                                <h4 className="text-[10px] font-black text-black uppercase tracking-[0.2em] border-l-4 border-black pl-3">Requirement Architecture</h4>
                                <button 
                                    type="button" 
                                    onClick={handleAddPhase} 
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-md"
                                >
                                    <Plus className="w-3 h-3" /> Add Phase
                                </button>
                            </div>

                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {formPhases.length === 0 ? (
                                    <div className="p-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">No requirement phases added yet</p>
                                        <p className="text-[9px] text-gray-400 mt-1">Configure submission fields for the interns.</p>
                                    </div>
                                ) : (
                                    formPhases.map((phase, pi) => (
                                        <div key={pi} className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <div className="flex-1">
                                                    <input 
                                                        value={phase.name} 
                                                        onChange={(e) => handlePhaseNameChange(pi, e.target.value)} 
                                                        placeholder="Phase Name (e.g. Design Spec)" 
                                                        className="bg-transparent text-[11px] font-black text-black uppercase tracking-widest outline-none w-full mb-1" 
                                                    />
                                                    <input 
                                                        value={phase.description} 
                                                        onChange={(e) => handlePhaseDescriptionChange(pi, e.target.value)} 
                                                        placeholder="Instructions..." 
                                                        className="bg-transparent text-[8px] font-medium text-gray-400 outline-none w-full" 
                                                    />
                                                </div>
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleRemovePhase(pi)} 
                                                    className="text-rose-400 hover:text-rose-600 p-1"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            <div className="space-y-3 pt-2">
                                                {phase.fields && phase.fields.map((field, fi) => (
                                                    <div key={fi} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                                                        <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Field #{fi + 1}</span>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => handleRemoveFieldFromPhase(pi, fi)} 
                                                                className="text-gray-300 hover:text-rose-500 transition-all"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-1.5">
                                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Label</label>
                                                                <input 
                                                                    value={field.label} 
                                                                    onChange={(e) => handleFieldChange(pi, fi, 'label', e.target.value)} 
                                                                    placeholder="E.g. GitHub Repository URL" 
                                                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-[10px] font-semibold outline-none shadow-sm" 
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Input Format</label>
                                                                <select 
                                                                    value={field.type} 
                                                                    onChange={(e) => handleFieldChange(pi, fi, 'type', e.target.value)} 
                                                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-[8px] font-semibold uppercase outline-none shadow-sm cursor-pointer"
                                                                >
                                                                    <option value="text">Single Line</option>
                                                                    <option value="textarea">Deep Block</option>
                                                                    <option value="link">Hyperlink</option>
                                                                    <option value="file">Asset/Doc Upload</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                <div className="grid grid-cols-3 gap-2 pt-2">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleAddFieldToPhase(pi, 'text')} 
                                                        className="py-1.5 border border-dashed border-gray-200 rounded-xl text-[8px] font-black text-gray-400 hover:text-black transition-all flex items-center justify-center gap-1.5"
                                                    >
                                                        <Type className="w-2.5 h-2.5" /> Text
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleAddFieldToPhase(pi, 'link')} 
                                                        className="py-1.5 border border-dashed border-gray-200 rounded-xl text-[8px] font-black text-gray-400 hover:text-black transition-all flex items-center justify-center gap-1.5"
                                                    >
                                                        <Link className="w-2.5 h-2.5" /> Link
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleAddFieldToPhase(pi, 'file')} 
                                                        className="py-1.5 border border-dashed border-gray-200 rounded-xl text-[8px] font-black text-gray-400 hover:text-black transition-all flex items-center justify-center gap-1.5"
                                                    >
                                                        <FileText className="w-2.5 h-2.5" /> File
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
