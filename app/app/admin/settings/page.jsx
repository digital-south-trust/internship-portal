"use client";

import { useState, useEffect, useRef } from "react";
import { Save, Lock, User,Clock, Shield, RefreshCw, XCircle, Mail, Phone, Calendar, Smile, Upload, Camera, Image as ImageIcon } from "lucide-react";
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
    
    // Avatar States
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const [chosenSeed, setChosenSeed] = useState("Admin");
    const [savingAvatar, setSavingAvatar] = useState(false);
    const [pickerTab, setPickerTab] = useState('avatar');

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
                body: JSON.stringify({ email, avatarSeed: seed, profilePic: '' })
            });
            if (res.ok) {
                setChosenSeed(seed);
                setUserDetails(prev => ({ ...prev, avatarSeed: seed, profilePicture: '' }));
                toast.success('Avatar updated!');
                setShowAvatarPicker(false);
            } else { toast.error('Failed to save avatar.'); }
        } catch { toast.error('Error saving avatar.'); }
        finally { setSavingAvatar(false); }
    };

    const avatarSrc = (userDetails?.profilePicture && userDetails?.profilePicture.length > 10) 
        ? userDetails.profilePicture 
        : dicebear(chosenSeed || userDetails?.avatarSeed || "Admin");

    return (
        <div className="-mx-8 -mt-8 flex flex-col min-h-screen bg-gray-50/30">
            {/* Full-width Profile Header (Top 1/3 Section) */}
            <div className="relative w-full h-[40vh] bg-white border-b border-gray-100 overflow-hidden shadow-sm">
                {/* Background Pattern */}
                <div 
                    className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                    style={{ backgroundImage: 'url(/background4.svg)', backgroundSize: '150px' }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-black/[0.02]" />

                <div className="relative z-10 h-full flex flex-col md:flex-row items-center justify-center md:items-end md:justify-start px-12 pb-12 gap-10">
                    {/* Large Avatar */}
                    <div className="relative group shrink-0">
                        <div className="w-48 h-48 md:w-56 md:h-56 rounded-[3.5rem] bg-white shadow-2xl border-8 border-white p-2 overflow-hidden ring-1 ring-black/5 transition-transform group-hover:scale-[1.02]">
                            <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover rounded-[3rem] animate-fade-in" />
                        </div>
                        <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowAvatarPicker(true)}
                            className="absolute -bottom-2 -right-2 w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center shadow-2xl z-20 group-hover:bg-neutral-800 transition-colors"
                        >
                            <Smile className="w-6 h-6" />
                        </motion.button>
                    </div>

                    {/* Metadata Section */}
                    <div className="flex-1 space-y-6 text-center md:text-left mb-4">
                        <div className="space-y-2">
                             <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                 <h1 className="text-5xl font-black text-gray-900 tracking-tighter uppercase leading-none">
                                     {userDetails?.fullName || userDetails?.name || displayName}
                                 </h1>
                                 <div className="flex gap-2">
                                     <span className="text-[10px] font-black text-white bg-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                                         {userDetails?.role || 'Admin'}
                                     </span>
                                     <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-4 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-2 border border-emerald-100">
                                         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                         {userDetails?.status || 'Active'}
                                     </span>
                                 </div>
                             </div>
                             <div className="flex items-center justify-center md:justify-start gap-2 text-gray-400 font-bold uppercase text-[11px] tracking-widest px-1">
                                 <Mail className="w-4 h-4 text-black/10" />
                                 {userDetails?.email || email}
                             </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl pt-8 border-t border-gray-100">
                             {[
                                 { label: "Track", value: userDetails?.track || 'System Admin', icon: Shield },
                                 { label: "Phone", value: userDetails?.phone || 'Not Provided', icon: Phone },
                                 { label: "Duration", value: userDetails?.duration || 'Permanent', icon: Clock },
                                 { label: "Partner ID", value: userDetails?.admissionId || 'ADMIN-CORP-01', icon: Fingerprint }
                             ].map((stat, i) => (
                                 <div key={i} className="space-y-1.5">
                                     <div className="flex items-center gap-2 text-gray-400">
                                         <stat.icon className="w-3.5 h-3.5 opacity-40 text-black" />
                                         <p className="text-[9px] font-black uppercase tracking-widest">{stat.label}</p>
                                     </div>
                                     <p className="font-black text-gray-900 text-sm truncate uppercase tracking-tight">{stat.value}</p>
                                 </div>
                             ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Content Area */}
            <div className="max-w-4xl px-12 py-12 space-y-8">
                {/* Security Section */}
                <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow group">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-red-50 rounded-2xl text-red-500 group-hover:scale-110 transition-transform">
                            <Shield className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Security Protocol</h2>
                            <p className="text-gray-500 text-sm font-medium">Manage institutional access and password credentials</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsPasswordModalOpen(true)}
                        className="px-8 py-4 bg-black text-white rounded-2xl text-[11px] font-black tracking-widest uppercase hover:bg-neutral-800 transition-all shadow-xl shadow-black/10 flex items-center gap-3"
                    >
                        <Lock className="w-4 h-4" /> Reset Password
                    </button>
                </div>

                {/* Additional Settings Info Placeholder */}
                <div className="p-8 border-2 border-dashed border-gray-100 rounded-[2.5rem] text-center opacity-30">
                    <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">System Configuration Nodes (v2.0)</p>
                </div>
            </div>

            {/* Avatar Picker Modal */}
            <AnimatePresence>
                {showAvatarPicker && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAvatarPicker(false)} className="absolute inset-0 bg-black/60 backdrop-blur-2xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="relative bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl border border-gray-100">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.4em] mb-1">Character Suite</p>
                                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Select Avatar</h3>
                                </div>
                                <button onClick={() => setShowAvatarPicker(false)} className="p-3 bg-gray-50 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all"><XCircle className="w-5 h-5" /></button>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                {AVATAR_SEEDS.map(seed => (
                                    <button 
                                        key={seed} 
                                        onClick={() => handleSaveAvatar(seed)} 
                                        disabled={savingAvatar} 
                                        className={`p-3 bg-gray-50/50 rounded-3xl border-2 transition-all hover:scale-105 active:scale-95 ${chosenSeed === seed ? 'border-black' : 'border-transparent'}`}
                                    >
                                        <img src={dicebear(seed)} alt={seed} className="w-full h-full" />
                                    </button>
                                ))}
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
