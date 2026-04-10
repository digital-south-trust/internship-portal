"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Clock,
    ChevronLeft,
    ChevronRight,
    Play,
    LogOut,
    CheckCircle2,
    Layers,
    Bookmark,
    Trophy,
    HelpCircle,
    Send
} from 'lucide-react';
import { toast } from 'react-hot-toast';

function AssessmentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlExamId = searchParams.get('examId');
    const [user, setUser] = useState(null);
    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('lobby'); // 'lobby' | 'details' | 'exam'
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [assessmentResult, setAssessmentResult] = useState(null);
    const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [pauseTimeLeft, setPauseTimeLeft] = useState(30);

    const violationsCount = useRef(0);
    const pauseTimerRef = useRef(null);
    const answersRef = useRef({});
    const timeLeftRef = useRef(0);
    const isSubmittingRef = useRef(false);
    const isSubmittedRef = useRef(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [reviewQuestions, setReviewQuestions] = useState(new Set());
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [helpQuery, setHelpQuery] = useState('');
    const [isSubmittingHelp, setIsSubmittingHelp] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
             const email = (localStorage.getItem('userEmail') || '').trim();
             if (!email) {
                 router.push('/login');
                 return;
             }
             try {
                 const res = await fetch(`/api/user/me?email=${email}`);
                 if (res.ok) {
                     const data = await res.json();
                     setUser(data);
                     if (data.isAssessmentDone) {
                         if (data.selectionStatus === 'Selected') {
                             router.push('/dashboard');
                         } else {
                             setIsSubmitted(true);
                         }
                         setLoading(false);
                         return;
                     }
                    const examUrl = `/api/assessment/get-by-track?track=${encodeURIComponent(data.track)}&email=${encodeURIComponent(email)}${urlExamId ? `&examId=${urlExamId}` : ''}`;
                    const examRes = await fetch(examUrl);
                     if (examRes.ok) {
                         const examData = await examRes.json();
                          setExam({ ...examData.exam, questions: examData.questions });
                          const duration = examData.exam.durationMinutes || 60;
                          setTimeLeft(duration * 60);
                      } else {
                          // If specific examId failed (maybe track mismatch), go back to default
                          if (urlExamId) router.push('/assessment');
                          setExam(null);
                      }
                 } else {
                     router.push('/login');
                 }
             } catch (err) {
                 console.error(err);
             } finally {
                 setLoading(false);
             }
        };
        fetchUserData();
    }, [router, urlExamId]);

    useEffect(() => {
        // Sync lobby/details based on URL presence
        if (urlExamId && exam && view === 'lobby') {
            setView('details');
        } else if (!urlExamId && view === 'details') {
            setView('lobby');
        }
    }, [urlExamId, exam, view]);

    useEffect(() => {
        answersRef.current = answers;
    }, [answers]);

    useEffect(() => {
        timeLeftRef.current = timeLeft;
    }, [timeLeft]);

    useEffect(() => {
        isSubmittingRef.current = isSubmitting;
    }, [isSubmitting]);

    useEffect(() => {
        if (view !== 'exam' || isSubmitted) return;
        
        const handleVisibilityChange = () => { 
            if (document.hidden && !isSubmittedRef.current) {
                recordViolation('Warning: Please stay on this page.');
                setIsPaused(true);
            }
        };
        
        const handleFullScreenChange = () => {
            if (!document.fullscreenElement && !isSubmittedRef.current) {
                recordViolation('Warning: Please stay in full screen.');
                setIsPaused(true);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('fullscreenchange', handleFullScreenChange);
        };
    }, [view, isSubmitted]);

    // Pause timer logic
    useEffect(() => {
        if (isPaused && !isSubmitted) {
            setPauseTimeLeft(30);
            const timer = setInterval(() => {
                setPauseTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        submitExam(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isPaused, isSubmitted]);

    useEffect(() => {
        if (view === 'exam' && timeLeft > 0 && !isSubmitted) {
            const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
            return () => clearInterval(timer);
        } else if (view === 'exam' && timeLeft === 0 && !isSubmitted && exam) {
            submitExam(true);
        }
    }, [view, timeLeft, isSubmitted, exam]);

    const recordViolation = (msg) => {
        if (isSubmitted) return;
        
        violationsCount.current += 1;
        
        if (violationsCount.current >= 5) {
            submitExam(true);
            return;
        }
        toast.error(`${msg} (Violation ${violationsCount.current}/5)`);
    };

    const startExam = async () => {
        try {
            await document.documentElement.requestFullscreen();
            setView('exam');
            setIsPaused(false);
        } catch (e) {
            toast.error("Full screen is required.");
        }
    };

    const handleAnswer = (optionIndex) => {
        const q = exam.questions[currentQuestionIndex];
        const selectedText = q.options[optionIndex].text;
        setAnswers(prev => ({ ...prev, [q._id]: selectedText }));
    };

    const toggleMarkForReview = (idx) => {
        setReviewQuestions(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    const submitExam = async (forced = false) => {
        if (isSubmitting || !exam) return;
        setIsSubmitting(true);
        const duration = exam?.durationMinutes || 60;
        const timeTaken = (duration * 60) - timeLeftRef.current;
        try {
            const res = await fetch('/api/assessment/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: user.email, 
                    examId: exam._id, 
                    answers: answersRef.current, 
                    violations: violationsCount.current, 
                    timeTaken, 
                    forced 
                })
            });
            if (res.ok) {
                const data = await res.json();
                setAssessmentResult(data);
                setIsSubmitted(true);
                isSubmittedRef.current = true;
                setIsPaused(false);
                if (document.fullscreenElement) {
                    document.exitFullscreen().catch(err => console.error("Failed to exit full screen:", err));
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitHelpQuery = async () => {
        if (!helpQuery.trim()) return toast.error("Please describe your problem.");
        setIsSubmittingHelp(true);
        try {
            const res = await fetch('/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'Assessment Query',
                    title: `Assessment Help - ${user.fullName}`,
                    description: helpQuery,
                    reportedBy: user.email,
                    status: 'Open'
                })
            });
            if (res.ok) {
                toast.success("Query submitted! Admin will review it.");
                setShowHelpModal(false);
                setHelpQuery('');
            }
        } catch (e) { toast.error("Failed to submit query."); }
        finally { setIsSubmittingHelp(false); }
    };

    const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    if (loading) return (
        <div className="min-h-screen bg-white animate-pulse p-10 md:p-24">
            <div className="max-w-5xl mx-auto space-y-12">
                <div className="flex items-center justify-between">
                    <div className="h-4 bg-gray-100 rounded w-24" />
                    <div className="h-8 bg-gray-200 rounded-xl w-32" />
                </div>
                <div className="space-y-6">
                    <div className="h-12 bg-gray-200 rounded-2xl w-3/4" />
                    <div className="h-6 bg-gray-100 rounded-xl w-1/2" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 bg-gray-50 rounded-3xl border border-gray-100" />
                    ))}
                </div>
            </div>
        </div>
    );

    if (!user) return null;

    if (!exam) return (
        <div 
            className="min-h-screen font-sans flex flex-col items-center justify-center p-6 text-center space-y-6 relative overflow-hidden bg-center"
            style={{ 
                backgroundImage: 'url(/background4.svg)',
                backgroundSize: '200px',
                backgroundRepeat: 'repeat'
            }}
        >
            <div className="absolute inset-0 z-0 pointer-events-none bg-white/40"></div>
            <div className="relative z-10 flex flex-col items-center space-y-6">
                <div className="w-20 h-20 bg-white/70 backdrop-blur-xl rounded-full flex items-center justify-center shadow-sm border border-white/60">
                    <CheckCircle2 className="w-10 h-10 text-gray-200" />
                </div>
                <h1 className="text-2xl font-black uppercase tracking-tight">No Assessment Found</h1>
                <p className="text-gray-500 max-w-sm font-medium">No assessment is currently active for the {user.track || 'assigned'} track. Please contact your administrator.</p>
                <button onClick={() => window.location.href = '/dashboard'} className="bg-black text-white px-10 py-3.5 rounded-xl font-bold uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-xl shadow-black/10">Back to Dashboard</button>
            </div>
        </div>
    );

    if (isSubmitted) {
        const isRejected = user?.status === 'REJECTED' || user?.selectionStatus === 'Rejected';
        const isSelected = user?.selectionStatus === 'Selected';
        
        return (
            <div 
                className="min-h-screen font-sans flex flex-col items-center bg-gray-50/50 relative overflow-hidden bg-center"
                style={{ 
                    backgroundImage: 'url(/background4.svg)',
                    backgroundSize: '200px',
                    backgroundRepeat: 'repeat'
                }}
            >
                <div className="absolute inset-0 z-0 pointer-events-none bg-white/60 backdrop-blur-[2px]"></div>
                
                <header className="fixed top-0 left-0 right-0 h-24 flex items-center justify-between px-12 z-50 bg-white/40 backdrop-blur-md border-b border-white/60">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                            <Trophy className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-black text-lg tracking-tight">DIGITAL SOUTH</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setShowHelpModal(true)} className="flex items-center gap-2 bg-white border border-gray-100 text-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-gray-50 transition-all">
                            <HelpCircle className="w-4 h-4 text-blue-600" /> Ask Help
                        </button>
                        <button 
                            onClick={() => {
                                localStorage.clear();
                                router.push('/login');
                            }} 
                            className="flex items-center gap-2 bg-black text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-black/10 hover:bg-neutral-800 transition-all active:scale-95"
                        >
                            <LogOut className="w-4 h-4" /> Log Out
                        </button>
                    </div>
                </header>

                <div className="max-w-5xl w-full mx-auto px-6 pt-36 pb-24 relative z-10 flex flex-col items-center">
                    {isRejected ? (
                        <div className="max-w-md w-full bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-2xl text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="w-32 h-32 mx-auto relative group">
                                <img src="/sad_intern_avatar.png" alt="Hard Luck" className="w-full h-full object-cover rounded-[2.5rem] shadow-xl border-4 border-white" />
                                <div className="absolute -bottom-2 -right-2 bg-red-500 text-white p-2.5 rounded-2xl shadow-lg"><Layers className="w-5 h-5 rotate-180" /></div>
                            </div>
                            <div className="space-y-4">
                                <h1 className="text-4xl font-black text-black uppercase tracking-tighter leading-none">Hard Luck!<br/>Not Selected</h1>
                                <div className="bg-red-50 text-red-600 px-8 py-3 rounded-2xl font-black text-2xl border border-red-100 italic">
                                    {user?.assessmentScore || 0}%
                                </div>
                            </div>
                            <p className="text-gray-500 font-medium leading-relaxed uppercase text-[10px] tracking-widest">
                                We appreciate your time, but unfortunately, we won't be moving forward with your application for the {user?.track} track at this time.
                            </p>
                            <button onClick={() => window.location.href = '/dashboard'} className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl">Back to Dashboard</button>
                        </div>
                    ) : isSelected ? (
                        <div className="w-full space-y-12 animate-in fade-in duration-1000">
                             <div className="text-center space-y-4">
                                <div className="w-20 h-20 bg-[#ccff00] rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-lime-500/20 rotate-3">
                                    <CheckCircle2 className="w-10 h-10 text-black" />
                                </div>
                                <h2 className="text-[10px] font-black text-lime-600 uppercase tracking-[0.4em]">ADMISSION GRANTED</h2>
                                <h1 className="text-5xl font-black text-black uppercase tracking-tighter">Congratulations!</h1>
                            </div>

                            <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-2xl space-y-12 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8">
                                    <div className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 text-right">
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Enrollment Status</p>
                                        <p className="text-[10px] font-black text-emerald-600 uppercase italic">SELECTED</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    {[
                                        { label: 'Exam Set', value: exam?.title || 'Standard' },
                                        { label: 'Final Score', value: `${user.assessmentScore || 0}%` },
                                        { label: 'Time Taken', value: assessmentResult ? `${Math.floor(assessmentResult.timeTaken/60)}m ${assessmentResult.timeTaken%60}s` : 'N/A' },
                                        { label: 'Performance', value: user.assessmentScore >= 90 ? 'EXCELLENT' : 'GOOD' }
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                                            <p className="text-xl font-black uppercase text-black">{stat.value}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-6 pt-6 border-t border-gray-50">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Evaluation Transcript</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {exam.questions.map((q, i) => {
                                            const ans = answers[q._id];
                                            return (
                                                <div key={i} className="bg-gray-50/50 p-6 rounded-3xl border border-gray-50 flex items-start gap-4">
                                                    <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0 text-xs font-black">{i+1}</div>
                                                    <div>
                                                        <p className="text-[11px] font-bold text-gray-800 line-clamp-1">{q.text}</p>
                                                        <p className="text-[10px] font-black uppercase text-blue-600 mt-1">{ans || 'Skipped'}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <button onClick={() => window.location.href = '/dashboard'} className="bg-black text-white px-14 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-105 transition-all">Proceed to Intern Portal</button>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full space-y-12 animate-in fade-in duration-1000">
                            <div className="text-center space-y-6">
                                <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl rotate-3">
                                    <CheckCircle2 className="w-10 h-10 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em]">ASSESSMENT SUBMITTED</h2>
                                    <h1 className="text-5xl font-black text-black uppercase tracking-tighter">Under Review</h1>
                                </div>
                                <p className="text-gray-400 max-w-lg mx-auto font-medium uppercase text-[10px] tracking-widest leading-loose">
                                    Our evaluation team is carefully reviewing your submission. 
                                    Verified results and selection status will be released within 24 hours.
                                </p>
                            </div>

                            <button onClick={() => window.location.href = '/dashboard'} className="mx-auto block bg-black text-white px-14 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-105 transition-all">Go to Dashboard</button>
                        </div>
                    ) }

                    {/* Help Modal */}
                    {showHelpModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                            <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 space-y-8 animate-in zoom-in-95 duration-300">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                        <HelpCircle className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <h3 className="text-xl font-black uppercase tracking-tighter">Assessment Support</h3>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Facing issues? Describe your problem below.</p>
                                </div>
                                <textarea 
                                    value={helpQuery} 
                                    onChange={(e) => setHelpQuery(e.target.value)} 
                                    placeholder="Write your problem here..." 
                                    className="w-full h-40 bg-gray-50 border border-gray-100 rounded-2xl p-6 text-sm font-semibold outline-none focus:border-blue-500 transition-all resize-none" 
                                />
                                <div className="flex flex-col gap-3">
                                    <button onClick={submitHelpQuery} disabled={isSubmittingHelp} className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                                        {isSubmittingHelp ? 'Sending...' : <><Send className="w-4 h-4" /> Submit Query</>}
                                    </button>
                                    <button onClick={() => setShowHelpModal(false)} className="w-full py-4 text-gray-300 hover:text-gray-600 font-black uppercase text-[10px] tracking-widest">Cancel</button>
                                </div>
                            </div>
                        </div>
                    ) }
                </div>
            </div>
        );
    }

    // 1. LOBBY VIEW
    if (view === 'lobby') return (
        <div 
            className="min-h-screen font-sans flex flex-col relative overflow-hidden bg-center"
            style={{ 
                backgroundImage: 'url(/background4.svg)',
                backgroundSize: '200px',
                backgroundRepeat: 'repeat'
            }}
        >
            <div className="absolute inset-0 z-0 pointer-events-none bg-white/30"></div>
            <nav className="h-24 flex items-center px-12 relative z-10">
                <span className="font-black text-xl tracking-tighter">DIGITAL SOUTH</span>
            </nav>

            <main className="flex-1 px-12 py-12 max-w-7xl mx-auto w-full space-y-16">
                <div>
                    <h1 className="text-6xl font-black tracking-tight uppercase">YOUR ASSESSMENT</h1>
                       </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {exam ? (
                        <div 
                            className="bg-white border border-gray-100 p-10 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-black/5 transition-all cursor-pointer group"
                            onClick={() => {
                                setView('details');
                                router.push(`/assessment?examId=${exam._id}`);
                            }}
                        >
                            <div className="flex justify-end mb-6">
                                <span className="bg-green-50 text-green-600 text-[10px] font-black uppercase px-2 py-1 rounded">Active</span>
                            </div>
                            <h2 className="text-2xl font-black uppercase leading-tight mb-4">{exam?.title || `${user?.track} Eligibility Assessment`}</h2>
                            <p className="text-gray-400 text-sm font-medium line-clamp-2 mb-10">The official entrance assessment for our {user?.track} internship program.</p>
                            <div className="flex justify-between items-center pt-6 border-t border-gray-50">
                                <span className="text-[10px] font-black uppercase text-gray-400">{exam.durationMinutes || 60} MINS</span>
                                <span className="text-[10px] font-black uppercase group-hover:underline">Start Now &gt;</span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-400 font-bold uppercase text-xs">Syncing Module...</div>
                    )}
                </div>
            </main>
        </div>
    );

    // 2. DETAILS / PAUSED VIEW
    if (view === 'details' || isPaused) return (
        <div 
            className="min-h-screen font-sans flex flex-col bg-gray/30 relative overflow-hidden bg-center"
            style={{ 
                backgroundImage: 'url(/background7.svg)',
                backgroundSize: '100px',
                backgroundRepeat: 'repeat'
            }}
        >
            <div className="absolute inset-0 z-0 pointer-events-none bg-white/30"></div>
             <nav className="h-20 flex bg-white items-center px-12 justify-between relative z-10">
                <span className="font-black text-xl tracking-tighter">DIGITAL SOUTH</span>
                {!isPaused && (
                     <button 
                        onClick={() => router.replace('/assessment', { scroll: false })} 
                        className="text-xs font-black uppercase tracking-widest hover:text-red-500 transition-all"
                    >
                        Back
                    </button>
                )}
            </nav>
 
            <main className="flex-1 px-12 py-20 max-w-7xl mx-auto w-full relative z-10">
                <div className="flex flex-col md:flex-row gap-16 md:items-start">
                    {/* Left 1/3: Rules */}
                    <div className="md:w-1/3 space-y-8 bg-white border border-gray-100 p-8 rounded-[2.5rem]">
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">Exam Rules</h2>
                        <div className="space-y-6">
                            {[
                                "Requires Full Screen Mode",
                                "Tab Switching is Blocked",
                                "AI-Powered Proctoring Active",
                                "Passing Score: 75% or higher"
                            ].map((rule, idx) => (
                                <div key={idx} className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 bg-black rounded-full mt-1.5 shrink-0"></div>
                                    <p className="text-sm font-bold text-gray-700">{rule}</p>
                                </div>
                            ))}
                        </div>
                    </div>
 
                    {/* Right side: Details */}
                    <div className="flex-1 space-y-12 bg-white border border-gray-100 p-8 md:p-12 rounded-[3.5rem]">
                        <div className="space-y-4">
                            {isPaused ? (
                                <>
                                    <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-black text-xs uppercase inline-block animate-pulse mb-2">Exam Paused - Resume Required</div>
                                    <h1 className="text-5xl font-black uppercase leading-[1.1] tracking-tighter text-red-600">Resume Within {pauseTimeLeft}s</h1>
                                    <p className="text-gray-400 font-bold leading-relaxed">Resuming will re-enter the secure full-screen testing interface. If the timer hits 0, your current progress will be automatically submitted.</p>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">Exam Details</h2>
                                    <h1 className="text-5xl font-black uppercase leading-[1.1] tracking-tighter">{exam?.title || `${user?.track} Eligibility Assessment`}</h1>
                                </>
                            )}
                        </div>
 
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-12">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Question Format</p>
                                 <p className="font-black text-xl">Multiple Choice</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Modules</p>
                                <p className="font-black text-xl">{exam.questions?.length || 0} Questions</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Violation Limit</p>
                                <p className={`font-black text-xl ${violationsCount.current > 0 ? 'text-red-500' : 'text-black'}`}>{violationsCount.current}/5</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Duration</p>
                                <p className="font-black text-xl">{exam.durationMinutes} Minutes</p>
                            </div>
                        </div>
 
                        <div className="pt-6">
                            <button 
                                onClick={startExam}
                                className="bg-black text-white px-14 py-5 rounded-2xl font-black uppercase text-sm tracking-widest shadow-2xl shadow-black/10 hover:bg-neutral-800 transition-all active:scale-95"
                            >
                                {isPaused ? 'Resume Exam' : 'Begin Exam'}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );

    // 3. EXAM VIEW
    if (!exam?.questions || exam.questions.length === 0) {
        return (
            <div className="min-h-screen font-sans flex flex-col items-center justify-center p-6 text-center space-y-6 bg-white">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 mb-4">
                    <Layers className="w-10 h-10 text-gray-200" />
                </div>
                <h1 className="text-2xl font-black uppercase tracking-tight">No Questions Detected</h1>
                <p className="text-gray-400 max-w-sm font-medium">This paper exists but contains no logic modules. Please contact your supervisor to populate the blueprint.</p>
                <button onClick={() => setView('lobby')} className="bg-black text-white px-10 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">Go Back</button>
            </div>
        );
    }

    const currentQuestion = exam.questions[currentQuestionIndex];
    const attemptedCount = Object.keys(answers).length;

    return (
        <div className="min-h-screen bg-white text-black flex flex-col md:flex-row overflow-hidden font-sans">
            {/* Left Sidebar: Collapsible */}
            <aside className={`transition-all duration-300 relative bg-slate-50 border-r border-gray-100 flex flex-col h-screen shrink-0 overflow-y-auto ${isSidebarCollapsed ? 'w-24' : 'w-full md:w-80'}`}>
                {/* Collapse Toggle */}
                <button 
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-white border border-gray-200 rounded-full flex items-center justify-center z-50 hover:bg-black hover:text-white transition-all shadow-sm"
                >
                    {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>

                <div className={`p-8 space-y-10 ${isSidebarCollapsed ? 'px-4' : ''}`}>
                    {!isSidebarCollapsed && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-fade-in">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Time Remaining</p>
                            <p className={`text-3xl font-black font-mono tracking-tighter ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-black'}`}>{formatTime(timeLeft)}</p>
                        </div>
                    )}

                    <div className="space-y-6">
                        {!isSidebarCollapsed && (
                            <div className="flex justify-between items-center animate-fade-in">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Question Map</p>
                                <span className="text-[9px] font-black text-black px-2 py-0.5 bg-gray-200 rounded-full">{attemptedCount}/{exam.questions.length}</span>
                            </div>
                        )}
                        <div className={`grid gap-2 shrink-0 ${isSidebarCollapsed ? 'grid-cols-1' : 'grid-cols-5'}`}>
                            {exam.questions.map((q, idx) => {
                                const isCurrent = idx === currentQuestionIndex;
                                const isAttempted = answers[q._id] !== undefined;
                                const isReview = reviewQuestions.has(idx);

                                return (
                                    <button 
                                        key={idx} 
                                        onClick={() => setCurrentQuestionIndex(idx)} 
                                        className={`w-full aspect-square md:h-12 md:w-12 rounded-xl font-bold text-xs transition-all border-2 flex items-center justify-center
                                        ${isCurrent ? 'border-black bg-black text-white shadow-md' : 
                                          isReview ? 'bg-amber-100 border-amber-300 text-amber-800' :
                                          isAttempted ? 'bg-blue-600 border-blue-700 text-white font-black shadow-lg shadow-blue-200/50' : 
                                          'bg-white border-gray-100 text-gray-400 hover:border-black'}
                                        `}>
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Area: Medium Level Size */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden bg-white relative">
                <div className="h-20 border-b border-gray-100 flex items-center justify-between px-10">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-black uppercase tracking-widest">{user?.track} ASSESSMENT</span>
                        {isSidebarCollapsed && (
                            <div className="flex items-center gap-2 bg-black text-white px-3 py-1 rounded-full animate-fade-in">
                                <Clock className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-black font-mono">{formatTime(timeLeft)}</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <button onClick={() => setShowHelpModal(true)} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest hover:text-blue-600 transition-all">
                            <HelpCircle className="w-4 h-4 text-blue-500" /> Ask Help
                        </button>
                        <span className="text-[10px] font-black text-gray-400">{currentQuestionIndex + 1} OF {exam.questions.length}</span>
                    </div>
                </div>

                {/* Help Modal in Exam */}
                {showHelpModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/5 backdrop-blur-sm">
                        <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 space-y-8">
                            <div className="text-center">
                                <HelpCircle className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                                <h3 className="text-xl font-black uppercase tracking-tighter">Support Request</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Briefly describe your issue</p>
                            </div>
                            <textarea value={helpQuery} onChange={(e) => setHelpQuery(e.target.value)} placeholder="Type here..." className="w-full h-32 bg-gray-50 border border-gray-100 rounded-2xl p-5 text-sm font-bold outline-none resize-none" />
                            <div className="flex flex-col gap-2">
                                <button onClick={submitHelpQuery} disabled={isSubmittingHelp} className="w-full py-4 bg-black text-white rounded-xl font-black uppercase text-[10px] tracking-widest">{isSubmittingHelp ? 'Sending...' : 'Send Query'}</button>
                                <button onClick={() => setShowHelpModal(false)} className="w-full py-3 text-gray-400 hover:text-black font-black uppercase text-[9px]">Close</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto px-10 md:px-24 py-12 max-w-5xl mx-auto w-full flex flex-col">
                    <div className="space-y-4 mb-10">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Question {currentQuestionIndex + 1}</p>
                            <button 
                                onClick={() => toggleMarkForReview(currentQuestionIndex)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                ${reviewQuestions.has(currentQuestionIndex) ? 'bg-amber-100 text-amber-700 border border-amber-200 shadow-sm' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                            >
                                <Bookmark className={`w-3 h-3 ${reviewQuestions.has(currentQuestionIndex) ? 'fill-current' : ''}`} />
                                {reviewQuestions.has(currentQuestionIndex) ? 'Marked' : 'Mark for Review'}
                            </button>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold leading-snug">{currentQuestion.text}</h1>
                    </div>

                    <div className="space-y-4">
                        {currentQuestion.options.map((option, idx) => (
                            <button 
                                key={idx} 
                                onClick={() => handleAnswer(idx)} 
                                className={`w-full text-left p-5 rounded-xl border-2 transition-all flex items-center justify-between
                                ${answers[currentQuestion._id] === option.text ? 'bg-neutral-50 border-black text-black shadow-sm' : 'bg-white border-slate-50 text-gray-500 hover:border-neutral-200 hover:bg-neutral-50'}`}
                            >
                                <span className="flex items-center gap-5">
                                    <span className={`h-8 w-8 rounded-lg flex items-center justify-center font-black text-xs border-2 
                                    ${answers[currentQuestion._id] === option.text ? 'bg-black border-black text-white' : 'border-gray-100 text-gray-300'}`}>{String.fromCharCode(65 + idx)}</span>
                                    <span className="text-base font-semibold">{option.text}</span>
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="mt-auto pt-16 flex justify-between items-center pb-12">
                        <button 
                            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))} 
                            disabled={currentQuestionIndex === 0} 
                            className="flex items-center gap-2 text-gray-300 hover:text-black font-black uppercase text-[10px] disabled:opacity-0 transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" /> Previous
                        </button>

                        <div className="flex gap-4">
                            {currentQuestionIndex === exam.questions.length - 1 ? (
                                <button onClick={() => setShowConfirmSubmit(true)} className="bg-[#ccff00] text-black px-10 py-3.5 rounded-xl font-black shadow-lg hover:shadow-xl transition-all uppercase text-[10px] tracking-widest">Finish Assessment</button>
                            ) : (
                                <button onClick={() => setCurrentQuestionIndex(prev => Math.min(exam.questions.length - 1, prev + 1))} className="bg-black text-white px-10 py-3.5 rounded-xl font-black hover:bg-neutral-800 transition-all uppercase text-[10px] tracking-widest shadow-lg shadow-black/5">Next Question</button>
                            )}
                        </div>
                    </div>
                </div>

                {showConfirmSubmit && (
                    <div className="fixed inset-0 bg-neutral-900/10 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white p-12 rounded-[2.5rem] max-w-md w-full text-center space-y-10 shadow-2xl">
                             <div className="space-y-2">
                                <h2 className="text-3xl font-black uppercase tracking-tight">Ready to Submit?</h2>
                                <p className="text-gray-400 text-sm font-medium">Please review all answers. Attempted: {attemptedCount}/{exam.questions.length}</p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <button onClick={() => submitExam()} disabled={isSubmitting} className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:shadow-black/10 transition-all">{isSubmitting ? 'Submitting...' : 'Yes, Submit My Exam'}</button>
                                <button onClick={() => setShowConfirmSubmit(false)} className="w-full py-4 text-gray-300 hover:text-gray-500 font-bold text-xs uppercase transition-all">Go Back</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default function AssessmentPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white animate-pulse p-10 md:p-24">
                <div className="max-w-5xl mx-auto space-y-10">
                    <div className="h-12 bg-gray-100 rounded-2xl w-1/2" />
                    <div className="h-64 bg-gray-50 rounded-[3rem]" />
                    <div className="grid grid-cols-2 gap-6">
                        <div className="h-20 bg-gray-50 rounded-2xl" />
                        <div className="h-20 bg-gray-50 rounded-2xl" />
                    </div>
                </div>
            </div>
        }>
            <AssessmentContent />
        </Suspense>
    );
}
