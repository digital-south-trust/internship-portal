"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    User,
    Phone,
    Calendar as CalendarIcon,
    GraduationCap,
    Building,
    Briefcase,
    Upload,
    CornerDownRight,
    X,
    Check,
    ChevronRight,
    ChevronLeft,
    ShieldCheck,
    FileText,
    ArrowRight,
    CreditCard,
    Clock
} from 'lucide-react';
import Script from 'next/script';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { Skeleton } from '@/components/ui/skeleton';
import { ParticleTextEffect } from '@/components/ui/particle-text-effect';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { motion } from 'framer-motion';

function ProfileSkeleton() {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
            <div className="absolute inset-0 z-0 bg-center opacity-[0.05]" style={{ backgroundImage: "url('/background8.svg')", backgroundSize: '30%', backgroundRepeat: 'repeat' }}></div>
            <div className="w-full max-w-xl bg-white/95 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-white/40 overflow-hidden relative z-10 p-10 md:p-14">
                <div className="space-y-4 mb-8">
                    <Skeleton className="h-8 w-3/4 mx-auto bg-black/5" />
                    <Skeleton className="h-4 w-1/2 mx-auto bg-black/5" />
                </div>
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                             <Skeleton className="h-3 w-1/3 bg-black/5" />
                             <Skeleton className="h-12 w-full rounded-xl bg-black/5" />
                        </div>
                        <div className="space-y-2">
                             <Skeleton className="h-3 w-1/3 bg-black/5" />
                             <Skeleton className="h-12 w-full rounded-xl bg-black/5" />
                        </div>
                    </div>
                    <div className="space-y-2">
                         <Skeleton className="h-3 w-1/4 bg-black/5" />
                         <div className="grid grid-cols-3 gap-2">
                            <Skeleton className="h-12 rounded-xl bg-black/5" />
                            <Skeleton className="h-12 rounded-xl bg-black/5" />
                            <Skeleton className="h-12 rounded-xl bg-black/5" />
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CompleteProfilePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState(null);
    const [formData, setFormData] = useState({
        phone: "", gender: "", dob: "",
        aadhaarNumber: "", passportPhoto: "", aadhaarCard: "",
        educationQualification: "", courseName: "", duration: "", collegeName: "", workingDetails: "", resumeDocument: "",
        isVerified: false, aadharVerificationTries: 0, 
        isPaid: false,
        referralCode: "",
        appliedReferral: null, // Stores ambassador data if valid
    });
    const [showSplash, setShowSplash] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState('idle');
    const [agreedPaymentTerms, setAgreedPaymentTerms] = useState(false);
    const [showPaymentTermsModal, setShowPaymentTermsModal] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            const email = localStorage.getItem('userEmail');
            console.log("Complete Profile - Loading for:", email);
            if (!email) {
                router.push('/login');
                return;
            }

            // Load saved progress from localStorage
            const savedData = localStorage.getItem(`profile_form_${email}`);
            const savedStep = localStorage.getItem(`profile_step_${email}`);
            
            if (savedData) {
                try {
                    setFormData(prev => ({ ...prev, ...JSON.parse(savedData) }));
                } catch (e) {
                    console.error("Failed to parse saved profile data");
                }
            }
            if (savedStep) {
                setStep(parseInt(savedStep));
            }

            try {
                const res = await fetch(`/api/user/me?email=${email}`);
                if (res.ok) {
                    const data = await res.json();
                    console.log("Profile data received, status:", data.status);
                    setUserData(data);

                    if (data.phone && !formData.phone) {
                        setFormData(prev => ({ ...prev, phone: data.phone }));
                    }

                    if (data.status === 'ACTIVE') {
                        router.push('/dashboard');
                        return;
                    }

                    const allowedStatuses = ['SELECTED', 'PROFILE_PENDING', 'VERIFIED'];
                    if (!allowedStatuses.includes(data.status)) {
                        toast.error("You are not authorized to access this page yet.");
                        router.push('/login');
                        return;
                    }
                } else {
                    router.push('/login');
                }
            } catch (err) {
                console.error(err);
                router.push('/login');
            }
        };

        fetchUserData();
    }, [router]);

    // Persistence Effect
    useEffect(() => {
        if (userData?.email) {
            localStorage.setItem(`profile_form_${userData.email}`, JSON.stringify(formData));
        }
    }, [formData, userData]);

    useEffect(() => {
        if (userData?.email) {
            localStorage.setItem(`profile_step_${userData.email}`, step.toString());
        }
    }, [step, userData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileUpload = async (e, fieldName) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be under 5MB");
            e.target.value = null;
            return;
        }

        const typeMap = {
            'passportPhoto': 'profile_photo',
            'aadhaarCard': 'Aadhar',
            'resumeDocument': 'resume'
        };

        const loadingToast = toast.loading(`Uploading ${fieldName.replace(/([A-Z])/g, ' $1').toLowerCase()}...`);

        try {
            const uploadFormData = new FormData();
            uploadFormData.append("file", file);
            uploadFormData.append("type", typeMap[fieldName] || fieldName);
            uploadFormData.append("email", userData.email);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: uploadFormData,
            });

            const data = await res.json();

            if (res.ok) {
                setFormData(prev => ({ ...prev, [fieldName]: data.url }));
                toast.success("File uploaded successfully");
            } else {
                throw new Error(data.message || "Upload failed");
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("File upload failed. Please try again.");
            e.target.value = null;
        } finally {
            toast.dismiss(loadingToast);
        }
    };

    const getAmount = () => {
        const costs = {
            '2 Months': 7200,
            '4 Months': 12000,
            '6 Months': 15000
        };
        const base = costs[formData.duration] || 7200;
        if (formData.appliedReferral) {
            const discount = (base * (formData.appliedReferral.discountPercentage || 10)) / 100;
            return base - discount;
        }
        return base;
    };

    const handleApplyReferral = async () => {
        if (!formData.referralCode.trim()) return toast.error("Enter a code first");
        const tid = toast.loading("Validating referral...");
        try {
            const res = await fetch(`/api/ambassador/validate?code=${formData.referralCode}`);
            if (res.ok) {
                const ambassador = await res.json();
                setFormData(prev => ({ ...prev, appliedReferral: ambassador }));
                toast.success("Referral applied! Enjoy 10% off", { id: tid });
            } else {
                toast.error("Invalid referral code", { id: tid });
            }
        } catch (e) {
            toast.error("Error validating referral", { id: tid });
        }
    };

    const handlePayment = async () => {
        setLoading(true);
        const amount = getAmount();
        const tid = toast.loading(`Initiating payment for ₹${amount}...`);
        try {
            const res = await fetch("/api/razorpay/order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    amount: amount, 
                    receipt: `rcpt_${userData.email.split('@')[0]}_${Date.now()}`
                }),
            });
            const orderData = await res.json();

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Digital South Internship",
                description: `${formData.duration} Program Enrollment`,
                order_id: orderData.id,
                handler: async function (response) {
                    toast.dismiss(tid); // Clear the "Initiating payment" toast
                    const verifyTid = toast.loading("Verifying payment...");
                    try {
                        const verifyRes = await fetch("/api/verify-payment", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                email: userData.email,
                                fullName: userData.fullName,
                                referralCode: formData.appliedReferral?.referralCode
                            }),
                        });

                        if (verifyRes.ok) {
                            toast.success("Payment Successful!", { id: verifyTid });
                            setPaymentStatus('success');
                            localStorage.removeItem(`profile_form_${userData.email}`);
                            localStorage.removeItem(`profile_step_${userData.email}`);
                            setFormData(prev => ({ ...prev, isPaid: true }));
                            
                            setTimeout(() => { setShowSplash(true); }, 1000);
                            setTimeout(() => { window.location.href = "/dashboard"; }, 5000);
                        } else {
                            setPaymentStatus('failed');
                            toast.error("Payment verification failed.", { id: verifyTid });
                        }
                    } catch (verifyError) {
                        console.error("Verification error:", verifyError);
                        toast.error("Payment verification error. Please contact support.", { id: verifyTid });
                    }
                },
                modal: {
                    ondismiss: function() {
                        // User closed the Razorpay modal without paying
                        toast.dismiss(tid);
                        setLoading(false);
                    }
                },
                prefill: {
                    name: userData.fullName,
                    email: userData.email,
                    contact: formData.phone
                },
                theme: { color: "#000000" },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
            toast.dismiss(tid); // Clear "Initiating" once the Razorpay modal opens
        } catch (error) {
            console.error("Payment failed:", error);
            toast.error("Failed to initiate payment.", { id: tid });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (step === 3 && (!formData.passportPhoto || !formData.aadhaarCard || !formData.aadhaarNumber)) {
            toast.error("Please fill in and upload identity documents first.");
            return;
        }

        setLoading(true);
        const tid = toast.loading("Saving profile...");

        try {
            const res = await fetch("/api/user/complete-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: userData.email,
                    ...formData
                }),
            });

            if (res.ok) {
                toast.success("Profile saved!", { id: tid });
                setStep(4); // Move to Payment
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to update profile", { id: tid });
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred.", { id: tid });
        } finally {
            setLoading(false);
        }
    };

    if (!userData) return <ProfileSkeleton />;

    if (showSplash) {
        return (
            <AuroraBackground>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                        duration: 1.2,
                        ease: [0.4, 0, 0.2, 1],
                    }}
                    className="relative flex flex-col gap-6 items-center justify-center px-6"
                >
                    <div className="text-4xl md:text-8xl font-black text-black dark:text-white text-center tracking-tighter uppercase drop-shadow-2xl">
                        Digital South Internship
                    </div>
                    <div className="font-medium text-base md:text-2xl text-gray-600 dark:text-neutral-400 py-2 text-center tracking-[0.3em] uppercase opacity-80">
                        Welcome aboard! Have a great journey with us.
                    </div>
                    
                    <div className="pt-8">
                        <button 
                            onClick={() => window.location.href = "/dashboard"} 
                            className="bg-black text-white px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:scale-110 active:scale-95 transition-all shadow-2xl hover:shadow-black/20"
                        >
                            Enter Workspace
                        </button>
                    </div>
                </motion.div>
            </AuroraBackground>
        );
    }


    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Background Wallpaper */}
            <div 
                className="absolute inset-0 z-0 bg-center opacity-[0.15]"
                style={{ 
                    backgroundImage: "url('/background8.svg')",
                    backgroundSize: '30%',
                    backgroundRepeat: 'repeat'
                }}
            ></div>
                        <div className={`w-full ${step === 4 ? 'max-w-5xl' : 'max-w-xl'} bg-white/95 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-white/40 overflow-hidden relative z-10 animate-in fade-in zoom-in duration-500`}>
                {/* Progress Bar */}
                <div className="h-2 w-full bg-black/5">
                    <div
                        className="h-full bg-black transition-all duration-700 ease-out"
                        style={{ width: `${(step / 4) * 100}%` }}
                    ></div>
                </div>

                <div className="p-10 md:p-14">
                    {step < 4 && (
                        <header className="mb-10 text-center">
                            <h1 className="text-2xl font-black text-black mb-1 uppercase tracking-tight">Complete Your Profile</h1>
                            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Please provide the necessary details to finalize your onboarding.</p>
                        </header>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {step === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2"><Phone className="w-2.5 h-2.5" /> Phone Number</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                                            required
                                            placeholder="10-digit mobile number"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2"><CalendarIcon className="w-2.5 h-2.5" /> Date of Birth</label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <button type="button" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-left text-sm font-bold bg-white hover:border-black transition-all flex items-center justify-between">
                                                    {formData.dob ? format(new Date(formData.dob), 'PPP') : <span className="text-gray-400 font-normal">Pick a date</span>}
                                                    <CalendarIcon className="w-3 h-3 text-gray-400" />
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 z-[9999]" align="start"><Calendar mode="single" selected={formData.dob ? new Date(formData.dob) : undefined} onSelect={(date) => date && setFormData(prev => ({ ...prev, dob: format(date, 'yyyy-MM-dd') }))} /></PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-black uppercase tracking-widest">Gender</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['Male', 'Female', 'Other'].map(g => (
                                            <button key={g} type="button" onClick={() => setFormData(prev => ({ ...prev, gender: g }))} className={`py-3 rounded-xl border font-medium transition-all ${formData.gender === g ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200'}`}>{g}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2"><GraduationCap className="w-3 h-3" /> Highest Qualification</label>
                                    <input type="text" name="educationQualification" value={formData.educationQualification} onChange={handleChange} required placeholder="e.g. Bachelor of Engineering" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-black uppercase tracking-widest">Course / Branch Name</label>
                                    <input type="text" name="courseName" value={formData.courseName} onChange={handleChange} required placeholder="e.g. Computer Science" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2"><Building className="w-3 h-3" /> College Name</label>
                                    <input type="text" name="collegeName" value={formData.collegeName} onChange={handleChange} required placeholder="Full Institution Name" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black outline-none" />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2"><Clock className="w-3 h-3" /> Internship Duration</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['2 Months', '4 Months', '6 Months'].map(d => (
                                            <button key={d} type="button" onClick={() => setFormData(prev => ({ ...prev, duration: d }))} className={`py-4 rounded-xl border transition-all flex items-center justify-center ${formData.duration === d ? 'bg-black text-white border-black shadow-xl scale-105' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300 active:scale-95'}`}><p className="text-[10px] font-black uppercase tracking-widest">{d}</p></button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2"><ShieldCheck className="w-3 h-3" /> Aadhaar Number</label>
                                    <input
                                        type="text"
                                        name="aadhaarNumber"
                                        value={formData.aadhaarNumber}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                                            const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
                                            setFormData(prev => ({ ...prev, aadhaarNumber: formatted }));
                                        }}
                                        required
                                        placeholder="1234 5678 9012"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black outline-none font-mono tracking-widest"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FileUploadField label="Passport Photo" uploaded={!!formData.passportPhoto} onChange={(e) => handleFileUpload(e, 'passportPhoto')} accept="image/*" />
                                    <FileUploadField label="Aadhaar Card" uploaded={!!formData.aadhaarCard} onChange={(e) => handleFileUpload(e, 'aadhaarCard')} accept=".pdf,image/*" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FileUploadField label="PAN Card" uploaded={!!formData.pancardPhoto} onChange={(e) => handleFileUpload(e, 'pancardPhoto')} accept=".pdf,image/*" />
                                    <FileUploadField label="Education Certificate" uploaded={!!formData.educationCertificate} onChange={(e) => handleFileUpload(e, 'educationCertificate')} accept=".pdf,image/*" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FileUploadField label="Resume (PDF)" uploaded={!!formData.resumeDocument} onChange={(e) => handleFileUpload(e, 'resumeDocument')} accept=".pdf" icon={FileText} />
                                    <FileUploadField label="Experience Letter" uploaded={!!formData.experienceLetter} onChange={(e) => handleFileUpload(e, 'experienceLetter')} accept=".pdf,image/*" icon={FileText} />
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                                {/* Left column: Pricing */}
                                <div className="space-y-6 lg:pr-10 lg:border-r border-gray-100">
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <h1 className="text-xl font-black text-black uppercase tracking-tight">Complete Your Profile</h1>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-loose">Provide details to finalize your onboarding.</p>
                                        </div>
                                        <div className="space-y-1">
                                            <h2 className="text-base font-black text-black uppercase tracking-tight">Onboarding Payment</h2>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-loose">Finalize enrollment by paying the verification fee.</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-[2rem] p-6 space-y-6 border border-gray-100 shadow-sm relative overflow-hidden">
                                        <div className="flex justify-between items-start relative z-10">
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Duration</p>
                                                <div className="bg-black text-white px-3 py-1 rounded-lg inline-block text-[9px] font-black uppercase tracking-widest">{formData.duration}</div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Base Fee</p>
                                                <p className={`text-sm font-black ${formData.appliedReferral ? 'text-gray-300 line-through' : 'text-black'}`}>₹{formData.duration === '2 Months' ? '7,200' : formData.duration === '4 Months' ? '12,000' : '15,000'}</p>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-gray-200 flex justify-between items-end relative z-10">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-black">Total To Pay</p>
                                                <h3 className="text-4xl font-black text-black tracking-tighter mt-1">₹{getAmount().toLocaleString('en-IN')}</h3>
                                            </div>
                                            {formData.appliedReferral && (
                                                <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-sm">10% DISCOUNT</div>
                                            )}
                                        </div>
                                    </div>

                                    {!formData.appliedReferral ? (
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                placeholder="Referral Code?" 
                                                value={formData.referralCode}
                                                onChange={(e) => setFormData(prev => ({ ...prev, referralCode: e.target.value.toUpperCase() }))}
                                                className="flex-1 px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-black transition-all"
                                            />
                                            <button 
                                                type="button" 
                                                onClick={handleApplyReferral}
                                                className="px-8 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10"
                                            >Apply</button>
                                        </div>
                                    ) : (
                                        <div className="bg-lime-50 border border-lime-100 p-4 px-6 rounded-2xl flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Check className="w-4 h-4 text-lime-600" />
                                                <span className="text-[10px] font-black text-lime-700 uppercase tracking-widest">Active Code: {formData.appliedReferral.referralCode}</span>
                                            </div>
                                            <button onClick={() => setFormData(prev => ({ ...prev, appliedReferral: null, referralCode: "" }))} className="text-[9px] font-black text-lime-600 uppercase underline decoration-2 underline-offset-4">Remove</button>
                                        </div>
                                    )}
                                </div>

                                {/* Right column: Compliance */}
                                <div className="space-y-6 flex flex-col justify-center">
                                    <div className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100 space-y-6 shadow-inner">
                                        <div 
                                            onClick={() => setShowPaymentTermsModal(true)}
                                            className="w-full bg-white rounded-2xl p-6 border border-gray-100 flex items-center gap-5 group cursor-pointer hover:border-black transition-all shadow-sm"
                                        >
                                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all shadow-inner">
                                                <CornerDownRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Legal Review</p>
                                                <p className="text-[11px] font-black text-black uppercase tracking-tight">Enrollment Terms & Conditions</p>
                                            </div>
                                        </div>

                                        <div className="px-4 flex items-start gap-4">
                                            <input 
                                                type="checkbox" 
                                                id="agreePay" 
                                                checked={agreedPaymentTerms}
                                                onChange={(e) => setAgreedPaymentTerms(e.target.checked)}
                                                className="w-7 h-7 accent-black rounded-lg cursor-pointer mt-0"
                                            />
                                            <label htmlFor="agreePay" className="text-[10px] font-black text-gray-500 uppercase tracking-tight cursor-pointer leading-relaxed">
                                                "I have read, understood, and agree to the terms... (Review required)"
                                            </label>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <button
                                            type="button"
                                            onClick={paymentStatus === 'success' ? () => setShowSplash(true) : handlePayment}
                                            disabled={loading || (paymentStatus !== 'success' && !agreedPaymentTerms)}
                                            className={`w-full font-black py-5 rounded-[2rem] shadow-2xl transition-all flex items-center justify-center gap-4 disabled:opacity-30 ${paymentStatus === 'success' ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-black text-white hover:scale-[1.03] active:scale-[0.97] shadow-black/20'}`}
                                        >
                                            <span className="text-xs uppercase tracking-[0.2em]">{loading ? "Processing..." : paymentStatus === 'success' ? "Start Journey" : "Pay & Start Journey"}</span>
                                            <ArrowRight className="w-5 h-5" />
                                        </button>
                                        
                                        <div className="flex justify-start items-center px-4">
                                            <button 
                                                type="button" 
                                                onClick={() => setStep(step - 1)} 
                                                className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-black transition-colors"
                                            >
                                                <ChevronLeft className="w-4 h-4" /> Go Back
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step < 4 && (
                            <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                                {step > 1 && <button type="button" onClick={() => setStep(step - 1)} className="flex items-center gap-2 text-gray-500 font-bold hover:text-black transition-colors"><ChevronLeft className="w-5 h-5" /> Back</button>}
                                <div className="flex-1"></div>
                                {step < 3 ? (
                                    <button type="button" onClick={() => setStep(step + 1)} className="bg-black text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-neutral-800 transition-all shadow-md">Next Step <ChevronRight className="w-5 h-5" /></button>
                                ) : (
                                    <button type="submit" disabled={loading} className="bg-black text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:bg-neutral-800 transition-all shadow-lg shadow-gray-200">{loading ? "Syncing..." : "Confirm & Proceed"} <ChevronRight className="w-4 h-4" /></button>
                                )}
                            </div>
                        )}
                        <Script src="https://checkout.razorpay.com/v1/checkout.js" />
                    </form>
                </div>
            </div>

            <TermsModal 
                isOpen={showPaymentTermsModal} 
                onClose={() => setShowPaymentTermsModal(false)} 
                onAccept={() => setAgreedPaymentTerms(true)}
                accepted={agreedPaymentTerms}
            />
        </div>
    );
}

function TermsModal({ isOpen, onClose, onAccept, accepted }) {
    const [isChecked, setIsChecked] = useState(false);
    
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-black">Enrollment Policy</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1">Pre-Payment Terms & Conditions</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-2xl transition-all shadow-sm">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-10 space-y-10 scroll-smooth text-gray-700">
                    <p className="text-sm font-bold text-black border-l-4 border-black pl-4">
                        By proceeding with payment and enrollment, you agree to the following terms:
                    </p>

                    <div className="space-y-8">
                        <section className="space-y-3">
                            <h3 className="text-[11px] font-black text-black uppercase tracking-widest flex items-center gap-3">
                                <span className="w-6 h-6 rounded-lg bg-black text-white flex items-center justify-center text-[9px] shrink-0">2.1</span> 
                                Non-Refundable Policy
                            </h3>
                            <div className="pl-9 space-y-3">
                                <p className="text-[13px] leading-relaxed font-medium">All program fees are strictly non-refundable under any circumstances, including but not limited to:</p>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {["Voluntary withdrawal", "Failure to complete", "Misconduct disqualification"].map((t, i) => (
                                        <li key={i} className="flex items-center gap-2 bg-red-50/50 p-3 rounded-xl border border-red-100/50 text-[10px] font-black text-red-600 uppercase">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-400" /> {t}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        <section className="space-y-3">
                            <h3 className="text-[11px] font-black text-black uppercase tracking-widest flex items-center gap-3">
                                <span className="w-6 h-6 rounded-lg bg-black text-white flex items-center justify-center text-[9px] shrink-0">2.2</span> 
                                Attendance & Participation
                            </h3>
                            <div className="pl-9 space-y-3">
                                <p className="text-[13px] leading-relaxed font-medium">Participants are required to attend all scheduled review meetings, mentoring sessions, and evaluations. Failure to attend without valid justification may result in:</p>
                                <div className="bg-gray-50 p-6 rounded-[2rem] space-y-3 border border-gray-100">
                                    <div className="text-[11px] font-black text-black flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-black rounded-full shadow-sm" /> Suspension or termination from the program
                                    </div>
                                    <div className="text-[11px] font-black text-black flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-black rounded-full shadow-sm" /> Ineligibility for certification
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-3">
                            <h3 className="text-[11px] font-black text-black uppercase tracking-widest flex items-center gap-3">
                                <span className="w-6 h-6 rounded-lg bg-black text-white flex items-center justify-center text-[9px] shrink-0">2.3</span> 
                                Project Assignment
                            </h3>
                            <div className="pl-9">
                                <p className="text-[13px] leading-relaxed font-medium">Each participant will be assigned a project as part of the internship. Project changes are not permitted until the current project is fully completed and officially approved.</p>
                            </div>
                        </section>

                        <section className="space-y-3">
                            <h3 className="text-[11px] font-black text-black uppercase tracking-widest flex items-center gap-3">
                                <span className="w-6 h-6 rounded-lg bg-black text-white flex items-center justify-center text-[9px] shrink-0">2.4</span> 
                                Professional Conduct
                            </h3>
                            <div className="pl-9">
                                <p className="text-[13px] leading-relaxed font-medium">Participants are expected to maintain high professional standards, including respectful communication and timely submission. Deadlines are mandatory.</p>
                            </div>
                        </section>

                        <section className="space-y-3">
                            <h3 className="text-[11px] font-black text-black uppercase tracking-widest flex items-center gap-3">
                                <span className="w-6 h-6 rounded-lg bg-black text-white flex items-center justify-center text-[9px] shrink-0">2.5</span> 
                                Certification Eligibility
                            </h3>
                            <div className="pl-9">
                                <p className="text-[13px] leading-relaxed font-medium">Certification will only be granted if all tasks are completed successfully and performance meets the evaluation criteria.</p>
                            </div>
                        </section>

                        <div className={`p-8 rounded-[2rem] border transition-all mt-10 ${isChecked ? 'bg-emerald-50 border-emerald-100 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                            <div className="flex items-center gap-5">
                                <input 
                                    type="checkbox" 
                                    id="modalCheck" 
                                    checked={isChecked}
                                    onChange={(e) => setIsChecked(e.target.checked)}
                                    className="w-5 h-5 accent-black rounded-lg cursor-pointer shrink-0"
                                />
                                <label htmlFor="modalCheck" className="text-[11px] font-black text-black uppercase tracking-tight leading-relaxed cursor-pointer select-none">
                                    "I have read, understood, and agree to the terms of enrollment and program policies."
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex gap-4 shrink-0">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-4 rounded-2xl border border-gray-200 text-[11px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-sm"
                    >
                        Cancel
                    </button>
                    <button 
                        disabled={!isChecked}
                        onClick={() => { onAccept(); onClose(); }}
                        className={`flex-1 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl transition-all disabled:opacity-20 disabled:grayscale ${accepted ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-black text-white shadow-black/20 hover:scale-[1.03] active:scale-[0.97]'}`}
                    >
                        {accepted ? 'Terms Accepted' : 'Save & Agree'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function FileUploadField({ label, uploaded, onChange, accept, icon: Icon = Upload }) {
    return (
        <div className={`p-4 rounded-xl border-2 border-dashed transition-all ${uploaded ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
            <label className="cursor-pointer block">
                <div className="flex flex-col items-center gap-2">
                    {uploaded ? (
                        <div className="bg-green-500 text-white p-1 rounded-full">
                            <Check className="w-3 h-3" />
                        </div>
                    ) : (
                        <div className="bg-black/5 p-2 rounded-xl text-black">
                            <Icon className="w-4 h-4" />
                        </div>
                    )}
                    <span className="text-[10px] font-black uppercase text-center tracking-tight">{label}</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase">{uploaded ? 'Change file' : 'Click to upload'}</span>
                </div>
                <input type="file" className="hidden" onChange={onChange} accept={accept} />
            </label>
        </div>
    );
}
