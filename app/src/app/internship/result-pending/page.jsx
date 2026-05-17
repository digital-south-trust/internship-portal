"use client";

import { Clock, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ResultPendingPage() {
    const router = useRouter();

    const handleLogout = () => {
        document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
        document.cookie = "userEmail=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
        localStorage.clear();
        router.push("/login");
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Minimal Ambient Blurs to match Portal style */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                 <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-slate-50 rounded-full filter blur-[120px] opacity-70"></div>
            </div>
            
            <div className="bg-white p-12 text-center max-w-lg w-full relative z-10 space-y-10">
                <div className="w-20 h-20 bg-slate-50 text-black border border-gray-100 rounded-[2rem] flex items-center justify-center mx-auto shadow-sm">
                    <Clock className="h-10 w-10 animate-pulse" />
                </div>
                
                <div className="space-y-4">
                    <h1 className="text-4xl font-black text-black uppercase tracking-tight leading-tight">Your exam paper <br/>is reviewing</h1>
                    <p className="text-gray-400 font-medium leading-relaxed px-6">
                        Thank you for completing the assessment. Your responses are currently being evaluated by our academic team. 
                    </p>
                </div>

                <div className="pt-8 space-y-6">
                    <p className="text-[10px] text-gray-400 uppercase tracking-[0.3em] font-black">Notification Status: Pending</p>
                    <button
                        onClick={handleLogout}
                        className="bg-black text-white font-black py-4.5 px-12 rounded-2xl hover:bg-neutral-800 transition-all uppercase text-[10px] tracking-widest shadow-xl shadow-black/5"
                    >
                        Exit
                    </button>
                    <p className="text-[9px] text-gray-300 font-medium italic">You will receive an email once your final selection results are ready.</p>
                </div>
            </div>
        </div>
    );
}
