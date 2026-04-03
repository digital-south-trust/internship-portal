"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Clock,
    ChevronLeft,
    ChevronRight,
    Play,
    LogOut,
    CheckCircle2
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
    const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [pauseTimeLeft, setPauseTimeLeft] = useState(30);

    const violationsCount = useRef(0);
    const pauseTimerRef = useRef(null);
    const answersRef = useRef({});
    const timeLeftRef = useRef(0);
    const isSubmittingRef = useRef(false);

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
                    const examRes = await fetch(`/api/assessment/get-by-track?track=${encodeURIComponent(data.track)}&email=${encodeURIComponent(email)}`);
                     if (examRes.ok) {
                         const examData = await examRes.json();
                         setExam({ ...examData.exam, questions: examData.questions });
                         setTimeLeft(examData.exam.durationMinutes * 60);
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
    }, [router]);

    useEffect(() => {
        if (urlExamId && exam && view === 'lobby') {
            setView('details');
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
            if (document.hidden && !isSubmitted) {
                recordViolation('Warning: Please stay on this page.');
                setIsPaused(true);
            }
        };
        
        const handleFullScreenChange = () => {
            if (!document.fullscreenElement && !isSubmitted) {
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
        const qId = exam.questions[currentQuestionIndex]._id;
        setAnswers(prev => ({ ...prev, [qId]: optionIndex }));
    };

    const submitExam = async (forced = false) => {
        if (isSubmitting || !exam) return;
        setIsSubmitting(true);
        const timeTaken = (exam.durationMinutes * 60) - timeLeftRef.current;
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
                setIsSubmitted(true);
                setIsPaused(false);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black" />
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
                <button onClick={() => router.push('/dashboard')} className="bg-black text-white px-10 py-3.5 rounded-xl font-bold uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-xl shadow-black/10">Back to Dashboard</button>
            </div>
        </div>
    );

    if (isSubmitted) {
        const isRejected = user?.selectionStatus === 'Rejected';
        
        return (
            <div 
                className="min-h-screen font-sans flex items-center justify-center p-6 text-center relative overflow-hidden bg-center"
                style={{ 
                    backgroundImage: 'url(/background4.svg)',
                    backgroundSize: '200px',
                    backgroundRepeat: 'repeat'
                }}
            >
                <div className="absolute inset-0 z-0 pointer-events-none bg-white/40"></div>
                <div className="max-w-md w-full relative z-10 bg-white/60 backdrop-blur-3xl p-12 rounded-[3.5rem] border border-white/60 shadow-2xl shadow-black/5">
                    {isRejected ? (
                        <>
                            <div className="w-32 h-32 mx-auto mb-8 relative">
                                <img 
                                    src="/sad_intern_avatar.png" 
                                    alt="Hard Luck" 
                                    className="w-full h-full object-cover rounded-3xl shadow-xl border-4 border-white/80"
                                />
                                <div className="absolute -bottom-2 -right-2 bg-red-500 text-white p-2 rounded-xl shadow-lg">
                                    <CheckCircle2 className="w-4 h-4 rotate-180" />
                                </div>
                            </div>
                            <h1 className="text-3xl font-black mb-4 uppercase tracking-tighter leading-tight">Hard Luck!<br/>Assessment Not Cleared</h1>
                            <p className="text-gray-500 mb-10 px-4 font-medium leading-relaxed uppercase text-[10px] tracking-widest">We appreciate your time, but unfortunately, we won't be moving forward with your application for the {user?.track} track.</p>
                        </>
                    ) : (
                        <>
                            <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                                <CheckCircle2 className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-3xl font-black mb-4 uppercase tracking-tighter leading-tight">Your exam paper<br/>is reviewing</h1>
                            <p className="text-gray-500 mb-10 px-4 font-medium leading-relaxed uppercase text-[10px] tracking-widest">Your results will be released soon or within a day.</p>
                        </>
                    )}
                    
                    <button 
                        onClick={() => {
                            localStorage.clear();
                            router.push('/login');
                        }} 
                        className="bg-black text-white px-12 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest active:scale-95 transition-all shadow-xl shadow-black/20 w-full"
                    >
                        Log Out
                    </button>
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
                                <span className="text-[10px] font-black uppercase text-gray-400">{exam.durationMinutes} MINS</span>
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
                        onClick={() => {
                            setView('lobby');
                            router.push('/assessment');
                        }} 
                        className="text-xs font-black uppercase tracking-widest"
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
    const currentQuestion = exam.questions[currentQuestionIndex];
    const attemptedCount = Object.keys(answers).length;
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [reviewQuestions, setReviewQuestions] = useState(new Set());

    const toggleMarkForReview = (idx) => {
        setReviewQuestions(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    return (
        <div className="min-h-screen bg-white text-black flex flex-col md:flex-row overflow-hidden font-sans">
            {/* Left Sidebar: Collapsible */}
            <aside className={`transition-all duration-300 relative bg-slate-50 border-r border-gray-100 flex flex-col h-screen shrink-0 ${isSidebarCollapsed ? 'w-24' : 'w-full md:w-80'}`}>
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
                                          isReview ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                                          isAttempted ? 'bg-blue-50 border-blue-100 text-blue-600' : 
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
            <main className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
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
                    <span className="text-[10px] font-black text-gray-400">{currentQuestionIndex + 1} OF {exam.questions.length}</span>
                </div>

                <div className="flex-1 overflow-y-auto px-10 md:px-24 py-12 max-w-5xl mx-auto w-full flex flex-col">
                    <div className="space-y-4 mb-10">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Question {currentQuestionIndex + 1}</p>
                            <button 
                                onClick={() => toggleMarkForReview(currentQuestionIndex)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                ${reviewQuestions.has(currentQuestionIndex) ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                            >
                                <Play className={`w-3 h-3 ${reviewQuestions.has(currentQuestionIndex) ? 'fill-current' : ''}`} />
                                {reviewQuestions.has(currentQuestionIndex) ? 'Under Review' : 'Mark for Review'}
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
                                ${answers[currentQuestion._id] === idx ? 'bg-neutral-50 border-black text-black shadow-sm' : 'bg-white border-slate-50 text-gray-500 hover:border-neutral-200 hover:bg-neutral-50'}`}
                            >
                                <span className="flex items-center gap-5">
                                    <span className={`h-8 w-8 rounded-lg flex items-center justify-center font-black text-xs border-2 
                                    ${answers[currentQuestion._id] === idx ? 'bg-black border-black text-white' : 'border-gray-100 text-gray-300'}`}>{String.fromCharCode(65 + idx)}</span>
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
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div></div>}>
            <AssessmentContent />
        </Suspense>
    );
}
