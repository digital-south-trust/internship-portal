"use client";

import { useState, useEffect, useRef } from "react";
import { 
    Settings, ShieldCheck, Mail, Phone, Calendar, 
    MapPin, Lock, Camera, Laptop, Smile, FileText ,
    Clock, RefreshCw, X, Upload, Briefcase ,XCircle 
} from "lucide-react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const dicebear = (seed) => `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent`;

export default function StudentSettingsPage() {
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [isCancelling, setIsCancelling] = useState(false);
    const [uploadingAadhaar, setUploadingAadhaar] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

    // Avatar / Photo States
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const [avatarTab, setAvatarTab] = useState('upload'); // upload, camera, avatar
    const [uploadPreview, setUploadPreview] = useState(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraSnapshot, setCameraSnapshot] = useState(null);
    const [chosenSeed, setChosenSeed] = useState('');

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        const fetchUser = async () => {
            const email = localStorage.getItem("userEmail");
            if (!email) return;
            try {
                const res = await fetch(`/api/user/me?email=${email}`);
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                    setChosenSeed(data.avatarSeed || '');
                }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchUser();
    }, []);

    const handleFileUpload = async (type, fileOrSeed) => {
        const loadingToast = toast.loading('Synchronizing Identity...');
        try {
            let url = fileOrSeed;
            if (type === 'profilePicture') {
                const formData = new FormData();
                formData.append('file', fileOrSeed);
                formData.append('upload_preset', 'ml_default'); 
                const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/dnd66v88p/image/upload`, {
                    method: 'POST',
                    body: formData
                });
                const cloudData = await cloudRes.json();
                url = cloudData.secure_url;
            }

            const res = await fetch('/api/user/me', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, [type]: url })
            });
            if (res.ok) {
                setUser(prev => ({ ...prev, [type]: url }));
                toast.success('Identity Updated successfully!', { id: loadingToast });
                if (type === 'profilePicture') closePickerClean();
            } else { toast.error('Failed to update profile.', { id: loadingToast }); }
        } catch (error) { toast.error('Processing error.', { id: loadingToast }); }
    };

    const processSnapshot = async (type, dataUrl) => {
        const loadingToast = toast.loading('Processing Camera Capture...');
        try {
            const formData = new FormData();
            formData.append('file', dataUrl);
            formData.append('upload_preset', 'ml_default');
            const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/dnd66v88p/image/upload`, {
                method: 'POST',
                body: formData
            });
            const cloudData = await cloudRes.json();
            const url = cloudData.secure_url;

            const res = await fetch('/api/user/me', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, [type]: url })
            });
            if (res.ok) {
                setUser(prev => ({ ...prev, [type]: url }));
                toast.success('Camera capture saved!', { id: loadingToast });
                closePickerClean();
            } else { toast.error('Failed to update profile.', { id: loadingToast }); }
        } catch (error) { toast.error('Processing error.', { id: loadingToast }); }
    };

    const closePickerClean = () => { stopCamera(); setShowAvatarPicker(false); setUploadPreview(null); setCameraSnapshot(null); };
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
            setCameraActive(true);
        } catch { toast.error("Camera access denied."); }
    };
    const stopCamera = () => { if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; } setCameraActive(false); };
    const takeSnapshot = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        setCameraSnapshot(canvas.toDataURL('image/jpeg', 0.85));
        stopCamera();
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) { toast.error("Passwords do not match!"); return; }
        setIsSubmittingPassword(true);
        try {
            const res = await fetch('/api/user/me', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, password: passwords.newPassword })
            });
            if (res.ok) { toast.success("Password updated!"); setIsPasswordModalOpen(false); setPasswords({ newPassword: '', confirmPassword: '' }); }
            else { toast.error("Failed to update password"); }
        } catch { toast.error("Error updating password"); }
        finally { setIsSubmittingPassword(false); }
    };

    if (loading) return (
        <div className="animate-in fade-in duration-500">
            <div className="px-8 pt-5 space-y-8 animate-pulse">
                <div className="bg-white rounded-[3rem] p-12 border border-gray-100 shadow-sm">
                    <div className="flex flex-col md:flex-row items-center gap-10">
                        <div className="w-40 h-40 rounded-[2.5rem] bg-gray-100 shrink-0" />
                        <div className="flex-1 space-y-4 w-full">
                            <div className="h-10 bg-gray-200 rounded-2xl w-3/4" />
                            <div className="flex gap-4">
                                <div className="h-8 bg-gray-100 rounded-xl w-24" />
                                <div className="h-8 bg-gray-100 rounded-xl w-40" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-8">
                    <div className="h-8 bg-gray-200 rounded-xl w-48" />
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-32 bg-gray-50 rounded-[2.5rem] border border-gray-100" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
    if (!user) return null;

    const handleCancelInternship = async () => {
        if (!cancelReason.trim()) { toast.error("Please provide a reason."); return; }
        setIsCancelling(true);
        try {
            const res = await fetch('/api/user/me', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, status: 'Cancelled', cancelReason })
            });
            if (res.ok) {
                toast.success("Internship Cancelled. Access Revoked.");
                setTimeout(() => {
                    localStorage.clear();
                    document.cookie = "userRole=; max-age=0; path=/";
                    window.location.href = "/login";
                }, 2000);
            } else { toast.error("Failed to cancel internship."); }
        } catch { toast.error("Error during cancellation."); }
        finally { setIsCancelling(false); }
    };

    const handleAadhaarUpload = async (file) => {
        if (!file) return;
        setUploadingAadhaar(true);
        const loadingToast = toast.loading('Uploading tactical documentation...');
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'ml_default');

        try {
            const cloudinaryRes = await fetch('https://api.cloudinary.com/v1_1/duv98m6p3/image/upload', {
                method: 'POST',
                body: formData
            });
            const imageData = await cloudinaryRes.json();
            
            if (imageData.secure_url) {
                const res = await fetch('/api/user/me', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: user.email, aadhaarNumber: "DOC-PENDING-VBR", aadhaarCardUrl: imageData.secure_url })
                });
                
                if (res.ok) {
                    toast.success('Aadhaar Document Synchronized.', { id: loadingToast });
                    setUser({ ...user, aadhaarCardUrl: imageData.secure_url });
                } else { toast.error('Metadata update failed.', { id: loadingToast }); }
            } else { toast.error('Cloudinary transmission failed.', { id: loadingToast }); }
        } catch { toast.error('Transmission error.', { id: loadingToast }); }
        finally { setUploadingAadhaar(false); }
    };

    const avatarSrc = (user.profilePicture && user.profilePicture.length > 10) ? user.profilePicture : dicebear(chosenSeed || user.avatarSeed || "User");

    return (
        <div className="-mx-8 -mt-8 flex flex-col min-h-screen bg-transparent pb-32 pt-5">

            <div className="px-8 space-y-8">
                {/* Unified Security & Identity Hub (Full Width bg-white) */}
                <div className="bg-white rounded-[3rem] p-12 border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        {/* Profile Info Segment (7/12) */}
                        <div className="lg:col-span-7 flex flex-col md:flex-row items-center gap-10">
                            <div className="relative shrink-0 group">
                                <div className="w-40 h-40 rounded-[2.5rem] bg-gray-50 border border-gray-100 overflow-hidden shadow-inner flex items-center justify-center ring-4 ring-gray-50/50">
                                     <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                                </div>
                                <button 
                                    onClick={() => setShowAvatarPicker(true)}
                                    className="absolute -bottom-2 -right-2 w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all border-4 border-white z-10"
                                    title="Update Identity Picture"
                                >
                                    <Camera className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 space-y-4 text-center md:text-left">
                                <div>
                                    <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase mb-3 leading-none ">{user.fullName}</h2>
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4">
                                         <span className="px-4 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-black/10">{user.track}</span>
                                         <span className="px-4 py-2 bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-gray-100">{user.email}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Security Actions Segment (5/12) */}
                        <div className="lg:col-span-5 h-full flex flex-col justify-center gap-4 bg-gray-50/50 p-8 rounded-[3rem] border border-gray-100/50">

                             <div className="grid grid-cols-2 gap-3">
                                 <button 
                                     onClick={() => setIsPasswordModalOpen(true)}
                                     className="bg-white text-black py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-sm border border-gray-100 hover:shadow-md hover:scale-[1.02] active:scale-98 transition-all"
                                 >
                                     <Lock className="w-4 h-4" /> password
                                 </button>
                                 <div className="relative">
                                     <input 
                                         type="file" 
                                         id="aadhaar-upload-intern" 
                                         className="hidden" 
                                         onChange={e => e.target.files?.[0] && handleAadhaarUpload(e.target.files[0])} 
                                     />
                                     <label 
                                         htmlFor="aadhaar-upload-intern"
                                         className={`w-full py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-sm border border-gray-100 hover:shadow-md hover:scale-[1.02] active:scale-98 transition-all cursor-pointer ${uploadingAadhaar ? 'opacity-50 pointer-events-none' : ''}`}
                                     >
                                         {uploadingAadhaar ? <RefreshCw className="w-4 h-4 animate-spin text-black" /> : <FileText className="w-4 h-4 text-black" />}
                                         Aadhaar
                                     </label>
                                 </div>
                             </div>

                             <button 
                                 onClick={() => setShowCancelModal(true)}
                                 className="w-full bg-red-500/5 text-red-500 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 border border-red-500/10 hover:bg-red-500 hover:text-white hover:border-transparent transition-all shadow-sm"
                             >
                                 <XCircle className="w-4 h-4" /> Cancel Internship
                             </button>
                        </div>
                    </div>
                </div>

                {/* Internship Overview: Full Width below */}
                <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                        <Laptop className="w-64 h-64 -mr-20 -mt-20" />
                    </div>
                    <div className="flex items-center gap-5 mb-12 relative z-10">
                         <div className="w-14 h-14 bg-black text-white rounded-[1.25rem] flex items-center justify-center shadow-2xl">
                             <Laptop className="w-7 h-7" />
                         </div>
                         <div>
                             <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase leading-none mb-1">Internship Overview</h3>
                             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-0.5">Tactical Deployment Assessment & Record</p>
                         </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                        {[
                            { icon: Mail, label: "Official Email", value: user.email },
                            { icon: Phone, label: "Core Contact", value: user.phone || "Not Provided" },
                            { icon: Calendar, label: "Birth Record", value: (user.dob || "Not Provided") + (user.dob ? ` (${Math.floor((new Date() - new Date(user.dob)) / 31557600000)}Y)` : "") },
                            { icon: MapPin, label: "Registered Node", value: user.address || "Not Provided" },
                            { icon: Clock, label: "Programme Scale", value: user.duration || "N/A" },
                            { icon: Briefcase, label: "Operational Track", value: user.track || "N/A" }
                        ].map(({ icon: Icon, label, value }) => (
                            <div key={label} className="p-7 bg-gray-50/50 border border-gray-100 rounded-[2.5rem] group hover:bg-white hover:shadow-2xl hover:border-transparent transition-all">
                                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-black rounded-full" />
                                    <Icon className="w-3.5 h-3.5" /> {label}
                                </div>
                                <p className="text-[13px] font-black text-gray-900 uppercase tracking-tight leading-relaxed">{value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Password Modal */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsPasswordModalOpen(false)} />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="relative bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl"
                    >
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-8">Update Protocol</h2>
                        <form onSubmit={handlePasswordUpdate} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">New Alignment Key</label>
                                <input type="password" required className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl" value={passwords.newPassword} onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm Realignment</label>
                                <input type="password" required className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl" value={passwords.confirmPassword} onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })} />
                            </div>
                            <button type="submit" disabled={isSubmittingPassword} className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3">
                                {isSubmittingPassword ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Execute Reset'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Avatar Picker Modal */}
            {showAvatarPicker && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={closePickerClean} />
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
                        className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden p-10"
                    >
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Profile Picker</h3>
                            <button onClick={closePickerClean} className="w-10 h-10 border rounded-xl flex items-center justify-center hover:text-red-500"><X className="w-5 h-5" /></button>
                        </div>
                        
                        <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100 mb-10">
                            {[
                                { id: 'upload', label: 'Upload', icon: Upload },
                                { id: 'camera', label: 'Camera', icon: Camera },
                                { id: 'avatar', label: 'Avatar Character', icon: Smile }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => { setAvatarTab(tab.id); if (tab.id !== 'camera') stopCamera(); }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${avatarTab === tab.id ? 'bg-black text-white shadow-xl' : 'text-gray-400'}`}
                                >
                                    <tab.icon className="w-4 h-4" /> {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="min-h-[300px] flex flex-col items-center justify-center">
                            {avatarTab === 'upload' && (
                                <div className="w-full flex flex-col items-center">
                                    <div className="w-full p-12 border-2 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center hover:bg-gray-50 transition-colors relative">
                                        <Upload className="w-12 h-12 text-gray-300 mb-4" />
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select Node Asset</p>
                                        <input type="file" onChange={e => handleFileUpload('profilePicture', e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    </div>
                                </div>
                            )}
                            
                            {avatarTab === 'camera' && (
                                <div className="w-full flex flex-col items-center">
                                    {!cameraActive && !cameraSnapshot && (
                                        <button onClick={startCamera} className="px-10 py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px]">Initialize Capture Device</button>
                                    )}
                                    {cameraActive && (
                                        <div className="w-full relative rounded-3xl overflow-hidden bg-black border border-gray-800">
                                            <video ref={videoRef} autoPlay playsInline className="w-full h-80 object-cover" />
                                            <button onClick={takeSnapshot} className="absolute bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full p-1 border-4 border-black/20"><div className="w-full h-full bg-black rounded-full" /></button>
                                        </div>
                                    )}
                                    {cameraSnapshot && (
                                        <div className="flex flex-col items-center gap-6">
                                            <img src={cameraSnapshot} className="w-64 h-64 rounded-full border-4 border-white shadow-2xl object-cover" alt="Snapshot" />
                                            <div className="flex gap-4">
                                                <button onClick={() => setCameraSnapshot(null)} className="px-8 py-3 bg-gray-50 text-gray-400 rounded-xl font-bold text-xs">Reset</button>
                                                <button onClick={() => processSnapshot('profilePicture', cameraSnapshot)} className="px-8 py-3 bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest">Execute Uplink</button>
                                            </div>
                                        </div>
                                    )}
                                    <canvas ref={canvasRef} className="hidden" />
                                </div>
                            )}

                            {avatarTab === 'avatar' && (
                                <div className="flex flex-col items-center gap-8 w-full">
                                    <div className="w-32 h-32 rounded-[2rem] border-4 border-white shadow-2xl bg-gray-50 overflow-hidden">
                                        <img src={dicebear(chosenSeed || user.avatarSeed || "User")} className="w-full h-full scale-110" alt="Dicebear" />
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto pr-2 w-full">
                                        <div className="grid grid-cols-4 gap-3">
                                            {["Felix", "Casper", "Sasha", "Bear", "Tigger", "Oliver", "Zephyr", "Nova", "Cosmo", "Pixel", "Cipher", "Echo", "Vega", "Blaze", "Orion", "Lyra", "Atlas", "Iris", "Luna", "Kai", "Milo", "Jade", "Remy", "Scout"].map(s => (
                                                <button 
                                                    key={s} 
                                                    onClick={() => setChosenSeed(s)} 
                                                    className={`p-2 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${chosenSeed === s ? 'border-black bg-gray-50' : 'border-transparent bg-gray-50/50'}`}
                                                >
                                                    <img src={dicebear(s)} alt={s} className="w-full aspect-square" />
                                                    <span className="text-[8px] font-black uppercase text-gray-400">{s}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <button onClick={() => handleFileUpload('avatarSeed', chosenSeed)} className="w-full py-5 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl">Save Avatar Character</button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
            {/* Cancellation Reason Modal */}
            <AnimatePresence>
                {showCancelModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowCancelModal(false)} />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="relative bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl"
                        >
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">Cancel Internship</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8 leading-relaxed">
                                CRITICAL: Access revocation protocol. Please define reason for early termination. No stipend will be issued.
                            </p>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Cancellation Reason</label>
                                    <textarea 
                                        rows={4}
                                        required 
                                        placeholder="Define reason for leaving..."
                                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5 resize-none" 
                                        value={cancelReason} 
                                        onChange={e => setCancelReason(e.target.value)} 
                                    />
                                </div>
                                <button
                                    onClick={handleCancelInternship}
                                    disabled={isCancelling}
                                    className="w-full py-5 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-red-600 transition-all flex items-center justify-center gap-3"
                                >
                                    {isCancelling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                    Confirm Termination
                                </button>
                                <button
                                    onClick={() => setShowCancelModal(false)}
                                    className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
                                >
                                    Abort Process
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
