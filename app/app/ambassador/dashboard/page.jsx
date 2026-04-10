"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Users, 
    Gift, 
    TrendingUp, 
    Copy, 
    ArrowRight, 
    BarChart3, 
    LogOut, 
    ShieldCheck, 
    Check, 
    Calendar,
    ChevronUp,
    MousePointer2,
    Briefcase,
    Mail
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { CartesianGrid, Line, LineChart, XAxis, YAxis, ResponsiveContainer } from 'recharts';



const dicebear = (seed) => `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent`;

export default function AmbassadorDashboard() {
    const router = useRouter();
    const [ambassador, setAmbassador] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchMe = async () => {
            const email = localStorage.getItem('ambassadorEmail') || localStorage.getItem('userEmail');
            if (!email) {
                router.push('/ambassador/login');
                return;
            }

            try {
                const res = await fetch(`/api/ambassador/me?email=${email}`);
                if (res.ok) {
                    const data = await res.json();
                    setAmbassador(data);
                } else {
                    router.push('/ambassador/login');
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchMe();
    }, [router]);

    const handleCopy = () => {
        navigator.clipboard.writeText(ambassador.referralCode);
        setCopied(true);
        toast.success("Code copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleLogout = () => {
        localStorage.clear();
        document.cookie = "userRole=; path=/; max-age=0";
        document.cookie = "userEmail=; path=/; max-age=0";
        router.push('/login');
    };

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!ambassador) return null;

    // Process real analytics data for the chart (Last 6 Months)
    const generateChartData = () => {
        if (!ambassador.referredUsers) return [];
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const data = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            let d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            let monthLabel = months[d.getMonth()];
            // Count recruits for this specific month
            let recruits = ambassador.referredUsers.filter(u => {
                let uDate = new Date(u.createdAt);
                return uDate.getMonth() === d.getMonth() && uDate.getFullYear() === d.getFullYear();
            });
            data.push({
                name: monthLabel,
                uv: recruits.length, // Total recruits
                pv: recruits.filter(u => u.status === 'Active' || u.status === 'SELECTED' || u.status === 'VERIFIED').length // Active recruits
            });
        }
        return data;
    };

    const chartData = generateChartData();

    const calculateGrowth = () => {
        if (chartData.length < 2) return "+0.0%";
        const currentMonth = chartData[5].uv;
        const lastMonth = chartData[4].uv;
        if (lastMonth === 0 && currentMonth > 0) return "+100.0%";
        if (lastMonth === 0) return "0.0%";
        const growth = ((currentMonth - lastMonth) / lastMonth) * 100;
        return `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`;
    };

    const growthRate = calculateGrowth();

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-black selection:text-white pb-20">
            {/* Standardized Tactical Header */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-3xl px-8 py-5 border-b border-gray-100 shadow-sm mb-8">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-8 bg-black rounded-full" />
                        <h1 className="text-2xl font-black text-black tracking-tighter uppercase leading-none">
                            Ambassador Dashboard
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                   
                        <button 
                            onClick={handleLogout}
                            className="p-2.5 bg-gray-50 hover:bg-black hover:text-white rounded-xl transition-all border border-gray-100 shadow-sm text-gray-400 group"
                        >
                            <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-8 space-y-10">
                {/* Profile Overview Card */}
                <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row items-center gap-12 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-black/[0.02] rounded-full translate-x-32 -translate-y-32 blur-[80px]" />
                    
                    <div className="w-32 h-32 rounded-3xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden relative z-10 shadow-xl group-hover:scale-105 transition-transform duration-500">
                        <img 
                            src={ambassador.profilePicture || dicebear(ambassador.fullName?.split(' ')[0])} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = dicebear("Ambassador"); }}
                        />
                    </div>

                    <div className="flex-1 space-y-8 relative z-10 w-full text-center lg:text-left">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                            <h2 className="text-4xl font-black text-black tracking-tighter uppercase leading-tight">{ambassador.fullName}</h2>
                            <div className="flex items-center justify-center lg:justify-start gap-2">
                                <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[9px] font-black uppercase rounded-lg border border-amber-100 flex items-center gap-1.5 shadow-sm">
                                    <TrendingUp className="w-3 h-3" /> Growth Mode
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center lg:justify-start items-center gap-6 text-gray-400">
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <span className="text-sm font-bold tracking-tight">{ambassador.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4" />
                                <span className="text-sm font-bold tracking-tight">{ambassador.collegeName || "Global Digital Partner"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Referral Code Card */}
                    <div className="lg:w-80 w-full bg-black rounded-[2.5rem] p-8 text-white relative overflow-hidden group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-shadow">
                        <div className="relative z-10 space-y-6">
                            <div>
                                <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.25em] mb-2">Unique Referral Key</p>
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-3xl font-black tracking-widest font-mono">{ambassador.referralCode}</p>
                                    <button 
                                        onClick={handleCopy}
                                        className="p-3 bg-white/10 hover:bg-white text-white hover:text-black rounded-xl transition-all active:scale-95"
                                    >
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Candidate Discount</p>
                                    <p className="text-sm font-black italic">{ambassador.discountPercentage || 10}% Off Total Fee</p>
                                </div>
                                <Gift className="w-8 h-8 text-[#ccff00] opacity-80" />
                            </div>
                        </div>
                        {/* Detail Lines */}
                        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: '20px 20px' }}></div>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <MetricCard 
                        label="Total Recruits" 
                        value={ambassador.referredCount || 0} 
                        icon={Users} 
                        desc="Accepted candidates who used your code"
                        color="text-blue-600"
                        bgColor="bg-blue-50"
                    />
                    <MetricCard 
                        label="Total Earnings" 
                        value={`₹${ambassador.earnings || 0}`} 
                        icon={Gift} 
                        desc="Accumulated commission from successful payments"
                        color="text-emerald-600"
                        bgColor="bg-emerald-50"
                    />
                    <MetricCard 
                        label="Growth Rate" 
                        value={growthRate} 
                        icon={TrendingUp} 
                        desc="Performance compared to previous period"
                        color="text-amber-600"
                        bgColor="bg-amber-50"
                    />
                    <MetricCard 
                        label="Profile Reach" 
                        value={ambassador.clicks || 0} 
                        icon={MousePointer2} 
                        desc="Clicks monitored on referral campaigns"
                        color="text-purple-600"
                        bgColor="bg-purple-50"
                    />
                </div>

                {/* Main Content: Performance Analytics & User History */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Analytics Graph Placeholder */}
                    <div className="lg:col-span-2 bg-white rounded-[3rem] border border-gray-100 shadow-sm p-10 space-y-8 group">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-black group-hover:text-white transition-colors border border-gray-100">
                                    <BarChart3 className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-black text-black uppercase tracking-tight">Recruitment Intelligence</h3>
                            </div>
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                Last 30 Days <ChevronUp className="w-3 h-3 text-emerald-500" />
                            </div>
                        </div>

                        {/* Line Chart */}
                        <div className="aspect-[2/1] bg-white rounded-3xl pt-6 border border-gray-100 flex items-end justify-between p-2 relative group-hover:bg-gray-50/10 transition-colors w-full h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid stroke="#f3f4f6" strokeDasharray="5 5" vertical={false} />
                                <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="#9ca3af" fontSize={10} axisLine={false} tickLine={false} />
                                <Line type="monotone" dataKey="uv" stroke="#000000" strokeWidth={3} dot={{ fill: '#ffffff', strokeWidth: 2, stroke: '#000000', r: 4 }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="pv" stroke="#d1d5db" strokeWidth={3} dot={{ fill: '#ffffff', strokeWidth: 2, stroke: '#d1d5db', r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recruitment Log */}
                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-10 space-y-8">
                        <div className="flex items-center justify-between">
                           <h3 className="text-lg font-black text-black uppercase tracking-tight flex items-center gap-3">
                                <Calendar className="w-5 h-5" /> History
                           </h3>
                        </div>

                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {ambassador.referredUsers?.length === 0 ? (
                                <div className="py-20 text-center opacity-30">
                                    <Users className="w-8 h-8 mx-auto mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No recruits recorded</p>
                                </div>
                            ) : (
                                ambassador.referredUsers?.map((user, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-transparent hover:border-gray-100 hover:bg-white transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center overflow-hidden">
                                                <img src={dicebear(user.fullName)} alt="U" className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-black uppercase tracking-tight truncate max-w-[80px]">{user.fullName}</p>
                                                <p className="text-[8px] font-bold text-gray-400 font-mono tracking-tighter italic">{new Date(user.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-[7px] font-black uppercase px-2 py-1 rounded-md border 
                                                ${user.status === 'ACTIVE' ? 'bg-black text-white border-transparent' : 'bg-white text-gray-400 border-gray-100'}`}>
                                                {user.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        <button className="w-full py-4 bg-gray-50 hover:bg-black hover:text-white rounded-2xl border border-gray-100 transition-all text-[9px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 group">
                            Full Database Access <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </main>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #ddd;
                    border-radius: 10px;
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.1 }
                    50% { opacity: 0.2 }
                }
            `}</style>
        </div>
    );
}

function MetricCard({ label, value, icon: Icon, desc, color, bgColor }) {
    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all relative overflow-hidden group">
            <div className={`w-12 h-12 ${bgColor} ${color} rounded-2xl flex items-center justify-center mb-6`}>
                <Icon className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            </div>
            <div className="space-y-1 relative z-10">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
                <p className="text-3xl font-black text-black tracking-tighter">{value}</p>
                <div className="pt-4 border-t border-gray-50 mt-4">
                     <p className="text-[8px] font-bold text-gray-400 leading-relaxed uppercase tracking-tight">{desc}</p>
                </div>
            </div>
            {/* Background Blur Detail */}
            <div className={`absolute top-0 right-0 w-20 h-20 ${bgColor} blur-[40px] opacity-0 group-hover:opacity-40 transition-opacity`} />
        </div>
    );
}
