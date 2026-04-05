"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    UserPlus,
    Shield,
    RefreshCw,
    Eye,
    EyeOff,
    Users,
    CheckCircle,
    Clock,
    ShieldCheck,
    Search,
    Filter,
    Check,
    X,
    RefreshCcw,
    AlertCircle,
    MoreHorizontal,
    Mail,
    Calendar,
    ChevronDown,
    Building,
    UserCircle,
    ChevronRight,
    ArrowLeft,
    ArrowRight,
    Target,
    Brain,
    FolderGit2,
    Code2,
    Cpu,
    Briefcase,
    Phone,
    Activity,
    Smile,
    Trash2
} from "lucide-react";
import { toast } from "react-hot-toast";

const dicebear = (seed) => `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent`;

export default function UnifiedUsersPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('database'); 
    const [admins, setAdmins] = useState([]);
    const [interns, setInterns] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- State Persistence ---
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedTab = sessionStorage.getItem('us_activeTab');
            if (savedTab) setActiveTab(savedTab);
        }
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('us_activeTab', activeTab);
        }
    }, [activeTab]);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState('newest');
    const [userFilter, setUserFilter] = useState('all'); // 'intern', 'admin', 'all'
    const [tracks, setTracks] = useState([]);

    // Detail View State
    const [viewingUserId, setViewingUserId] = useState(null);
    const [selectedUserData, setSelectedUserData] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Aadhaar View State
    const [viewingAadhaarUser, setViewingAadhaarUser] = useState(null);

    // Password Generation Utility
    const generateRandomPassword = () => {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let retVal = "";
        for (let i = 0; i < 12; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return retVal;
    };

    // Form state
    const [adminForm, setAdminForm] = useState({
        fullName: "",
        email: "",
        phone: "",
        password: generateRandomPassword(),
        role: "intern",
        track: ""
    });

    useEffect(() => {
        fetchUsers();
        fetchTracks();
    }, []);

    const fetchTracks = async () => {
        try {
            const res = await fetch('/api/admin/tracks');
            if (res.ok) {
                const data = await res.json();
                const allTracks = [...(data.CODING || []), ...(data.RESEARCH || [])];
                setTracks(allTracks);
                if (allTracks.length > 0) {
                    setAdminForm(prev => ({ ...prev, track: allTracks[0].name }));
                }
            }
        } catch (error) { console.error("Network Failure connecting to Track Central", error); }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/users");
            if (res.ok) {
                const users = await res.json();
                setAdmins(users.filter(u => u.role === 'admin'));
                setInterns(users.filter(u => u.role === 'intern'));
            }
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const handleUpdateStatus = async (email, newStatus) => {
        const tid = toast.loading(`Updating...`);
        try {
            const res = await fetch("/api/admin/user/update-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, status: newStatus }),
            });
            if (res.ok) {
                toast.success(`Success`, { id: tid });
                fetchUsers();
            }
        } catch (error) { toast.error("Error", { id: tid }); }
    };

    const handleViewUserDetail = async (userId) => {
        setViewingUserId(userId);
        setLoadingDetail(true);
        setSelectedUserData(null);
        try {
            // Find base user info first
            const user = interns.find(i => i._id === userId) || admins.find(a => a._id === userId);
            
            const res = await fetch(`/api/admin/users/result?userId=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedUserData({ ...data, user });
            } else {
                toast.error("Telemetry Retrieval Failed");
                setViewingUserId(null);
            }
        } catch (error) {
            toast.error("Network Link Error");
            setViewingUserId(null);
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        const tid = toast.loading("Executing User Creation Protocol...");
        try {
            const requestedBy = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
            const res = await fetch("/api/admin/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...adminForm, requestedBy }),
            });

            if (res.ok) {
                toast.success(`Access Protocol ACTIVE. Password: ${adminForm.password}`, { 
                    id: tid,
                    duration: 10000 
                });
                setAdminForm({ 
                    fullName: "", 
                    email: "", 
                    phone: "", 
                    password: generateRandomPassword(),
                    role: "intern",
                    track: tracks.length > 0 ? tracks[0].name : ""
                });
                fetchUsers();
                setActiveTab('database');
            } else {
                const data = await res.json();
                toast.error(data.message || "Protocol Failure", { id: tid });
            }
        } catch (error) {
            toast.error("Security Error during creation", { id: tid });
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm("CRITICAL WARNING: Are you ready to PERMANENTLY revoke access and DELETE this administrative record? This action cannot be reversed.")) return;
        
        const tid = toast.loading("Executing Access Revocation...");
        try {
            const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Security Node PURGED Successfully", { id: tid });
                fetchUsers();
            } else {
                toast.error("Deletion Sequence Failed", { id: tid });
            }
        } catch {
            toast.error("Network Link Unstable during deletion", { id: tid });
        }
    };

    if (viewingUserId) {
        return (
            <UserDetailView 
                data={selectedUserData} 
                loading={loadingDetail} 
                onBack={() => setViewingUserId(null)} 
            />
        );
    }

    const allUsers = [...interns, ...admins];

    const filteredUsers = allUsers
        .filter(u => userFilter === 'all' || u.role === userFilter)
        .filter(u =>
            u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.track?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === 'score') return (b.assessmentScore || 0) - (a.assessmentScore || 0);
            if (sortBy === 'name') return (a.fullName || '').localeCompare(b.fullName || '');
            if (sortBy === 'role') return (a.role || '').localeCompare(b.role || '');
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });

    return (
        <div className="animate-in fade-in duration-500">
            {/* Standardized Tactical Header */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-3xl -mx-8 -mt-8 px-8 py-5 border-b border-gray-100 shadow-sm mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-8 bg-black rounded-full" />
                        <h1 className="text-2xl font-black text-black tracking-tighter uppercase leading-none">
                            Users
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex bg-gray-50/50 p-1 rounded-xl border border-gray-100 shadow-sm">
                            {[
                                { id: 'database', label: 'Database Access' },
                                { id: 'add', label: 'Provision Entry' }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                        activeTab === item.id 
                                        ? 'bg-black text-white shadow-xl' 
                                        : 'text-gray-400 hover:text-black hover:bg-white'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={fetchUsers}
                            disabled={loading}
                            className={`p-2.5 bg-gray-50 hover:bg-black hover:text-white rounded-xl transition-all border border-gray-100 shadow-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </header>

            <div className="px-8 pb-20">

            {activeTab === 'database' ? (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300 pt-6">
                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
                        <div className="p-5 border-b border-gray-50 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Building className="w-5 h-5 text-black" />
                                <h2 className="text-xs font-black text-black uppercase tracking-[0.2em]">Candidate Archives</h2>
                            </div>
                            
                            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
                                <div className="relative flex-shrink-0">
                                    <select
                                        value={userFilter}
                                        onChange={(e) => setUserFilter(e.target.value)}
                                        className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-black/5 transition-all cursor-pointer shadow-sm appearance-none min-w-[120px]"
                                    >
                                        <option value="all">All Users</option>
                                        <option value="intern">Interns Only</option>
                                        <option value="admin">Admins Only</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                </div>
                                <div className="relative flex-1 sm:min-w-[240px]">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Audit records..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-white border border-gray-100 rounded-xl pl-11 pr-4 py-2 text-[10px] font-bold focus:ring-4 focus:ring-black/5 outline-none transition-all shadow-sm"
                                    />
                                </div>
                                <div className="relative flex-shrink-0">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-black/5 transition-all cursor-pointer shadow-sm appearance-none min-w-[140px]"
                                    >
                                        <option value="newest">By Recent</option>
                                        <option value="role">By Role</option>
                                        <option value="name">By Lexical</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/30">
                                    <tr>
                                        <th className="p-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">User Name</th>
                                        <th className="p-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Role / Track</th>
                                        <th className="p-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Status</th>
                                        <th className="p-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        Array(3).fill(0).map((_, i) => <tr key={i}><td colSpan="4" className="p-8 animate-pulse"><div className="h-2 bg-gray-50 rounded-lg w-full" /></td></tr>)
                                    ) : filteredUsers.length === 0 ? (
                                        <tr><td colSpan="4" className="p-32 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">No Candidate Intelligence FOUND</td></tr>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <tr key={user._id} className="group hover:bg-gray-50/50 transition-all cursor-pointer" onClick={() => router.push(`/admin/users/${user._id}`)}>
                                                <td className="p-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-2xl overflow-hidden border-2 shadow-sm transition-transform group-hover:scale-105 flex items-center justify-center bg-gray-50 ${user.role === 'admin' ? 'border-purple-100' : 'border-gray-100'}`}>
                                                            <img 
                                                                src={user.profilePicture || dicebear(user.avatarSeed || user.fullName?.split(' ')[0] || "User")} 
                                                                alt="U" 
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => { e.target.src = dicebear("User"); }}
                                                            />
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <p className="text-xs font-black text-black uppercase tracking-tight flex items-center gap-2">
                                                                {user.fullName}
                                                                {user.role === 'admin' && <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded text-[7px] font-black tracking-widest uppercase">Admin</span>}
                                                            </p>
                                                            <p className="text-[9px] font-bold text-gray-400 tracking-tight flex items-center gap-1.5"><Mail className="w-3 h-3 text-gray-200" /> {user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-center">
                                                    <span className="text-[9px] font-black uppercase bg-gray-50 px-3 py-1.5 rounded-lg text-black border border-gray-100 tracking-widest">
                                                        {user.role === 'admin' ? 'Admin / Overseer' : (user.track || '--')}
                                                    </span>
                                                </td>
                                                <td className="p-6 text-center flex flex-col items-center justify-center space-y-1">
                                                    <SelectionBadge status={user.status} />
                                                    {user.selectionStatus === 'Access given by admin' && (
                                                        <span className="text-[8px] font-black uppercase text-blue-500 tracking-widest">Admin Granted</span>
                                                        )}
                                                </td>
                                                <td className="p-6 text-right" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-end gap-2 transition-all">
                                                        {user.status === 'ASSESSMENT_COMPLETED' && (
                                                            <>
                                                                <button onClick={() => handleUpdateStatus(user.email, 'SELECTED')} className="p-2 bg-black text-white hover:bg-gray-800 rounded-lg transition-all shadow-sm"><Check className="w-4 h-4" /></button>
                                                                <button onClick={() => handleUpdateStatus(user.email, 'REJECTED')} className="p-2 bg-white border border-gray-100 text-black hover:bg-gray-50 rounded-lg transition-all shadow-sm"><X className="w-4 h-4" /></button>
                                                            </>
                                                        )}
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteUser(user._id); }}
                                                            className="p-2 bg-white border border-gray-100 text-gray-300 hover:text-red-500 hover:border-red-500 rounded-lg transition-all shadow-sm group"
                                                            title="Purge Identity Access"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); router.push(`/admin/users/${user._id}`); }}
                                                            className="p-2 bg-white border border-gray-100 text-gray-300 hover:text-black hover:border-black rounded-lg transition-all shadow-sm"
                                                            title="View Full Profile"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-2 duration-300 pt-6">
                    <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm h-fit">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="p-3.5 bg-black text-white rounded-xl shadow-lg">
                                <UserPlus className="w-6 h-6" />
                            </div>
                            <h2 className="text-sm font-black text-black uppercase tracking-[0.2em]">Add User</h2>
                        </div>

                        <form onSubmit={handleCreateAdmin} className="space-y-7">
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Access Level</label>
                                    <div className="relative">
                                        <select
                                            className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-xl focus:ring-8 focus:ring-black/5 text-black font-bold text-[11px] uppercase tracking-widest shadow-inner appearance-none cursor-pointer"
                                            value={adminForm.role}
                                            onChange={e => setAdminForm({ ...adminForm, role: e.target.value })}
                                            required
                                        >
                                            <option value="intern">Intern Candidate</option>
                                            <option value="admin">Administrator</option>
                                        </select>
                                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                                
                                {adminForm.role === 'intern' && (
                                    <div className="space-y-2 animate-in slide-in-from-top-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Assigned Pathway</label>
                                        <div className="relative">
                                            <select
                                                className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-xl focus:ring-8 focus:ring-black/5 text-black font-bold text-[11px] uppercase tracking-widest shadow-inner appearance-none cursor-pointer"
                                                value={adminForm.track}
                                                onChange={e => setAdminForm({ ...adminForm, track: e.target.value })}
                                                required
                                            >
                                                {tracks.map(t => <option key={t._id} value={t.name}>{t.name}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Permanent Identity</label>
                                    <input
                                        className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-xl focus:ring-8 focus:ring-black/5 text-black font-bold text-[11px] shadow-inner"
                                        placeholder="Full Name"
                                        value={adminForm.fullName}
                                        onChange={e => setAdminForm({ ...adminForm, fullName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Secure Mail</label>
                                    <input
                                        className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-xl focus:ring-8 focus:ring-black/5 text-black font-bold text-[11px] shadow-inner"
                                        placeholder="Email Address"
                                        type="email"
                                        value={adminForm.email}
                                        onChange={e => setAdminForm({ ...adminForm, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Mobile Reference</label>
                                    <input
                                        className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-xl focus:ring-8 focus:ring-black/5 text-black font-bold text-[11px] shadow-inner"
                                        placeholder="Phone Number"
                                        value={adminForm.phone}
                                        onChange={e => setAdminForm({ ...adminForm, phone: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-black text-white py-5 rounded-xl font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-neutral-800 transition-all text-[11px] mt-2 flex items-center justify-center gap-3">
                                COMMIT {adminForm.role === 'admin' ? 'ADMIN' : 'INTERN'} ACCESS <ArrowRight className="w-4 h-4" />
                            </button>
                        </form>
                    </div>

                    <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm h-fit">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gray-50 text-black border border-gray-100 rounded-xl shadow-sm">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <h2 className="text-sm font-black text-black uppercase tracking-[0.2em]">Active Admin</h2>
                            </div>
                            <button
                                onClick={fetchUsers}
                                className="p-3 bg-gray-50 rounded-xl hover:bg-black hover:text-white text-gray-400 transition-all border border-gray-100 shadow-sm"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {admins.map((admin) => (
                                <div key={admin._id} className="flex items-center justify-between p-5 bg-gray-50/50 rounded-2xl border border-transparent hover:border-gray-100 hover:bg-white transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center text-xs font-black shadow-lg">
                                            {admin.fullName?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-black uppercase tracking-tight mb-0.5">{admin.fullName}</p>
                                            <p className="text-[9px] text-gray-400 font-bold tracking-tight">{admin.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => handleDeleteUser(admin._id)}
                                            className="p-2 text-gray-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                            title="Revoke Admin Access"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 bg-black text-white rounded-lg">Admin</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Aadhaar Modal */}
            {viewingAadhaarUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewingAadhaarUser(null)}></div>
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                                    <ShieldCheck className="w-6 h-6 text-black" /> Identity Document
                                </h3>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                                    Candidate: {viewingAadhaarUser.fullName}
                                </p>
                            </div>
                            <button 
                                onClick={() => setViewingAadhaarUser(null)}
                                className="w-10 h-10 bg-white border border-gray-100 text-gray-400 hover:text-black rounded-xl flex items-center justify-center shadow-sm transition-all hover:bg-gray-50 hover:-rotate-90"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-6">
                            <div className="flex flex-col md:flex-row gap-6 w-full items-start">
                                {/* Passport Photo */}
                                <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 flex-shrink-0 mx-auto md:mx-0 w-full md:w-auto flex flex-col items-center justify-center">
                                    <img 
                                        src={viewingAadhaarUser.passportPhoto || viewingAadhaarUser.profilePicture || ""} 
                                        alt="Passport Photo" 
                                        className="w-32 h-40 object-cover rounded-2xl shadow-sm border border-gray-200 bg-white"
                                        onError={(e) => { 
                                            e.target.onerror = null; 
                                            e.target.src = 'https://placehold.co/400x500?text=No+Photo' 
                                        }}
                                        crossOrigin="anonymous"
                                    />
                                    <p className="text-center mt-3 text-[9px] font-black uppercase text-gray-400 tracking-widest">Candidate Photo</p>
                                </div>

                                {/* Aadhaar Card */}
                                <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 flex-grow flex flex-col items-center justify-center w-full min-h-[192px]">
                                    <img 
                                        src={viewingAadhaarUser.aadhaarCard || ""} 
                                        alt="Aadhaar Card" 
                                        className="max-h-40 object-contain rounded-2xl shadow-sm border border-gray-200"
                                        onError={(e) => { 
                                            e.target.onerror = null; 
                                            e.target.src = 'https://placehold.co/800x500?text=No+ID+Card' 
                                        }}
                                        crossOrigin="anonymous"
                                    />
                                    <p className="text-center mt-3 text-[9px] font-black uppercase text-gray-400 tracking-widest">Aadhaar Card</p>
                                </div>
                            </div>

                            <div className="bg-black text-white p-6 rounded-3xl flex items-center justify-between shadow-inner w-full">
                                <div>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-1">Authenticated Number</p>
                                    <p className="text-2xl font-black tracking-widest font-mono">
                                        {viewingAadhaarUser.aadhaarNumber?.replace(/(.{4})/g, '$1 ') || 'XXXX XXXX XXXX'}
                                    </p>
                                </div>
                                <ShieldCheck className="w-10 h-10 text-emerald-400 opacity-80" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}

function UserDetailView({ data, loading, onBack }) {
    if (loading) {
        return (
            <div className="py-32 flex flex-col items-center justify-center gap-6 animate-in fade-in">
                <RefreshCw className="w-12 h-12 animate-spin text-black" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-300">Retrieving Vault Data...</p>
            </div>
        );
    }

    if (!data) return null;

    const { user, assessment, projects } = data;

    return (
        <div className="space-y-12 animate-in slide-in-from-right-4 duration-500 pb-32">
            {/* Navigation Header */}
            <button 
                onClick={onBack}
                className="flex items-center gap-3 text-gray-400 hover:text-black transition-colors group mb-4"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-[11px] font-black uppercase tracking-widest">Back to Users</span>
            </button>

            {/* Profile Header Block */}
            <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
                <div className="w-32 h-32 rounded-3xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden relative z-10 shadow-xl">
                    <img 
                        src={user?.profilePicture || dicebear(user?.avatarSeed || user?.fullName?.split(' ')[0] || "User")} 
                        alt="Profile" 
                        className="w-full h-full object-cover scale-110"
                        onError={(e) => { e.target.src = dicebear("User"); }}
                    />
                </div>

                <div className="flex-1 space-y-8 relative z-10 w-full">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <h2 className="text-4xl font-black text-black tracking-tighter uppercase">{user?.fullName || "Identity Unknown"}</h2>
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-black/5 text-black text-[9px] font-black uppercase rounded-lg">ADMIN</span>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase rounded-lg flex items-center gap-1.5 border border-emerald-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-gray-400 hover:text-black transition-colors">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm font-bold tracking-tight">{user?.email}</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 py-8">
                        <ProfileMeta label="TRACK" value={user?.track || "Web Development"} />
                        <ProfileMeta label="PHONE" value={user?.phone || "+91 9342560109"} />
                        <ProfileMeta label="DURATION" value="Permanent" />
                        <ProfileMeta label="INTERNSHIP PERIOD" value={`${new Date(user?.createdAt).toLocaleDateString()} — Feb 20, 2026`} />
                    </div>
                </div>
            </div>

            {/* Content Section: Submitted Projects */}
            <div className="space-y-8">
                <div className="flex items-center gap-4 ml-6">
                    <Activity className="w-5 h-5 text-black" />
                    <h3 className="text-lg font-black text-black uppercase tracking-tighter">Submitted Projects</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {projects.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-200">
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No deployed assets discovered</p>
                        </div>
                    ) : (
                        projects.map((proj, idx) => (
                            <div key={idx} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-black/5 transition-all group">
                                <div className="flex items-center justify-between mb-8">
                                    <h4 className="text-xl font-black text-black tracking-tight uppercase">{proj.projectName}</h4>
                                    <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase rounded-xl border border-emerald-100">
                                        APPROVED
                                    </span>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Progress</span>
                                        <span className="text-sm font-black text-black">{proj.progress || 0}%</span>
                                    </div>
                                    <div className="h-2.5 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-0.5">
                                        <div 
                                            className="h-full bg-black rounded-full transition-all duration-1000" 
                                            style={{ width: `${proj.progress || 0}%` }} 
                                        />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function ProfileMeta({ label, value }) {
    return (
        <div className="space-y-1.5">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{label}</p>
            <p className="text-xs font-black text-black uppercase tracking-tight">{value}</p>
        </div>
    );
}

function SelectionBadge({ status }) {
    if (!status) return <span className="text-[10px] font-black text-gray-200">--</span>;
    const config = {
        'NEW': 'bg-gray-50 text-gray-400 border-gray-100',
        'OTP_VERIFIED': 'bg-white text-gray-600 border-gray-200',
        'ASSESSMENT_COMPLETED': 'bg-white text-black border-black/10 text-black',
        'SELECTED': 'bg-black text-white border-transparent',
        'REJECTED': 'bg-gray-100 text-gray-300 border-transparent',
        'PROFILE_PENDING': 'bg-white text-gray-400 border-gray-100',
        'VERIFIED': 'bg-white text-black border-black/20',
        'ACTIVE': 'bg-black text-white border-transparent shadow-md'
    };
    const style = config[status] || 'bg-white text-gray-400 border-gray-100';
    return (
        <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${style} whitespace-nowrap inline-block`}>
            {status.replace(/_/g, ' ')}
        </span>
    );
}
