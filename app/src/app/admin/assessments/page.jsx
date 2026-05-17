"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Plus,
    Trash2,
    ChevronRight,
    ChevronDown,
    RefreshCw,
    BookOpen,
    Layers,
    Users,
    Mail,
    Target,
    Eye,
    ArrowLeft,
    Activity,
    UserCircle,
    UserCheck,
    UserX,
    Shield,
    ShieldCheck,
    X,
    Upload,
    FileText,
    FileDigit,
    FileCheck,
    Phone,
    MapPin,
    GraduationCap,
    Calendar,
    Briefcase
} from "lucide-react";
import MacOSFolder from "@/components/MacOSFolder";
import { toast } from "react-hot-toast";

const dicebear = (seed) => `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent`;

export default function UnifiedAssessmentsPage() {
    const [activeTab, setActiveTab] = useState(() => {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem('as_activeTab') || 'submissions';
        }
        return 'submissions';
    }); // 'build', 'submissions'

    // --- Dynamic Tracks State ---
    const [tracks, setTracks] = useState([]);
    const [loadingTracks, setLoadingTracks] = useState(true);
    const [loading, setLoading] = useState(false);

    // --- Assessment Builder State ---
    const [selectedTrack, setSelectedTrack] = useState("");
    const [selectedExam, setSelectedExam] = useState(null);
    const [exams, setExams] = useState([]);
    const [loadingExams, setLoadingExams] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
    const [loadingExam, setLoadingExam] = useState(false);
    const [isAddingMode, setIsAddingMode] = useState(false);
    const [expandedQuestion, setExpandedQuestion] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
    const [deleteQuestionTarget, setDeleteQuestionTarget] = useState(null);
    const [newQuestion, setNewQuestion] = useState({
        text: "",
        options: [
            { text: "", isCorrect: true },
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
            { text: "", isCorrect: false }
        ]
    });

    // --- Submissions State ---
    const [submissions, setSubmissions] = useState([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(true);
    const [filterTrack, setFilterTrack] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // --- Detail View State ---
    const [viewingUserId, setViewingUserId] = useState(null);
    const [selectedUserData, setSelectedUserData] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // --- Aadhaar View State ---
    const [viewingAadhaarUser, setViewingAadhaarUser] = useState(null);

    // --- Bulk Import State ---
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [bulkImportText, setBulkImportText] = useState("");
    const [isParsing, setIsParsing] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);

    // --- Global Modal State ---
    const isAnyModalOpen = !!(showSaveModal || viewingAadhaarUser || deleteQuestionTarget);

    useEffect(() => {
        if (isAnyModalOpen) {
            document.body.style.overflow = 'hidden';
            document.body.classList.add('modal-active');
        } else {
            document.body.style.overflow = 'unset';
            document.body.classList.remove('modal-active');
        }
        return () => {
            document.body.style.overflow = 'unset';
            document.body.classList.remove('modal-active');
        };
    }, [isAnyModalOpen]);

    // --- Initialization ---
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedTab = sessionStorage.getItem('as_activeTab');
            const savedTrack = sessionStorage.getItem('as_selectedTrack');
            const savedExam = sessionStorage.getItem('as_selectedExam');
            
            if (savedTab) setActiveTab(savedTab);
            if (savedTrack) setSelectedTrack(savedTrack);
            if (savedExam) {
                try {
                    setSelectedExam(JSON.parse(savedExam));
                } catch (e) {
                    console.error("Session parse error", e);
                }
            }
        }
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('as_activeTab', activeTab);
        }
    }, [activeTab]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('as_selectedTrack', selectedTrack);
        }
    }, [selectedTrack]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (selectedExam) {
                sessionStorage.setItem('as_selectedExam', JSON.stringify(selectedExam));
            } else {
                sessionStorage.removeItem('as_selectedExam');
            }
        }
    }, [selectedExam]);

    useEffect(() => {
        fetchTracks();
    }, []);

    const fetchTracks = async () => {
        setLoadingTracks(true);
        try {
            const res = await fetch('/api/admin/tracks', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                const allTracks = Array.isArray(data) ? data : Object.values(data).flat();
                setTracks(allTracks);
            }
        } catch (error) {
            toast.error("Network Failure");
        } finally {
            setLoadingTracks(false);
        }
    };

    useEffect(() => {
        if (selectedTrack && activeTab === 'build') {
            fetchExams();
        }
    }, [selectedTrack, activeTab]);

    const fetchExams = async () => {
        if (!selectedTrack) return;
        setLoadingExams(true);
        try {
            const res = await fetch(`/api/admin/assessment/exams?track=${encodeURIComponent(selectedTrack)}`);
            if (res.ok) {
                const data = await res.json();
                setExams(data.exams || []);
            }
        } catch (error) {
            toast.error("Failed to load Exams");
        } finally {
            setLoadingExams(false);
        }
    };

    useEffect(() => {
        if (selectedExam && activeTab === 'build') fetchData();
    }, [selectedExam, activeTab]);

    const fetchData = async () => {
        if (!selectedExam) return;
        setLoadingExam(true);
        try {
            const res = await fetch(`/api/admin/assessment/questions?examId=${selectedExam._id}`);
            if (res.ok) {
                const data = await res.json();
                setQuestions(data.questions || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingExam(false);
        }
    };

    const handleToggleStatus = async (examId, currentStatus) => {
        const nextStatus = currentStatus === 'active' ? 'scheduled' : 'active';
        const tid = toast.loading(`${nextStatus === 'active' ? 'Releasing' : 'Freezing'} blueprint...`);
        try {
            const res = await fetch("/api/admin/assessment/exams/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: examId, status: nextStatus })
            });
            if (res.ok) {
                toast.success(nextStatus === 'active' ? "Blueprint ACTIVE" : "Access FROZEN", { id: tid });
                if (selectedExam && selectedExam._id === examId) {
                    const updated = await res.json();
                    setSelectedExam(updated);
                }
                fetchExams();
            } else { toast.error("Transfer Error", { id: tid }); }
        } catch { toast.error("Network Failure", { id: tid }); }
    };

    const [editQuestionId, setEditQuestionId] = useState(null);
    const [editQuestionData, setEditQuestionData] = useState(null);

    const handleBulkImport = async (e) => {
        e.preventDefault();
        setIsParsing(true);
        const tid = toast.loading("Analyzing blueprint...");
        try {
            const lines = bulkImportText.split('\n').map(l => l.trim()).filter(l => l);
            const importedQuestions = [];
            let currentQuestion = null;

            for (let line of lines) {
                const ansMatch = line.match(/^(?:ans(?:wer)?|correct|solution)[\s]*[:\-]?[\s]*(.+)$/i);
                if (ansMatch) {
                    if (currentQuestion) {
                        const rawAns = ansMatch[1].trim();
                        let correctIdx = -1;
                        const letterMatch = rawAns.match(/^([a-eA-E])(?:\s*[\).\]:]?|\s+)/i);
                        if (letterMatch) {
                            correctIdx = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
                        } else if (/^\d+$/.test(rawAns)) {
                            correctIdx = Math.max(0, parseInt(rawAns) - 1);
                        } else {
                            const lowerAns = rawAns.toLowerCase();
                            correctIdx = currentQuestion.options.findIndex(o => 
                                lowerAns.includes(o.text.toLowerCase()) || o.text.toLowerCase().includes(lowerAns)
                            );
                        }
                        if (correctIdx !== -1 && currentQuestion.options[correctIdx]) {
                            currentQuestion.options.forEach(o => o.isCorrect = false);
                            currentQuestion.options[correctIdx].isCorrect = true;
                        }
                        if (currentQuestion.options.length > 0) {
                            while (currentQuestion.options.length < 4) {
                                currentQuestion.options.push({ text: `Option ${currentQuestion.options.length + 1}`, isCorrect: false });
                            }
                            importedQuestions.push(currentQuestion);
                        }
                        currentQuestion = null;
                    }
                    continue;
                }

                let isQuestionLine = /^(?:Q\d*|\d+)[.)\]]?\s+/i.test(line) || line.toLowerCase().startsWith('q:');
                let isOptionLine = /^[a-z][.)\]]\s+/i.test(line);

                if (isQuestionLine) {
                    if (currentQuestion && currentQuestion.options.length > 0) {
                        while (currentQuestion.options.length < 4) currentQuestion.options.push({ text: `Option ${currentQuestion.options.length + 1}`, isCorrect: false });
                        importedQuestions.push(currentQuestion);
                    }
                    let qText = line.replace(/^(?:Q\d*|\d+|Q)[.)\]:\s]{0,}/i, '').trim();
                    currentQuestion = { text: qText, options: [] };
                } else if (isOptionLine) {
                    if (!currentQuestion) currentQuestion = { text: "Untitled Question", options: [] };
                    if (currentQuestion.options.length < 4) {
                        const optText = line.replace(/^[a-e1-5][.)\]]\s{0,}/i, '');
                        currentQuestion.options.push({ text: optText, isCorrect: false });
                    }
                } else {
                    if (!currentQuestion) {
                        currentQuestion = { text: line, options: [] };
                    } else if (currentQuestion.options.length === 0) {
                        currentQuestion.text += " " + line;
                    } else {
                        currentQuestion.options[currentQuestion.options.length - 1].text += " " + line;
                    }
                }
            }
            if (currentQuestion && currentQuestion.options.length > 0) {
                if (!currentQuestion.options.find(o => o.isCorrect)) currentQuestion.options[0].isCorrect = true;
                while (currentQuestion.options.length < 4) currentQuestion.options.push({ text: `Option ${currentQuestion.options.length + 1}`, isCorrect: false });
                importedQuestions.push(currentQuestion);
            }

            let successCount = 0;
            for (const q of importedQuestions) {
                const res = await fetch("/api/admin/assessment/questions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ examId: selectedExam._id, ...q })
                });
                if (res.ok) successCount++;
            }
            toast.success(`Imported ${successCount} questions`, { id: tid });
            setBulkImportText("");
            setIsBulkMode(false);
            fetchData();
        } catch (error) {
            toast.error("Parsing Failure", { id: tid });
        } finally {
            setIsParsing(false);
        }
    };

    const handleAddQuestion = async (e) => {
        e.preventDefault();
        const tid = toast.loading("Processing...");
        try {
            const res = await fetch("/api/admin/assessment/questions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ examId: selectedExam._id, ...newQuestion })
            });
            if (res.ok) {
                toast.success("Added!", { id: tid });
                setNewQuestion({ text: "", options: [ { text: "", isCorrect: true }, { text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false } ] });
                setIsAddingMode(false);
                fetchData();
            } else toast.error("Fail", { id: tid });
        } catch { toast.error("Error", { id: tid }); }
    };

    const handleSaveEdit = async () => {
        if (!editQuestionData) return;
        const tid = toast.loading("Saving...");
        try {
            const res = await fetch("/api/admin/assessment/questions", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: editQuestionData._id, text: editQuestionData.text, options: editQuestionData.options })
            });
            if (res.ok) {
                toast.success("Saved", { id: tid });
                setEditQuestionId(null);
                fetchData();
            }
        } catch { toast.error("Error", { id: tid }); }
    };

    const handleUpdateAnswer = async (question, correctIdx) => {
        const tid = toast.loading("Updating answer...");
        try {
            const updatedOptions = question.options.map((opt, i) => ({
                ...opt,
                isCorrect: i === correctIdx
            }));

            const res = await fetch("/api/admin/assessment/questions", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: question._id,
                    text: question.text,
                    options: updatedOptions
                })
            });

            if (res.ok) {
                toast.success("Answer Updated", { id: tid });
                fetchData();
            } else {
                toast.error("Update Failed", { id: tid });
            }
        } catch (err) {
            toast.error("Network Error", { id: tid });
        }
    };

    const handleDeleteQuestion = async (id) => {
        const tid = toast.loading("Removing...");
        try {
            const res = await fetch(`/api/admin/assessment/questions?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Cleared", { id: tid });
                fetchData();
            } else {
                toast.error("Deletion Failed", { id: tid });
            }
        } catch { 
            toast.error("Error", { id: tid }); 
        }
    };

    const handleBulkDeleteQuestions = async () => {
        if (!confirm(`Delete ${selectedQuestionIds.length} questions?`)) return;
        const tid = toast.loading(`Purging ${selectedQuestionIds.length} modules...`);
        try {
            for (const id of selectedQuestionIds) {
                await fetch(`/api/admin/assessment/questions?id=${id}`, { method: "DELETE" });
            }
            toast.success("Cleanup Complete", { id: tid });
            setSelectedQuestionIds([]);
            fetchData();
        } catch {
            toast.error("Cleanup Interrupted", { id: tid });
        }
    };

    useEffect(() => {
        if (activeTab === 'submissions') fetchSubmissions();
    }, [activeTab]);

    const fetchSubmissions = async () => {
        setLoadingSubmissions(true);
        try {
            const res = await fetch('/api/admin/assessments');
            if (res.ok) {
                const data = await res.json();
                setSubmissions(data.assessments || []);
            }
        } catch { toast.error('Error'); }
        finally { setLoadingSubmissions(false); }
    };

    const updateSubmissionStatus = async (userId, status) => {
        try {
            const res = await fetch('/api/admin/assessments/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, status })
            });
            if (res.ok) {
                toast.success(`Status Synced`);
                fetchSubmissions();
            }
        } catch { toast.error('Sync Fail'); }
    };

    const handleViewUserDetail = async (user) => {
        setViewingUserId(user._id);
        setLoadingDetail(true);
        try {
            const res = await fetch(`/api/admin/users/result?userId=${user._id}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedUserData({ ...data, user });
            } else {
                toast.error("Retrieval Failed");
                setViewingUserId(null);
            }
        } catch {
            toast.error("Network Error");
            setViewingUserId(null);
        } finally {
            setLoadingDetail(false);
        }
    };

    if (viewingUserId) {
        return <UserDetailView data={selectedUserData} loading={loadingDetail} onBack={() => setViewingUserId(null)} onStatusUpdate={updateSubmissionStatus} />;
    }

    const filteredSubmissions = submissions.filter(s => {
        const matchesTrack = filterTrack ? s.track === filterTrack : true;
        const matchesStatus = filterStatus ? s.selectionStatus === filterStatus : true;
        
        // Find the track object to check its category
        const trackObj = tracks.find(t => t.name === s.track);
        const matchesCategory = selectedCategoryFilter === 'ALL' || (trackObj && trackObj.category === selectedCategoryFilter);
        
        return matchesTrack && matchesStatus && matchesCategory;
    });

    return (
        <div className="relative min-h-screen bg-white">
            <div className={`flex flex-col min-h-screen transition-all duration-500 ${isAnyModalOpen ? 'blur-sm grayscale grayscale-0 pointer-events-none' : ''}`}>
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl -mx-8 -mt-8 px-8 py-5 border-b border-gray-100 shadow-sm mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-8 bg-black rounded-full" />
                        <h1 className="text-2xl font-black text-black tracking-tighter uppercase leading-none">Assessment Dashboard</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <nav className="flex bg-gray-50/50 p-1 rounded-xl border border-gray-100">
                            {['submissions', 'build'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setActiveTab(t)}
                                    className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-black text-white shadow-xl' : 'text-gray-400 hover:text-black'}`}
                                >
                                    {t === 'submissions' ? 'Intelligence' : 'Repository'}
                                </button>
                            ))}
                        </nav>
                        <button onClick={fetchTracks} className="p-2.5 bg-gray-50 hover:bg-black hover:text-white rounded-xl border border-gray-100 transition-all">
                            <RefreshCw className={`w-4 h-4 ${loadingTracks ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </header>


            <div className="px-10 pb-20 w-full relative">
                {activeTab === 'build' ? (
                    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                        {!selectedTrack ? (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <CustomDropdown 
                                        value={selectedCategoryFilter} 
                                        onChange={setSelectedCategoryFilter} 
                                        options={[
                                            { value: "ALL", label: "ALL CATEGORIES" },
                                            ...Array.from(new Set(tracks.map(t => t.category).filter(Boolean))).map(c => ({ value: c, label: c.toUpperCase() }))
                                        ]} 
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8 w-full">
                                    {tracks.filter(t => selectedCategoryFilter === 'ALL' || t.category === selectedCategoryFilter).map(track => (
                                        <div key={track._id} onClick={() => setSelectedTrack(track.name)} className="group bg-white p-12 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all cursor-pointer flex flex-col items-start justify-start gap-6 text-left">
                                            <div className="space-y-1">
                                                <h3 className="text-base font-black text-black uppercase tracking-tighter leading-tight">{track.name}</h3>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{track.category || "General Category"}</p>
                                            </div>
                                            <MacOSFolder size={64} className="transition-transform group-hover:scale-110 origin-left" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {!selectedExam ? (
                                    <div className="space-y-8">
                                        <div className="flex items-center justify-between">
                                            <button onClick={() => setSelectedTrack("")} className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center hover:bg-black hover:text-white transition-all"><ArrowLeft className="w-4 h-4" /></button>
                                            <button onClick={async () => {
                                                const res = await fetch("/api/admin/assessment/exams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ track: selectedTrack, title: `SET ${exams.length + 1}`, durationMinutes: 60 }) });
                                                if (res.ok) fetchExams();
                                            }} className="px-5 py-2.5 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Plus className="w-4 h-4" /> Create Unique Paper</button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 w-full">
                                            {exams.map(ex => (
                                                <div key={ex._id} className="relative bg-white p-12 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-black/5 transition-all flex flex-col gap-8 min-h-[350px]">
                                                    <button onClick={(e) => { e.stopPropagation(); if(confirm("Purge?")) fetch(`/api/admin/assessment/exams?id=${ex._id}`, { method: "DELETE" }).then(() => fetchExams()); }} className="absolute top-10 right-10 p-2.5 text-gray-200 hover:text-rose-500 transition-colors z-20"><Trash2 className="w-5 h-5" /></button>
                                                    
                                                    <div onClick={() => setSelectedExam(ex)} className="cursor-pointer space-y-4 flex-1 relative z-10">
                                                        <div className="space-y-2">
                                                            <h3 className="text-xl font-black text-black uppercase tracking-tight leading-none">{ex.title}</h3>
                                                            <span className="inline-block text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">ID-{ex._id.slice(-6).toUpperCase()}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Activity className="w-4 h-4" /> {ex.questions?.length || 0} Modules</span>
                                                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${ex.status === 'active' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>{ex.status === 'active' ? 'Active' : 'Inactive'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3 pt-2 border-t border-gray-50">
                                                        <button onClick={() => setSelectedExam(ex)} className="flex-1 py-3.5 bg-gray-50 hover:bg-black hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Modify</button>
                                                        <button onClick={() => handleToggleStatus(ex._id, ex.status)} className={`flex-1 py-3.5 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${ex.status === 'active' ? 'border-amber-200 text-amber-600 hover:bg-amber-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}>{ex.status === 'active' ? 'Freeze' : 'Release'}</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <button onClick={() => setSelectedExam(null)} className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center hover:bg-black hover:text-white transition-all"><ArrowLeft className="w-4 h-4" /></button>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => setIsBulkMode(!isBulkMode)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${isBulkMode ? 'bg-black text-white' : 'bg-white border-gray-200'}`}><Upload className="w-4 h-4 mr-2 inline" /> Bulk Add</button>
                                                <button onClick={() => setIsAddingMode(!isAddingMode)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${isAddingMode ? 'bg-black text-white' : 'bg-white border-gray-200'}`}><Plus className="w-4 h-4 mr-2 inline" /> Single</button>
                                            </div>
                                        </div>

                                        {isBulkMode && (
                                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm animate-in zoom-in-95">
                                                <textarea className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-6 text-[10px] font-mono h-64 outline-none" placeholder="Paste questions..." value={bulkImportText} onChange={e => setBulkImportText(e.target.value)} />
                                                <div className="flex justify-start">
                                                    <button onClick={handleBulkImport} className="w-max px-20 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest mt-6 hover:scale-[1.02] active:scale-95 transition-all">
                                                        Upload
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {isAddingMode && (
                                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm animate-in zoom-in-95">
                                                <form onSubmit={handleAddQuestion} className="space-y-6">
                                                    <textarea className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-6 text-xs font-bold h-32 outline-none" value={newQuestion.text} onChange={e => setNewQuestion({...newQuestion, text: e.target.value})} required />
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {newQuestion.options.map((opt, i) => (
                                                            <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-2">
                                                                <button type="button" onClick={() => setNewQuestion({...newQuestion, options: newQuestion.options.map((o, idx) => ({...o, isCorrect: i === idx}))})} className={`text-[8px] font-black px-4 py-1.5 rounded-full border ${opt.isCorrect ? 'bg-black text-white' : 'bg-white text-gray-400'}`}>{opt.isCorrect ? 'CORRECT' : 'MARK CORRECT'}</button>
                                                                <input className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs font-bold" value={opt.text} onChange={e => { const updated = [...newQuestion.options]; updated[i].text = e.target.value; setNewQuestion({...newQuestion, options: updated}); }} required />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <button type="submit" className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest">Commit to Bank</button>
                                                </form>
                                            </div>
                                        )}

                                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
                                            <div className="p-8 border-b border-gray-100 bg-gray-50/10 flex items-center justify-between gap-6">
                                                <div className="flex items-center gap-4 flex-1">
                                                     {selectedQuestionIds.length > 0 ? (
                                                         <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-2">
                                                             <input 
                                                                type="checkbox" 
                                                                checked={selectedQuestionIds.length === questions.length}
                                                                onChange={() => setSelectedQuestionIds(selectedQuestionIds.length === questions.length ? [] : questions.map(q => q._id))}
                                                                className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                                                             />
                                                             <span className="text-xs font-black uppercase tracking-widest text-red-600">{selectedQuestionIds.length} Selected</span>
                                                             <button onClick={handleBulkDeleteQuestions} className="px-4 py-2 bg-red-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-red-200"><Trash2 className="w-3.5 h-3.5" /> Delete Selected</button>
                                                             <button onClick={() => setSelectedQuestionIds([])} className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-black">Cancel</button>
                                                         </div>
                                                     ) : (
                                                        <>
                                                            <input 
                                                                type="checkbox" 
                                                                checked={selectedQuestionIds.length === questions.length && questions.length > 0}
                                                                onChange={() => setSelectedQuestionIds(selectedQuestionIds.length === questions.length ? [] : questions.map(q => q._id))}
                                                                className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                                                            />
                                                            <input className="text-2xl font-black uppercase tracking-tighter bg-transparent w-full outline-none" defaultValue={selectedExam.title} onBlur={async (e) => { if(e.target.value !== selectedExam.title) { fetch("/api/admin/assessment/exams/update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selectedExam._id, title: e.target.value }) }); } }} />
                                                        </>
                                                     )}
                                                </div>
                                                <button onClick={() => setShowSaveModal(true)} className="px-6 py-2 bg-black text-white rounded-lg text-[9px] font-black uppercase tracking-widest">Save Settings</button>
                                            </div>
                                            <div className="divide-y divide-gray-50">
                                                {questions.map((q, idx) => (
                                                    <div key={q._id} className={`p-6 hover:bg-gray-50/50 transition-all ${selectedQuestionIds.includes(q._id) ? 'bg-red-50/50' : ''}`}>
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-center gap-6">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={selectedQuestionIds.includes(q._id)}
                                                                    onChange={() => setSelectedQuestionIds(prev => prev.includes(q._id) ? prev.filter(id => id !== q._id) : [...prev, q._id])}
                                                                    className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                                                                />
                                                                <span className="text-[10px] font-black text-gray-200">{String(idx+1).padStart(2,'0')}</span>
                                                                <div className="space-y-4">
                                                                    <p className="text-[11px] font-black tracking-tight">{q.text}</p>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
                                                                        {q.options?.map((opt, i) => (
                                                                            <button 
                                                                                key={i} 
                                                                                onClick={() => handleUpdateAnswer(q, i)}
                                                                                className={`px-4 py-2.5 rounded-xl border text-[10px] font-black tracking-widest flex items-center justify-between transition-all group/opt ${opt.isCorrect ? 'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm' : 'bg-gray-50/50 border-gray-100 text-gray-400 hover:border-black hover:text-black'}`}
                                                                            >
                                                                                <span className="flex items-center gap-2">
                                                                                    <span className={`w-5 h-5 rounded flex items-center justify-center text-[9px] transition-colors ${opt.isCorrect ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400 group-hover/opt:bg-black group-hover/opt:text-white'}`}>
                                                                                        {String.fromCharCode(65 + i)}
                                                                                    </span>
                                                                                    {opt.text}
                                                                                </span>
                                                                                {opt.isCorrect && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button onClick={() => setDeleteQuestionTarget(q)} className="p-2 text-gray-200 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[600px]">
                            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/10">
                                <div className="flex items-center gap-4">
                                    <CustomDropdown 
                                        value={selectedCategoryFilter} 
                                        onChange={setSelectedCategoryFilter} 
                                        options={[
                                            { value: "ALL", label: "ALL CATEGORIES" },
                                            ...Array.from(new Set(tracks.map(t => t.category).filter(Boolean))).map(c => ({ value: c, label: c.toUpperCase() }))
                                        ]} 
                                    />
                                    <CustomDropdown value={filterTrack} onChange={setFilterTrack} options={[{ value: "", label: "ALL TRACKS" }, ...tracks.filter(t => selectedCategoryFilter === 'ALL' || t.category === selectedCategoryFilter).map(t => ({ value: t.name, label: t.name }))]} />
                                    {activeTab === 'submissions' && <CustomDropdown value={filterStatus} onChange={setFilterStatus} options={[{ value: "", label: "ALL STATUS" }, { value: "Pending Selection (24h Buffer)", label: "PENDING" }, { value: "Selected", label: "SELECTED" }]} />}
                                </div>
                                <button onClick={fetchSubmissions} className="p-3 bg-white border border-gray-100 rounded-xl hover:bg-black hover:text-white transition-all"><RefreshCw className={`w-4 h-4 ${loadingSubmissions ? 'animate-spin' : ''}`} /></button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/30">
                                        <tr className="border-b border-gray-50">
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Candidate</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Track</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Identity</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Score</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Verdict</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Ops</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredSubmissions.map(s => (
                                            <tr key={s._id} className="hover:bg-gray-50/50 transition-all">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                                            <img 
                                                                src={
                                                                    (s.profilePicture && s.profilePicture !== "null") 
                                                                    ? s.profilePicture 
                                                                    : (s.passportPhoto && s.passportPhoto !== "null")
                                                                    ? s.passportPhoto
                                                                    : dicebear(s.avatarSeed || s.fullName?.split(' ')[0] || "User")
                                                                } 
                                                                alt="" 
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => { e.target.src = dicebear("User"); }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black uppercase tracking-tight">{s.fullName}</p>
                                                            <p className="text-[9px] font-bold text-gray-400">{s.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center text-[9px] font-black uppercase tracking-widest text-gray-500">{s.track}</td>
                                                <td className="px-8 py-6 text-center">{s.aadhaarCard ? <button onClick={() => setViewingAadhaarUser(s)} className="px-3 py-1.5 bg-gray-50 text-[9px] font-black uppercase tracking-widest rounded-lg border border-gray-100 hover:bg-black hover:text-white transition-all"><Shield className="w-3 h-3 mr-2 inline" /> Aadhaar</button> : <span className="text-[10px] text-gray-200">--</span>}</td>
                                                <td className="px-8 py-6 text-center text-2xl font-black tracking-tighter">{Math.round(s.assessmentScore)}%</td>
                                                <td className="px-8 py-6 text-center"><SelectionBadge status={s.selectionStatus === 'Selected' ? 'SELECTED' : s.selectionStatus === 'Rejected' ? 'REJECTED' : 'NEW'} label={s.selectionStatus?.split(' ')[0]} /></td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        {(s.selectionStatus !== 'Selected') && (
                                                            <button onClick={() => updateSubmissionStatus(s._id, 'Selected')} className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center hover:bg-neutral-800 transition-all shadow-sm">
                                                                <UserCheck className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {(s.selectionStatus !== 'Rejected' && s.selectionStatus !== 'Selected') && (
                                                            <button onClick={() => updateSubmissionStatus(s._id, 'Rejected')} className="w-10 h-10 bg-white border border-gray-100 text-black rounded-xl flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm">
                                                                <UserX className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button onClick={() => handleViewUserDetail(s)} className="w-10 h-10 bg-white border border-gray-100 text-gray-400 hover:text-black rounded-xl flex items-center justify-center transition-all shadow-sm">
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            </div>

            {showSaveModal && selectedExam && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSaveModal(false)} />
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-[10001] overflow-hidden border border-gray-50 animate-in fade-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-gray-100 text-center bg-gray-50/30">
                            <h3 className="text-xl font-black uppercase tracking-tighter">Paper Protocol</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Update release status for {selectedExam.title}</p>
                        </div>
                        <div className="p-8 space-y-3">
                            <button onClick={() => { handleToggleStatus(selectedExam._id, 'scheduled'); setShowSaveModal(false); }} className="w-full py-4 bg-black text-white hover:bg-neutral-800 rounded-2xl font-black uppercase tracking-widest transition-all">Enable Access</button>
                            <button onClick={() => { handleToggleStatus(selectedExam._id, 'active'); setShowSaveModal(false); }} className="w-full py-4 bg-gray-50 text-black hover:bg-gray-100 rounded-2xl border border-gray-100 font-black uppercase tracking-widest transition-all">Freeze Access</button>
                            <button onClick={() => setShowSaveModal(false)} className="w-full py-3 text-[9px] font-black text-gray-300 uppercase tracking-widest hover:text-black transition-all">Cancel Request</button>
                        </div>
                    </div>
                </div>
            )}

            {viewingAadhaarUser && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewingAadhaarUser(null)} />
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative z-[10001] overflow-hidden border border-gray-50 animate-in fade-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                            <h3 className="text-xl font-black uppercase tracking-tighter">Identity Proof</h3>
                            <button onClick={() => setViewingAadhaarUser(null)} className="p-2 text-gray-400 hover:text-black"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-8 flex flex-col md:flex-row gap-8">
                            <img src={viewingAadhaarUser.passportPhoto || 'https://placehold.co/400x500'} alt="Candidate" className="w-40 h-52 object-cover rounded-2xl border border-gray-100 shadow-sm" />
                            <div className="flex-1 bg-gray-50/50 p-8 rounded-2xl border border-gray-100">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">Aadhaar Document</p>
                                <img src={viewingAadhaarUser.aadhaarCard || 'https://placehold.co/800x500'} alt="Aadhaar" className="w-full h-40 object-contain rounded-xl" />
                                <div className="mt-8">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Verified Unique ID</p>
                                    <p className="text-3xl font-black font-mono tracking-[0.2em] text-black bg-white inline-block px-4 py-2 rounded-xl border border-gray-100">{viewingAadhaarUser.aadhaarNumber?.replace(/(.{4})/g, '$1 ') || 'XXXX XXXX XXXX'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {deleteQuestionTarget && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteQuestionTarget(null)} />
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 text-center relative z-[10001] border border-gray-50 animate-in fade-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Trash2 className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-tighter">Remove Module</h3>
                        <p className="text-[10px] font-bold text-gray-400 mt-2 mb-8 leading-relaxed uppercase tracking-widest">
                            Are you sure you want to delete this question? This action is irreversible.
                        </p>
                        <div className="flex gap-4">
                            <button onClick={() => setDeleteQuestionTarget(null)} className="flex-1 py-4 bg-gray-50 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all">Cancel</button>
                            <button onClick={async () => {
                                const qid = deleteQuestionTarget._id;
                                setDeleteQuestionTarget(null);
                                handleDeleteQuestion(qid);
                            }} className="flex-1 py-4 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/20">Purge</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function CustomDropdown({ value, onChange, options }) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const click = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
        document.addEventListener('mousedown', click);
        return () => document.removeEventListener('mousedown', click);
    }, []);
    const curr = options.find(o => o.value === value) || options[0];
    return (
        <div className="relative" ref={ref}>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="min-w-[170px] bg-white border border-gray-100 rounded-xl px-4 py-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-black hover:border-black transition-all">
                {curr?.label} <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-2xl z-[100] py-2 overflow-hidden animate-in fade-in zoom-in-95">
                    {options.map((o, i) => (
                        <button key={i} onClick={() => { onChange(o.value); setIsOpen(false); }} className={`w-full text-left px-4 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all ${value === o.value ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-black'}`}>{o.label}</button>
                    ))}
                </div>
            )}
        </div>
    );
}

function UserDetailView({ data, loading, onBack, onStatusUpdate }) {
    if (loading) return <div className="py-32 flex flex-col items-center justify-center gap-6"><RefreshCw className="w-12 h-12 animate-spin text-black" /><p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-300">Syncing Intelligence...</p></div>;
    if (!data) return null;
    const { user, assessment } = data;
    const formatDate = (dateStr) => {
        if (!dateStr) return 'Not Set';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? 'Not Set' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="animate-in slide-in-from-right-4 duration-500 pb-32">
            {/* Header Section */}
            <div className="-mt-8 -mx-8 bg-white border-b border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="px-12 py-8 space-y-8">
                    {/* ── Top Bar: Back, Name, Avatar & Actions ── */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <button onClick={onBack} className="p-3 bg-gray-50 hover:bg-black hover:text-white rounded-xl transition-all shadow-sm group">
                                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            </button>
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-xl shadow-black/5 transition-transform hover:rotate-3">
                                    <img 
                                        src={
                                            (user.profilePicture && user.profilePicture !== "null") 
                                            ? user.profilePicture 
                                            : (user.passportPhoto && user.passportPhoto !== "null")
                                            ? user.passportPhoto
                                            : dicebear(user.avatarSeed || user.fullName?.split(' ')[0] || "User")
                                        } 
                                        alt="" 
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.src = dicebear("User"); }}
                                    />
                                </div>
                                <div className="space-y-0.5">
                                    <h2 className="text-3xl font-black text-black tracking-tighter uppercase leading-none">{user.fullName}</h2>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{user.track} Intelligence Profile</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {user.selectionStatus !== 'Selected' && (
                                <button 
                                    onClick={() => onStatusUpdate(user._id, 'Selected')}
                                    className="px-8 py-3.5 bg-[#ccff00] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-[#ccff00]/10"
                                >
                                    <UserCheck className="w-4 h-4" /> Accept Candidate
                                </button>
                            )}
                            {user.selectionStatus !== 'Rejected' && user.selectionStatus !== 'Selected' && (
                                <button 
                                    onClick={() => onStatusUpdate(user._id, 'Rejected')}
                                    className="px-8 py-3.5 bg-red-50 text-red-500 border border-red-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
                                >
                                    <UserX className="w-4 h-4" /> Reject
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── Compact Intelligence Grid ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <CompactTile icon={Mail} label="Email" value={user.email} />
                        <CompactTile icon={Phone} label="Contact" value={user.phone || 'Not Provided'} />
                        <CompactTile icon={MapPin} label="Location" value={user.address || 'Not Provided'} />
                        <CompactTile icon={Calendar} label="DOB" value={user.dob || 'Not Provided'} />
                        <CompactTile icon={UserCircle} label="Gender" value={user.gender || 'Not Provided'} />
                        <CompactTile icon={GraduationCap} label="Degree" value={user.educationQualification || 'Not Provided'} />
                        <CompactTile icon={Briefcase} label="College" value={user.collegeName || 'Self Taught'} />
                        <CompactTile icon={Target} label="Path" value={user.track} />
                        <CompactTile icon={Activity} label="Mode" value={user.mode || 'Remote'} />
                        <CompactTile icon={RefreshCw} label="Duration" value={user.duration ? `${user.duration} Months` : 'Not Set'} />
                        <CompactTile icon={Calendar} label="Joined" value={formatDate(user.createdAt)} />
                        <CompactTile icon={ShieldCheck} label="Identity" value={user.aadhaarCard ? 'Verified' : 'Pending'} />
                    </div>
                </div>

            {/* Compact Score Bar */}
                {assessment ? (
                    <div className="bg-black text-white grid grid-cols-2 md:grid-cols-5 gap-0 divide-x divide-white/5 py-4 border-t border-white/5">
                        <ScoreMetric label="Final Score" value={`${assessment.scorePercentage}%`} />
                        <ScoreMetric label="Accuracy" value={`${assessment.score}/${assessment.totalQuestions}`} />
                        <ScoreMetric label="Time Invested" value={`${Math.floor(assessment.timeTaken/60)}m ${assessment.timeTaken%60}s`} />
                        <ScoreMetric label="Verdict" value={assessment.passed ? 'PASSED' : 'FAILED'} color={assessment.passed ? 'text-emerald-400' : 'text-red-400'} />
                        <ScoreMetric label="Status" value={user.selectionStatus?.split(' ')[0] || 'NEW'} />
                    </div>
                ) : (
                    <div className="bg-gray-50 py-3 text-center border-t border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Module Blueprint Not Attempted</p>
                    </div>
                )}
            </div>

            {assessment && (
                <div className="mt-12 space-y-8 px-4">
                    <div className="space-y-4 max-w-5xl mx-auto">
                        {assessment.answers?.map((ans, idx) => (
                            <div key={idx} className={`p-8 rounded-[2.5rem] border transition-all hover:shadow-lg ${!ans.selectedOption ? 'bg-gray-50 border-gray-100' : ans.isCorrect ? 'bg-emerald-50/20 border-emerald-100/50' : 'bg-red-50/20 border-red-100/50'}`}>
                                <div className="flex gap-6 mb-6">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black shrink-0 ${!ans.selectedOption ? 'bg-gray-200 text-gray-500' : ans.isCorrect ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>{idx+1}</div>
                                    <p className="text-base font-black leading-tight text-gray-900">{ans.questionId?.text}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-100"><p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1 italic">Candidate Selected</p><p className={`text-xs font-black uppercase ${ans.isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>{ans.selectedOption || 'BLANK SUBMISSION'}</p></div>
                                    <div className="p-4 bg-white rounded-2xl border border-gray-100"><p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1 italic">Correct Solution</p><p className="text-xs font-black uppercase text-black">{ans.questionId?.options?.find(o => o.isCorrect)?.text}</p></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function CompactTile({ icon: Icon, label, value }) {
    return (
        <div className="bg-gray-50/50 border border-gray-100 p-4 rounded-2xl flex items-center gap-4 transition-all hover:bg-white hover:border-black/5 hover:shadow-xl hover:shadow-black/5">
            <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-gray-400" />
            </div>
            <div className="min-w-0">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
                <p className="text-[11px] font-bold text-black truncate leading-tight">{value}</p>
            </div>
        </div>
    );
}

function DetailTile({ icon: Icon, label, value }) {
    return (
        <div className="bg-gray-50/50 hover:bg-white border border-gray-100 hover:border-black/5 hover:shadow-2xl hover:shadow-black/5 p-6 rounded-[2rem] transition-all group flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                    <Icon className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors" />
                </div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
            </div>
            <p className="text-sm font-black text-black tracking-tight truncate pl-1">{value}</p>
        </div>
    );
}

function DetailItem({ icon: Icon, label, value }) {
    return (
        <div className="flex flex-col gap-1 min-w-0">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-5">{label}</p>
            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 truncate">
                <Icon className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                <span className="truncate">{value}</span>
            </div>
        </div>
    );
}

function ScoreMetric({ label, value, color = "text-white" }) {
    return (
        <div className="flex flex-col items-center justify-center py-2 px-4 text-center">
            <p className="text-[8px] font-black uppercase text-gray-500 tracking-widest mb-0.5">{label}</p>
            <p className={`text-lg font-black uppercase tracking-tighter ${color}`}>{value}</p>
        </div>
    );
}

function SelectionBadge({ status, label }) {
    const s = { 'SELECTED': 'bg-black text-white', 'REJECTED': 'bg-white text-gray-200 border-gray-100', 'NEW': 'bg-gray-50 text-gray-400' };
    return <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${s[status] || s.NEW}`}>{label || status}</span>;
}
