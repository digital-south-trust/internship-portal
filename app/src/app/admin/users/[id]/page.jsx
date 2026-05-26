"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft, Mail, Calendar, Phone, Award, Activity, User,
    CheckCircle, RefreshCw, UserCog, ChevronDown, ShieldOff, ShieldCheck, X, AlertTriangle,
    Github, ExternalLink, KeyRound, Copy, Eye, EyeOff, Edit, CreditCard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import CertificateIssuer from "@/components/CertificateIssuer";
import { CartesianGrid, Line, LineChart, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

const dicebear = (seed) => `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent`;



export default function InternDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id;

    const [user, setUser] = useState(null);
    const [projects, setProjects] = useState([]);
    const [referredUsers, setReferredUsers] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState(null);

    // Progress control
    const [editProgress, setEditProgress] = useState(0);
    const [adminNote, setAdminNote] = useState('');
    const [savingProgress, setSavingProgress] = useState(false);

    // Assigned admin state
    const [assignedAdmin, setAssignedAdmin] = useState('');
    const [pendingAdmin, setPendingAdmin] = useState('');
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [savingAdmin, setSavingAdmin] = useState(false);

    // Terminate state
    const [showTerminateModal, setShowTerminateModal] = useState(false);
    const [terminating, setTerminating] = useState(false);

    // Certificate modal
    const [showCertsListModal, setShowCertsListModal] = useState(false);
    const [certificates, setCertificates] = useState([]);

    // Cancellation report modal state
    const [showCancellationReportModal, setShowCancellationReportModal] = useState(false);

    // Password reset state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [resettingPassword, setResettingPassword] = useState(false);
    const [newPassword, setNewPassword] = useState(null);
    const [showNewPassword, setShowNewPassword] = useState(false);
    
    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState({});
    const [savingEdit, setSavingEdit] = useState(false);

    // Tab switching logic for dual-role users
    const [profileTab, setProfileTab] = useState("");
    const isMergedUser = user && (user.role?.toLowerCase() === 'admin' || user.role?.toLowerCase() === 'intern') && (user.isAmbassador || user.referralCode);

    useEffect(() => {
        if (user) {
            setProfileTab(user.role?.toLowerCase() === 'admin' ? 'admin' : user.role?.toLowerCase() === 'intern' ? 'intern' : 'ambassador');
        }
    }, [user]);

    const openProject = (project) => {
        setSelectedProject(project);
        setEditProgress(project.progress || 0);
        setAdminNote(project.adminFeedback || '');
    };

    useEffect(() => {
        if (!id) return;
        const fetchDetails = async () => {
            try {
                const [userRes, adminsRes] = await Promise.all([
                    fetch(`/api/admin/users/${id}`),
                    fetch('/api/admin/users')
                ]);
                if (userRes.ok) {
                    const data = await userRes.json();
                    setUser(data.user);
                    setProjects(data.projects || []);
                    setReferredUsers(data.referredUsers || []);
                    const saved = data.user?.assignedAdmin || 'gauthamram.um@gmail.com';
                    setAssignedAdmin(saved);
                    setPendingAdmin(saved);
                }
                if (adminsRes.ok) {
                    const data = await adminsRes.json();
                    setAdmins((data.users || []).filter(u => u.role === 'admin'));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    useEffect(() => {
        if (!user?.email) return;
        const fetchCerts = async () => {
             try {
                const res = await fetch(`/api/admin/certificates?email=${user.email}`);
                if (res.ok) {
                    const data = await res.json();
                    setCertificates(data);
                }
             } catch (err) { console.error(err); }
        };
        fetchCerts();
    }, [user?.email, user?.track]);

    /* ─── Reset password ─── */
    const handleResetPassword = async () => {
        setResettingPassword(true);
        setNewPassword(null);
        try {
            const res = await fetch('/api/admin/users/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: id })
            });
            if (res.ok) {
                const data = await res.json();
                setNewPassword(data.newPassword);
                setShowNewPassword(true);
                toast.success(`Password reset & emailed to ${user.fullName}`);
            } else {
                const err = await res.json();
                toast.error(err.message || 'Failed to reset password');
            }
        } catch { toast.error('Error resetting password'); }
        finally { setResettingPassword(false); }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Password copied to clipboard!');
    };

    /* ─── Save assigned admin ─── */
    const handleSaveAdmin = async () => {
        setSavingAdmin(true);
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignedAdmin: pendingAdmin })
            });
            if (res.ok) {
                toast.success('Assigned admin updated!');
                setAssignedAdmin(pendingAdmin);
                setUser(prev => ({ ...prev, assignedAdmin: pendingAdmin }));
            } else {
                toast.error('Failed to update');
            }
        } catch { toast.error('Error saving'); }
        finally {
            setSavingAdmin(false);
            setShowAdminModal(false);
        }
    };

    /* ─── Terminate intern ─── */
    const handleTerminate = async () => {
        setTerminating(true);
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Terminated' })
            });
            if (res.ok) {
                toast.success(`${user.fullName} has been terminated.`);
                setUser(prev => ({ ...prev, status: 'Terminated' }));
            } else {
                toast.error('Failed to terminate');
            }
        } catch { toast.error('Error'); }
        finally {
            setTerminating(false);
            setShowTerminateModal(false);
        }
    };

    /* ─── Reactivate intern ─── */
    const handleReactivate = async () => {
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Active' })
            });
            if (res.ok) {
                toast.success(`${user.fullName} reactivated.`);
                setUser(prev => ({ ...prev, status: 'Active' }));
            } else {
                toast.error('Failed to reactivate');
            }
        } catch { toast.error('Error'); }
    };

    const calculateEndDate = (joinDate, duration) => {
        if (!joinDate || !duration) return 'N/A';
        const d = new Date(joinDate);
        d.setMonth(d.getMonth() + (parseInt(duration) || 0));
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const getAdminLabel = () => {
        const a = admins.find(a => a.email === assignedAdmin);
        if (a?.fullName) return a.fullName;
        if (assignedAdmin) return assignedAdmin.split('@')[0];
        return 'Gauthamram';
    };

    const isTerminated = user?.status === 'Terminated';
    const isCancelled = user?.status === 'Cancelled' || user?.selectionStatus === 'Cancelled';

    if (loading) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black" />
        </div>
    );

    if (!user) return (
        <div className="p-8 text-center text-gray-500">
            <p>User not found.</p>
            <button onClick={() => router.back()} className="mt-4 px-4 py-2 border rounded-xl text-sm font-bold hover:bg-gray-50">Go Back</button>
        </div>
    );

    // Process real analytics data for the chart (Last 6 Months)
    const generateChartData = () => {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const data = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            let d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            let monthLabel = months[d.getMonth()];
            
            let recruits = (referredUsers || []).filter(u => {
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

    return (
        <div className="-mt-8 -mx-8">

            {/* ── Profile Header ── */}
            <div className={`bg-white px-8 pt-8 pb-12 border-b border-gray-100 shadow-sm relative overflow-hidden ${isTerminated ? 'opacity-80' : ''}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-emerald-50/50 pointer-events-none" />

                {/* Top bar */}
                {/* Top bar */}
                <div className="w-full relative z-10 flex items-center justify-between mb-8">
                    <button onClick={() => router.push('/admin/users')}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-all group">
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> Back to Users
                    </button>
                </div>

                {/* Avatar + Info + Actions Grid */}
                <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                    {/* Avatar */}
                    <div className="w-32 h-32 md:w-36 md:h-36 bg-gray-50 rounded-[2.5rem] border-2 border-white shadow-xl flex items-center justify-center shrink-0 z-20 overflow-hidden">
                        <img 
                            src={
                                (user.profilePicture && user.profilePicture !== "null") 
                                ? user.profilePicture 
                                : (user.passportPhoto && user.passportPhoto !== "null")
                                ? user.passportPhoto
                                : dicebear(user.avatarSeed || user.fullName?.split(' ')[0] || "User")
                            } 
                            alt="Profile" 
                            className="w-full h-full object-cover" 
                            onError={(e) => { e.target.src = dicebear("User"); }}
                        />
                    </div>

                    {/* Middle Info Section */}
                    <div className="flex-1 space-y-5 w-full">
                        <div>
                            <div className="flex items-center gap-3 mb-1 flex-wrap">
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none uppercase">{user.fullName}</h1>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold border ${
                                    user.role?.toLowerCase() === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                    user.role?.toLowerCase() === 'ambassador' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                    'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                    {user.role}
                                </span>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${isTerminated || isCancelled ? 'text-red-700 bg-red-50 border border-red-100' :
                                    user.status === 'Active' ? 'text-green-700 bg-green-50 border border-green-100' :
                                        'text-gray-500 bg-gray-100 border border-gray-200'
                                    }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${isTerminated || isCancelled ? 'bg-red-500' : user.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                                    {isCancelled ? 'Cancelled' : user.status || 'Active'}
                                </span>
                            </div>
                            <p className="text-sm font-bold text-gray-400 flex items-center gap-2">
                                <Mail className="w-4 h-4 text-black/10" /> {user.email}
                            </p>
                        </div>

                        {isMergedUser && (
                            <div className="flex bg-gray-50/80 p-1 rounded-xl border border-gray-100 shadow-sm w-fit mb-5">
                                <button
                                    onClick={() => setProfileTab(user.role?.toLowerCase() === 'admin' ? 'admin' : 'intern')}
                                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                        profileTab !== 'ambassador'
                                        ? 'bg-black text-white shadow-md'
                                        : 'text-gray-400 hover:text-black'
                                    }`}
                                >
                                    {user.role?.toLowerCase() === 'admin' ? 'Admin Profile' : 'Intern Profile'}
                                </button>
                                <button
                                    onClick={() => setProfileTab('ambassador')}
                                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                        profileTab === 'ambassador'
                                        ? 'bg-black text-white shadow-md'
                                        : 'text-gray-400 hover:text-black'
                                    }`}
                                >
                                    Ambassador Profile
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-5 border-t border-gray-50">
                            {profileTab === 'ambassador' ? (
                                <>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Referral Code</p>
                                        <p className="text-xs font-black text-black select-all tracking-wider font-mono uppercase">{user.referralCode || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Institution</p>
                                        <p className="text-xs font-bold text-gray-900 truncate">{user.collegeName || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Performance</p>
                                        <p className="text-xs font-bold text-gray-900">{user.userCount || 0} Successful Recruits</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Earnings</p>
                                        <p className="text-xs font-black text-emerald-600 flex items-center gap-1">
                                            <span className="text-[10px]">₹</span> {user.earnings || 0}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Ambassador Commission</p>
                                        <p className="text-xs font-bold text-gray-900">{user.commissionPercentage || 10}% Commission</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Intern Discount</p>
                                        <p className="text-xs font-bold text-gray-900">{user.discountPercentage || 10}% OFF</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Aadhaar Number</p>
                                        <p className="text-xs font-bold text-gray-900">{user.aadhaarNumber || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Phone</p>
                                        <p className="text-xs font-bold text-gray-900">{user.phone || 'N/A'}</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Track</p>
                                        <p className="text-xs font-bold text-gray-900 truncate">{user.track || 'Unassigned'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Duration</p>
                                        <p className="text-xs font-bold text-gray-900">{user.duration || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Professional Status</p>
                                        <p className="text-xs font-bold text-gray-900 truncate">{user.workingDetails || user.collegeName || 'Not Provided'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Aadhaar</p>
                                        <p className="text-xs font-bold text-gray-900 select-all">{user.aadhaarNumber || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Date of Birth</p>
                                        <p className="text-xs font-bold text-gray-900">{user.dob || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Course & Degree</p>
                                        <p className="text-xs font-bold text-gray-900 truncate">{user.courseName ? `${user.courseName} (${user.educationQualification || 'Degree'})` : 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Assigned Admin</p>
                                        <button
                                            onClick={() => { setPendingAdmin(assignedAdmin); setShowAdminModal(true); }}
                                            className="text-xs font-bold text-black border-b border-black/20 hover:border-black transition-all flex items-center gap-1"
                                        >
                                            {getAdminLabel()}
                                        </button>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Location / Address</p>
                                        <p className="text-xs font-bold text-gray-900 truncate max-w-[150px]" title={user.address}>{user.address || 'N/A'}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right Vertical Action Stack */}
                    <div className="flex flex-col gap-2 w-full md:w-48 pt-2">
                        {/* Cancellation Report Button - Shown above Certificates for Cancelled users */}
                        {profileTab !== 'ambassador' && isCancelled && (
                            <button onClick={() => setShowCancellationReportModal(true)}
                                className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center gap-2 border border-red-100 shadow-sm">
                                <AlertTriangle className="w-4 h-4" /> View Reason
                            </button>
                        )}

                        {/* Unified Certificates Button - Hidden for Ambassadors */}
                        {profileTab !== 'ambassador' && (
                            <button onClick={() => setShowCertsListModal(true)}
                                className="bg-gray-50 text-gray-600 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all flex items-center justify-between border border-gray-200">
                                <div className="flex items-center gap-2">
                                    <Award className="w-4 h-4" /> Certificates
                                </div>
                                {certificates.length > 0 && <span className="bg-black/10 group-hover:bg-white/20 px-1.5 py-0.5 rounded text-[8px]">{certificates.length}</span>}
                            </button>
                        )}

                        {/* Change Password */}
                        <button onClick={() => { setShowPasswordModal(true); setNewPassword(null); setShowNewPassword(false); }}
                            className="bg-amber-50 text-amber-600 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all flex items-center gap-2 border border-amber-100">
                            <KeyRound className="w-4 h-4" /> Change Password
                        </button>

                        {/* Terminate / Reactivate */}
                        {(isTerminated || isCancelled) ? (
                            <button onClick={handleReactivate}
                                className="bg-blue-50 text-blue-600 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 border border-blue-100">
                                <ShieldCheck className="w-4 h-4" /> Reactivate
                            </button>
                        ) : (
                            <button onClick={() => setShowTerminateModal(true)}
                                className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center gap-2 border border-red-100">
                                <ShieldOff className="w-4 h-4" /> Terminate
                            </button>
                        )}

                        {/* Update Data Button (New) */}
                        <button onClick={() => { setEditData(user); setShowEditModal(true); }}
                            className="bg-black text-white px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all flex items-center gap-2 shadow-lg shadow-black/10">
                            <Edit className="w-4 h-4 text-[#ccff00]" /> Update Information
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Performance & Recruitment (Ambassador Only) ── */}
            {profileTab === 'ambassador' && (
                <div className="p-8 space-y-10">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Analytics Graph */}
                        <div className="lg:col-span-2 bg-white rounded-[3rem] border border-gray-100 shadow-sm p-10 space-y-8 group">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-black group-hover:text-white transition-colors border border-gray-100">
                                        <Activity className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-black text-black uppercase tracking-tight">Growth Intelligence</h3>
                                </div>
                            </div>
                            {/* Line Chart */}
                            <div className="aspect-[2.5/1] bg-white rounded-3xl pt-6 group-hover:bg-gray-50/30 transition-colors w-full h-[250px]">
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

                        {/* Recent Activity Log */}
                        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-10 space-y-8 h-full">
                            <h3 className="text-lg font-black text-black uppercase tracking-tight flex items-center gap-3">
                                <Calendar className="w-5 h-5" /> Joined History
                            </h3>
                            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                {referredUsers.length === 0 ? (
                                    <p className="text-xs text-gray-400 font-bold text-center py-10 uppercase tracking-widest opacity-40">No entries yet</p>
                                ) : (
                                    referredUsers.map((u, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-transparent hover:border-gray-100 hover:bg-white transition-all">
                                            <div>
                                                <p className="text-[10px] font-black text-black uppercase tracking-tight">{u.fullName}</p>
                                                <p className="text-[8px] font-bold text-gray-400">{u.track || 'Gen Track'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[8px] font-black text-gray-400 uppercase">{new Date(u.createdAt).toLocaleDateString()}</p>
                                                <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded border ${u.status === 'ACTIVE' ? 'bg-black text-white' : 'bg-white text-gray-400'}`}>{u.status}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Projects - Hidden for Ambassadors ── */}
            {profileTab !== 'ambassador' && (
                <div className="p-8 space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <Activity className="w-5 h-5" /> Submitted Projects
                    </h2>
                    {projects.length === 0 ? (
                        <div className="bg-white border border-gray-100 p-8 rounded-3xl text-center text-gray-500 font-medium">
                            This intern hasn&apos;t submitted any projects yet.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {projects.map((project, idx) => (
                                <div key={project._id || `project-${idx}`} onClick={() => openProject(project)}
                                    className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-black text-gray-900 group-hover:text-black">{project.projectName}</h3>
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${project.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : project.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                            {project.status}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                                            <span>Progress</span>
                                            <span className="font-black text-gray-900">{project.progress || 0}%</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-black rounded-full transition-all" style={{ width: `${project.progress || 0}%` }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}



            {/* ════ MODALS ════ */}
            <AnimatePresence>

                {/* ── Project Detail Modal ── */}
                {selectedProject && (
                    <motion.div key="project-detail-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedProject(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

                            {/* Header */}
                            <div className="px-7 pt-7 pb-5 border-b border-gray-50 flex items-start justify-between gap-4 bg-gray-50/40">
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 tracking-tight">{selectedProject.projectName}</h3>
                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                        <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${selectedProject.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : selectedProject.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                            {selectedProject.status}
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-400">{new Date(selectedProject.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedProject(null)}
                                    className="w-8 h-8 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 transition-all shrink-0">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-7 space-y-6">

                                {/* Description */}
                                {selectedProject.description && (
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Description</p>
                                        <p className="text-sm text-gray-600 font-medium leading-relaxed bg-gray-50 rounded-2xl p-4">{selectedProject.description}</p>
                                    </div>
                                )}

                                {/* Links */}
                                <div className="flex gap-3 flex-wrap">
                                    {selectedProject.githubLink ? (
                                        <a href={selectedProject.githubLink} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-black hover:scale-105 transition-all">
                                            <Github className="w-3.5 h-3.5" /> GitHub
                                        </a>
                                    ) : (
                                        <span className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-300 rounded-xl text-xs font-black border border-gray-100">
                                            <Github className="w-3.5 h-3.5" /> No GitHub link
                                        </span>
                                    )}
                                    {selectedProject.liveLink ? (
                                        <a href={selectedProject.liveLink} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black hover:scale-105 transition-all">
                                            <ExternalLink className="w-3.5 h-3.5" /> Live Demo
                                        </a>
                                    ) : (
                                        <span className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-300 rounded-xl text-xs font-black border border-gray-100">
                                            <ExternalLink className="w-3.5 h-3.5" /> No live link
                                        </span>
                                    )}
                                </div>

                                {/* Extra details grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    {selectedProject.techStack && (
                                        <div className="bg-gray-50 rounded-2xl p-3">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Tech Stack</p>
                                            <p className="text-xs font-bold text-gray-700">{Array.isArray(selectedProject.techStack) ? selectedProject.techStack.join(', ') : selectedProject.techStack}</p>
                                        </div>
                                    )}
                                    <div className="bg-gray-50 rounded-2xl p-3">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Submitted</p>
                                        <p className="text-xs font-bold text-gray-700">{new Date(selectedProject.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                    </div>
                                    {selectedProject.internId && (
                                        <div className="bg-gray-50 rounded-2xl p-3">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Intern ID</p>
                                            <p className="text-xs font-bold text-gray-500 truncate">{selectedProject.internId}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Progress control — slider only, no duplicate bar */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Progress</p>
                                        <span className="text-sm font-black text-gray-900 bg-gray-100 px-3 py-1 rounded-xl">{editProgress}%</span>
                                    </div>
                                    <input type="range" min="0" max="100" value={editProgress}
                                        onChange={e => setEditProgress(Number(e.target.value))}
                                        className="w-full accent-black cursor-pointer" />
                                </div>

                                {/* Status update */}
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Update Status</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {['Pending', 'Approved', 'Rejected'].map(s => (
                                            <button key={s} onClick={() => setSelectedProject(p => ({ ...p, status: s }))}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedProject.status === s
                                                    ? s === 'Approved' ? 'bg-emerald-600 text-white border-emerald-600'
                                                        : s === 'Rejected' ? 'bg-red-600 text-white border-red-600'
                                                            : 'bg-black text-white border-black'
                                                    : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-gray-300'}`}>
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Admin feedback */}
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Admin Feedback</p>
                                    <textarea rows={3} value={adminNote} onChange={e => setAdminNote(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-4 focus:ring-black/5 resize-none"
                                        placeholder="Add feedback or observations for this project..." />
                                </div>

                                {/* Save */}
                                <div className="flex gap-3">
                                    <button onClick={() => setSelectedProject(null)}
                                        className="flex-1 py-3 bg-gray-50 text-gray-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all">
                                        Close
                                    </button>
                                    <button onClick={async () => {
                                        setSavingProgress(true);
                                        try {
                                            const res = await fetch(`/api/projects`, {
                                                method: 'PUT',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ id: selectedProject._id, progress: editProgress, status: selectedProject.status, adminFeedback: adminNote })
                                            });
                                            if (res.ok) {
                                                const updated = await res.json();
                                                setProjects(prev => prev.map(p => p._id === updated._id ? updated : p));
                                                toast.success('Project updated!');
                                                setSelectedProject(null);
                                            } else { toast.error('Failed to save'); }
                                        } catch { toast.error('Error saving'); }
                                        finally { setSavingProgress(false); }
                                    }} disabled={savingProgress}
                                        className="flex-[2] py-3 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 shadow-lg">
                                        {savingProgress ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}


                {/* ── Change Admin Confirmation Modal ── */}
                {showAdminModal && (
                    <motion.div key="change-admin-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowAdminModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
                            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center">
                                        <UserCog className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Change Assigned Admin</h3>
                                        <p className="text-[10px] text-gray-400 font-medium">For {user.fullName}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowAdminModal(false)} className="w-8 h-8 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <p className="text-sm text-gray-600 font-medium">
                                    Are you sure you want to change the assigned admin? The new admin will receive all future meeting reminders for this intern.
                                </p>
                                <div className="relative">
                                    <select
                                        value={pendingAdmin}
                                        onChange={e => setPendingAdmin(e.target.value)}
                                        className="w-full appearance-none bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 pr-10 text-sm font-bold text-gray-700 focus:outline-none focus:ring-4 focus:ring-black/5 cursor-pointer"
                                    >
                                        <option value="gauthamram.um@gmail.com">Gauthamram (Default)</option>
                                        {admins.filter(a => a.email !== 'gauthamram.um@gmail.com').map((a, idx) => (
                                            <option key={a._id || `admin-${idx}`} value={a.email}>
                                                {a.fullName ? `${a.fullName} — ${a.email}` : a.email}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button onClick={() => setShowAdminModal(false)}
                                        className="flex-1 py-3 bg-gray-50 text-gray-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all">
                                        Cancel
                                    </button>
                                    <button onClick={handleSaveAdmin} disabled={savingAdmin}
                                        className="flex-1 py-3 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-lg">
                                        {savingAdmin ? 'Saving...' : 'Save Change'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* ── Terminate Confirmation Modal ── */}
                {showTerminateModal && (
                    <motion.div key="terminate-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowTerminateModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
                            <div className="p-6 bg-red-50/60 border-b border-red-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center">
                                        <AlertTriangle className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Terminate Intern</h3>
                                        <p className="text-[10px] text-red-500 font-medium">This action restricts portal access</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowTerminateModal(false)} className="w-8 h-8 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <p className="text-sm text-gray-700 font-medium leading-relaxed">
                                    Are you sure you want to terminate <strong>{user.fullName}</strong>?
                                </p>
                                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-1">
                                    <p className="text-xs font-black text-amber-700">⚠️ What happens after termination:</p>
                                    <ul className="text-xs text-amber-600 font-medium space-y-0.5 list-disc list-inside">
                                        <li>Intern cannot log into the portal</li>
                                        <li>All their data is preserved (not deleted)</li>
                                        <li>You can reactivate them at any time</li>
                                    </ul>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button onClick={() => setShowTerminateModal(false)}
                                        className="flex-1 py-3 bg-gray-50 text-gray-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all">
                                        Cancel
                                    </button>
                                    <button onClick={handleTerminate} disabled={terminating}
                                        className="flex-1 py-3 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50 shadow-lg">
                                        {terminating ? 'Terminating...' : 'Yes, Terminate'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* ── Unified Certificate Issuer Component ── */}
                <CertificateIssuer
                    key="certificate-issuer"
                    user={user}
                    projects={projects}
                    certificates={certificates}
                    setCertificates={setCertificates}
                    showModal={showCertsListModal}
                    setShowModal={setShowCertsListModal}
                />

                {/* ── Password Reset Modal ── */}
                {showPasswordModal && (
                    <motion.div key="password-reset-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowPasswordModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
                            <div className="p-6 bg-amber-50/60 border-b border-amber-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                                        <KeyRound className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Change Password</h3>
                                        <p className="text-[10px] text-amber-600 font-medium">For {user.fullName}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowPasswordModal(false)}
                                    className="w-8 h-8 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="p-6 space-y-5">
                                {!newPassword ? (
                                    <>
                                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                            <p className="text-xs font-bold text-amber-700 leading-relaxed">
                                                This will generate a new random password and send it to {user.fullName}&apos;s email address.
                                            </p>
                                        </div>
                                        <button onClick={handleResetPassword} disabled={resettingPassword}
                                            className="w-full py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-103 active:scale-95 transition-all shadow-xl shadow-black/10">
                                            {resettingPassword ? "Generating..." : "Confirm & Send Email"}
                                        </button>
                                    </>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-green-50 rounded-2xl border border-green-100 text-center">
                                            <p className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-1">New Password Generated</p>
                                            <div className="flex items-center justify-center gap-2">
                                                <code className="text-lg font-black text-black tracking-widest">{showNewPassword ? newPassword : '••••••••'}</code>
                                                <button onClick={() => setShowNewPassword(!showNewPassword)} className="p-2 hover:bg-black/5 rounded-lg transition-all">
                                                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <button onClick={() => copyToClipboard(newPassword)}
                                            className="w-full py-3 bg-gray-50 text-gray-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
                                            <Copy className="w-4 h-4" /> Copy Password
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* ── Update Data Modal ── */}
                {showEditModal && (
                    <motion.div key="edit-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowEditModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            {/* Header */}
                            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-xl shadow-black/10">
                                        <Edit className="w-5 h-5 text-[#ccff00]" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black uppercase tracking-tight">Update Information</h3>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Administrative Override</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowEditModal(false)} className="p-3 hover:bg-black/5 rounded-2xl transition-all">
                                    <X className="w-6 h-6 text-gray-400" />
                                </button>
                            </div>

                            {/* Scrollable Form */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5 col-span-2">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Full Name</label>
                                        <input type="text" value={editData.fullName || ""} 
                                            onChange={e => setEditData({...editData, fullName: e.target.value})}
                                            className="w-full bg-gray-50 border border-transparent focus:border-black/5 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold transition-all outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Phone Number</label>
                                        <PhoneInput
                                            defaultCountry="IN"
                                            placeholder="Phone Number"
                                            value={editData.phone || ""}
                                            onChange={(value) => setEditData({...editData, phone: value})}
                                            className="w-full bg-gray-50 border border-transparent focus-within:border-black/5 focus-within:bg-white rounded-2xl px-5 py-4 text-sm font-bold transition-all outline-none"
                                            style={{ '--PhoneInput-color--focus': 'black' }}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Aadhaar Number</label>
                                        <input type="text" value={editData.aadhaarNumber || ""} 
                                            onChange={e => setEditData({...editData, aadhaarNumber: e.target.value})}
                                            className="w-full bg-gray-50 border border-transparent focus:border-black/5 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold transition-all outline-none" />
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Date of Birth</label>
                                        <input type="text" value={editData.dob || ""} 
                                            onChange={e => setEditData({...editData, dob: e.target.value})}
                                            placeholder="DD/MM/YYYY"
                                            className="w-full bg-gray-50 border border-transparent focus:border-black/5 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold transition-all outline-none" />
                                    </div>
                                    <div className="space-y-1.5 col-span-2">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Physical Address</label>
                                        <textarea value={editData.address || ""} 
                                            onChange={e => setEditData({...editData, address: e.target.value})}
                                            className="w-full bg-gray-50 border border-transparent focus:border-black/5 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold transition-all outline-none resize-none" rows={2} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Qualification</label>
                                        <input type="text" value={editData.educationQualification || ""} 
                                            onChange={e => setEditData({...editData, educationQualification: e.target.value})}
                                            className="w-full bg-gray-50 border border-transparent focus:border-black/5 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold transition-all outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Course Name</label>
                                        <input type="text" value={editData.courseName || ""} 
                                            onChange={e => setEditData({...editData, courseName: e.target.value})}
                                            className="w-full bg-gray-50 border border-transparent focus:border-black/5 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold transition-all outline-none" />
                                    </div>
                                    <div className="space-y-1.5 col-span-2">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Working Status / Company Name</label>
                                        <input type="text" value={editData.workingDetails || ""} 
                                            onChange={e => setEditData({...editData, workingDetails: e.target.value})}
                                            placeholder="Company Name if working, else leave blank"
                                            className="w-full bg-gray-50 border border-transparent focus:border-black/5 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold transition-all outline-none" />
                                    </div>
                                    
                                    {/* Institution / College */}
                                    <div className="space-y-1.5 col-span-2">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Institution / College</label>
                                        <input type="text" value={editData.collegeName || ""} 
                                            onChange={e => setEditData({...editData, collegeName: e.target.value})}
                                            className="w-full bg-gray-50 border border-transparent focus:border-black/5 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold transition-all outline-none" />
                                    </div>

                                    {/* Internship Duration */}
                                    {(editData.role?.toLowerCase() === 'intern' || !editData.role) && (
                                        <div className="space-y-1.5 col-span-2">
                                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Internship Duration</label>
                                            <input type="text" value={editData.duration || ""} 
                                                onChange={e => setEditData({...editData, duration: e.target.value})}
                                                placeholder="e.g. 2 Months, 4 Months, etc."
                                                className="w-full bg-gray-50 border border-transparent focus:border-black/5 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold transition-all outline-none" />
                                        </div>
                                    )}

                                    {/* Ambassador Details */}
                                    {(editData.role?.toLowerCase() === 'ambassador' || editData.isAmbassador || editData.referralCode) && (
                                        <>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Referral Code</label>
                                                <input type="text" value={editData.referralCode || ""} 
                                                    onChange={e => setEditData({...editData, referralCode: e.target.value.toUpperCase()})}
                                                    className="w-full bg-gray-50 border border-transparent focus:border-black/5 focus:bg-white rounded-2xl px-5 py-4 text-sm font-black tracking-widest transition-all outline-none" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Current Earnings (₹)</label>
                                                <input type="number" value={editData.earnings || 0} 
                                                    onChange={e => setEditData({...editData, earnings: Number(e.target.value)})}
                                                    className="w-full bg-emerald-50/50 border border-transparent focus:border-emerald-200 focus:bg-white rounded-2xl px-5 py-4 text-sm font-black text-emerald-600 transition-all outline-none" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Commission %</label>
                                                <input type="number" value={editData.commissionPercentage || 0} 
                                                    onChange={e => setEditData({...editData, commissionPercentage: Number(e.target.value)})}
                                                    className="w-full bg-gray-50 border border-transparent focus:border-black/5 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold transition-all outline-none" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Intern Discount %</label>
                                                <input type="number" value={editData.discountPercentage || 0} 
                                                    onChange={e => setEditData({...editData, discountPercentage: Number(e.target.value)})}
                                                    className="w-full bg-gray-50 border border-transparent focus:border-black/5 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold transition-all outline-none" />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-8 border-t border-gray-50 flex gap-4 bg-gray-50/50">
                                <button onClick={() => setShowEditModal(false)}
                                    className="flex-1 py-4 bg-white border border-gray-200 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all">
                                    Cancel
                                </button>
                                <button onClick={async () => {
                                    setSavingEdit(true);
                                    try {
                                        const res = await fetch(`/api/admin/users/${id}`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify(editData)
                                        });
                                        if (res.ok) {
                                            toast.success('Information updated successfully');
                                            setUser(editData);
                                            setShowEditModal(false);
                                        } else {
                                            const err = await res.json();
                                            toast.error(err.message || 'Update failed');
                                        }
                                    } catch { toast.error('Error saving changes'); }
                                    finally { setSavingEdit(false); }
                                }} disabled={savingEdit}
                                    className="flex-1 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/10 disabled:opacity-50">
                                    {savingEdit ? 'Updating...' : 'Save Changes'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* ── Cancellation Report Modal ── */}
                {showCancellationReportModal && (
                    <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                            onClick={() => setShowCancellationReportModal(false)}
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 220 }}
                            className="relative w-full max-w-xl h-full bg-white shadow-2xl p-12 flex flex-col justify-between border-l border-gray-100 z-10"
                        >
                            <div className="space-y-10 flex-1 flex flex-col justify-start">
                                {/* Top Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-red-500 rounded-full" />
                                        <h3 className="text-xl font-black text-gray-900 tracking-tighter uppercase leading-none">
                                            cancellation report
                                        </h3>
                                    </div>
                           
                                </div>

                                {/* Warning text */}
                                <div className="p-6 bg-red-50/50 rounded-3xl border border-red-100/50 space-y-2">
                                    <p className="text-[11px] font-black text-red-600 uppercase tracking-widest">Crucial Notice</p>
                                    <p className="text-[12px] text-red-600/80 font-bold leading-relaxed">
                                        This intern has voluntarily exited the program. Their portal access is revoked.
                                    </p>
                                </div>

                                {/* Middle Content */}
                                <div className="space-y-3 flex-1 flex flex-col">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                        Reason for leaving the program
                                    </label>
                                    <div className="w-full flex-1 p-6 bg-gray-50 border border-gray-100 rounded-[2rem] text-sm font-bold leading-relaxed overflow-y-auto max-h-[400px]">
                                        {user.cancelReason || "No explanation reason was submitted."}
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Exit Button */}
                            <div className="pt-8 border-t border-gray-50">
                                <button
                                    onClick={() => setShowCancellationReportModal(false)}
                                    className="w-full py-5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 active:scale-98"
                                >
                                    Close Report
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
