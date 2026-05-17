
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [terminatedInfo, setTerminatedInfo] = useState(null); // { contact }
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    useEffect(() => {
        const userEmail = typeof window !== 'undefined' ? localStorage.getItem("userEmail") : null;
        const userRole = typeof window !== 'undefined' ? localStorage.getItem("userRole") : null;
        if (userEmail && userRole) {
            if (userRole === 'admin') router.push('/admin');
            else if (userRole === 'ambassador') router.push('/ambassador/dashboard');
            else router.push('/dashboard');
        }
    }, [router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setTerminatedInfo(null);

        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    email: formData.email.trim()
                })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Login Successful");
                localStorage.setItem("userEmail", data.user.email);
                localStorage.setItem("userRole", data.user.role || 'intern');
                localStorage.setItem("userName", data.user.fullName);
                localStorage.setItem("loginTimestamp", Date.now().toString());

                // For Ambassadors, set the specific key used by their dashboard
                if (data.user.role === 'ambassador') {
                    localStorage.setItem("ambassadorEmail", data.user.email);
                }

                document.cookie = `userRole=${data.user.role || 'intern'}; path=/; max-age=10800`;
                document.cookie = `userEmail=${data.user.email}; path=/; max-age=10800`;

                if (data.redirectTo) {
                    window.location.href = data.redirectTo;
                } else {
                    const role = data.user.role || 'intern';
                    if (role === 'admin') window.location.href = "/admin";
                    else if (role === 'ambassador') window.location.href = "/ambassador/dashboard";
                    else window.location.href = "/dashboard";
                }
            } else if (res.status === 403) {
                const errorData = data;
                if (errorData.status === 'pending_assessment') {
                    toast.error("Please complete the assessment first");
                    setTimeout(() => router.push("/assessment"), 2000);
                } else if (errorData.status === 'profile_incomplete') {
                    toast.error("Please complete your profile first");
                    setTimeout(() => router.push(errorData.redirectTo), 2000);
                } else if (errorData.status === 'unverified') {
                    toast.error("Please verify your identity");
                    setTimeout(() => router.push(errorData.redirectTo), 2000);
                } else if (errorData.terminated) {
                    // Terminated account — show inline banner
                    setTerminatedInfo({ contact: errorData.contact });
                } else {
                    toast.error(errorData.message || "Login Failed");
                }
            } else {
                toast.error(data.message || "Login Failed");
            }
        } catch (error) {
            toast.error("Something went wrong");
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
            {/* Subtle Overlay */}
            <div className="absolute inset-0 z-0 pointer-events-none bg-white/30"></div>

            <div className="w-full max-w-md bg-white/70 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-white/60 p-8 space-y-6 relative z-10">
                <div className="text-center">

                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Digital South </h1>
                    <h3 className="text-xl  text-gray-900 tracking-tight">Internship Portal </h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all text-gray-900"
                            placeholder="name@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all text-gray-900 pr-12"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {terminatedInfo && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-1">
                            <p className="text-sm font-black text-red-700">⛔ Account Terminated</p>
                            <p className="text-xs text-red-500 font-medium">Your internship account has been terminated and access has been revoked.</p>
                            <p className="text-xs font-bold text-red-600 mt-1">
                                For queries, contact:{" "}
                                <a href={`mailto:${terminatedInfo.contact}`} className="underline hover:text-red-800">
                                    {terminatedInfo.contact}
                                </a>
                            </p>
                        </div>
                    )}

                    {loading ? (
                        <div className="w-full h-[52px] bg-gray-200 animate-pulse rounded-xl shadow-sm"></div>
                    ) : (
                        <button
                            type="submit"
                            className="w-full py-3.5 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10 active:scale-[0.98]"
                        >
                            Sign In
                        </button>
                    )}
                </form>

                <div className="text-center text-sm text-gray-500">
                    Don&apos;t have an account?{" "}
                    <Link href="/internship/register" className="text-black font-semibold hover:underline">
                        Register
                    </Link>
                </div>
            </div>
        </div>
    );
}
