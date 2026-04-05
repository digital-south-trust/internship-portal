"use client";

import { useState, useEffect, useRef } from "react";
import { Save, Lock, Fingerprint,Users ,Clock, Shield, RefreshCw, XCircle, Mail, Phone, Calendar, Smile, Upload, Camera, Image as ImageIcon, FileText } from "lucide-react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const AVATAR_SEEDS = ["Zephyr", "Nova", "Cosmo", "Pixel", "Cipher", "Echo", "Vega", "Blaze", "Orion", "Lyra", "Atlas", "Iris"];
const dicebear = (seed) => `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent`;

export default function AdminSettingsPage() {
    const [email, setEmail] = useState("");
    const [displayName, setDisplayName] = useState("Admin");
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [reenterPassword, setReenterPassword] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [userDetails, setUserDetails] = useState(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    
    // Profile Edit States
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [tempDetails, setTempDetails] = useState({});
    const [savingDetails, setSavingDetails] = useState(false);

    // Avatar & Photo States
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const [chosenSeed, setChosenSeed] = useState("Admin");
    const [savingAvatar, setSavingAvatar] = useState(false);
    const [pickerTab, setPickerTab] = useState('avatar');
    
    // Photo Upload & Camera States
    const [uploadPreview, setUploadPreview] = useState(null);
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraSnapshot, setCameraSnapshot] = useState(null);

    const closePickerClean = () => { 
        stopCamera(); 
        setShowAvatarPicker(false); 
        setUploadPreview(null); 
        setCameraSnapshot(null); 
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
            setCameraActive(true);
        } catch { toast.error("Camera access denied."); }
    };

    const stopCamera = () => { 
        if (streamRef.current) { 
            streamRef.current.getTracks().forEach(t => t.stop()); 
            streamRef.current = null; 
        } 
        setCameraActive(false); 
    };

    const takeSnapshot = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        setCameraSnapshot(canvas.toDataURL('image/jpeg', 0.85));
        stopCamera();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return; }
        const reader = new FileReader();
        reader.onload = (ev) => setUploadPreview(ev.target.result);
        reader.readAsDataURL(file);
    };

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (typeof window !== "undefined") {
                const userEmail = localStorage.getItem("userEmail");
                if (userEmail) {
                    try {
                        const res = await fetch(`/api/user/me?email=${userEmail}`);
                        if (res.ok) {
                            const data = await res.json();
                            setUserDetails(data);
                            setEmail(data.email);
                            setDisplayName(data.fullName || data.name);
                            setChosenSeed(data.avatarSeed || data.fullName?.split(' ')[0] || "Admin");
                            setTempDetails(data);
                        }
                    } catch (error) {
                        console.error("Failed to fetch user profile", error);
                    }
                }
                setIsLoadingProfile(false);
            }
        };
        fetchUserProfile();
    }, []);

    const handleSavePassword = async () => {
        if (!oldPassword || !newPassword || !reenterPassword) {
            toast.error("Please fill all password fields.");
            return;
        }

        if (newPassword !== reenterPassword) {
            toast.error("New passwords do not match.");
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch("/api/admin/settings/password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, oldPassword, newPassword }),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || "Password updated successfully!");
                setOldPassword("");
                setNewPassword("");
                setReenterPassword("");
                setIsPasswordModalOpen(false);
            } else {
                toast.error(data.message || "Failed to update password.");
            }
        } catch (err) {
            toast.error("An error occurred while saving.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveAvatar = async (seed) => {
        setSavingAvatar(true);
        try {
            const res = await fetch('/api/user/me', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userDetails.email, avatarSeed: seed, profilePicture: '' })
            });
            if (res.ok) {
                setChosenSeed(seed);
                setUserDetails(prev => ({ ...prev, avatarSeed: seed, profilePicture: '' }));
                toast.success('Avatar updated!');
                closePickerClean();
            } else { toast.error('Failed to save avatar.'); }
        } catch { toast.error('Error saving avatar.'); }
        finally { setSavingAvatar(false); }
    };

    const handleSavePhoto = async (base64OrUrl) => {
        setSavingAvatar(true);
        try {
            let finalUrl = base64OrUrl;
            if (base64OrUrl.startsWith('data:')) {
                const blob = await (await fetch(base64OrUrl)).blob();
                const file = new File([blob], `${userDetails.fullName?.replace(/\s+/g, '_')}_profile.jpg`, { type: 'image/jpeg' });
                const formData = new FormData();
                formData.append('file', file);
                formData.append('type', 'profile');
                formData.append('email', userDetails.email);
                const upRes = await fetch('/api/upload', { method: 'POST', body: formData });
                if (upRes.ok) {
                    const { url } = await upRes.json();
                    finalUrl = url;
                }
            }
            const res = await fetch('/api/user/me', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userDetails.email, profilePicture: finalUrl, avatarSeed: '' })
            });
            if (res.ok) {
                setUserDetails(prev => ({ ...prev, profilePicture: finalUrl, avatarSeed: '' }));
                setChosenSeed(userDetails.fullName?.split(' ')[0] || 'Admin');
                toast.success('Profile photo updated!');
                closePickerClean();
            } else { toast.error('Failed to save photo.'); }
        } catch { toast.error('Error saving photo.'); }
        finally { setSavingAvatar(false); }
    };

    const handleSaveProfile = async () => {
        setSavingDetails(true);
        try {
            const res = await fetch('/api/user/me', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: userDetails.email, 
                    fullName: tempDetails.fullName,
                    phone: tempDetails.phone,
                    address: tempDetails.address,
                    dob: tempDetails.dob,
                    aadhaarNumber: tempDetails.aadhaarNumber
                })
            });
            if (res.ok) {
                const data = await res.json();
                setUserDetails(data.user);
                setIsEditingProfile(false);
                toast.success('Profile updated successfully!');
            } else { toast.error('Failed to update profile.'); }
        } catch { toast.error('Error saving profile.'); }
        finally { setSavingDetails(false); }
    };

    const handleAadhaarUpload = async (file) => {
        const loadingToast = toast.loading("Uploading Aadhaar...");
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', 'aadhaar');
            formData.append('email', userDetails.email);
            const upRes = await fetch('/api/upload', { method: 'POST', body: formData });
            if (upRes.ok) {
                const { url } = await upRes.json();
                const res = await fetch('/api/user/me', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: userDetails.email, aadhaarCard: url })
                });
                if (res.ok) {
                    setUserDetails(prev => ({ ...prev, aadhaarCard: url }));
                    toast.success('Aadhaar uploaded!', { id: loadingToast });
                } else { toast.error('Failed to update.', { id: loadingToast }); }
            } else { toast.error('Upload failed.', { id: loadingToast }); }
        } catch { toast.error('Processing error.', { id: loadingToast }); }
    };

    const calculateAge = (dob) => {
        if (!dob) return 'N/A';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-IN', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
    };

    const avatarSrc = (userDetails?.profilePicture && userDetails?.profilePicture.length > 10) 
        ? userDetails.profilePicture 
        : dicebear(chosenSeed || userDetails?.avatarSeed || "Admin");

    return (
        <div className="-mx-8 -mt-8 flex flex-col min-h-screen bg-transparent">

            {/* Profile Metrics Row */}
            <div className="relative w-full bg-white border-b border-gray-100 overflow-hidden shadow-sm rounded-[2.5rem] mb-10">
                <div 
                    className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                    style={{ backgroundImage: 'url(/background4.svg)', backgroundSize: '150px' }}
                />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-center md:items-start md:justify-start px-12 py-12 gap-8">
                    {/* Medium Avatar (Resized) */}
                    <div className="relative group shrink-0">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-white shadow-xl border-4 border-white p-1 overflow-hidden ring-1 ring-black/5 transition-all group-hover:shadow-2xl">
                            <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover rounded-[2rem] animate-fade-in" />
                        </div>
                        <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowAvatarPicker(true)}
                            className="absolute -bottom-1 -right-1 w-10 h-10 bg-black text-white rounded-2xl flex items-center justify-center shadow-xl z-20 group-hover:bg-neutral-800 transition-colors"
                        >
                            <Camera className="w-4 h-4" />
                        </motion.button>
                    </div>

                    {/* Metadata Section */}
                    <div className="flex-1 space-y-4 text-center md:text-left pt-2">
                        <div className="space-y-1">
                             <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                 <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">
                                     {userDetails?.fullName || userDetails?.name || displayName}
                                 </h1>
                             </div>
                             <div className="flex items-center justify-center md:justify-start gap-2 text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                                 <Mail className="w-3.5 h-3.5" />
                                 {userDetails?.email || email}
                             </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-gray-50">
                             {[
                                 { label: "Track", value: userDetails?.track || 'System Admin', icon: Shield },
                                 { label: "Phone", value: userDetails?.phone || 'Not Provided', icon: Phone },
                                 { label: "Duration", value: userDetails?.duration || 'Permanent', icon: Clock },
                                 { label: "Partner ID", value: userDetails?.admissionId || 'ADMIN-CORP-01', icon: Fingerprint }
                             ].map((stat, i) => (
                                 <div key={i} className="space-y-1">
                                     <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
                                     <p className="font-black text-gray-900 text-xs uppercase tracking-tight">{stat.value}</p>
                                 </div>
                             ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Content Area */}
            <div className="max-w-6xl px-12 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-7 gap-10 items-start">
                    {/* Left: Admin Details (4/7 width) */}
                    <div className="lg:col-span-4 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
                        <div className="relative z-10">
                             <div className="flex justify-between items-center mb-10">
                                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-3">
                                    <Users className="w-5 h-5 text-black" /> {isEditingProfile ? 'Update Profile' : 'Admin Profile Details'}
                                </h2>
                                <button 
                                    onClick={() => {
                                        if(isEditingProfile) handleSaveProfile();
                                        else setIsEditingProfile(true);
                                    }}
                                    disabled={savingDetails}
                                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all scale-105 active:scale-95 shadow-sm border ${isEditingProfile ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-900 border-gray-100 hover:bg-white'}`}
                                >
                                    {savingDetails ? 'Saving...' : isEditingProfile ? 'Save Changes' : 'Edit Profile'}
                                </button>
                             </div>

                             {!isEditingProfile ? (
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-8">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Full Name</p>
                                        <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">{userDetails?.fullName || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Date of Birth</p>
                                        <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">
                                            {formatDate(userDetails?.dob)}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Calculated Age</p>
                                        <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">{calculateAge(userDetails?.dob)} Years</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Primary Phone</p>
                                        <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">{userDetails?.phone || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Aadhaar Identity</p>
                                        <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">{userDetails?.aadhaarNumber || 'Not Linked'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Office Address</p>
                                        <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">{userDetails?.address || 'Corporate HQ, Digital South'}</p>
                                    </div>
                                    {userDetails?.aadhaarCard && (
                                        <div className="col-span-full">
                                            <a href={userDetails.aadhaarCard} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black text-gray-500 uppercase tracking-widest hover:bg-black hover:text-white transition-all">
                                                <FileText className="w-4 h-4" /> View Linked Aadhaar
                                            </a>
                                        </div>
                                    )}
                                </div>
                             ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5 min-w-0">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Identity Name</label>
                                        <input 
                                            type="text" 
                                            value={tempDetails.fullName || ''} 
                                            onChange={e => setTempDetails({...tempDetails, fullName: e.target.value})}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5" 
                                        />
                                    </div>
                                    <div className="space-y-1.5 min-w-0">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                                        <input 
                                            type="text" 
                                            value={tempDetails.phone || ''} 
                                            onChange={e => setTempDetails({...tempDetails, phone: e.target.value})}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5" 
                                        />
                                    </div>
                                    <div className="space-y-1.5 min-w-0">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Date of Birth</label>
                                        <input 
                                            type="date" 
                                            value={tempDetails.dob || ''} 
                                            onChange={e => setTempDetails({...tempDetails, dob: e.target.value})}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5" 
                                        />
                                    </div>
                                     <div className="space-y-1.5">
                                         <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">DOB / Age</p>
                                         <p className="text-sm font-bold text-gray-900 bg-gray-50/50 px-5 py-4 rounded-2xl border border-gray-100">
                                             {userDetails.dob || "Not Set"} 
                                             {userDetails.dob && ` (${Math.floor((new Date() - new Date(userDetails.dob)) / 31557600000)}Y)`}
                                         </p>
                                     </div>
                                     <div className="space-y-1.5">
                                         <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Aadhaar Card</p>
                                         <p className="text-sm font-bold text-gray-900 bg-gray-50/50 px-5 py-4 rounded-2xl border border-gray-100">{userDetails.aadhaarNumber || "Not Set"}</p>
                                     </div>
                                    <div className="space-y-1.5 min-w-0">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Aadhaar Number</label>
                                        <input 
                                            type="text" 
                                            value={tempDetails.aadhaarNumber || ''} 
                                            onChange={e => setTempDetails({...tempDetails, aadhaarNumber: e.target.value})}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5" 
                                        />
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Office / Residential Address</label>
                                        <textarea 
                                            rows={2}
                                            value={tempDetails.address || ''} 
                                            onChange={e => setTempDetails({...tempDetails, address: e.target.value})}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5 resize-none" 
                                        />
                                    </div>
                                    <div className="md:col-span-2 pt-2 flex gap-3">
                                        <input 
                                            type="file" 
                                            id="aadhaar-upload" 
                                            className="hidden" 
                                            onChange={e => e.target.files?.[0] && handleAadhaarUpload(e.target.files[0])} 
                                        />
                                        <label 
                                            htmlFor="aadhaar-upload"
                                            className="flex-1 py-4 bg-gray-50 border border-gray-100 border-dashed rounded-2xl text-[10px] font-black uppercase text-gray-400 tracking-widest text-center cursor-pointer hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Upload className="w-4 h-4" /> Upload Aadhaar Card
                                        </label>
                                        <button 
                                            onClick={() => setIsEditingProfile(false)}
                                            className="px-8 py-4 border border-gray-100 rounded-2xl text-[10px] font-black uppercase text-gray-400 tracking-widest hover:bg-gray-50 transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                             )}
                        </div>
                    </div>

                    <div className="lg:col-span-3 bg-black p-8 rounded-[2rem] shadow-2xl flex flex-col justify-between hover:shadow-black/20 transition-all group self-start">
                         <div>
                             <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                                 <Shield className="w-6 h-6" />
                             </div>
                             <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Security Protocol</h2>
                             <p className="text-gray-400 text-xs font-medium leading-relaxed">Institutional access and credential management vault.</p>
                         </div>
                         <div className="mt-8 flex flex-col gap-3">
                             <button
                                 onClick={() => setIsPasswordModalOpen(true)}
                                 className="px-6 py-4 bg-white text-black rounded-xl text-[10px] font-black tracking-widest uppercase hover:bg-gray-100 transition-all flex items-center justify-center gap-3 w-full border border-transparent"
                             >
                                 <Lock className="w-4 h-4" /> Reset Password
                             </button>
                         </div>
                    </div>
                </div>
            </div>

            {/* Avatar Picker Modal */}
            <AnimatePresence>
                {showAvatarPicker && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closePickerClean} className="absolute inset-0 bg-black/60 backdrop-blur-2xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="relative bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.4em] mb-1">Character Suite</p>
                                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Profile Picker</h3>
                                </div>
                                <button onClick={closePickerClean} className="p-3 bg-gray-50 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all"><XCircle className="w-5 h-5" /></button>
                            </div>

                            <div className="flex bg-gray-50 p-1.5 rounded-2xl border mb-8">
                                {[
                                    { id: 'avatar', label: 'Avatars', icon: Smile },
                                    { id: 'upload', label: 'Upload', icon: Upload },
                                    { id: 'camera', label: 'Camera', icon: Camera }
                                ].map(tab => (
                                    <button 
                                        key={tab.id} 
                                        onClick={() => { 
                                            setPickerTab(tab.id); 
                                            if (tab.id === 'camera') startCamera(); 
                                            else stopCamera(); 
                                        }} 
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${pickerTab === tab.id ? 'bg-white shadow-xl text-black' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        {!isLoadingProfile && tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="min-h-[200px]">
                                {pickerTab === 'avatar' && (
                                    <div className="grid grid-cols-4 gap-4">
                                        {AVATAR_SEEDS.map(seed => (
                                            <button 
                                                key={seed} 
                                                onClick={() => handleSaveAvatar(seed)} 
                                                disabled={savingAvatar} 
                                                className={`aspect-square p-2 bg-gray-50 rounded-2xl border-2 transition-all hover:scale-105 active:scale-95 ${chosenSeed === seed ? 'border-black' : 'border-transparent'}`}
                                            >
                                                <img src={dicebear(seed)} alt={seed} className="w-full h-full" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {pickerTab === 'upload' && (
                                    <div className="space-y-6 text-center">
                                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                        {uploadPreview ? (
                                            <div className="flex flex-col items-center gap-6">
                                                <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-gray-50 shadow-xl">
                                                    <img src={uploadPreview} alt="Preview" className="w-full h-full object-cover" />
                                                </div>
                                                <button onClick={() => handleSavePhoto(uploadPreview)} disabled={savingAvatar} className="w-full py-4 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg">
                                                    {savingAvatar ? 'Saving...' : 'Set as Profile'}
                                                </button>
                                            </div>
                                        ) : (
                                            <button onClick={() => fileInputRef.current.click()} className="w-full py-16 border-2 border-dashed border-gray-200 rounded-[2.5rem] hover:bg-gray-50 hover:border-black/20 transition-all flex flex-col items-center gap-4">
                                                <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center">
                                                    <Upload className="w-6 h-6 text-black/40" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Drop image or click to upload</span>
                                            </button>
                                        )}
                                    </div>
                                )}

                                {pickerTab === 'camera' && (
                                    <div className="space-y-6 text-center">
                                        <canvas ref={canvasRef} className="hidden" />
                                        {cameraSnapshot ? (
                                            <div className="flex flex-col items-center gap-6">
                                                <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-gray-50 shadow-xl">
                                                    <img src={cameraSnapshot} alt="Snapshot" className="w-full h-full object-cover" />
                                                </div>
                                                <button onClick={() => handleSavePhoto(cameraSnapshot)} disabled={savingAvatar} className="w-full py-4 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg">
                                                    {savingAvatar ? 'Saving...' : 'Set as Profile'}
                                                </button>
                                            </div>
                                        ) : cameraActive ? (
                                            <div className="flex flex-col items-center gap-6">
                                                <div className="w-full rounded-[2.5rem] bg-black overflow-hidden aspect-square border-4 border-gray-50 shadow-xl">
                                                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                                                </div>
                                                <button onClick={takeSnapshot} className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all">
                                                    <Camera className="w-7 h-7" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button onClick={startCamera} className="w-full py-20 border-2 border-dashed border-gray-200 rounded-[2.5rem] hover:bg-gray-50 flex flex-col items-center gap-4">
                                                <Camera className="w-8 h-8 text-black/20" />
                                                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Initialize Camera</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Password Modal */}
            <AnimatePresence>
                {isPasswordModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPasswordModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-2xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="relative bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.4em] mb-1">Security</p>
                                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-none">Security Update</h3>
                                </div>
                                <button onClick={() => setIsPasswordModalOpen(false)} className="p-2 bg-gray-50 rounded-xl"><XCircle className="w-5 h-5" /></button>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5 flex flex-col">
                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Password</label>
                                    <input type="password" placeholder="••••••••" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5" />
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-1.5 flex flex-col">
                                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">New Access Key</label>
                                        <input type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5" />
                                    </div>
                                    <div className="space-y-1.5 flex flex-col">
                                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Verify Key</label>
                                        <input type="password" placeholder="••••••••" value={reenterPassword} onChange={(e) => setReenterPassword(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 mt-8">
                                <button
                                    onClick={handleSavePassword}
                                    disabled={isSaving}
                                    className="w-full py-4 rounded-2xl bg-black text-white text-[11px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-colors shadow-xl flex items-center justify-center gap-3">
                                    {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {isSaving ? "Authorizing..." : "Update Credentials"}
                                </button>
                                <button
                                    onClick={() => setIsPasswordModalOpen(false)}
                                    className="w-full py-4 rounded-2xl border border-gray-100 text-gray-400 text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
