"use client";

import React, { useState, useEffect } from "react";
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
    const [activeTab, setActiveTab] = useState('submissions'); // 'build' or 'submissions'

    // --- Dynamic Tracks State ---
    const [tracks, setTracks] = useState([]);
    const [loadingTracks, setLoadingTracks] = useState(true);
    const [loading, setLoading] = useState(false);

    // --- Assessment Builder State ---
    const [selectedTrack, setSelectedTrack] = useState("");
    const [selectedExam, setSelectedExam] = useState(null); // The actual exam object
    const [exams, setExams] = useState([]); // Exams for the selected track
    const [loadingExams, setLoadingExams] = useState(false);
    const [exam, setExam] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loadingExam, setLoadingExam] = useState(false);
    const [isAddingMode, setIsAddingMode] = useState(false);
    const [expandedQuestion, setExpandedQuestion] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL"); // ALL, CODING, RESEARCH
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

    // --- Initialization & State Persistence ---
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedTab = sessionStorage.getItem('as_activeTab');
            const savedTrack = sessionStorage.getItem('as_selectedTrack');
            const savedExam = sessionStorage.getItem('as_selectedExam');
            
            if (savedTab) setActiveTab(savedTab);
            if (savedTrack) setSelectedTrack(savedTrack);
            if (savedExam) setSelectedExam(JSON.parse(savedExam));
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

    // 1. Fetch Tracks First
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
            toast.error("Network Failure connecting to Track Central");
        } finally {
            setLoadingTracks(false);
        }
    };

    // 2. Fetch Exams for Track when Track changes
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
            toast.error("Failed to load question papers");
        } finally {
            setLoadingExams(false);
        }
    };

    // 3. Fetch Questions when Exam changes
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
            } else { toast.error("Transfer Protocol Error", { id: tid }); }
        } catch { toast.error("Network Link Failure", { id: tid }); }
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

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];

                // ── Correct Answer Detection ──
                const ansMatch = line.match(/^(?:ans(?:wer)?|correct|solution)[\s]*[:\-]?[\s]*(.+)$/i);
                if (ansMatch) {
                    if (currentQuestion) {
                        const rawAns = ansMatch[1].trim();
                        let correctIdx = -1;

                        // Case 1: Just a letter or starts with a letter like "a)" "c." "[b]"
                        const letterMatch = rawAns.match(/^([a-eA-E])(?:\s*[\).\]:]?|\s+)/i);
                        if (letterMatch) {
                            correctIdx = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
                        } 
                        // Case 2: Numeric index
                        else if (/^\d+$/.test(rawAns)) {
                            correctIdx = Math.max(0, parseInt(rawAns) - 1);
                        }
                        // Case 3: Text match (trying to find which option text is in the answer line)
                        else {
                            const lowerAns = rawAns.toLowerCase();
                            // First try exact match or deep inclusion
                            correctIdx = currentQuestion.options.findIndex(o => 
                                lowerAns.includes(o.text.toLowerCase()) || 
                                o.text.toLowerCase().includes(lowerAns)
                            );
                        }

                        // Apply the detected index
                        if (correctIdx !== -1 && currentQuestion.options[correctIdx]) {
                            currentQuestion.options.forEach(o => o.isCorrect = false);
                            currentQuestion.options[correctIdx].isCorrect = true;
                        }

                        // Finalize current question if it has enough options
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

                if (/^[1-5][.)\]]\s+/i.test(line) && currentQuestion && currentQuestion.options.length > 0 && currentQuestion.options.length < 4) {
                    isOptionLine = true;
                    isQuestionLine = false;
                }

                if (isQuestionLine) {
                    if (currentQuestion) {
                        if (currentQuestion.options.length > 0) {
                            while (currentQuestion.options.length < 4) currentQuestion.options.push({ text: `Option ${currentQuestion.options.length + 1}`, isCorrect: false });
                            importedQuestions.push(currentQuestion);
                        }
                    }
                    let qText = line.replace(/^(?:Q\d*|\d+|Q)[.)\]:\s]*/i, '').trim();
                    currentQuestion = { text: qText, options: [] };
                } else if (isOptionLine) {
                    if (!currentQuestion) {
                        currentQuestion = { text: line, options: [] };
                    } else if (currentQuestion.options.length < 4) {
                        const optText = line.replace(/^[a-e1-5][.)\]]\s*/i, '');
                        currentQuestion.options.push({ text: optText, isCorrect: false });
                    }
                } else {
                    if (currentQuestion) {
                        if (currentQuestion.options.length === 0) {
                            currentQuestion.text += " " + line;
                        } else {
                            currentQuestion.options[currentQuestion.options.length - 1].text += " " + line;
                        }
                    } else {
                        currentQuestion = { text: line, options: [] };
                    }
                }
            }

            if (currentQuestion && currentQuestion.options.length > 0) {
                if (!currentQuestion.options.find(o => o.isCorrect) && currentQuestion.options[0]) currentQuestion.options[0].isCorrect = true;
                while (currentQuestion.options.length < 4) currentQuestion.options.push({ text: `Option ${currentQuestion.options.length + 1}`, isCorrect: false });
                importedQuestions.push(currentQuestion);
            }

            if (importedQuestions.length === 0) {
                toast.error("No parseable questions found.", { id: tid });
                setIsParsing(false);
                return;
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

            toast.success(`Injected ${successCount} modules!`, { id: tid });
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
                setNewQuestion({
                    text: "",
                    options: [
                        { text: "", isCorrect: true },
                        { text: "", isCorrect: false },
                        { text: "", isCorrect: false },
                        { text: "", isCorrect: false }
                    ]
                });
                setIsAddingMode(false);
                fetchData();
            } else { toast.error("Fail", { id: tid }); }
        } catch (error) { toast.error("Error", { id: tid }); }
    };

    const handleSaveEdit = async () => {
        if (!editQuestionData) return;
        const tid = toast.loading("Saving changes...");
        try {
            const res = await fetch("/api/admin/assessment/questions", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: editQuestionData._id, text: editQuestionData.text, options: editQuestionData.options })
            });

            if (res.ok) {
                toast.success("Changes saved", { id: tid });
                setEditQuestionId(null);
                setEditQuestionData(null);
                fetchData();
            } else { toast.error("Could not update changes", { id: tid }); }
        } catch(e) { toast.error("Error saving edits", { id: tid }); }
    };

    const handleDeleteQuestion = async (id, e) => {
        e.stopPropagation();
        if (!confirm("Delete logic module?")) return;
        const tid = toast.loading("Removing...");
        try {
            const res = await fetch(`/api/admin/assessment/questions?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Cleared", { id: tid });
                fetchData();
            }
        } catch (e) { toast.error("Fail", { id: tid }); }
    };

    // 3. Fetch Submissions
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
        } catch (err) { toast.error('Error'); }
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
                toast.success(`Success`);
                fetchSubmissions();
            }
        } catch (err) { toast.error('Fail'); }
    };

    const handleViewUserDetail = async (user) => {
        setViewingUserId(user._id);
        setLoadingDetail(true);
        setSelectedUserData(null);
        try {
            const res = await fetch(`/api/admin/users/result?userId=${user._id}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedUserData({ ...data, user });
            } else {
                toast.error("Telemetry Retrieval Failed");
                setViewingUserId(null);
            }
        } catch (error) {
            toast.error("Network Link Error");
            setViewingUserId(null);
        } finally {
            setLoadingDetail(false);
        }
    };

    if (viewingUserId) {
        return (
            <UserDetailView 
                data={selectedUserData} 
                loading={loadingDetail} 
                onBack={() => setViewingUserId(null)} 
            />
        );
    }

    const filteredSubmissions = submissions.filter(s => {
        const matchesTrack = filterTrack ? s.track === filterTrack : true;
        const matchesStatus = filterStatus ? s.selectionStatus === filterStatus : true;
        return matchesTrack && matchesStatus;
    });

    return (
        <div className="animate-in fade-in duration-500">
            {/* Sticky Header */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-3xl -mx-8 -mt-8 px-8 py-5 border-b border-gray-100 shadow-sm mb-8">
                <div className="flex items-center justify-between gap-6 w-full">
                    <div>
                        <h1 className="text-xl font-bold text-black tracking-tight uppercase leading-none">
                            Question Paper Hub
                        </h1>
                        {selectedTrack && (
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                                 Tracks / {selectedTrack} {selectedExam && `/ ${selectedExam.title}`}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-6">
                        <nav className="flex items-center bg-gray-50/50 p-1 rounded-xl border border-gray-100">
                            <button
                                onClick={() => setActiveTab('submissions')}
                                className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'submissions' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-black hover:bg-white'}`}
                            >
                                Submissions
                            </button>
                            <button
                                onClick={() => setActiveTab('build')}
                                className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'build' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-black hover:bg-white'}`}
                            >
                                Question Bank
                            </button>
                        </nav>

                        {activeTab === 'build' && !selectedTrack && (
                            <div className="flex items-center gap-3 bg-white/50 p-1 rounded-xl border border-gray-100 shadow-sm animate-in zoom-in-95 duration-200">
                                <Layers className="w-3.5 h-3.5 text-gray-400 ml-2" />
                                <select
                                    value={selectedCategoryFilter}
                                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                                    className="bg-transparent border-none focus:outline-none text-[8px] font-black uppercase tracking-[0.2em] text-black pr-4 cursor-pointer"
                                >
                                    <option value="ALL">ALL CATEGORIES</option>
                                    {[...new Set(tracks.map(t => t.category))].filter(Boolean).map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        
                        <button
                            onClick={fetchTracks}
                            disabled={loading}
                            className={`p-2.5 bg-gray-50 hover:bg-black hover:text-white rounded-xl transition-all border border-gray-100 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </header>

            <div className="px-8 pb-20 max-w-[1750px] mx-auto">

            <div className="max-w-7xl mx-auto space-y-6">
                {activeTab === 'build' ? (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                    {!selectedTrack ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {tracks
                                .filter(t => selectedCategoryFilter === 'ALL' || t.category === selectedCategoryFilter)
                                .map(track => (
                                 <div 
                                     key={track._id}
                                     onClick={() => setSelectedTrack(track.name)}
                                     className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-4"
                                 >
                                     <div className="w-16 h-16 flex items-center justify-center transition-all duration-500 group-hover:scale-110">
                                         <MacOSFolder size={48} />
                                     </div>
                                     <div className="space-y-1">
                                         <h3 className="text-sm font-black text-black uppercase tracking-widest leading-tight">{track.name}</h3>
                                         <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Entry Assessment Paper</p>
                                     </div>
                                     <div className="px-4 py-2 bg-gray-100 group-hover:bg-black group-hover:text-white rounded-xl transition-all text-[9px] font-black uppercase tracking-widest">
                                         Enter Repository
                                     </div>
                                 </div>
                             ))}
                         </div>
                    ) : (
                        <div className="space-y-6">
                            {!selectedExam ? (
                                <div className="space-y-8">
                                    {/* Navigation breadcrumb replaces folder icon */}
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <button 
                                                onClick={() => setSelectedTrack("")}
                                                className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm"
                                            >
                                                <ArrowLeft className="w-4 h-4" />
                                            </button>
                                            <div className="flex flex-col">
                                                 <h3 className="text-xs font-black text-black uppercase tracking-widest leading-none">Management Repository</h3>
                                                 <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Available question papers for active track</p>
                                            </div>
                                        </div>
                                        
                                        <button
                                            onClick={async () => {
                                                const defaultTitle = `SET ${exams.length + 1}`;
                                                const tid = toast.loading("Initializing Blueprint...");
                                                try {
                                                    const res = await fetch("/api/admin/assessment/exams", {
                                                        method: "POST",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({ track: selectedTrack, title: defaultTitle })
                                                    });
                                                    if (res.ok) {
                                                        const newPaper = await res.json();
                                                        toast.success("ID Created & Blueprint Synced!", { id: tid });
                                                        fetchExams();
                                                        setSelectedExam(newPaper);
                                                    } else toast.error("Failed", { id: tid });
                                                } catch { toast.error("Error", { id: tid }); }
                                            }}
                                            className="px-5 py-2.5 bg-black text-white hover:bg-neutral-800 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg flex items-center gap-2 whitespace-nowrap"
                                        >
                                            <Plus className="w-4 h-4" /> Create Unique Paper
                                        </button>
                                    </div>

                                    {/* Question Papers List */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {loadingExams ? (
                                            Array(3).fill(0).map((_, i) => <div key={i} className="h-40 bg-white rounded-3xl border border-gray-100 animate-pulse" />)
                                        ) : exams.length === 0 ? (
                                            <div className="col-span-full py-20 text-center space-y-4">
                                                <Layers className="w-12 h-12 text-gray-100 mx-auto" />
                                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No question papers found in this track</p>
                                            </div>
                                        ) : exams.map(ex => (
                                            <div 
                                                key={ex._id}
                                                className="group relative bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all flex flex-col gap-6"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                                                        <FileText className="w-6 h-6" />
                                                    </div>
                                                    <button 
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            if (!confirm("Permanently purge this question paper?")) return;
                                                            const tid = toast.loading("Deleting...");
                                                            try {
                                                                const res = await fetch(`/api/admin/assessment/exams?id=${ex._id}`, { method: "DELETE" });
                                                                if (res.ok) {
                                                                    toast.success("Purged", { id: tid });
                                                                    fetchExams();
                                                                }
                                                            } catch { toast.error("Error", { id: tid }); }
                                                        }}
                                                        className="p-2 text-gray-200 hover:text-rose-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div onClick={() => setSelectedExam(ex)} className="cursor-pointer space-y-4 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">ID-{ex._id.slice(-6).toUpperCase()}</span>
                                                        <h3 className="text-xs font-black text-black uppercase tracking-widest leading-tight truncate">{ex.title}</h3>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                                            <Activity className="w-3 h-3" /> {ex.questions?.length || 0} Modules
                                                        </div>
                                                        <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${ex.status === 'active' ? 'text-emerald-500 bg-emerald-50' : 'text-amber-500 bg-amber-50'}`}>
                                                            {ex.status === 'active' ? 'Active' : 'Inactive'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => setSelectedExam(ex)}
                                                        className="flex-1 py-3 bg-gray-50 hover:bg-black hover:text-white rounded-xl transition-all text-[9px] font-black uppercase tracking-widest"
                                                    >
                                                        Modify
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleToggleStatus(ex._id, ex.status); }}
                                                        className={`flex-1 py-3 border rounded-xl transition-all text-[9px] font-black uppercase tracking-widest ${ex.status === 'active' ? 'border-amber-100 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white' : 'border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}
                                                    >
                                                        {ex.status === 'active' ? 'Freeze' : 'Release'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 mb-2">
                                        <button 
                                            onClick={() => setSelectedExam(null)}
                                            className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                        </button>
                                        <div className="flex-1" />
                                    </div>


                                    {/* Bulk & Adding modes remain same logic below */}
                                    {isBulkMode && (
                                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm animate-in zoom-in-95 duration-300">
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="flex items-center gap-3">
                                                    <FileDigit className="w-5 h-5 text-black" />
                                                    <div>
                                                        <h3 className="text-xs font-black text-black uppercase tracking-widest">Bulk Paper Construction</h3>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Paste your paper contents or upload below</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => setIsBulkMode(false)} className="text-gray-400 hover:text-black transition-colors"><X className="w-5 h-5" /></button>
                                            </div>

                                            <div className="space-y-6">


                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Text Transcript Import</label>
                                                    <textarea
                                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-5 text-[10px] font-mono font-bold focus:ring-8 focus:ring-black/5 outline-none resize-none h-64 transition-all text-black shadow-inner"
                                                        placeholder={`What is React?\nA: UI Library\nB: CSS Framework\nC: Backend Tool\nD: Database\nAns: UI Library\n\n[Repeat for next item]`}
                                                        value={bulkImportText}
                                                        onChange={e => setBulkImportText(e.target.value)}
                                                    />
                                                </div>

                                                <button 
                                                    onClick={handleBulkImport}
                                                    disabled={!bulkImportText || isParsing}
                                                    className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-[0.4em] shadow-lg hover:bg-neutral-800 transition-all flex items-center justify-center gap-3 text-[11px] disabled:opacity-50"
                                                >
                                                    <FileCheck className={`w-5 h-5 ${isParsing ? 'animate-bounce' : ''}`} /> EXECUTE BULK INJECTION
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {isAddingMode && (
                                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm animate-in zoom-in-95 duration-300">
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="flex items-center gap-3">
                                                    <Target className="w-5 h-5 text-black" />
                                                    <div>
                                                        <h3 className="text-xs font-black text-black uppercase tracking-widest">Single Module Deployment</h3>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Hand-craft a specific assessment question</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => setIsAddingMode(false)} className="text-gray-400 hover:text-black transition-colors"><X className="w-5 h-5" /></button>
                                            </div>

                                            <form onSubmit={handleAddQuestion} className="space-y-8">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Objective Text</label>
                                                    <textarea
                                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-5 text-xs font-bold focus:ring-8 focus:ring-black/5 outline-none resize-none h-32 transition-all text-black shadow-inner"
                                                        placeholder="Formulate details..."
                                                        value={newQuestion.text}
                                                        onChange={e => setNewQuestion({ ...newQuestion, text: e.target.value })}
                                                        required
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                    {newQuestion.options.map((opt, idx) => (
                                                        <div key={idx} className="space-y-2 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Option {String.fromCharCode(65 + idx)}</label>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const updated = newQuestion.options.map((o, i) => ({ ...o, isCorrect: i === idx }));
                                                                        setNewQuestion({ ...newQuestion, options: updated });
                                                                    }}
                                                                    className={`text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full transition-all border ${opt.isCorrect ? 'bg-black text-white border-black scale-105' : 'bg-white text-gray-400 border-gray-100 hover:border-black hover:text-black'}`}
                                                                >
                                                                    {opt.isCorrect ? "● CORRECT SOLUTION" : "○ MARK AS CORRECT"}
                                                                </button>
                                                            </div>
                                                            <input
                                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-black/5 transition-all text-black shadow-sm"
                                                                placeholder="..."
                                                                value={opt.text}
                                                                onChange={e => {
                                                                    const updated = [...newQuestion.options];
                                                                    updated[idx].text = e.target.value;
                                                                    setNewQuestion({ ...newQuestion, options: updated });
                                                                }}
                                                                required
                                                            />
                                                        </div>
                                                    ))}
                                                </div>

                                                <button type="submit" className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-[0.4em] shadow-lg hover:bg-neutral-800 transition-all flex items-center justify-center gap-3 text-[11px]">
                                                    COMMIT TO SYSTEM BANK <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </form>
                                        </div>
                                    )}

                                    {/* Blueprint System Architecture Header */}
                                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
                                        <div className="p-8 border-b border-gray-100 flex flex-col gap-6 bg-gray-50/10">
                                            
                                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 w-full">
                                                <div className="flex flex-col gap-1 w-full">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-6 bg-black rounded-full" />
                                                        <input 
                                                            className="text-2xl font-black text-black uppercase tracking-tighter bg-transparent border-none focus:outline-none w-full"
                                                            defaultValue={selectedExam.title}
                                                            onBlur={async (e) => {
                                                                if (e.target.value === selectedExam.title) return;
                                                                const tid = toast.loading("Syncing Metadata...");
                                                                try {
                                                                    const res = await fetch("/api/admin/assessment/exams/update", {
                                                                        method: "POST",
                                                                        headers: { "Content-Type": "application/json" },
                                                                        body: JSON.stringify({ id: selectedExam._id, title: e.target.value })
                                                                    });
                                                                    if (res.ok) {
                                                                        const updated = await res.json();
                                                                        setSelectedExam(updated);
                                                                        toast.success("Metadata Restructured", { id: tid });
                                                                        fetchExams();
                                                                    }
                                                                } catch { toast.error("Sync Failure", { id: tid }); }
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="pl-3.5 flex flex-col items-start gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase tracking-widest inline-block w-max">ID-{selectedExam._id.toUpperCase()}</span>
                                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${selectedExam.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                                {selectedExam.status === 'active' ? 'Access Active' : 'Access Frozen'}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-4 mt-2">
                                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Track: <span className="text-black">{selectedTrack}</span></p>
                                                            <div className="h-4 w-[1px] bg-gray-200" />
                                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Questions: <span className="text-black">{questions.length}</span></p>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-3">
                                                    <button 
                                                        onClick={() => setShowSaveModal(true)}
                                                        className="px-6 py-2 bg-black text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-sm flex items-center gap-2"
                                                    >
                                                        Save Paper
                                                    </button>
                                                    <button 
                                                        onClick={async () => {
                                                            if (!confirm("Are you sure you want to clear ALL questions?")) return;
                                                            const tid = toast.loading("Clearing Questions...");
                                                            try {
                                                                let c = 0;
                                                                for(const q of questions) {
                                                                    await fetch(`/api/admin/assessment/questions?id=${q._id}`, { method: "DELETE" });
                                                                    c++;
                                                                }
                                                                toast.success(`Cleared ${c} Questions`, { id: tid });
                                                                fetchData();
                                                            } catch(e) { toast.error("Failed to clear", { id: tid }); }
                                                        }}
                                                        className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm whitespace-nowrap"
                                                    >
                                                        Clear All
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Action bar and Search grouped together below */}
                                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full pt-4 border-t border-gray-100">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => { setIsBulkMode(!isBulkMode); setIsAddingMode(false); }}
                                                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border ${isBulkMode ? 'bg-black text-white shadow-lg' : 'bg-white text-black border-gray-200 hover:bg-gray-50'}`}
                                                    >
                                                        <Upload className="w-3.5 h-3.5" /> Bulk Add
                                                    </button>
                                                    <button
                                                        onClick={() => { setIsAddingMode(!isAddingMode); setIsBulkMode(false); }}
                                                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border ${isAddingMode ? 'bg-black text-white shadow-lg' : 'bg-white text-black border-gray-200 hover:bg-gray-50'}`}
                                                    >
                                                        <Plus className="w-3.5 h-3.5" /> Single Question
                                                    </button>
                                                </div>
                                                
                                                <div className="relative w-full sm:max-w-xs ml-auto">
                                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search question bank..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 text-[10px] font-bold focus:bg-gray-50 focus:ring-4 focus:ring-black/5 outline-none transition-all shadow-sm text-black uppercase tracking-wide"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="divide-y divide-gray-50">
                                            {loadingExam ? (
                                                Array(3).fill(0).map((_, i) => <div key={i} className="p-6 animate-pulse"><div className="h-4 bg-gray-50 rounded-lg w-full" /></div>)
                                            ) : questions.filter(q => q.text.toLowerCase().includes(searchQuery.toLowerCase())).map((q, idx) => (
                                                <div key={q._id} className="group transition-all">
                                                    {editQuestionId === q._id ? (
                                                        <div className="p-6 bg-gray-50 flex flex-col gap-4 border-b border-gray-100">
                                                            <div className="flex gap-4">
                                                                <span className="text-[10px] font-black text-gray-400 p-3 bg-white rounded-xl shadow-sm border border-gray-100 h-10 w-10 flex items-center justify-center">
                                                                    {String(idx + 1).padStart(2, '0')}
                                                                </span>
                                                                <textarea
                                                                    className="w-full bg-white border border-gray-200 rounded-xl p-4 text-[11px] font-bold outline-none text-black"
                                                                    value={editQuestionData.text}
                                                                    onChange={e => setEditQuestionData({...editQuestionData, text: e.target.value})}
                                                                    rows="3"
                                                                />
                                                            </div>
                                                            <div className="pl-14 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {editQuestionData.options.map((opt, i) => (
                                                                    <div key={i} className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => {
                                                                                const updated = editQuestionData.options.map((o, idxOptions) => ({...o, isCorrect: i === idxOptions}));
                                                                                setEditQuestionData({...editQuestionData, options: updated});
                                                                            }}
                                                                            type="button"
                                                                            className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center font-black text-[9px] transition-all border ${opt.isCorrect ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-200 hover:border-black hover:text-black hover:shadow-sm'}`}
                                                                        >
                                                                            {String.fromCharCode(65 + i)}
                                                                        </button>
                                                                        <input
                                                                            className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-[10px] font-bold outline-none text-black transition-all focus:border-black focus:ring-2 focus:ring-black/5"
                                                                            value={opt.text}
                                                                            onChange={e => {
                                                                                const updated = [...editQuestionData.options];
                                                                                updated[i].text = e.target.value;
                                                                                setEditQuestionData({...editQuestionData, options: updated});
                                                                            }}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="pl-14 flex items-center gap-3 justify-end mt-2">
                                                                <button onClick={() => setEditQuestionId(null)} className="px-5 py-2 text-[9px] font-black uppercase text-gray-500 hover:text-black transition-all">Cancel</button>
                                                                <button onClick={handleSaveEdit} className="px-6 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all hover:bg-emerald-500 hover:text-white shadow-sm">Save Config</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div 
                                                                onClick={() => setExpandedQuestion(expandedQuestion === q._id ? null : q._id)}
                                                                className={`p-6 flex items-center justify-between gap-6 hover:bg-gray-50/40 transition-all cursor-pointer ${expandedQuestion === q._id ? 'bg-gray-50' : ''}`}
                                                            >
                                                                <div className="flex items-center gap-6 flex-1">
                                                                    <span className="text-[10px] font-black text-gray-200">{String(idx + 1).padStart(2, '0')}</span>
                                                                    <div className={`p-1.5 rounded-lg transition-all ${expandedQuestion === q._id ? 'rotate-180 bg-black text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-white'}`}>
                                                                        <ChevronDown className="w-3.5 h-3.5" />
                                                                    </div>
                                                                    <p className="text-[11px] font-black text-black uppercase tracking-normal line-clamp-1">{q.text}</p>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <button onClick={(e) => { e.stopPropagation(); setEditQuestionId(q._id); setEditQuestionData({...q}); }} className="px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all shadow-sm">Edit</button>
                                                                    <button onClick={(e) => handleDeleteQuestion(q._id, e)} className="p-2 bg-white border border-gray-100 text-gray-300 hover:bg-red-50 hover:text-red-500 hover:border-red-100 rounded-lg transition-all shadow-sm"><Trash2 className="w-3.5 h-3.5" /></button>
                                                                </div>
                                                            </div>
                                                            {expandedQuestion === q._id && (
                                                                <div className="px-16 py-6 bg-white grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-50 animate-in slide-in-from-top-1 duration-200">
                                                                    {q.options.map((opt, i) => (
                                                                        <div key={i} className={`p-4 rounded-xl border ${opt.isCorrect ? 'bg-black text-white border-transparent shadow-lg' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                                                                            <div className="flex items-center gap-4">
                                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[9px] shadow-sm ${opt.isCorrect ? 'bg-white text-black' : 'bg-white border border-gray-200 text-gray-400'}`}>{String.fromCharCode(65 + i)}</div>
                                                                                <p className="text-[10px] font-bold uppercase tracking-wide leading-relaxed">{opt.text}</p>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                            {questions.length === 0 && !loadingExam && (
                                                <div className="py-20 text-center text-gray-300 text-[10px] font-black uppercase tracking-widest">Repository is Empty</div>
                                            )}
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
                        <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/10">
                            <div className="flex gap-3 w-full md:w-auto">
                                <div className="relative min-w-[200px]">
                                    <select value={filterTrack} onChange={e => setFilterTrack(e.target.value)} className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2 font-black uppercase text-[10px] tracking-widest outline-none focus:ring-4 focus:ring-black/5 transition-all appearance-none cursor-pointer shadow-sm">
                                        <option value="">Full Universe</option>
                                        {tracks.map(t => <option key={t._id} value={t.name}>{t.name}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" />
                                </div>
                                <div className="relative min-w-[180px]">
                                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2 font-black uppercase text-[10px] tracking-widest outline-none focus:ring-4 focus:ring-black/5 transition-all appearance-none cursor-pointer shadow-sm">
                                        <option value="">All Status</option>
                                        <option value="Pending Selection (24h Buffer)">Pending</option>
                                        <option value="Selected">Selected</option>
                                        <option value="Rejected">Rejected</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" />
                                </div>
                            </div>

                            <button onClick={fetchSubmissions} className="bg-black text-white p-3 rounded-xl hover:bg-neutral-800 transition-all shadow-sm">
                                <RefreshCw className={`w-4 h-4 ${loadingSubmissions ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/30">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Candidate Intel</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Pathway</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Identity</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Score %</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Protocol</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Ops</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loadingSubmissions ? (
                                        Array(3).fill(0).map((_, i) => <tr key={i}><td colSpan="5" className="px-8 py-8 animate-pulse"><div className="h-2 bg-gray-50 rounded-lg w-full" /></td></tr>)
                                    ) : filteredSubmissions.length === 0 ? (
                                        <tr><td colSpan="5" className="px-8 py-32 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">No Candidate Intelligence FOUND</td></tr>
                                    ) : filteredSubmissions.map(s => (
                                        <tr key={s._id} className="group hover:bg-gray-50/50 transition-all">
                                            <td className="px-8 py-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-black text-[11px] shadow-lg shadow-black/10">
                                                        {s.fullName?.[0]}
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-xs font-black text-black uppercase tracking-tight">{s.fullName}</p>
                                                        <p className="text-[9px] font-bold text-gray-400 tracking-tight flex items-center gap-1.5"><Mail className="w-3 h-3 text-gray-200" /> {s.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-8 text-center">
                                                <span className="text-[9px] font-black uppercase bg-gray-50 px-3 py-1.5 rounded-lg text-black border border-gray-100 tracking-widest">{s.track}</span>
                                            </td>
                                            <td className="px-8 py-8 text-center">
                                                {s.aadhaarCard ? (
                                                    <button
                                                        onClick={() => setViewingAadhaarUser(s)}
                                                        className="px-3 py-1.5 bg-gray-50 text-[9px] font-black text-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 mx-auto hover:bg-black hover:text-white transition-all shadow-sm border border-gray-100"
                                                    >
                                                        <Shield className="w-3 h-3" /> Aadhaar
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] font-black text-gray-200 uppercase tracking-widest">--</span>
                                                )}
                                            </td>
                                            <td className="px-8 py-8 text-center">
                                                <span className={`text-3xl font-black tracking-tighter ${s.assessmentScore >= 75 ? 'text-black' : 'text-gray-300'}`}>{Math.round(s.assessmentScore)}%</span>
                                            </td>
                                            <td className="px-8 py-8 text-center">
                                                <SelectionBadge status={s.selectionStatus === 'Selected' ? 'SELECTED' : (s.selectionStatus === 'Rejected' ? 'REJECTED' : 'NEW')} label={s.selectionStatus?.split(' ')[0]} />
                                            </td>
                                            <td className="px-8 py-8 text-right">
                                                <div className="flex gap-2 justify-end transition-all">
                                                    {s.selectionStatus === 'Pending Selection (24h Buffer)' && (
                                                        <>
                                                            <button title="Select" onClick={() => updateSubmissionStatus(s._id, 'Selected')} className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center hover:bg-neutral-800 transition-all shadow-sm">
                                                                <UserCheck className="w-4 h-4" />
                                                            </button>
                                                            <button title="Reject" onClick={() => updateSubmissionStatus(s._id, 'Rejected')} className="w-10 h-10 bg-white border border-gray-100 text-black rounded-xl flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm">
                                                                <UserX className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button 
                                                        title="Inspect Mission Metrics" 
                                                        onClick={() => handleViewUserDetail(s)}
                                                        className="w-10 h-10 bg-white border border-gray-100 text-gray-400 hover:text-black rounded-xl flex items-center justify-center shadow-sm"
                                                    >
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

            {/* Save Exam Status Modal */}
            {showSaveModal && selectedExam && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSaveModal(false)}></div>
                    <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-gray-50 flex flex-col items-center justify-center bg-gray-50/30 text-center relative">
                            <button onClick={() => setShowSaveModal(false)} className="absolute right-6 top-6 text-gray-400 hover:text-black transition-colors"><X className="w-5 h-5" /></button>
                            <h3 className="text-xl font-black uppercase tracking-tighter mt-4">
                                Save Module
                            </h3>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2 px-4 leading-relaxed">
                                Control candidate access. Releasing makes it instantly available to interns in this track.
                            </p>
                        </div>
                        <div className="p-8 space-y-4">
                            <button 
                                onClick={async () => {
                                    if (selectedExam.status !== 'active') {
                                        await handleToggleStatus(selectedExam._id, 'scheduled');
                                    } else {
                                        toast.success("Blueprint is already Active");
                                    }
                                    setShowSaveModal(false);
                                    setSelectedExam(null);
                                }}
                                className="w-full py-4 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl border border-emerald-100 flex items-center justify-center gap-3 font-black uppercase tracking-[0.1em] transition-all shadow-sm"
                            >
                                <ShieldCheck className="w-5 h-5" /> RELEASE PAPER
                            </button>
                            <button 
                                onClick={async () => {
                                    if (selectedExam.status !== 'scheduled') {
                                        await handleToggleStatus(selectedExam._id, 'active');
                                    } else {
                                        toast.success("Blueprint is already Frozen");
                                    }
                                    setShowSaveModal(false);
                                    setSelectedExam(null);
                                }}
                                className="w-full py-4 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-2xl border border-amber-100 flex items-center justify-center gap-3 font-black uppercase tracking-[0.1em] transition-all shadow-sm"
                            >
                                <Shield className="w-5 h-5" /> FREEZE PAPER
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Aadhaar Modal */}
            {viewingAadhaarUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewingAadhaarUser(null)}></div>
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                                    <ShieldCheck className="w-6 h-6 text-black" /> Identity Document
                                </h3>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                                    Candidate: {viewingAadhaarUser.fullName}
                                </p>
                            </div>
                            <button 
                                onClick={() => setViewingAadhaarUser(null)}
                                className="w-10 h-10 bg-white border border-gray-100 text-gray-400 hover:text-black rounded-xl flex items-center justify-center shadow-sm transition-all hover:bg-gray-50 hover:-rotate-90"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-6">
                            <div className="flex flex-col md:flex-row gap-6 w-full items-start">
                                {/* Passport Photo */}
                                <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 flex-shrink-0 mx-auto md:mx-0 w-full md:w-auto flex flex-col items-center justify-center">
                                    <img 
                                        src={viewingAadhaarUser.passportPhoto || viewingAadhaarUser.profilePicture || ""} 
                                        alt="Passport Photo" 
                                        className="w-32 h-40 object-cover rounded-2xl shadow-sm border border-gray-200 bg-white"
                                        onError={(e) => { 
                                            e.target.onerror = null; 
                                            e.target.src = 'https://placehold.co/400x500?text=No+Photo' 
                                        }}
                                        crossOrigin="anonymous"
                                    />
                                    <p className="text-center mt-3 text-[9px] font-black uppercase text-gray-400 tracking-widest">Candidate Photo</p>
                                </div>

                                {/* Aadhaar Card */}
                                <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 flex-grow flex flex-col items-center justify-center w-full min-h-[192px]">
                                    <img 
                                        src={viewingAadhaarUser.aadhaarCard || ""} 
                                        alt="Aadhaar Card" 
                                        className="max-h-40 object-contain rounded-2xl shadow-sm border border-gray-200"
                                        onError={(e) => { 
                                            e.target.onerror = null; 
                                            e.target.src = 'https://placehold.co/800x500?text=No+ID+Card' 
                                        }}
                                        crossOrigin="anonymous"
                                    />
                                    <p className="text-center mt-3 text-[9px] font-black uppercase text-gray-400 tracking-widest">Aadhaar Card</p>
                                </div>
                            </div>

                            <div className="bg-black text-white p-6 rounded-3xl flex items-center justify-between shadow-inner w-full">
                                <div>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-1">Authenticated Number</p>
                                    <p className="text-2xl font-black tracking-widest font-mono">
                                        {viewingAadhaarUser.aadhaarNumber?.replace(/(.{4})/g, '$1 ') || 'XXXX XXXX XXXX'}
                                    </p>
                                </div>
                                <ShieldCheck className="w-10 h-10 text-emerald-400 opacity-80" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
                </div>
            </div>
        </div>
    );
}

function UserDetailView({ data, loading, onBack }) {
    if (loading) {
        return (
            <div className="py-32 flex flex-col items-center justify-center gap-6 animate-in fade-in">
                <RefreshCw className="w-12 h-12 animate-spin text-black" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-300">Retrieving Vault Data...</p>
            </div>
        );
    }

    if (!data) return null;

    const { user, assessment, projects } = data;

    return (
        <div className="animate-in slide-in-from-right-4 duration-500 pb-32">
            
            {/* Profile Header Block Full Width */}
            <div className="-mt-8 -mx-8 px-8 py-6 bg-white border-b border-gray-100 flex flex-col items-start gap-4 relative overflow-hidden shadow-sm">
                
                <button 
                    onClick={onBack}
                    className="flex items-center gap-3 text-gray-400 hover:text-black transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[11px] font-black uppercase tracking-widest">Back to Hub</span>
                </button>

                <div className="flex flex-col md:flex-row items-center gap-8 w-full">
                    <div className="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-200 relative z-10 shrink-0">
                        {user?.fullName ? (
                            <span className="text-2xl font-black text-black tracking-tighter shadow-sm w-full h-full flex items-center justify-center">
                                {user.fullName.charAt(0)}
                            </span>
                        ) : (
                            <UserCircle className="w-12 h-12" strokeWidth={1} />
                        )}
                    </div>

                    <div className="flex-1 space-y-3 relative z-10 w-full pl-4 md:pl-0">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <h2 className="text-4xl font-black text-black tracking-tighter uppercase">{user?.fullName || "Identity Unknown"}</h2>
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-black/5 text-black text-[9px] font-black uppercase rounded-lg">{user?.role === 'admin' ? 'ADMIN' : 'INTERN'}</span>
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase rounded-lg flex items-center gap-1.5 border border-emerald-100">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-gray-400 hover:text-black transition-colors">
                            <Mail className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold tracking-tight">{user?.email}</span>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 pt-2">
                            <ProfileMeta label="TRACK" value={user?.track || "Web Development"} />
                            <ProfileMeta label="PHONE" value={user?.phone || "+91 9342560109"} />
                            <ProfileMeta label="AADHAAR" value={user?.aadhaarNumber ? user.aadhaarNumber.replace(/(.{4})/g, '$1 ').trim() : "NOT PROVIDED"} />
                            <ProfileMeta label="DURATION" value="Permanent" />
                            <ProfileMeta label="INTERNSHIP PERIOD" value={`${new Date(user?.createdAt || Date.now()).toLocaleDateString()} — Feb 20, 2026`} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section: Assessment Results */}
            <div className="space-y-6 mt-0">
                {!assessment ? (
                    <div className="py-20 text-center bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-200">
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No Assessment Telemetry Discovered</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Overall Metrics Block */}
                        <div className="bg-black text-white px-8 py-4 -mx-8 grid grid-cols-2 md:grid-cols-5 gap-6 border-t border-gray-800">
                            <div className="space-y-1.5">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Overall Score</p>
                                <p className="text-2xl font-black">{assessment.scorePercentage}%</p>
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Question Paper</p>
                                <p className="text-sm font-black uppercase tracking-widest text-emerald-400 line-clamp-1">{assessment.exam?.title || "Standard Set"}</p>
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Questions Hit</p>
                                <p className="text-2xl font-black">{assessment.score} <span className="text-sm text-gray-500">/ {assessment.totalQuestions}</span></p>
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Time Expended</p>
                                <p className="text-2xl font-black">{Math.floor((assessment.timeTaken || 0)/60)}m {(assessment.timeTaken || 0)%60}s</p>
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Final Verdict</p>
                                <p className={`text-2xl font-black ${assessment.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {assessment.passed ? 'PASSED' : 'FAILED'}
                                </p>
                                {(user?.selectionStatus === 'Access given by admin' || (!assessment.passed && ['SELECTED', 'PROFILE_PENDING', 'ACTIVE', 'VERIFIED'].includes(user?.status || ''))) && (
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mt-1 leading-tight">ADMIN ACCEPTED THIS INTERN</span>
                                )}
                            </div>
                        </div>

                        {/* Breakdown per Question */}
                        <div className="space-y-6 pt-8">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-8 bg-black rounded-full" />
                                <h3 className="text-2xl font-black text-black uppercase tracking-tighter">
                                    {user?.track || "General"} Track Assessment Transcript
                                </h3>
                            </div>
                            
                            <div className="space-y-4">
                                {assessment.answers?.map((ans, idx) => {
                                    const q = ans.questionId;
                                    if (!q) return null; // Defensive check
                                    
                                    const isSkipped = !ans.selectedOption;
                                    const isCorrect = ans.isCorrect && !isSkipped;
                                    
                                    const bgStyle = isSkipped ? 'bg-gray-50 border-gray-200' : isCorrect ? 'bg-emerald-50/30 border-emerald-100' : 'bg-red-50/30 border-red-100';
                                    const badgeStyle = isSkipped ? 'bg-gray-300 text-white shadow-sm' : isCorrect ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' : 'bg-red-500 text-white shadow-md shadow-red-200';
                                    const textStyle = isSkipped ? 'text-gray-400' : isCorrect ? 'text-emerald-600' : 'text-red-500';

                                    return (
                                        <div key={idx} className={`p-6 md:p-8 rounded-[2rem] border ${bgStyle}`}>
                                            <div className="flex gap-4 items-start mb-6">
                                                <div className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-xl font-black text-[10px] ${badgeStyle}`}>
                                                    {idx + 1}
                                                </div>
                                                <p className="text-sm font-black text-black leading-relaxed">{q.text}</p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="p-4 bg-white rounded-2xl border border-gray-100 space-y-2">
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Candidate's Choice</p>
                                                    <p className={`text-xs font-bold uppercase ${textStyle}`}>{ans.selectedOption || 'Not Attempted'}</p>
                                                </div>
                                                <div className="p-4 bg-white rounded-2xl border border-gray-100 space-y-2">
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Correct Answer</p>
                                                    <p className="text-xs font-bold uppercase text-black">{q.options?.find(o => o.isCorrect)?.text || 'Unknown'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function ProfileMeta({ label, value }) {
    return (
        <div className="space-y-1.5">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{label}</p>
            <p className="text-xs font-black text-black uppercase tracking-tight">{value}</p>
        </div>
    );
}

function SelectionBadge({ status, label }) {
    const config = {
        'NEW': 'bg-gray-50 text-gray-400 border-gray-100',
        'SELECTED': 'bg-black text-white border-transparent shadow-md',
        'REJECTED': 'bg-white text-gray-300 border-gray-100',
    };
    const style = config[status] || 'bg-white text-gray-300 border-gray-100';
    return (
        <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${style} whitespace-nowrap inline-block`}>
            {label || status}
        </span>
    );
}
