"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Crown, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AmbassadorLoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const tid = toast.loading("Authenticating Ambassador...");

        try {
            const res = await fetch('/api/ambassador/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('ambassadorEmail', data.email);
                localStorage.setItem('ambassadorToken', data.token); // If using JWT
                toast.success("Welcome back, Ambassador!", { id: tid });
                router.push('/ambassador/dashboard');
            } else {
                toast.error(data.message || "Invalid Credentials", { id: tid });
            }
        } catch (error) {
            toast.error("Network Failure", { id: tid });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background Aesthetics */}
            <div className="absolute inset-0 z-0 bg-center opacity-[0.05]" style={{ backgroundImage: "url('/background8.svg')", backgroundSize: '30%', backgroundRepeat: 'repeat' }}></div>
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-black/5 rounded-full blur-[120px]"></div>

            <div className="w-full max-w-md bg-white/80 backdrop-blur-3xl rounded-[3rem] shadow-2xl border border-white/50 p-10 md:p-14 relative z-10 animate-in fade-in zoom-in-95 duration-700">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-black/10 rotate-3 hover:rotate-0 transition-transform duration-500">
                        <Crown className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-black text-black uppercase tracking-tight mb-2">Ambassador Portal</h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.25em]">Secure Network Intelligence Login</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Email Access</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-8 focus:ring-black/5 outline-none font-bold text-sm transition-all"
                                placeholder="ambassador@digitalsouth.in"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Secure Protocol</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-8 focus:ring-black/5 outline-none font-bold text-sm transition-all"
                                placeholder="••••••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-[0.4em] shadow-2xl shadow-black/20 hover:bg-neutral-800 transition-all text-[11px] flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                    >
                        {loading ? "Authenticating..." : "Establish Connection"} <ArrowRight className="w-4 h-4" />
                    </button>
                </form>

                <div className="mt-10 pt-10 border-t border-gray-100 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest leading-none">Encrypted Transmission Protocol</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
