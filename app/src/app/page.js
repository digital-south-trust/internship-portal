"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from 'swr';
import { 
  ArrowRight, 
  Zap,
  BookOpen,
  ShieldCheck,
  Briefcase,
  Award,
  CheckCircle,
  Users,
  Target,
  Sparkles,
  Code,
  Search,
  Globe
} from "lucide-react";
import FlowArt, { FlowSection } from "@/components/ui/story-scroll";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function LandingPage() {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Dynamic Tracks Fetching
    const { data: tracks, error } = useSWR('/api/admin/tracks', fetcher);

    useEffect(() => {
        setMounted(true);
        const userEmail = typeof window !== 'undefined' ? localStorage.getItem("userEmail") : null;
        const userRole = typeof window !== 'undefined' ? localStorage.getItem("userRole") : null;
        if (userEmail && userRole) {
            setIsLoggedIn(true);
            if (userRole === 'admin') router.push('/admin');
            else if (userRole === 'ambassador') router.push('/ambassador/dashboard');
            else router.push('/dashboard');
        }
    }, [router]);

    if (!mounted) return null;

    // Group tracks by category dynamically
    const tracksByCategory = tracks?.reduce((acc, track) => {
        if (track.status === 'FROZEN') return acc;
        const cat = track.category || 'OTHER';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(track);
        return acc;
    }, {}) || {};

    const categoryIcons = {
        'CODING': <Code className="w-4 h-4 text-black" />,
        'RESEARCH': <Search className="w-4 h-4 text-white" />,
        'DEFAULT': <Globe className="w-4 h-4 text-white" />
    };

    const categoryAccents = {
        'CODING': 'bg-[#ccff00]',
        'RESEARCH': 'bg-blue-500',
        'DEFAULT': 'bg-neutral-800'
    };

    return (
        <FlowArt aria-label="Digital South InternPortal Presentation">
            {/* 01 — HERO / VISION */}
            <FlowSection aria-label="The Vision" style={{ backgroundColor: '#ffffffff', color: '#000000ff' }}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black tracking-tighter uppercase">Digital South InternPortal</span>
                    </div>
                    <div className="flex items-center gap-6">
                        {isLoggedIn ? (
                            <Link href="/dashboard" className="text-xs font-black uppercase tracking-widest hover:text-[#ccff00] transition-colors">Dashboard</Link>
                        ) : (
                            <>
                                <Link href="/login" className="text-md font-black uppercase tracking-widest hover:scale-105 hover:bg-black hover:text-white p-3 rounded-full transition-colors">Sign In</Link>
                                <Link href="/internship/register" className="px-6 py-3 bg-white text-black text-[15px] font-black uppercase tracking-widest rounded-full hover:bg-black hover:text-white hover:scale-105 transition-all">Join Program</Link>
                            </>
                        )}
                    </div>
                </div>

                <hr className="border-none border-t border-white/20" />
                
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-white w-fit bg-black p-3 rounded-full">01 — The Future of Work</p>
                    <h1 className="text-[clamp(3rem,10vw,12rem)] font-black leading-[0.85] uppercase tracking-tighter">
                        Kickstart<br />
                        Your Career<br />
                        <span className="text-black">Today.</span>
                    </h1>
                </div>

                <hr className="my-[2vw] border-none border-t border-white/20" />

                <div className="flex flex-col md:flex-row items-end justify-between gap-12 mt-auto">
                    <p className="max-w-[45ch] text-[clamp(1rem,2vw,1.5rem)] font-bold leading-tight uppercase tracking-tight">
                        Join the most comprehensive internship program designed to transform students into industry-ready professionals.
                    </p>
                    <div className="flex gap-12">
                        <div className="text-center">
                            <p className="text-4xl font-black tracking-tighter">500+</p>
                            <p className="text-[8px] font-black uppercase tracking-widest text-black w-fit bg-white p-3 rounded-full">Active Interns</p>
                        </div>
                        <div className="text-center">
                            <p className="text-4xl font-black tracking-tighter">98%</p>
                            <p className="text-[8px] font-black uppercase tracking-widest text-black w-fit bg-white p-3 rounded-full">Success Rate</p>
                        </div>
                    </div>
                </div>
            </FlowSection>

            {/* 02 — DYNAMIC TRACKS SECTION */}
            <FlowSection aria-label="Specializations" style={{ backgroundColor: '#f4a7a7ff', color: '#000000ff' }}>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">02 — Choose Your Trajectory</p>
                 <hr className="-my-5 border-none border-t border-white/10" />

                 <div className="flex flex-col lg:flex-row justify-between items-start gap-5">
                    <h2 className="text-[clamp(2.5rem,8vw,8rem)] font-black leading-[0.85] uppercase tracking-tighter">
                        Multiple<br />
                        Pathways.<br />
                        One Goal.
                    </h2>
                    <p className="max-w-[30ch] text-xs font-bold uppercase tracking-widest opacity-60 leading-relaxed text-right">
                        Explore specialized tracks designed to give you domain-specific expertise through high-impact industrial projects.
                    </p>
                 </div>

                 <div className="columns-1 md:columns-2 lg:columns-3 gap-10 space-y-10">
                    {Object.entries(tracksByCategory).map(([category, catTracks]) => (
                        <div key={category} className="break-inside-avoid space-y-6">
                            <div className="flex items-center gap-3 ">
                                <div className={`w-8 h-8 ${categoryAccents[category] || categoryAccents.DEFAULT} rounded-lg flex items-center justify-center`}>
                                    {categoryIcons[category] || categoryIcons.DEFAULT}
                                </div>
                                <h3 className="text-sm  font-black uppercase tracking-widest ">
                                    {category === 'CODING' ? 'Coding Architectures' : 
                                     category === 'RESEARCH' ? 'Research Strategies' : 
                                     `${category} Programs`}
                                </h3>
                            </div>
                            <div className="flex flex-wrap gap-2 ">
                                {catTracks.map((track, i) => (
                                    <div key={i} className={`px-4 py-2 bg-white border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all cursor-default hover:border-[#ccff00]/50`}>
                                        {track.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    
                    {Object.keys(tracksByCategory).length === 0 && (
                        <div className="col-span-full py-20 text-center text-white/20 italic text-sm font-black uppercase tracking-widest">
                            Syncing System Trajectories...
                        </div>
                    )}
                 </div>

                 <div className="mt-auto flex justify-between items-center border-t border-white/10 pt-8">
                    <div className="flex items-center gap-4">
                        <Globe className="w-4 h-4 text-white/40" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Globally Verified Curriculum</span>
                    </div>
                    <Link href="/internship/register" className="text-[10px] font-black uppercase tracking-widest bg-white text-black px-6 py-3 rounded-full hover:bg-[#ccff00] transition-all">
                        View All Tracks
                    </Link>
                 </div>
            </FlowSection>

            {/* 03 — THE PROTOCOL / ASSESSMENT */}
            <FlowSection aria-label="The Protocol" style={{ backgroundColor: '#fd5200', color: '#fff' }}>
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">03 — The Entrance Protocol</p>
                <hr className="my-[2vw] border-none border-t border-white/30" />
                
                <div>
                    <h2 className="text-[clamp(3rem,10vw,12rem)] font-black leading-[0.85] uppercase tracking-tighter">
                        Prove<br />
                        Your<br />
                        Value.
                    </h2>
                </div>

                <hr className="my-[2vw] border-none border-t border-white/30" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                    <div className="space-y-4">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-tight">Dynamic Assessment</h3>
                        <p className="text-sm font-medium opacity-80 leading-relaxed max-w-sm">Take our proprietary eligibility test to showcase your analytical and technical skills to secure your spot.</p>
                    </div>
                    <div className="space-y-4">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-tight">Identity Trust</h3>
                        <p className="text-sm font-medium opacity-80 leading-relaxed max-w-sm">Seamless identity verification via DigiLocker to ensure program integrity and secure your future credentials.</p>
                    </div>
                </div>

                <div className="mt-auto">
                    <Link href="/internship/register" className="inline-flex items-center gap-4 group">
                        <span className="text-2xl font-black uppercase tracking-tighter">Initialize Assessment</span>
                        <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ArrowRight className="w-6 h-6" />
                        </div>
                    </Link>
                </div>
            </FlowSection>

            {/* 04 — THE EXPERIENCE / PROJECTS */}
            <FlowSection aria-label="The Experience" style={{ backgroundColor: '#F5F0E8', color: '#000' }}>
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">04 — Industry Experience</p>
                <hr className="my-[2vw] border-none border-t border-black/10" />

                <div>
                    <h2 className="text-[clamp(3rem,10vw,12rem)] font-black leading-[0.85] uppercase tracking-tighter">
                        Real<br />
                        World.<br />
                        Real<br />
                        Impact.
                    </h2>
                </div>

                <hr className="my-[2vw] border-none border-t border-black/10" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">Phase 01</p>
                        <h4 className="text-lg font-black uppercase tracking-tight">Live Deployment</h4>
                        <p className="text-xs font-medium text-black/60 leading-relaxed">Work on actual industry projects with guidance from expert mentors and senior engineers.</p>
                    </div>
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">Phase 02</p>
                        <h4 className="text-lg font-black uppercase tracking-tight">Global Networking</h4>
                        <p className="text-xs font-medium text-black/60 leading-relaxed">Connect with collaborators and mentors who push your technical boundaries and career forward.</p>
                    </div>
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">Phase 03</p>
                        <h4 className="text-lg font-black uppercase tracking-tight">Skill Evolution</h4>
                        <p className="text-xs font-medium text-black/60 leading-relaxed">Iterate on your practice with flexible tools and specialized feedback that adapt to your growth.</p>
                    </div>
                </div>

                <p className="mt-auto ml-auto max-w-[40ch] text-right text-xs font-bold uppercase tracking-widest opacity-40">
                    Industry-ready professionals aren't born. They are deployed through intensive experience.
                </p>
            </FlowSection>

            {/* 05 — THE VALIDATION / CERTIFICATION */}
            <FlowSection aria-label="The Validation" style={{ backgroundColor: '#1A3DE8', color: '#fff' }}>
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">05 — Verified Validation</p>
                <hr className="my-[2vw] border-none border-t border-white/20" />

                <div>
                    <h2 className="text-[clamp(3rem,10vw,12rem)] font-black leading-[0.85] uppercase tracking-tighter">
                        Verified.<br />
                        Trusted.<br />
                        Ready.
                    </h2>
                </div>

                <hr className="my-[2vw] border-none border-t border-white/20" />

                <div className="flex flex-wrap gap-12 items-center">
                    <div className="p-10 bg-white/10 rounded-[2.5rem] border border-white/10 flex-1 min-w-[300px]">
                        <Award className="w-12 h-12 text-[#ccff00] mb-6" />
                        <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Official Certification</h3>
                        <p className="text-sm font-medium opacity-80 leading-relaxed">Receive a cryptographically verified certificate upon successful completion, recognized by global technology partners.</p>
                    </div>
                    <div className="space-y-8 flex-1 min-w-[300px]">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl font-black italic tracking-tighter">100%</div>
                            <p className="text-xs font-black uppercase tracking-widest opacity-60">Success Alignment</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl font-black italic tracking-tighter">24/7</div>
                            <p className="text-xs font-black uppercase tracking-widest opacity-60">Intelligence Support</p>
                        </div>
                    </div>
                </div>

                <p className="mt-auto text-[clamp(1rem,2.5vw,2rem)] font-black uppercase tracking-tighter max-w-[50ch]">
                    WE ARE NOT JUST A PORTAL. WE ARE THE MOVEMENT REWRITING THE RULES OF ENTRY-LEVEL TALENT.
                </p>
            </FlowSection>

            {/* 06 — CTA */}
            <FlowSection aria-label="Join Us" style={{ backgroundColor: '#000', color: '#fff' }}>
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">06 — Join the Elite</p>
                <hr className="my-[2vw] border-none border-t border-white/10" />

                <div className="flex-1 flex flex-col justify-center items-center text-center space-y-12">
                    <h2 className="text-[clamp(4rem,15vw,20rem)] font-black leading-[0.8] uppercase tracking-tighter">
                        READY<br />
                        TO<br />
                        BEGIN?
                    </h2>
                    
                    <div className="flex flex-col sm:flex-row gap-6">
                        <Link 
                            href="/internship/register" 
                            className="px-12 py-6 bg-[#ccff00] text-black text-sm font-black uppercase tracking-widest rounded-2xl hover:scale-110 transition-all shadow-2xl shadow-[#ccff00]/20"
                        >
                            Initialize Journey
                        </Link>
                        <Link 
                            href="/login" 
                            className="px-12 py-6 bg-white/5 text-white border border-white/10 text-sm font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all"
                        >
                            Portal Access
                        </Link>
                    </div>
                </div>

                <footer className="mt-auto py-8 flex flex-col md:flex-row justify-between items-center gap-6 border-t border-white/5 opacity-40">
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">InternPortal &copy; {new Date().getFullYear()}</span>
                    </div>
                    <div className="flex gap-8 text-[8px] font-black uppercase tracking-widest">
                        <Link href="#">Privacy</Link>
                        <Link href="#">Terms</Link>
                        <Link href="#">Contact</Link>
                    </div>
                </footer>
            </FlowSection>
        </FlowArt>
    );
}
