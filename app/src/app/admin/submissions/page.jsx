"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, RefreshCw, UserCheck, UserX, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminAssessmentSubmissionsPage() {
    const router = useRouter();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterTrack, setFilterTrack] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [sortBy, setSortBy] = useState('date_new');
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        const userRole = localStorage.getItem('userRole');
        if (userRole !== 'admin') {
            router.push('/login');
            return;
        }
        fetchSubmissions();
    }, [router]);

    const fetchSubmissions = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/assessments');
            if (res.ok) {
                const data = await res.json();
                setSubmissions(data.assessments || []);
            } else {
                toast.error('Failed to load submissions');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error fetching submissions');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (userId, status) => {
        try {
            const res = await fetch('/api/admin/assessments/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, status })
            });

            if (res.ok) {
                toast.success(`Candidate ${status === 'Selected' ? 'Approved' : 'Rejected'}`);
                fetchSubmissions();
            } else {
                toast.error('Failed to update status');
            }
        } catch (err) {
            toast.error('Error updating status');
        }
    };

    const handleBulkAction = async (status) => {
        if (selectedIds.length === 0) return;
        
        const loadingToast = toast.loading(`${status === 'Selected' ? 'Approving' : 'Rejecting'} candidates...`);
        try {
            // Processing in batches or one by one for simplicity (can be optimized)
            for (const id of selectedIds) {
                await fetch('/api/admin/assessments/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: id, status })
                });
            }
            toast.success(`Mass ${status === 'Selected' ? 'Approval' : 'Rejection'} complete`, { id: loadingToast });
            setSelectedIds([]);
            fetchSubmissions();
        } catch (err) {
            toast.error('Mass update failed', { id: loadingToast });
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filtered.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filtered.map(s => s._id));
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    // Filter submissions
    let filtered = [...submissions];
    if (filterTrack) filtered = filtered.filter(s => s.track === filterTrack);
    if (filterStatus) filtered = filtered.filter(s => s.selectionStatus === filterStatus);

    // Sort submissions
    if (sortBy === 'score_asc') {
        filtered.sort((a, b) => a.assessmentScore - b.assessmentScore);
    } else if (sortBy === 'score_desc') {
        filtered.sort((a, b) => b.assessmentScore - a.assessmentScore);
    } else if (sortBy === 'date_new') {
        filtered.sort((a, b) => new Date(b.assessmentDate) - new Date(a.assessmentDate));
    } else if (sortBy === 'date_old') {
        filtered.sort((a, b) => new Date(a.assessmentDate) - new Date(b.assessmentDate));
    }

    const stats = {
        total: submissions.length,
        above75: submissions.filter(s => s.assessmentScore >= 75).length,
        below75: submissions.filter(s => s.assessmentScore < 75).length,
        selected: submissions.filter(s => s.selectionStatus === 'Selected').length
    };

    if (loading) return (
        <div className="animate-in fade-in duration-500">
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-3xl -mx-8 -mt-8 px-8 py-5 border-b border-gray-100 mb-8">
                <div className="flex items-center justify-between px-4">
                    <div className="h-6 bg-gray-200 rounded w-40 animate-pulse" />
                    <div className="h-10 w-10 bg-gray-100 rounded-xl animate-pulse" />
                </div>
            </header>
            <div className="px-8 pb-20 max-w-[1750px] mx-auto space-y-10 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 space-y-3">
                            <div className="h-2.5 bg-gray-100 rounded w-24" />
                            <div className="h-12 bg-gray-200 rounded-xl w-20" />
                        </div>
                    ))}
                </div>
                <div className="bg-white rounded-[3rem] border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-10 py-6 flex gap-8">
                        <div className="h-4 bg-gray-200 rounded w-20" />
                        <div className="h-4 bg-gray-200 rounded w-24" />
                        <div className="h-4 bg-gray-200 rounded w-16" />
                        <div className="h-4 bg-gray-200 rounded w-16" />
                        <div className="h-4 bg-gray-200 rounded w-16" />
                    </div>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="px-10 py-8 border-b border-gray-50 flex items-center gap-8">
                            <div className="w-5 h-5 bg-gray-100 rounded" />
                            <div className="flex-1 space-y-1.5">
                                <div className="h-4 bg-gray-200 rounded w-40" />
                                <div className="h-3 bg-gray-100 rounded w-52" />
                            </div>
                            <div className="h-5 bg-gray-100 rounded-lg w-24" />
                            <div className="h-8 bg-gray-200 rounded-xl w-16" />
                            <div className="h-5 bg-gray-100 rounded-xl w-20" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="animate-in fade-in duration-500">
            {/* Standardized Tactical Header */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-3xl -mx-8 -mt-8 px-8 py-5 border-b border-gray-100 shadow-sm mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-8 bg-black rounded-full" />
                        <h1 className="text-2xl font-black text-black tracking-tighter uppercase leading-none">
                            Submissions Intelligence
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Pipeline Active</span>
                        </div>
                        <button
                            onClick={fetchSubmissions}
                            disabled={loading}
                            className={`p-2.5 bg-gray-50 hover:bg-black hover:text-white rounded-xl transition-all border border-gray-100 shadow-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </header>

            <div className="px-8 pb-20 max-w-[1750px] mx-auto space-y-10">

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Submissions', val: stats.total, color: 'text-slate-900' },
                        { label: 'Above 75%', val: stats.above75, color: 'text-green-600' },
                        { label: 'Below 75%', val: stats.below75, color: 'text-red-600' },
                        { label: 'Final Selected', val: stats.selected, color: 'text-blue-600' }
                    ].map((s, idx) => (
                        <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm leading-tight">
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">{s.label}</p>
                            <p className={`text-5xl font-black ${s.color}`}>{s.val}</p>
                        </div>
                    ))}
                </div>

                {/* Controls & Bulk Actions */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
                    <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
                        <div className="flex gap-4 w-full md:w-auto">
                            <select value={filterTrack} onChange={e => setFilterTrack(e.target.value)} className="bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold text-sm outline-none focus:ring-2 ring-black transition-all">
                                <option value="">All Tracks</option>
                                <option value="Web Development">Web Development</option>
                                <option value="App Development">App Development</option>
                                <option value="Blockchain/Web3">Blockchain/Web3</option>
                                <option value="Gen AI">Gen AI</option>
                                <option value="AI/ML">AI/ML</option>
                                <option value="Cybersecurity">Cybersecurity</option>
                                <option value="Robotics">Robotics</option>
                            </select>
                            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold text-sm outline-none focus:ring-2 ring-black transition-all">
                                <option value="">All Statuses</option>
                                <option value="Pending Selection (24h Buffer)">Pending</option>
                                <option value="Selected">Selected</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>

                        {selectedIds.length > 0 && (
                            <div className="flex items-center gap-4 bg-black text-white px-8 py-3 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-5">
                                <span className="text-xs font-black uppercase tracking-widest">{selectedIds.length} Selected</span>
                                <div className="h-6 w-px bg-white/20"></div>
                                <button onClick={() => handleBulkAction('Selected')} className="hover:text-green-400 transition-colors"><UserCheck className="w-5 h-5" /></button>
                                <button onClick={() => handleBulkAction('Rejected')} className="hover:text-red-400 transition-colors"><UserX className="w-5 h-5" /></button>
                                <button onClick={() => setSelectedIds([])} className="hover:opacity-50 transition-all"><X className="w-5 h-5" /></button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-gray-100">
                            <tr>
                                <th className="px-10 py-6">
                                    <input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.length > 0 && selectedIds.length === filtered.length} className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black cursor-pointer" />
                                </th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Candidate</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Track</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Score</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Status</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(s => (
                                <tr key={s._id} className={`group hover:bg-slate-50 transition-all ${selectedIds.includes(s._id) ? 'bg-blue-50/30' : ''}`}>
                                    <td className="px-10 py-8">
                                        <input type="checkbox" checked={selectedIds.includes(s._id)} onChange={() => toggleSelect(s._id)} className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black cursor-pointer" />
                                    </td>
                                    <td className="px-6 py-8">
                                        <div className="space-y-0.5">
                                            <p className="font-black text-slate-900 uppercase tracking-tight">{s.fullName}</p>
                                            <p className="text-xs font-medium text-gray-400">{s.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-8">
                                        <span className="text-[10px] font-black uppercase bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600">{s.track}</span>
                                    </td>
                                    <td className="px-6 py-8 text-center">
                                        <p className={`text-2xl font-black ${s.assessmentScore >= 75 ? 'text-green-600' : 'text-slate-400'}`}>
                                            {Math.round(s.assessmentScore)}%
                                        </p>
                                    </td>
                                    <td className="px-6 py-8 text-center">
                                        <span className={`inline-block px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                                            s.selectionStatus === 'Selected' ? 'bg-green-100 text-green-700' :
                                            s.selectionStatus === 'Rejected' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-50 text-yellow-600'
                                        }`}>
                                            {s.selectionStatus?.split(' ')[0] || 'Pending'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-8 text-right">
                                        {s.selectionStatus === 'Pending Selection (24h Buffer)' && (
                                            <div className="flex gap-2 justify-end transition-all">
                                                <button onClick={() => updateStatus(s._id, 'Selected')} className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all"><Check className="w-4 h-4" /></button>
                                                <button onClick={() => updateStatus(s._id, 'Rejected')} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><X className="w-4 h-4" /></button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filtered.length === 0 && (
                    <div className="bg-white p-20 rounded-[3rem] text-center border border-gray-100">
                        <p className="text-gray-300 font-bold uppercase tracking-widest">No matching submissions found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
