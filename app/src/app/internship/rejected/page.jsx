"use client";

import { useEffect, useState } from "react";
import { XCircle, RefreshCcw, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function RejectedPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            const email = (localStorage.getItem('userEmail') || '').trim();
            if(!email) return;

            try {
                const res = await fetch(`/api/user/me?email=${encodeURIComponent(email)}`);
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                }
            } catch (err) { console.error(err); }
        };
        fetchUserData();
    }, []);

    const handleRequestReExam = async () => {
        if (!user) return;
        setLoading(true);
        const tid = toast.loading("Sending re-exam request...");

        try {
            const res = await fetch('/api/user/re-exam-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email }),
            });

            if (res.ok) {
                toast.success("Request sent successfully! We'll notify you soon.", { id: tid });
            } else {
                const data = await res.json();
                toast.error(data.message || "Failed to send request.", { id: tid });
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred.", { id: tid });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
        document.cookie = "userEmail=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
        localStorage.clear();
        router.push("/login");
    };

    return (
        <div 
            className="min-h-screen font-sans flex items-center justify-center p-6 text-center relative overflow-hidden bg-center"
            style={{ 
                backgroundImage: 'url(/background4.svg)',
                backgroundSize: '200px',
                backgroundRepeat: 'repeat'
            }}
        >
            {/* Subtle Overlay */}
            <div className="absolute inset-0 z-0 pointer-events-none bg-white/30"></div>
            
            <div className="w-full max-w-4xl bg-white/70 backdrop-blur-3xl rounded-[3.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-white/60 overflow-hidden relative z-10 flex flex-col md:flex-row h-full min-h-[500px]">
                {/* Left Side: Identity & Messaging */}
                <div className="w-full md:w-2/5 p-12 bg-black flex flex-col justify-between text-left text-white relative">
                    <div className="space-y-6">
                        <div className="space-y-1">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Internship Portal</h2>
                            <p className="text-xl font-bold uppercase tracking-tighter">Digital South</p>
                        </div>
                        
                        <div className="pt-8 space-y-4">
                            <p className="text-2xl font-black italic opacity-90 leading-tight">
                                "Improve yourself, try other internships."
                            </p>
                            <div className="w-12 h-1 bg-white/20"></div>
                        </div>
                    </div>

                    <div className="space-y-6 mt-12 md:mt-0">
                        <div className="space-y-1">
                             <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 block">Assessment</span>
                             <p className="text-sm font-bold uppercase truncate">{user?.assessmentResult?.exam?.title || user?.track || 'General'}</p>
                        </div>
                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                             <div className="flex flex-col gap-1">
                                 <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-500">Candidate ID</span>
                                 <p className="text-sm font-black tracking-widest text-white">{user?.admissionId || 'PENDING GENERATION'}</p>
                                 <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase border-t border-white/5 pt-1">{user?.fullName}</p>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Performance Breakdown */}
                <div className="w-full md:w-3/5 p-12 bg-white/40 flex flex-col justify-center space-y-10">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black text-black uppercase tracking-tighter leading-none">Hard Luck!</h1>
                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">Application Status: Rejected</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm text-center">
                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-1">Total Score</span>
                            <p className="text-3xl font-black text-red-500 leading-none">
                                {user?.assessmentScore ? Math.round(user.assessmentScore * 100) / 100 : '--'}%
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm text-center">
                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-1">Bench Mark</span>
                            <p className="text-3xl font-black text-black leading-none">75%</p>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm text-center col-span-1">
                             <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-1">Attended</span>
                             <p className="text-xl font-black text-black">{user?.assessmentResult?.answers?.length || 0}</p>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm text-center col-span-1">
                             <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-1">Skipped</span>
                             <p className="text-xl font-black text-gray-400">
                                 {(user?.assessmentResult?.totalQuestions || 0) - (user?.assessmentResult?.answers?.length || 0)}
                             </p>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-black/5 text-left">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Reason for Failure</p>
                        <p className="text-xs font-black text-black uppercase tracking-tight">Insufficient assessment score during the initial stage.</p>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="bg-black text-white font-black py-4 px-10 rounded-2xl hover:bg-neutral-800 transition-all inline-flex items-center gap-2 w-full justify-center uppercase text-xs tracking-widest mt-4 shadow-xl shadow-black/10 active:scale-95"
                    >
                        Log Out & Exit
                    </button>
                </div>
            </div>
        </div>
    );
}
