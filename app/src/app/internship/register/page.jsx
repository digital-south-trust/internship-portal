"use client";

import { Sun, ChevronRight, ChevronLeft, Check, Upload, FileText } from "lucide-react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { WarpBackground } from "@/components/ui/warp-background";
import { DropdownDatePicker } from "@/components/ui/dropdown-date-picker";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function RegistrationPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        fullName: "", email: "", password: "", track: ""
    });
    const [loading, setLoading] = useState(false);
    const [activeTracks, setActiveTracks] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");

    const availableCategories = Array.from(new Set(activeTracks.map(t => t.category).filter(Boolean)));
    const filteredTracks = activeTracks.filter(t => t.category === selectedCategory);

    useEffect(() => {
        const fetchTracks = async () => {
            try {
                // Fetch both tracks and categories to ensure we get some data if one is empty
                const res = await fetch("/api/tracks", { cache: 'no-store' });
                
                let allItems = [];
                
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        allItems = data;
                    }
                }

                if (allItems.length === 0) {
                    console.log("Registration: No tracks available to display.");
                }
                
                // Filter for active tracks (case-insensitive)
                const activeOnly = allItems.filter(t => 
                    !t.status || t.status.toString().toUpperCase() === 'ACTIVE'
                );
                
                console.log(`Registration: Received ${allItems.length} options, ${activeOnly.length} are active.`);
                setActiveTracks(activeOnly);
                
                if (!res.ok) {
                    console.error("Registration: Tracks API failed.");
                }
            } catch (err) {
                console.error("Failed to fetch tracks or categories:", err);
            }
        };
        fetchTracks();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTrackChange = (value) => {
        setFormData(prev => ({ ...prev, track: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.email || !formData.password || !formData.track || !formData.fullName) {
            toast.error("Please fill in all details.");
            return;
        }

        setLoading(true);
        const tid = toast.loading("Creating account...");

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    email: formData.email.trim(),
                }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Account created! Verifying your email...", { id: tid });
                
                // Do NOT log in or set role yet, just redirect to OTP
                setTimeout(() => { 
                    router.push(`/internship/verify-otp?email=${encodeURIComponent(formData.email)}`); 
                }, 1500);
            } else {
                toast.error(data.message || "Registration failed", { id: tid });
            }
        } catch (error) {
            console.error("Registration error:", error);
            toast.error("An error occurred during registration.", { id: tid });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            className="relative min-h-screen w-screen font-sans flex items-center justify-center overflow-hidden bg-center"
            style={{ 
                backgroundImage: 'url(/background4.svg)',
                backgroundSize: '200px',
                backgroundRepeat: 'repeat'
            }}
        >
         <div className="absolute inset-0 z-0 pointer-events-none bg-white/30 "></div>

            <div className="w-full max-w-lg mx-auto space-y-8 bg-white/70 backdrop-blur-3xl lg:px-12 pb-12 pt-16 rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-white/60 relative z-10 transition-all m-4">
                <div className="text-center space-y-4">
                    <h2 className="text-3xl font-bold text-black tracking-tight">Digital South Internship</h2>
                    <p className="text-gray-500">Create an account to take the eligibility assessment.</p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Full Name</label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="John Doe"
                                required
                                className="w-full text-black px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="john@example.com"
                                required
                                className="w-full text-black px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Create a password"
                                required
                                className="w-full text-black px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div className={`grid gap-4 ${selectedCategory ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                            <div className="space-y-1">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Interest Category</label>
                                <Select
                                    value={selectedCategory}
                                    onValueChange={(value) => {
                                        setSelectedCategory(value);
                                        setFormData(prev => ({ ...prev, track: "" })); // Reset track when category changes
                                    }}
                                    required
                                >
                                    <SelectTrigger className="w-full text-black h-[50px] px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all bg-white shadow-none">
                                        <SelectValue placeholder="Select a Category" className="font-medium" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-white/60 bg-white/90 backdrop-blur-xl shadow-2xl z-[9999]">
                                        {availableCategories.map((cat, idx) => (
                                            <SelectItem 
                                                key={idx} 
                                                value={cat}
                                                className="py-3 px-4 rounded-xl focus:bg-gray-100 transition-colors"
                                            >
                                                {cat}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            {selectedCategory && (
                                <div className="space-y-1 animate-in fade-in slide-in-from-right-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Interest Sub-Track</label>
                                    <Select
                                        value={formData.track}
                                        onValueChange={handleTrackChange}
                                        required
                                    >
                                        <SelectTrigger className="w-full text-black h-[50px] px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all bg-white shadow-none">
                                            <SelectValue placeholder="Select a Sub-Track" className="font-medium" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-white/60 bg-white/90 backdrop-blur-xl shadow-2xl z-[9999]">
                                            {filteredTracks.map((track) => (
                                                <SelectItem 
                                                    key={track._id} 
                                                    value={track.name}
                                                    className="py-3 px-4 rounded-xl focus:bg-gray-100 transition-colors"
                                                >
                                                    {track.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="w-full h-[56px] bg-gray-200 animate-pulse rounded-xl shadow-sm"></div>
                    ) : (
                        <button
                            type="submit"
                            className="w-full bg-black hover:bg-neutral-800 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            Sign Up & Take Assessment <ChevronRight className="w-5 h-5" />
                        </button>
                    )}

                    <p className="text-center text-sm text-gray-600 mt-4">
                        Already have an account?{" "}
                        <Link href="/login" className="text-black hover:underline font-semibold">
                            Log in
                        </Link>
                    </p>
                </form>
            </div>
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />
        </div>
    );
}

