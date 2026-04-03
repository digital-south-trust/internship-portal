"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Check, Info, Lock } from "lucide-react";
import toast from "react-hot-toast";

function DigiLockerMockContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email");
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const handleLogin = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setStep(2);
        }, 1500);
    };

    const handleConsent = () => {
        setLoading(true);
        setTimeout(() => {
            // Simulated data from DigiLocker
            const mockData = {
                name: "Gautham Ram",
                dob: "1998-05-15",
                aadhaar: "123456789012",
                verified: "true"
            };

            const params = new URLSearchParams(mockData);
            router.push(`/dashboard/complete-profile?${params.toString()}`);
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans text-gray-900">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="bg-blue-600 p-6 text-white text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Lock className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest opacity-80">Secure Identity Gateway</span>
                    </div>
                    <h1 className="text-2xl font-black italic tracking-tighter">DigiLocker</h1>
                </div>

                <div className="p-8">
                    {step === 1 ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="text-center">
                                <h2 className="text-xl font-bold mb-2">Login to your account</h2>
                                <p className="text-sm text-gray-500">Sign in to share your documents securely with InternsPortal</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Aadhaar / Username</label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter UID / Username"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 ring-blue-500/20 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase">6-digit Security PIN</label>
                                    <input 
                                        type="password" 
                                        placeholder="******"
                                        maxLength={6}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 ring-blue-500/20 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleLogin}
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : "Sign In"}
                            </button>

                            <div className="text-center">
                                <p className="text-xs text-gray-400">Not registered? <span className="text-blue-600 font-bold cursor-pointer">Sign Up</span></p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                            <div className="bg-blue-50 p-4 rounded-2xl flex gap-4 items-start border border-blue-100">
                                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-900 leading-relaxed">
                                    <span className="font-bold">InternsPortal</span> is requesting access to your:
                                    <ul className="mt-2 space-y-1 font-bold list-disc list-inside">
                                        <li>Full Name</li>
                                        <li>Date of Birth</li>
                                        <li>Aadhaar Document</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={handleConsent}
                                    disabled={loading}
                                    className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Check className="w-5 h-5" />
                                            Allow Access
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => router.back()}
                                    className="w-full bg-white text-gray-500 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all"
                                >
                                    Deny
                                </button>
                            </div>

                            <div className="text-[10px] text-gray-400 text-center flex items-center justify-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                256-bit SSL Layer Protected Session
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 flex gap-6 grayscale opacity-50">
                <img src="https://digitallocker.gov.in/assets/img/digital-india.png" alt="Digital India" className="h-10" />
                <img src="https://digitallocker.gov.in/assets/img/meity.png" alt="Meity" className="h-10" />
            </div>
        </div>
    );
}

export default function DigiLockerMockPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
            </div>
        }>
            <DigiLockerMockContent />
        </Suspense>
    );
}
