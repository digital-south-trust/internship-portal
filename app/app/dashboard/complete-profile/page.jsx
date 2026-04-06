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
    const [paymentStatus, setPaymentStatus] = useState('idle'); // 'idle', 'success', 'failed'

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
            '2 Months': 4700,
            '3 Months': 7050, // Pro-rated or default for 3? User said 4m-9400. 
            '4 Months': 9400,
            '6 Months': 14000
        };
        const base = costs[formData.duration] || 4700;
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
                        toast.success("Payment Successful!");
                        setPaymentStatus('success');
                        localStorage.removeItem(`profile_form_${userData.email}`);
                        localStorage.removeItem(`profile_step_${userData.email}`);
                        setFormData(prev => ({ ...prev, isPaid: true }));
                        
                        setTimeout(() => { setShowSplash(true); }, 1000);
                        setTimeout(() => { router.push("/dashboard"); }, 5000);
                    } else {
                        setPaymentStatus('failed');
                        toast.error("Payment verification failed.");
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
            <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center p-6 text-center overflow-hidden font-sans">
                {/* Modern Minimal Background Detail */}
                <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)", backgroundSize: '40px 40px' }}></div>
                
                <div className="relative z-10 w-full max-w-4xl space-y-4 animate-in fade-in duration-1000">
                    <div className="h-64 flex items-center justify-center">
                        <ParticleTextEffect words={["DIGITAL SOUTH", "INTERNSHIP", "WELCOME"]} />
                    </div>
                    
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-3 bg-white/5 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.5em] text-gray-400 border border-white/10 mb-4 backdrop-blur-md">
                            Protocol Activated
                        </div>
                        <p className="text-gray-500 text-sm font-medium tracking-widest uppercase opacity-70 max-w-md mx-auto">
                            Secure Onboarding Complete. <br />Initializing Developer Environment...
                        </p>
                    </div>

                    <div className="pt-12 flex flex-col items-center gap-6">
                        <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <div className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-[loading_4s_ease-in-out_forwards]" />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Directing to Workspace</p>
                        </div>
                    </div>
                </div>
                
                <style jsx>{`
                    @keyframes loading {
                        0% { width: 0% }
                        100% { width: 100% }
                    }
                `}</style>
            </div>
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
            
            <div className="w-full max-w-xl bg-white/95 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-white/40 overflow-hidden relative z-10 animate-in fade-in zoom-in duration-500">
                {/* Progress Bar */}
                <div className="h-2 w-full bg-black/5">
                    <div
                        className="h-full bg-black transition-all duration-700 ease-out"
                        style={{ width: `${(step / 4) * 100}%` }}
                    ></div>
                </div>

                <div className="p-10 md:p-14">
                    <header className="mb-6 text-center">
                        <h1 className="text-2xl font-black text-black mb-1 uppercase tracking-tight">Complete Your Profile</h1>
                        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Please provide the necessary details to finalize your onboarding.</p>
                    </header>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {step === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2">
                                            <Phone className="w-2.5 h-2.5" /> Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            required
                                            readOnly={!!userData.phone}
                                            placeholder="+91 00000 00000"
                                            className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all ${userData.phone ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2">
                                            <CalendarIcon className="w-2.5 h-2.5" /> Date of Birth
                                        </label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-left text-sm font-bold bg-white hover:border-black transition-all flex items-center justify-between"
                                                >
                                                    {formData.dob ? format(new Date(formData.dob), 'PPP') : <span className="text-gray-400 font-normal">Pick a date</span>}
                                                    <CalendarIcon className="w-3 h-3 text-gray-400" />
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={formData.dob ? new Date(formData.dob) : undefined}
                                                    onSelect={(date) => {
                                                        if (date) {
                                                            setFormData(prev => ({ ...prev, dob: format(date, 'yyyy-MM-dd') }));
                                                        }
                                                    }}
                                                    alwaysOnTop={true}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-black uppercase tracking-widest">Gender</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['Male', 'Female', 'Other'].map(g => (
                                            <button
                                                key={g}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, gender: g }))}
                                                className={`py-3 rounded-xl border font-medium transition-all ${formData.gender === g ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200'}`}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2">
                                        <GraduationCap className="w-3 h-3" /> Highest Qualification
                                    </label>
                                    <input
                                        type="text"
                                        name="educationQualification"
                                        value={formData.educationQualification}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g. Bachelor of Engineering"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-black uppercase tracking-widest">Course / Branch Name</label>
                                    <input
                                        type="text"
                                        name="courseName"
                                        value={formData.courseName}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g. Computer Science and Engineering"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2">
                                        <Building className="w-3 h-3" /> College / Institution Name
                                    </label>
                                    <input
                                        type="text"
                                        name="collegeName"
                                        value={formData.collegeName}
                                        onChange={handleChange}
                                        required
                                        placeholder="Full name of your institution"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2">
                                        <Briefcase className="w-3 h-3" /> Working Details (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        name="workingDetails"
                                        value={formData.workingDetails}
                                        onChange={handleChange}
                                        placeholder="Current job or experience if any"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2">
                                        <Clock className="w-3 h-3" /> Internship Duration
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { label: '2 Months', fee: '₹4,700' },
                                            { label: '4 Months', fee: '₹9,400' },
                                            { label: '6 Months', fee: '₹14,000' }
                                        ].map(d => (
                                            <button
                                                key={d.label}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, duration: d.label }))}
                                                className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-2 group
                                                ${formData.duration === d.label ? 'bg-black border-black text-white shadow-xl scale-105' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'}`}
                                            >
                                                <Clock className={`w-6 h-6 ${formData.duration === d.label ? 'text-[#ccff00]' : 'text-gray-300 group-hover:text-black'}`} />
                                                <div className="text-center">
                                                    <p className="text-xs font-black uppercase tracking-widest">{d.label}</p>
                                                    <p className={`text-[9px] font-bold ${formData.duration === d.label ? 'text-gray-400' : 'text-gray-300'}`}>Total Program Fee: {d.fee}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2">
                                        <ShieldCheck className="w-3 h-3" /> Aadhaar Number
                                    </label>
                                    <input
                                        type="text"
                                        name="aadhaarNumber"
                                        value={formData.aadhaarNumber}
                                        onChange={handleChange}
                                        required
                                        maxLength={12}
                                        placeholder="1234 5678 9012"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FileUploadField
                                        label="Passport Size Photo"
                                        uploaded={!!formData.passportPhoto}
                                        onChange={(e) => handleFileUpload(e, 'passportPhoto')}
                                        accept="image/*"
                                    />
                                    <FileUploadField
                                        label="Aadhaar Card Copy"
                                        uploaded={!!formData.aadhaarCard}
                                        onChange={(e) => handleFileUpload(e, 'aadhaarCard')}
                                        accept=".pdf,image/*"
                                    />
                                </div>

                                <FileUploadField
                                    label="Professional Resume (PDF)"
                                    uploaded={!!formData.resumeDocument}
                                    onChange={(e) => handleFileUpload(e, 'resumeDocument')}
                                    accept=".pdf"
                                    icon={FileText}
                                />
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-8">
                                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                    <CreditCard className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold uppercase tracking-tight">Onboarding Payment</h3>
                                <p className="text-[11px] text-gray-500 uppercase tracking-widest font-bold">
                                    Finalize your enrollment by paying the verification fee.
                                </p>

                                <div className="space-y-4">
                                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex items-center justify-between">
                                        <div className="text-left">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Total Enrollment Fee</p>
                                            <p className={`text-2xl font-black ${formData.appliedReferral ? 'text-gray-300 line-through text-sm' : 'text-gray-900'}`}>
                                                ₹{formData.duration === '2 Months' ? '4,700' : formData.duration === '4 Months' ? '9,400' : formData.duration === '6 Months' ? '14,000' : '4,700'}.00
                                            </p>
                                            {formData.appliedReferral && <p className="text-2xl font-black text-black">₹{getAmount()}.00</p>}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Duration</p>
                                            <p className="text-xs font-black uppercase text-black italic">{formData.duration}</p>
                                        </div>
                                    </div>

                                    {!formData.appliedReferral ? (
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                placeholder="Have a Referral Code?" 
                                                value={formData.referralCode}
                                                onChange={(e) => setFormData(prev => ({ ...prev, referralCode: e.target.value.toUpperCase() }))}
                                                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-blue-300 transition-all"
                                            />
                                            <button 
                                                type="button" 
                                                onClick={handleApplyReferral}
                                                className="px-6 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="bg-lime-50 border border-lime-100 p-4 rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Check className="w-4 h-4 text-lime-600" />
                                                <span className="text-[10px] font-black text-lime-700 uppercase tracking-widest">Code Applied: {formData.appliedReferral.referralCode}</span>
                                            </div>
                                            <button 
                                                onClick={() => setFormData(prev => ({ ...prev, appliedReferral: null, referralCode: "" }))}
                                                className="text-[9px] font-black text-lime-600 uppercase underline"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={paymentStatus === 'success' ? () => setShowSplash(true) : handlePayment}
                                    disabled={loading}
                                    className={`w-full font-black py-4 rounded-xl shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 ${
                                        paymentStatus === 'success' 
                                        ? 'bg-emerald-500 text-white shadow-emerald-200' 
                                        : paymentStatus === 'failed'
                                        ? 'bg-red-600 text-white shadow-red-200'
                                        : 'bg-black text-white hover:bg-neutral-800 shadow-gray-200'
                                    }`}
                                >
                                    {loading ? (
                                        "Processing..."
                                    ) : paymentStatus === 'success' ? (
                                        <>Start Your Journey <ArrowRight className="w-5 h-5" /></>
                                    ) : paymentStatus === 'failed' ? (
                                        <>Try Again <ArrowRight className="w-5 h-5" /></>
                                    ) : (
                                        <>Pay & Start Journey <ArrowRight className="w-5 h-5" /></>
                                    )}
                                </button>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Secure transaction powered by Razorpay</p>
                            </div>
                        )}

                        <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                            {(step > 1 && step < 4) ? (
                                <button
                                    type="button"
                                    onClick={() => setStep(step - 1)}
                                    className="flex items-center gap-2 text-gray-500 font-bold hover:text-black transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5" /> Back
                                </button>
                            ) : (
                                <div></div>
                            )}

                            {step < 4 ? (
                                step < 3 ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep(step + 1);
                                        }}
                                        className="bg-black text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-neutral-800 transition-all shadow-md"
                                    >
                                        Next Step <ChevronRight className="w-5 h-5" />
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-black text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:bg-neutral-800 transition-all shadow-lg shadow-gray-200"
                                    >
                                        {loading ? "Syncing..." : "Confirm & Proceed"} <ChevronRight className="w-4 h-4" />
                                    </button>
                                )
                            ) : null}
                        </div>
                        <Script src="https://checkout.razorpay.com/v1/checkout.js" />
                    </form>
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
