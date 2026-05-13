"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { 
  ArrowRight, 
  BookOpen, 
  CheckCircle, 
  Award, 
  Users, 
  ShieldCheck,
  Briefcase,
  Zap
} from "lucide-react";

export default function LandingPage() {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const userEmail = typeof window !== 'undefined' ? localStorage.getItem("userEmail") : null;
        const userRole = typeof window !== 'undefined' ? localStorage.getItem("userRole") : null;
        if (userEmail && userRole) {
            setIsLoggedIn(true);
            // Automatically redirect to the appropriate dashboard
            if (userRole === 'admin') router.push('/admin');
            else if (userRole === 'ambassador') router.push('/ambassador/dashboard');
            else router.push('/dashboard');
        }
    }, [router]);

    if (!mounted) return null;

    const features = [
        {
            icon: <BookOpen className="w-6 h-6 text-blue-500" />,
            title: "Assessment",
            description: "Take our eligibility test to showcase your skills and secure your spot."
        },
        {
            icon: <ShieldCheck className="w-6 h-6 text-indigo-500" />,
            title: "Verification",
            description: "Seamless identity verification via DigiLocker to ensure program integrity."
        },
        {
            icon: <Briefcase className="w-6 h-6 text-violet-500" />,
            title: "Real Projects",
            description: "Work on actual industry projects with guidance from expert mentors."
        },
        {
            icon: <Award className="w-6 h-6 text-purple-500" />,
            title: "Certification",
            description: "Receive a verified certificate upon successful completion of your internship."
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100
            }
        }
    };

    return (
        <div className="relative min-h-screen bg-white overflow-hidden font-sans">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Navigation */}
            <nav className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                        <Zap className="text-white w-6 h-6 fill-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-gray-900">InternPortal</span>
                </div>
                <div className="flex items-center gap-6">
                    {isLoggedIn ? (
                        <Link 
                            href="/dashboard" 
                            className="px-5 py-2.5 bg-black text-white font-semibold rounded-full hover:bg-gray-800 transition-all text-sm shadow-lg shadow-black/10"
                        >
                            Go to Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link href="/login" className="text-sm font-semibold text-gray-600 hover:text-black transition-colors">
                                Sign In
                            </Link>
                            <Link 
                                href="/internship/register" 
                                className="px-5 py-2.5 bg-black text-white font-semibold rounded-full hover:bg-gray-800 transition-all text-sm shadow-lg shadow-black/10"
                            >
                                Get Started
                            </Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
                <motion.div 
                    className="text-center space-y-8"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-widest mb-4">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        Admissions Open for 2024
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight leading-[1.1]">
                        Kickstart Your Career <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
                            With Industry Experts
                        </span>
                    </h1>
                    
                    <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
                        Join the most comprehensive internship program designed to transform students into industry-ready professionals. Real projects, expert mentorship, and global certification.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Link 
                            href="/internship/register" 
                            className="group w-full sm:w-auto px-8 py-4 bg-black text-white font-bold rounded-2xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2 text-lg shadow-xl shadow-black/20 active:scale-[0.98]"
                        >
                            Start Assessment
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link 
                            href="/login" 
                            className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 font-bold rounded-2xl border-2 border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all text-lg flex items-center justify-center"
                        >
                            Already Registered?
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16 max-w-4xl mx-auto border-t border-gray-100 mt-20">
                        <div>
                            <div className="text-3xl font-black text-gray-900">500+</div>
                            <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Active Interns</div>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-gray-900">150+</div>
                            <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Live Projects</div>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-gray-900">98%</div>
                            <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Success Rate</div>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-gray-900">24/7</div>
                            <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Support</div>
                        </div>
                    </div>
                </motion.div>

                {/* Features Section */}
                <motion.div 
                    className="mt-40"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                >
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">How It Works</h2>
                        <p className="text-gray-500 font-medium max-w-xl mx-auto">Your journey from a student to a professional is just four simple steps away.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, idx) => (
                            <motion.div 
                                key={idx}
                                variants={itemVariants}
                                className="p-8 bg-white/50 backdrop-blur-sm rounded-[2rem] border border-gray-100 hover:border-blue-200 hover:bg-white hover:shadow-2xl hover:shadow-blue-500/5 transition-all group"
                            >
                                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform group-hover:bg-blue-50">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed font-medium">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-gray-100 py-12 bg-gray-50/50">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                            <Zap className="text-white w-5 h-5 fill-white" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-gray-900">InternPortal</span>
                    </div>
                    <div className="text-sm text-gray-400 font-medium">
                        &copy; {new Date().getFullYear()} Digital South Internship Portal. All rights reserved.
                    </div>
                    <div className="flex items-center gap-8">
                        <Link href="#" className="text-sm font-bold text-gray-400 hover:text-black transition-colors">Privacy</Link>
                        <Link href="#" className="text-sm font-bold text-gray-400 hover:text-black transition-colors">Terms</Link>
                        <Link href="#" className="text-sm font-bold text-gray-400 hover:text-black transition-colors">Contact</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
