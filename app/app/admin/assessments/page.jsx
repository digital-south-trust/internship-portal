"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Plus,
    Trash2,
    ChevronRight,
    ChevronDown,
    Search,
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
    FileCheck
} from "lucide-react";
import MacOSFolder from "@/components/MacOSFolder";
import { toast } from "react-hot-toast";

export default function UnifiedAssessmentsPage() {
    const [activeTab, setActiveTab] = useState('submissions'); // 'build', 'submissions', 'rejected'

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
    const [loadingExam, setLoadingExam] = useState(false);
    const [isAddingMode, setIsAddingMode] = useState(false);
    const [expandedQuestion, setExpandedQuestion] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
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
                let isOptionLine = /^[a-e][.)\]]\s+/i.test(line);

                if (isQuestionLine) {
                    if (currentQuestion && currentQuestion.options.length > 0) {
                        while (currentQuestion.options.length < 4) currentQuestion.options.push({ text: `Option ${currentQuestion.options.length + 1}`, isCorrect: false });
                        importedQuestions.push(currentQuestion);
                    }
                    let qText = line.replace(/^(?:Q\d*|\d+|Q)[.)\]:\s]*/i, '').trim();
                    currentQuestion = { text: qText, options: [] };
                } else if (isOptionLine) {
                    if (!currentQuestion) currentQuestion = { text: "Untitled Question", options: [] };
                    if (currentQuestion.options.length < 4) {
                        const optText = line.replace(/^[a-e1-5][.)\]]\s*/i, '');
                        currentQuestion.options.push({ text: optText, isCorrect: false });
                    }
                } else if (currentQuestion) {
                    if (currentQuestion.options.length === 0) currentQuestion.text += " " + line;
                    else currentQuestion.options[currentQuestion.options.length - 1].text += " " + line;
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
            toast.success(`Imported ${successCount} modules`, { id: tid });
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

    const handleDeleteQuestion = async (id, e) => {
        e.stopPropagation();
        if (!confirm("Delete?")) return;
        const tid = toast.loading("Removing...");
        try {
            const res = await fetch(`/api/admin/assessment/questions?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Cleared", { id: tid });
                fetchData();
            }
        } catch { toast.error("Error", { id: tid }); }
    };

    useEffect(() => {
        if (activeTab === 'submissions' || activeTab === 'rejected') fetchSubmissions();
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
        return <UserDetailView data={selectedUserData} loading={loadingDetail} onBack={() => setViewingUserId(null)} />;
    }

    const filteredSubmissions = submissions.filter(s => {
        const matchesTrack = filterTrack ? s.track === filterTrack : true;
        const matchesStatus = filterStatus ? s.selectionStatus === filterStatus : true;
        return matchesTrack && matchesStatus;
    });

    return (
        <div className="animate-in fade-in duration-500">
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-3xl -mx-8 -mt-8 px-8 py-5 border-b border-gray-100 shadow-sm mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-8 bg-black rounded-full" />
                        <h1 className="text-2xl font-black text-black tracking-tighter uppercase leading-none">Assessment Dashboard</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <nav className="flex bg-gray-50/50 p-1 rounded-xl border border-gray-100">
                            {['submissions', 'build', 'rejected'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setActiveTab(t)}
                                    className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-black text-white shadow-xl' : 'text-gray-400 hover:text-black'}`}
                                >
                                    {t === 'submissions' ? 'Intelligence' : t === 'build' ? 'Repository' : 'Rejected'}
                                </button>
                            ))}
                        </nav>
                        <button onClick={fetchTracks} className="p-2.5 bg-gray-50 hover:bg-black hover:text-white rounded-xl border border-gray-100 transition-all">
                            <RefreshCw className={`w-4 h-4 ${loadingTracks ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </header>

            <div className="px-8 pb-20 max-w-[1750px] mx-auto">
                {activeTab === 'build' ? (
                    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                        {!selectedTrack ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {tracks.filter(t => selectedCategoryFilter === 'ALL' || t.category === selectedCategoryFilter).map(track => (
                                    <div key={track._id} onClick={() => setSelectedTrack(track.name)} className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col items-center gap-4">
                                        <MacOSFolder size={48} />
                                        <h3 className="text-sm font-black text-black uppercase tracking-widest leading-tight">{track.name}</h3>
                                        <div className="px-4 py-2 bg-gray-100 group-hover:bg-black group-hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Enter Repository</div>
                                    </div>
                                ))}
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
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {exams.map(ex => (
                                                <div key={ex._id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all flex flex-col gap-6">
                                                    <div className="flex items-start justify-between">
                                                        <FileText className="w-6 h-6 text-blue-500" />
                                                        <button onClick={(e) => { e.stopPropagation(); if(confirm("Purge?")) fetch(`/api/admin/assessment/exams?id=${ex._id}`, { method: "DELETE" }).then(() => fetchExams()); }} className="p-2 text-gray-200 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                    <div onClick={() => setSelectedExam(ex)} className="cursor-pointer space-y-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">ID-{ex._id.slice(-6).toUpperCase()}</span>
                                                            <h3 className="text-xs font-black text-black uppercase tracking-widest truncate">{ex.title}</h3>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1"><Activity className="w-3 h-3" /> {ex.questions?.length || 0} Modules</span>
                                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${ex.status === 'active' ? 'text-emerald-500 bg-emerald-50' : 'text-amber-500 bg-amber-50'}`}>{ex.status === 'active' ? 'Active' : 'Inactive'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => setSelectedExam(ex)} className="flex-1 py-3 bg-gray-50 hover:bg-black hover:text-white rounded-xl text-[9px] font-black uppercase">Modify</button>
                                                        <button onClick={() => handleToggleStatus(ex._id, ex.status)} className={`flex-1 py-3 border rounded-xl text-[9px] font-black uppercase ${ex.status === 'active' ? 'border-amber-100 text-amber-600' : 'border-emerald-100 text-emerald-600'}`}>{ex.status === 'active' ? 'Freeze' : 'Release'}</button>
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
                                                <button onClick={handleBulkImport} className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest mt-6">Execute Injection</button>
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
                                                <input className="text-2xl font-black uppercase tracking-tighter bg-transparent w-full outline-none" defaultValue={selectedExam.title} onBlur={async (e) => { if(e.target.value !== selectedExam.title) { fetch("/api/admin/assessment/exams/update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selectedExam._id, title: e.target.value }) }); } }} />
                                                <button onClick={() => setShowSaveModal(true)} className="px-6 py-2 bg-black text-white rounded-lg text-[9px] font-black uppercase tracking-widest">Save Settings</button>
                                            </div>
                                            <div className="divide-y divide-gray-50">
                                                {questions.map((q, idx) => (
                                                    <div key={q._id} className="p-6">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-6">
                                                                <span className="text-[10px] font-black text-gray-200">{String(idx+1).padStart(2,'0')}</span>
                                                                <p className="text-[11px] font-black uppercase tracking-tight">{q.text}</p>
                                                            </div>
                                                            <button onClick={(e) => handleDeleteQuestion(q._id, e)} className="p-2 text-gray-200 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
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
                                    <CustomDropdown value={filterTrack} onChange={setFilterTrack} options={[{ value: "", label: "ALL TRACKS" }, ...tracks.map(t => ({ value: t.name, label: t.name }))]} />
                                    {activeTab === 'submissions' && <CustomDropdown value={filterStatus} onChange={setFilterStatus} options={[{ value: "", label: "ALL STATUS" }, { value: "Pending Selection (24h Buffer)", label: "PENDING" }, { value: "Selected", label: "SELECTED" }, { value: "Rejected", label: "REJECTED" }]} />}
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
                                        {(activeTab === 'rejected' ? filteredSubmissions.filter(s => s.selectionStatus === 'Rejected') : filteredSubmissions).map(s => (
                                            <tr key={s._id} className="hover:bg-gray-50/50 transition-all">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-black text-[11px]">{s.fullName?.charAt(0)}</div>
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
                                                        {(s.selectionStatus !== 'Selected') && <button onClick={() => updateSubmissionStatus(s._id, 'Selected')} className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center hover:bg-neutral-800 transition-all"><UserCheck className="w-4 h-4" /></button>}
                                                        {(s.selectionStatus !== 'Rejected') && <button onClick={() => updateSubmissionStatus(s._id, 'Rejected')} className="w-10 h-10 bg-white border border-gray-100 text-black rounded-xl flex items-center justify-center hover:bg-gray-50 transition-all"><UserX className="w-4 h-4" /></button>}
                                                        <button onClick={() => handleViewUserDetail(s)} className="w-10 h-10 bg-white border border-gray-100 text-gray-400 hover:text-black rounded-xl flex items-center justify-center transition-all"><Eye className="w-4 h-4" /></button>
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

            {/* Modals & Sub-components */}
            {showSaveModal && selectedExam && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSaveModal(false)} />
                    <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95">
                        <div className="p-8 border-b border-gray-50 text-center bg-gray-50/30">
                            <h3 className="text-xl font-black uppercase tracking-tighter">Paper Protocol</h3>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">Update release status for {selectedExam.title}</p>
                        </div>
                        <div className="p-8 space-y-4">
                            <button onClick={() => { handleToggleStatus(selectedExam._id, 'scheduled'); setShowSaveModal(false); }} className="w-full py-4 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl border border-emerald-100 font-black uppercase tracking-widest transition-all">Enable Access</button>
                            <button onClick={() => { handleToggleStatus(selectedExam._id, 'active'); setShowSaveModal(false); }} className="w-full py-4 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-2xl border border-amber-100 font-black uppercase tracking-widest transition-all">Freeze Access</button>
                        </div>
                    </div>
                </div>
            )}

            {viewingAadhaarUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewingAadhaarUser(null)} />
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95">
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="text-xl font-black uppercase tracking-tighter">Identity Proof</h3>
                            <button onClick={() => setViewingAadhaarUser(null)} className="p-2 text-gray-400 hover:text-black"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-8 flex flex-col md:flex-row gap-6">
                            <img src={viewingAadhaarUser.passportPhoto || 'https://placehold.co/400x500'} className="w-32 h-40 object-cover rounded-2xl border" />
                            <div className="flex-1 bg-gray-50 p-6 rounded-2xl">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">Aadhaar Document</p>
                                <img src={viewingAadhaarUser.aadhaarCard || 'https://placehold.co/800x500'} className="w-full h-32 object-contain rounded-xl" />
                                <p className="mt-6 text-2xl font-black font-mono tracking-widest">{viewingAadhaarUser.aadhaarNumber?.replace(/(.{4})/g, '$1 ') || 'XXXX XXXX XXXX'}</p>
                            </div>
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

function UserDetailView({ data, loading, onBack }) {
    if (loading) return <div className="py-32 flex flex-col items-center justify-center gap-6"><RefreshCw className="w-12 h-12 animate-spin text-black" /><p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-300">Syncing Intelligence...</p></div>;
    if (!data) return null;
    const { user, assessment } = data;
    return (
        <div className="animate-in slide-in-from-right-4 duration-500 pb-32">
            <div className="-mt-8 -mx-8 px-8 py-6 bg-white border-b border-gray-100 flex flex-col gap-4 shadow-sm mb-8">
                <button onClick={onBack} className="flex items-center gap-3 text-gray-400 hover:text-black transition-all font-black text-[11px] uppercase tracking-widest"><ArrowLeft className="w-4 h-4" /> Back to Dashboard</button>
                <div className="flex items-center gap-8">
                    <div className="w-20 h-20 rounded-2xl bg-black text-white flex items-center justify-center text-3xl font-black">{user.fullName?.charAt(0)}</div>
                    <div className="space-y-2">
                        <h2 className="text-4xl font-black text-black tracking-tighter uppercase">{user.fullName}</h2>
                        <div className="flex items-center gap-4 text-xs font-bold text-gray-400"><Mail className="w-4 h-4" /> {user.email} | <Activity className="w-4 h-4 ml-2" /> {user.track} Path</div>
                    </div>
                </div>
            </div>
            {assessment ? (
                <div className="space-y-8">
                    <div className="bg-black text-white grid grid-cols-2 md:grid-cols-5 gap-6 p-10 -mx-8">
                        {[{l:'Score', v:`${assessment.scorePercentage}%`}, {l:'Questions', v:`${assessment.score}/${assessment.totalQuestions}`}, {l:'Time', v:`${Math.floor(assessment.timeTaken/60)}m ${assessment.timeTaken%60}s`}, {l:'Verdict', v:assessment.passed ? 'PASSED' : 'FAILED', c:assessment.passed ? 'text-emerald-400' : 'text-red-400'}].map((m, i) => (
                            <div key={i} className="space-y-1"><p className="text-[9px] font-black uppercase text-gray-500 tracking-[0.2em]">{m.l}</p><p className={`text-2xl font-black ${m.c || ''}`}>{m.v}</p></div>
                        ))}
                    </div>
                    <div className="space-y-6">
                        <h3 className="text-2xl font-black uppercase tracking-tighter">Transcript</h3>
                        {assessment.answers?.map((ans, idx) => (
                            <div key={idx} className={`p-8 rounded-[2rem] border ${!ans.selectedOption ? 'bg-gray-50' : ans.isCorrect ? 'bg-emerald-50/30 border-emerald-100' : 'bg-red-50/30 border-red-100'}`}>
                                <div className="flex gap-4 mb-6"><div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black ${!ans.selectedOption ? 'bg-gray-200' : ans.isCorrect ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>{idx+1}</div><p className="text-sm font-black leading-relaxed">{ans.questionId?.text}</p></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white rounded-xl border border-gray-100"><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Candidate</p><p className={`text-xs font-bold uppercase ${ans.isCorrect ? 'text-emerald-600' : 'text-red-500'}`}>{ans.selectedOption || 'No response'}</p></div>
                                    <div className="p-4 bg-white rounded-xl border border-gray-100"><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Correct</p><p className="text-xs font-bold uppercase text-black">{ans.questionId?.options?.find(o => o.isCorrect)?.text}</p></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="py-20 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">No Telemetry Discovered</div>
            )}
        </div>
    );
}

function SelectionBadge({ status, label }) {
    const s = { 'SELECTED': 'bg-black text-white', 'REJECTED': 'bg-white text-gray-200 border-gray-100', 'NEW': 'bg-gray-50 text-gray-400' };
    return <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${s[status] || s.NEW}`}>{label || status}</span>;
}
