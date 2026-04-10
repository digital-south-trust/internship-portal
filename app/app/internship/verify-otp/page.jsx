"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { ChevronRight, Mail } from "lucide-react";

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

function VerifyOTPContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(120); // 2 minutes in seconds
    const [sessionTimeLeft, setSessionTimeLeft] = useState(SESSION_TIMEOUT_MS / 1000);
    const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

    useEffect(() => {
        if (!email) {
            router.push("/internship/register");
        }
    }, [email, router]);

    // 30-minute session expiry logic
    useEffect(() => {
        const storageKey = `otp_session_start_${email}`;
        let startTime = sessionStorage.getItem(storageKey);

        if (!startTime) {
            startTime = Date.now().toString();
            sessionStorage.setItem(storageKey, startTime);
        }

        const checkExpiry = () => {
            const elapsed = Date.now() - parseInt(startTime);
            const remaining = SESSION_TIMEOUT_MS - elapsed;

            if (remaining <= 0) {
                // Session expired — clean up and force restart
                sessionStorage.removeItem(storageKey);
                toast.error("Verification session expired. Please register again.");
                router.push("/internship/register");
                return;
            }

            setSessionTimeLeft(Math.ceil(remaining / 1000));
        };

        checkExpiry(); // Check immediately on mount
        const interval = setInterval(checkExpiry, 10000); // Re-check every 10 seconds
        return () => clearInterval(interval);
    }, [email, router]);

    // Countdown Timer logic
    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        
        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs[index + 1].current.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs[index - 1].current.focus();
        }
    };

    const handlePaste = (e) => {
        const pasteData = e.clipboardData.getData("text").slice(0, 6).split("");
        if (pasteData.length > 0) {
            const newOtp = [...otp];
            pasteData.forEach((char, i) => {
                if (i < 6 && /^\d$/.test(char)) newOtp[i] = char;
            });
            setOtp(newOtp);
            // Focus the last input or next empty one
            const nextIndex = Math.min(pasteData.length, 5);
            inputRefs[nextIndex].current.focus();
        }
    };

    const handleResend = async () => {
        if (timeLeft > 0 || resendLoading) return;
        setResendLoading(true);
        const tid = toast.loading("Resending code...");
        try {
            const res = await fetch("/api/auth/resend-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("New code sent to your email!", { id: tid });
                setTimeLeft(120); // Reset countdown (2 mins)
                setOtp(["", "", "", "", "", ""]); // Clear existing input
                inputRefs[0].current.focus();
            } else {
                toast.error(data.message || "Failed to resend code", { id: tid });
            }
        } catch (error) {
            console.error("Resend error:", error);
            toast.error("An error occurred during resend.", { id: tid });
        } finally {
            setResendLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        const fullOtp = otp.join("");
        if (fullOtp.length !== 6) {
            toast.error("Please enter the full 6-digit code.");
            return;
        }

        setLoading(true);
        const tid = toast.loading("Verifying identity...");

        try {
            const res = await fetch("/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp: fullOtp }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Identity verified successfully!", { id: tid });
                localStorage.setItem("userEmail", email);
                localStorage.setItem("userRole", "intern");
                localStorage.setItem("loginTimestamp", Date.now().toString());
                
                setTimeout(() => {
                    router.push("/assessment");
                }, 1000);
            } else {
                toast.error(data.message || "Verification failed", { id: tid });
            }
        } catch (error) {
            console.error("Verification error:", error);
            toast.error("An error occurred during verification.", { id: tid });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            className="relative min-h-screen w-screen font-sans flex items-center justify-center overflow-hidden p-4 bg-center"
            style={{ 
                backgroundImage: 'url(/background4.svg)',
                backgroundSize: '200px',
                backgroundRepeat: 'repeat'
            }}
        >
            <div className="absolute inset-0 z-0 pointer-events-none bg-white/30"></div>

            <div className="w-full max-w-md mx-auto space-y-8 bg-white/70 backdrop-blur-3xl p-10 rounded-[2.5rem] shadow-xl border border-white/60 relative z-10 transition-all">
                <div className="text-center space-y-3">
                    <p className="text-xs text-black/40 uppercase tracking-[0.3em] font-normal">Identity Verification</p>
                    <h2 className="text-2xl font-black text-black tracking-tighter leading-tight uppercase">
                        Digital South <br/>
                        <span className="text-gray-400 font-bold">Internship</span>
                    </h2>
                    <p className="text-gray-500 text-sm">
                        Protecting your account. Enter the code sent to <br />
                        <span className="font-bold text-black text-xs font-mono">{email}</span>
                    </p>
                </div>

                <form className="space-y-8" onSubmit={handleSubmit}>
                    <div className="flex justify-between gap-2 max-w-sm mx-auto">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={inputRefs[index]}
                                type="text"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={index === 0 ? handlePaste : undefined}
                                className="w-12 h-14 text-center text-2xl font-black text-black bg-white rounded-xl border-2 border-gray-100 focus:border-black focus:ring-0 outline-none transition-all shadow-sm"
                            />
                        ))}
                    </div>

                    <div className="space-y-4">
                        <button
                            type="submit"
                            disabled={loading || otp.some(d => !d)}
                            className="w-full bg-black hover:bg-neutral-800 text-white font-bold py-4 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? "Verifying..." : "Verify & Start Journey"} <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-gray-400">
                            Didn't receive the email?{" "}
                            {timeLeft > 0 ? (
                                <span className="text-black font-semibold ml-1">Resend in {formatTime(timeLeft)}</span>
                            ) : (
                                <button 
                                    type="button" 
                                    className="text-black hover:underline font-bold ml-1 active:scale-95 transition-transform" 
                                    onClick={handleResend}
                                    disabled={resendLoading}
                                >
                                    {resendLoading ? "Resending..." : "Resend Code"}
                                </button>
                            )}
                        </p>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mt-3 ${sessionTimeLeft < 300 ? 'text-red-500' : 'text-gray-300'}`}>
                            Session expires in {Math.floor(sessionTimeLeft / 60)}:{(sessionTimeLeft % 60).toString().padStart(2, '0')}
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function VerifyOTPPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <VerifyOTPContent />
        </Suspense>
    );
}
