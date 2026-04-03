"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft, Mail, Calendar, Phone, Award, Activity, User,
    CheckCircle, RefreshCw, UserCog, ChevronDown, ShieldOff, ShieldCheck, X, AlertTriangle,
    Github, ExternalLink, KeyRound, Copy, Eye, EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import CertificateIssuer from "@/components/CertificateIssuer";



export default function InternDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id;

    const [user, setUser] = useState(null);
    const [projects, setProjects] = useState([]);
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

    // Password reset state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [resettingPassword, setResettingPassword] = useState(false);
    const [newPassword, setNewPassword] = useState(null);
    const [showNewPassword, setShowNewPassword] = useState(false);

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
                    const saved = data.user?.assignedAdmin || 'gauthamram.um@gmail.com';
                    setAssignedAdmin(saved);
                    setPendingAdmin(saved);
                }
                if (adminsRes.ok) {
                    const all = await adminsRes.json();
                    setAdmins(all.filter(u => u.role === 'admin'));
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

    return (
        <div className="-mt-8 -mx-8">

            {/* ── Profile Header ── */}
            <div className={`bg-white px-8 pt-8 pb-12 border-b border-gray-100 shadow-sm relative overflow-hidden ${isTerminated ? 'opacity-80' : ''}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-emerald-50/50 pointer-events-none" />

                {/* Top bar */}
                <div className="w-full relative z-10 flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <button onClick={() => router.push('/admin/users')}
                        className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-black transition-colors w-fit">
                        <ArrowLeft className="w-4 h-4" /> Back to Users
                    </button>

                    <div className="flex items-center gap-3">
                        {/* Unified Certificates Button */}
                        <button onClick={() => setShowCertsListModal(true)}
                            className="bg-gray-50 text-gray-600 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all flex items-center gap-2 border border-gray-200 shadow-sm">
                            <Award className="w-4 h-4" /> Certificates{certificates.length > 0 && <span className="bg-black text-white text-[8px] px-1.5 py-0.5 rounded-full ml-1">{certificates.length}</span>}
                        </button>
                        {/* Change Password */}
                        <button onClick={() => { setShowPasswordModal(true); setNewPassword(null); setShowNewPassword(false); }}
                            className="bg-amber-50 text-amber-600 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-600 hover:text-white transition-all flex items-center gap-2 border border-amber-100 shadow-sm">
                            <KeyRound className="w-4 h-4" /> Change Password
                        </button>
                        {/* Terminate / Reactivate */}
                        {isTerminated ? (
                            <button onClick={handleReactivate}
                                className="bg-blue-50 text-blue-600 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 border border-blue-100 shadow-sm">
                                <ShieldCheck className="w-4 h-4" /> Reactivate
                            </button>
                        ) : (
                            <button onClick={() => setShowTerminateModal(true)}
                                className="bg-red-50 text-red-600 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center gap-2 border border-red-100 shadow-sm">
                                <ShieldOff className="w-4 h-4" /> Terminate
                            </button>
                        )}
                    </div>
                </div>

                {/* Avatar + Info */}
                <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                    <div className="w-32 h-32 md:w-40 md:h-40 bg-gray-50 rounded-[2.5rem] border-2 border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-center shrink-0 z-20">
                        {user.profilePicture ? (
                            <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover rounded-[2.5rem]" />
                        ) : (
                            <User className="w-12 h-12 text-gray-300" strokeWidth={1.5} />
                        )}
                    </div>

                    <div className="flex-1 space-y-5 w-full pt-2">
                        <div>
                            <div className="flex items-center gap-3 mb-1 flex-wrap">
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight">{user.fullName}</h1>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold border ${user.role?.toLowerCase() === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                    {user.role}
                                </span>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${isTerminated ? 'text-red-700 bg-red-50 border border-red-100' :
                                    user.status === 'Active' ? 'text-green-700 bg-green-50 border border-green-100' :
                                        'text-gray-500 bg-gray-100 border border-gray-200'
                                    }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${isTerminated ? 'bg-red-500' : user.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                                    {user.status || 'Active'}
                                </span>
                            </div>
                            <p className="text-sm font-bold text-gray-400 flex items-center gap-2">
                                <Mail className="w-4 h-4" /> {user.email}
                            </p>
                        </div>

                        {/* Stats grid — 5 cols on md, now includes Assigned Admin */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 pt-5 border-t border-gray-50">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Track</p>
                                <p className="text-sm font-bold text-gray-900">{user.track || 'Unassigned'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Phone</p>
                                <p className="text-sm font-bold text-gray-900 flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-gray-400" /> {user.phone || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Duration</p>
                                <p className="text-sm font-bold text-gray-900">{user.duration || 'N/A'}</p>
                            </div>

                            {/* ── Assigned Admin (inline, clickable) ── */}
                            {user.role?.toLowerCase() === 'intern' && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 flex items-center gap-1">
                                        <UserCog className="w-3 h-3" /> Assigned Admin
                                    </p>
                                    <button
                                        onClick={() => { setPendingAdmin(assignedAdmin); setShowAdminModal(true); }}
                                        className="text-sm font-black text-black hover:text-blue-600 flex items-center gap-1 underline-offset-2 hover:underline transition-colors"
                                    >
                                        {getAdminLabel()}
                                        <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                                    </button>
                                    <p className="text-[9px] text-gray-400 font-medium mt-0.5">Click to change</p>
                                </div>
                            )}

                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Internship Period</p>
                                <p className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {new Date(user.joinDate).toLocaleDateString()} → {calculateEndDate(user.joinDate, user.duration)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Projects ── */}
            <div className="p-8 space-y-6">
                <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                    <Activity className="w-5 h-5" /> Submitted Projects
                </h2>
                {projects.length === 0 ? (
                    <div className="bg-white border border-gray-100 p-8 rounded-3xl text-center text-gray-500 font-medium">
                        This intern hasn't submitted any projects yet.
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
                                        <p className="text-sm text-gray-700 font-medium leading-relaxed">
                                            This will generate a <strong>new random password</strong> for <strong>{user.fullName}</strong> and email it to:
                                        </p>
                                        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
                                            <Mail className="w-5 h-5 text-gray-400 shrink-0" />
                                            <span className="text-sm font-bold text-gray-800 truncate">{user.email}</span>
                                        </div>
                                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-1">
                                            <p className="text-xs font-black text-amber-700">⚠️ Important:</p>
                                            <ul className="text-xs text-amber-600 font-medium space-y-0.5 list-disc list-inside">
                                                <li>The old password will stop working immediately</li>
                                                <li>New password will be emailed to the intern</li>
                                                <li>You will also see it on-screen after reset</li>
                                            </ul>
                                        </div>
                                        <div className="flex gap-3 pt-2">
                                            <button onClick={() => setShowPasswordModal(false)}
                                                className="flex-1 py-3 bg-gray-50 text-gray-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all">
                                                Cancel
                                            </button>
                                            <button onClick={handleResetPassword} disabled={resettingPassword}
                                                className="flex-1 py-3 bg-amber-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-amber-600 transition-all disabled:opacity-50 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2">
                                                {resettingPassword ? (
                                                    <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Resetting...</>
                                                ) : (
                                                    <><KeyRound className="w-3.5 h-3.5" /> Reset Now</>
                                                )}
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-center space-y-2">
                                            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                                                <CheckCircle className="w-7 h-7 text-emerald-600" />
                                            </div>
                                            <p className="text-sm font-black text-emerald-700 uppercase tracking-widest">Password Reset Successful</p>
                                            <p className="text-xs text-gray-500 font-medium">Email sent to {user.email}</p>
                                        </div>
                                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-3">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">New Password</p>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 font-mono text-lg font-black tracking-widest text-gray-900 overflow-hidden">
                                                    {showNewPassword ? newPassword : '••••••••••••'}
                                                </div>
                                                <button onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-400 hover:text-black transition-all shrink-0"
                                                    title={showNewPassword ? "Hide" : "Show"}>
                                                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                                <button onClick={() => copyToClipboard(newPassword)}
                                                    className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center hover:scale-105 transition-all shrink-0 shadow-lg"
                                                    title="Copy to clipboard">
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <button onClick={() => setShowPasswordModal(false)}
                                            className="w-full py-3 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg">
                                            Done
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
