"use client";

import {
    Mail, Phone, MapPin, Calendar, Briefcase,
    Clock, Laptop, ShieldCheck, Lock, X, Check, Smile,
    Upload, Camera, Image as ImageIcon, CreditCard, Fingerprint, FileCheck
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";

const AVATAR_SEEDS = ["Zephyr", "Nova", "Cosmo", "Pixel", "Cipher", "Echo", "Vega", "Blaze", "Orion", "Lyra", "Atlas", "Iris"];
const dicebear = (seed) => `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent`;

export default function SettingsPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const [pickerTab, setPickerTab] = useState('upload');
    const [chosenSeed, setChosenSeed] = useState(null);
    const [savingAvatar, setSavingAvatar] = useState(false);
    const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
    const [uploadPreview, setUploadPreview] = useState(null);
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraSnapshot, setCameraSnapshot] = useState(null);

    const fetchUser = async () => {
        const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
        if (!email) { setLoading(false); return; }
        try {
            const res = await fetch(`/api/user/me?email=${email}`);
            if (res.ok) {
                const data = await res.json();
                setUser({ ...data, joinDate: data.joinDate ? new Date(data.joinDate).toISOString().split('T')[0] : 'N/A' });
                setChosenSeed(data.avatarSeed || data.fullName?.split(' ')[0] || "User");
            }
        } catch (error) { console.error("Error fetching user data:", error); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchUser(); }, []);

    const handleSaveAvatar = async (seed) => {
        setSavingAvatar(true);
        try {
            const res = await fetch('/api/user/me', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, avatarSeed: seed, profilePic: '' })
            });
            if (res.ok) {
                setChosenSeed(seed);
                setUser(prev => ({ ...prev, avatarSeed: seed, profilePicture: '' }));
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
                const file = new File([blob], `${user.fullName?.replace(/\s+/g, '_')}_profile.jpg`, { type: 'image/jpeg' });
                const formData = new FormData();
                formData.append('file', file);
                formData.append('type', 'profile');
                formData.append('email', user.email);
                const upRes = await fetch('/api/upload', { method: 'POST', body: formData });
                if (upRes.ok) {
                    const { url } = await upRes.json();
                    finalUrl = url;
                }
            }
            const res = await fetch('/api/user/me', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, profilePic: finalUrl, avatarSeed: '' })
            });
            if (res.ok) {
                setUser(prev => ({ ...prev, profilePicture: finalUrl, avatarSeed: '' }));
                setChosenSeed(user.fullName?.split(' ')[0] || 'User');
                toast.success('Profile photo updated!');
                closePickerClean();
            } else { toast.error('Failed to save photo.'); }
        } catch { toast.error('Error saving photo.'); }
        finally { setSavingAvatar(false); }
    };

    const handleIdUpload = async (file, type) => {
        const loadingToast = toast.loading(`Uploading ${type === 'aadhaarCard' ? 'Aadhaar' : 'Photo'}...`);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', type === 'aadhaarCard' ? 'aadhaar' : 'passport');
            formData.append('email', user.email);
            const upRes = await fetch('/api/upload', { method: 'POST', body: formData });
            if (upRes.ok) {
                const { url } = await upRes.json();
                const res = await fetch('/api/user/me', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: user.email, [type]: url })
                });
                if (res.ok) {
                    setUser(prev => ({ ...prev, [type]: url }));
                    toast.success('Document uploaded successfully!', { id: loadingToast });
                } else { toast.error('Failed to update profile.', { id: loadingToast }); }
            } else { toast.error('Upload failed.', { id: loadingToast }); }
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

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return; }
        const reader = new FileReader();
        reader.onload = (ev) => setUploadPreview(ev.target.result);
        reader.readAsDataURL(file);
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

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black" /></div>;
    if (!user) return null;

    const avatarSrc = (user.profilePicture && user.profilePicture.length > 10) ? user.profilePicture : dicebear(chosenSeed || user.avatarSeed || "User");

    return (
        <div className="space-y-8">

            <div className="w-full space-y-8">
                <div className="bg-white rounded-[2rem] p-10 shadow-xl border border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-emerald-50/50 pointer-events-none" />
                    <div className="relative shrink-0 z-10">
                        <div className="w-40 h-40 rounded-full border-4 border-white shadow-xl bg-gray-50 overflow-hidden">
                            <img src={avatarSrc} alt="Avatar" className="w-full h-full scale-110 object-cover" />
                        </div>
                        <button onClick={() => setShowAvatarPicker(true)} className="absolute -bottom-1 -right-1 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-20"><Smile className="w-5 h-5" /></button>
                    </div>
                    <div className="flex-1 space-y-6 z-10 text-center md:text-left mt-2 md:mt-0">
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase mb-2">{user.fullName}</h1>
                            <div className="inline-block px-4 py-1.5 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-md">{user.track || "Intern"}</div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100/80">
                            {[{ icon: Mail, value: user.email }, { icon: Phone, value: user.phone || "Not Provided" }, { icon: MapPin, value: user.address || "Not Provided" }, { icon: Calendar, value: user.dob || "Not Provided" }].map(({ icon: Icon, value }, i) => (
                                <div key={i} className="flex items-center justify-center md:justify-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/70 border border-gray-100 flex items-center justify-center shrink-0 shadow-sm"><Icon className="w-5 h-5 text-gray-400" /></div>
                                    <div className="text-sm font-bold text-gray-700">{value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-[2rem] p-10 shadow-lg border border-gray-100 relative overflow-hidden group hover:shadow-xl transition-all h-full">
                        <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase mb-8 flex items-center gap-3"><Laptop className="w-6 h-6 shrink-0" /> Internship Overview</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                            {[{ icon: Laptop, label: "Track", value: user.track }, { icon: Clock, label: "Duration", value: user.duration }, { icon: MapPin, label: "Work Mode", value: user.mode }, { icon: Calendar, label: "Join Date", value: user.joinDate }].map(({ icon: Icon, label, value }) => (
                                <div key={label} className="bg-gray-50 border border-gray-100 rounded-2xl p-5 hover:bg-white hover:shadow-md transition-all">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2"><Icon className="w-3 h-3" /> {label}</div>
                                    <p className="text-lg font-bold text-gray-900">{value || "N/A"}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-black rounded-[2rem] p-10 shadow-2xl relative overflow-hidden group hover:shadow-black/40 transition-all h-full flex flex-col justify-between">
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black text-white tracking-tighter uppercase mb-4 flex items-center gap-3"><ShieldCheck className="w-6 h-6 shrink-0" /> Security Protocol</h3>
                            <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-sm mb-10">Maintain strict access control. Change your password regularly.</p>
                        </div>
                        <button onClick={() => setIsPasswordModalOpen(true)} className="relative z-10 bg-white text-black px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:scale-105 active:scale-95 transition-all w-full flex items-center justify-center gap-3 group/btn"><Lock className="w-5 h-5 transition-transform" />Update Password</button>
                    </div>
                </div>

                {/* Avatar Picker Modal */}
                {showAvatarPicker && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={closePickerClean} />
                        <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-black text-gray-900 uppercase">Profile Picker</h3>
                                <button onClick={closePickerClean} className="w-9 h-9 border rounded-xl flex items-center justify-center hover:text-red-500"><X className="w-4 h-4" /></button>
                            </div>
                            <div className="flex bg-gray-50 p-1 rounded-2xl border mb-6">
                                {[{ id: 'upload', label: 'Upload', icon: Upload }, { id: 'camera', label: 'Camera', icon: Camera }, { id: 'avatar', label: 'Avatar', icon: Smile }].map(tab => (
                                    <button key={tab.id} onClick={() => { setPickerTab(tab.id); if (tab.id === 'camera') startCamera(); else stopCamera(); }} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${pickerTab === tab.id ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}><tab.icon className="w-3.5 h-3.5" />{tab.label}</button>
                                ))}
                            </div>
                            <div>
                                {pickerTab === 'upload' && (
                                    <div className="space-y-4 text-center">
                                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                        {uploadPreview ? <div className="flex flex-col items-center gap-4"><img src={uploadPreview} alt="P" className="w-32 h-32 rounded-full object-cover" /><button onClick={() => handleSavePhoto(uploadPreview)} disabled={savingAvatar} className="w-full py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase">Use This</button></div> : <button onClick={() => fileInputRef.current.click()} className="w-full py-10 border-2 border-dashed rounded-3xl hover:bg-gray-50"><Upload className="w-6 h-6 mx-auto mb-2" /><span className="text-[10px] font-black uppercase">Upload File</span></button>}
                                    </div>
                                )}
                                {pickerTab === 'camera' && (
                                    <div className="space-y-4 text-center">
                                        <canvas ref={canvasRef} className="hidden" />
                                        {cameraSnapshot ? <div className="flex flex-col items-center gap-4"><img src={cameraSnapshot} alt="S" className="w-32 h-32 rounded-full object-cover" /><button onClick={() => handleSavePhoto(cameraSnapshot)} disabled={savingAvatar} className="w-full py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase">Use This</button></div> : cameraActive ? <div className="flex flex-col items-center gap-4"><video ref={videoRef} autoPlay playsInline className="w-full rounded-3xl bg-black aspect-square object-cover" /><button onClick={takeSnapshot} className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center"><Camera className="w-6 h-6" /></button></div> : <button onClick={startCamera} className="w-full py-10 border-2 border-dashed rounded-3xl hover:bg-gray-50"><Camera className="w-6 h-6 mx-auto mb-2" /><span className="text-[10px] font-black uppercase">Open Camera</span></button>}
                                    </div>
                                )}
                                {pickerTab === 'avatar' && (
                                    <div className="grid grid-cols-4 gap-3">{AVATAR_SEEDS.map(seed => <button key={seed} onClick={() => handleSaveAvatar(seed)} disabled={savingAvatar} className={`p-2 bg-gray-50 rounded-2xl border-2 hover:scale-105 transition-all ${chosenSeed === seed ? 'border-black' : 'border-transparent'}`}><img src={dicebear(seed)} alt={seed} /></button>)}</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Password Reset */}
                {isPasswordModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsPasswordModalOpen(false)} />
                        <div className="relative w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl">
                            <h3 className="text-2xl font-black text-gray-900 uppercase mb-8">Reset Key</h3>
                            <form onSubmit={handlePasswordUpdate} className="space-y-6">
                                <input type="password" required value={passwords.newPassword} onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} className="w-full bg-gray-50 px-6 py-4 rounded-2xl outline-none" placeholder="New Password" />
                                <input type="password" required value={passwords.confirmPassword} onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })} className="w-full bg-gray-50 px-6 py-4 rounded-2xl outline-none" placeholder="Confirm Password" />
                                <button type="submit" disabled={isSubmittingPassword} className="w-full py-4 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest">{isSubmittingPassword ? "..." : "Update"}</button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
