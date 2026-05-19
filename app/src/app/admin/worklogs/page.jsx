"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { 
    Search, Filter, CheckCircle2, XCircle, ArrowRight, 
    Loader2, Users, Calendar, ClipboardList, Eye, ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

export default function AdminWorklogsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("today"); // "today" or "previous"
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("All"); // "All", "Filled", "Not Filled"
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]); // Today logs or Master interns list

    // Sub-states for Previous tab (inspecting an intern)
    const [inspectingIntern, setInspectingIntern] = useState(null); // The intern object
    const [internHistory, setInternHistory] = useState([]);
    const [historyPercentage, setHistoryPercentage] = useState(100);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [internProjects, setInternProjects] = useState([]);

    // Selected log for Today modal
    const [selectedTodayLog, setSelectedTodayLog] = useState(null);
    const [selectedHistoryLog, setSelectedHistoryLog] = useState(null);
    const [mounted, setMounted] = useState(false);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                tab: activeTab,
                search: search.trim(),
                filter: filter
            });
            const res = await fetch(`/api/admin/worklogs?${queryParams.toString()}`);
            if (res.ok) {
                const result = await res.json();
                setData(result);
            } else {
                toast.error("Failed to load logs.");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred while fetching worklogs.");
        } finally {
            setLoading(false);
        }
    };

    // Fetch single log detail from URL query param
    useEffect(() => {
        setMounted(true);
        const logId = new URLSearchParams(window.location.search).get('logId');
        if (logId) {
            const fetchSingleLog = async () => {
                try {
                    const res = await fetch(`/api/admin/worklogs/${logId}`);
                    if (res.ok) {
                        const result = await res.json();
                        setSelectedHistoryLog(result.worklog);
                        if (result.worklog?.userId) {
                            setActiveTab('previous');
                            handleInspectIntern(result.worklog.userId);
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch log from URL:", error);
                }
            };
            fetchSingleLog();
        }
    }, []);

    // Refetch data when tab, filter, or search changes
    useEffect(() => {
        // Clear data to prevent rendering mismatched tab format during transition
        setData([]);
        // Clear inspecting intern when switching tabs
        if (activeTab === 'today') {
            setInspectingIntern(null);
        }
        fetchData();
    }, [activeTab, filter]);

    // If search is cleared, fetch data automatically
    useEffect(() => {
        if (search.trim() === "") {
            fetchData();
        }
    }, [search]);

    // Handle search submission or debounced trigger
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchData();
    };

    // Load history of a specific intern in the Previous tab
    const handleInspectIntern = async (intern) => {
        setInspectingIntern(intern);
        setHistoryLoading(true);
        setInternProjects([]);
        try {
            const res = await fetch(`/api/worklogs?email=${encodeURIComponent(intern.email)}`);
            if (res.ok) {
                const result = await res.json();
                setInternHistory(result.logs || []);
                setHistoryPercentage(result.attendancePercentage ?? 100);
            } else {
                toast.error("Failed to load history.");
            }

            // Fetch intern projects
            try {
                const projRes = await fetch(`/api/admin/users/result?userId=${intern._id}`);
                if (projRes.ok) {
                    const projData = await projRes.json();
                    setInternProjects(projData.projects || []);
                }
            } catch (projErr) {
                console.error("Failed to fetch intern projects:", projErr);
            }
        } catch (error) {
            console.error(error);
            toast.error("Error loading intern history.");
        } finally {
            setHistoryLoading(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-500 w-full">
            
            {/* Standardized Tactical Header */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-3xl -mx-8 -mt-8 px-8 py-5 border-b border-gray-100 shadow-sm mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-8 bg-black rounded-full" />
                        <h1 className="text-2xl font-black text-black tracking-tighter uppercase leading-none">
                            Worklogs
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Tab Selector */}
                        <div className="flex bg-gray-50/50 p-1 rounded-xl border border-gray-100 shadow-sm">
                            {[
                                { id: 'today', label: 'Today' },
                                { id: 'previous', label: 'Previous Logs' }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setActiveTab(item.id);
                                        setShowFilterDropdown(false);
                                        setSelectedHistoryLog(null);
                                        router.replace('/admin/worklogs', { scroll: false });
                                    }}
                                    className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                        activeTab === item.id 
                                        ? 'bg-black text-white shadow-md' 
                                        : 'text-gray-400 hover:text-black hover:bg-white'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        {/* Search form (small search box on the right side) */}
                        {!inspectingIntern && (
                            <form onSubmit={handleSearchSubmit} className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search interns..."
                                    className="bg-white border border-gray-100 rounded-xl pl-9 pr-3 py-2 text-[10px] font-bold focus:ring-4 focus:ring-black/5 outline-none transition-all shadow-sm w-36 focus:w-48"
                                />
                            </form>
                        )}

                        {/* Filter Button (Icon) */}
                        {activeTab === 'today' && !inspectingIntern && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                    className={`p-2.5 rounded-xl transition-all border border-gray-100 shadow-sm flex items-center justify-center ${
                                        showFilterDropdown || filter !== 'All'
                                        ? 'bg-black text-white border-black'
                                        : 'bg-gray-50 hover:bg-black hover:text-white text-gray-600'
                                    }`}
                                >
                                    <Filter className="w-4 h-4" />
                                </button>
                                
                                {/* Dropdown with Filled / Not Filled / All buttons */}
                                <AnimatePresence>
                                    {showFilterDropdown && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 mt-2 bg-white border border-gray-100 rounded-2xl p-2.5 shadow-xl z-50 flex flex-col gap-1.5 min-w-[150px]"
                                        >
                                            {["All", "Filled", "Not Filled"].map((f) => (
                                                <button
                                                    key={f}
                                                    onClick={() => {
                                                        setFilter(f);
                                                        setShowFilterDropdown(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                                        filter === f
                                                        ? 'bg-black text-white'
                                                        : 'hover:bg-gray-50 text-gray-500 hover:text-black'
                                                    }`}
                                                >
                                                    {f}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="px-8 pb-12 w-full">
                {/* Main Content Area */}
                {loading ? (
                    <div className="flex justify-center items-center py-24 bg-white rounded-[2rem] border border-gray-100">
                        <Loader2 className="w-10 h-10 animate-spin text-black" />
                    </div>
                ) : (
                    <div className="bg-transparent">
                        {activeTab === "today" ? (
                            /* TODAY TAB VIEW */
                            <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-black  font-medium uppercase tracking-tight flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-gray-400" /> Worklog
                                    </h3>
                                    <span className="text-xs bg-gray-50 text-gray-400 border border-gray-200 px-3 py-1 rounded-lg font-bold">
                                        IST Cutoff: 11:59 PM
                                    </span>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                <th className="pb-4 font-black">Name</th>
                                                <th className="pb-4 font-black">Track</th>
                                                <th className="pb-4 font-black">Submission Status</th>
                                                <th className="pb-4 font-black text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {data.length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" className="text-center py-12 text-sm text-gray-400 font-medium">
                                                        No interns found matching the criteria.
                                                    </td>
                                                </tr>
                                            ) : (
                                                data.map((item, idx) => {
                                                    const intern = item?.intern || item;
                                                    const filled = item?.filled;
                                                    const worklog = item?.worklog;
                                                    if (!intern || !intern.fullName) return null;

                                                    return (
                                                        <tr key={intern._id?.toString() || intern.email || `today-row-${idx}`} className="hover:bg-gray-50/50 transition-all">
                                                            <td className="py-4">
                                                                <div>
                                                                    <p className="text-sm font-black text-gray-900">{intern.fullName}</p>
                                                                    <p className="text-xs text-gray-400 font-medium">{intern.email}</p>
                                                                </div>
                                                            </td>
                                                            <td className="py-4">
                                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                                                    {intern.track || "Not Assigned"}
                                                                </span>
                                                            </td>
                                                            <td className="py-4">
                                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                                                    filled 
                                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                                                        : "bg-amber-50 text-amber-700 border-amber-100"
                                                                }`}>
                                                                    {filled ? (
                                                                        <>
                                                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Filled
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <XCircle className="w-3 h-3 text-amber-600" /> Not Filled
                                                                        </>
                                                                    )}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 text-right">
                                                                {filled && (
                                                                    <button 
                                                                        onClick={() => setSelectedTodayLog(worklog)}
                                                                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200  rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                                    >
                                                                         View Log
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            /* PREVIOUS TAB VIEW (INSPECT LIST OR INDIVIDUAL HISTORY) */
                            <div>
                                {!inspectingIntern ? (
                                    /* Interns Master List */
                                    <div className="bg-white rounded-lg border border-gray-100 p-8 shadow-sm">
                                        <h3 className="text-lg font-black font-medium uppercase tracking-tight flex items-center gap-2 mb-6">
                                            <Users className="w-5 h-5 text-gray-400" /> Previous Worklogs
                                        </h3>

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-gray-100 text-[10px] font-black  tracking-widest text-gray-400">
                                                        <th className="pb-4 font-black">Name</th>
                                                        <th className="pb-4 font-black">Track</th>
                                                        <th className="pb-4 font-black">Overall Attendance</th>
                                                        <th className="pb-4 font-black text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {data.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="4" className="text-center py-12 text-sm text-gray-400 font-medium">
                                                                No interns found.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        data.map((item, idx) => {
                                                            const intern = item?.intern ? item.intern : item;
                                                            if (!intern || !intern.fullName) return null;

                                                            return (
                                                                <tr key={intern._id?.toString() || intern.email || `prev-row-${idx}`} className="hover:bg-gray-50/50 transition-all">
                                                                    <td className="py-4">
                                                                        <div>
                                                                            <p className="text-sm font-black text-gray-900">{intern.fullName}</p>
                                                                            <p className="text-xs text-gray-400 font-medium">{intern.email}</p>
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-4">
                                                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                                                            {intern.track || "Not Assigned"}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-24 bg-gray-100 rounded-lg h-2">
                                                                                <div 
                                                                                    className={`h-2 rounded-lg ${
                                                                                        intern.attendancePercentage >= 90 ? "bg-emerald-500" :
                                                                                        intern.attendancePercentage >= 75 ? "bg-blue-500" : "bg-amber-500"
                                                                                    }`}
                                                                                    style={{ width: `${intern.attendancePercentage}%` }}
                                                                                />
                                                                            </div>
                                                                            <span className="text-xs font-black text-gray-900">
                                                                                {intern.attendancePercentage}%
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-4 text-right">
                                                                        <button 
                                                                            onClick={() => handleInspectIntern(intern)}
                                                                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-black text-white hover:bg-neutral-800 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                                        >
                                                                            View Logs <ArrowRight className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    /* Inspected Intern's Worklog History */
                                    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                                        {/* Back Header */}
                                        <div className="flex items-center justify-between">
                                            <button 
                                                onClick={() => setInspectingIntern(null)}
                                                className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-black transition-all"
                                            >
                                                <ArrowLeft className="w-4 h-4" /> Back
                                            </button>

                                          
                                        </div>

                                        {/* 1/3 and 2/3 Two Column Layout */}
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                                            
                                            {/* Left side column: 1/3 part */}
                                            <div className="lg:col-span-1 space-y-6">
                                                {/* Intern profile card (small box with rounded-lg) */}
                                                <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Intern Profile</p>
                                                    
                                                    <div className="space-y-4">
                                                        <div>
                                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Name</span>
                                                            <span className="text-sm font-black text-gray-900">{inspectingIntern.fullName}</span>
                                                            <span className="text-xs text-gray-500 font-medium block">{inspectingIntern.email}</span>
                                                        </div>

                                                        <div>
                                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Track</span>
                                                            <span className="text-xs font-black text-gray-900 uppercase">{inspectingIntern.track || "Not Assigned"}</span>
                                                            <span className="text-[10px] text-gray-500 font-medium block">Status: {inspectingIntern.status}</span>
                                                        </div>

                                                        <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                                                            <div>
                                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Attendance</span>
                                                                <span className="text-lg font-black text-black">{historyPercentage}%</span>
                                                            </div>
                                                            <div className="w-20 bg-gray-100 rounded-lg h-2 overflow-hidden">
                                                                <div 
                                                                    className={`h-full rounded-lg ${
                                                                        historyPercentage >= 90 ? "bg-emerald-500" :
                                                                        historyPercentage >= 75 ? "bg-blue-500" : "bg-amber-500"
                                                                    }`}
                                                                    style={{ width: `${historyPercentage}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Top 3 latest project list */}
                                                <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Latest Projects (Top 3)</p>
                                                    
                                                    {internProjects.length === 0 ? (
                                                        <p className="text-xs text-gray-400 font-medium italic">No projects assigned or requested.</p>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {(() => {
                                                                // Sort: approved and progress < 100 first (active), then others
                                                                const sortedProjects = [...internProjects].sort((a, b) => {
                                                                    const aIsCurrent = a.status === 'Approved' && (a.progress || 0) < 100;
                                                                    const bIsCurrent = b.status === 'Approved' && (b.progress || 0) < 100;
                                                                    if (aIsCurrent && !bIsCurrent) return -1;
                                                                    if (!aIsCurrent && bIsCurrent) return 1;
                                                                    return new Date(b.requestedAt || b.createdAt || 0) - new Date(a.requestedAt || a.createdAt || 0);
                                                                });

                                                                return sortedProjects.slice(0, 3).map((proj, idx) => {
                                                                    const isCurrent = proj.status === 'Approved' && (proj.progress || 0) < 100;
                                                                    return (
                                                                        <div key={proj._id || idx} className={`p-4 rounded-lg border transition-all ${
                                                                            isCurrent 
                                                                            ? "bg-black text-white border-black" 
                                                                            : "bg-gray-50/50 text-gray-900 border-gray-100 hover:border-gray-300"
                                                                        }`}>
                                                                            <div className="flex justify-between items-start gap-2 mb-1">
                                                                                <h5 className={`text-xs font-black uppercase tracking-tight line-clamp-1 ${isCurrent ? 'text-white' : 'text-gray-900'}`}>
                                                                                    {proj.projectName}
                                                                                </h5>
                                                                                {isCurrent && (
                                                                                    <span className="text-[8px] font-black uppercase tracking-widest bg-[#ccff00] text-black px-1.5 py-0.5 rounded-lg shrink-0">
                                                                                        Active
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <p className={`text-[10px] font-medium line-clamp-2 ${isCurrent ? 'text-gray-300' : 'text-gray-400'}`}>
                                                                                {proj.description}
                                                                            </p>
                                                                            <div className="mt-3 pt-2 border-t border-gray-100/10 flex justify-between items-center text-[9px] font-bold">
                                                                                <span className={`uppercase tracking-widest ${isCurrent ? 'text-[#ccff00]' : 'text-gray-500'}`}>
                                                                                    {proj.status}
                                                                                </span>
                                                                                <span className={isCurrent ? 'text-white' : 'text-gray-600'}>
                                                                                    Progress: {proj.progress || 0}%
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                });
                                                            })()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right side column: 2/3 part */}
                                            <div className="lg:col-span-2 space-y-6">
                                                {/* History Table */}
                                                <div className="bg-white rounded-lg border border-gray-100 p-8 shadow-sm">
                                                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-2 mb-6">
                                                        <ClipboardList className="w-5 h-5 text-gray-400" /> Historical Logs
                                                    </h3>

                                                    {historyLoading ? (
                                                        <div className="flex justify-center items-center py-12">
                                                            <Loader2 className="w-8 h-8 animate-spin text-black" />
                                                        </div>
                                                    ) : (
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-left border-collapse">
                                                                <thead>
                                                                    <tr className="border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                                        <th className="pb-4 font-black">Date</th>
                                                                        <th className="pb-4 font-black">Status</th>
                                                                        <th className="pb-4 font-black">Snippet</th>
                                                                        <th className="pb-4 font-black text-right">Action</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-50">
                                                                    {internHistory.length === 0 ? (
                                                                        <tr>
                                                                            <td colSpan="4" className="text-center py-8 text-sm text-gray-400">
                                                                                No logs found for this intern.
                                                                            </td>
                                                                        </tr>
                                                                    ) : (
                                                                        internHistory.map((log, idx) => (
                                                                            <tr key={log._id?.toString() || log.date || `history-row-${idx}`} className="hover:bg-gray-50/50 transition-all">
                                                                                <td className="py-4">
                                                                                    <span className="text-sm font-black text-gray-900">{log.date}</span>
                                                                                </td>
                                                                                <td className="py-4">
                                                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                                                                        log.status === "Present" 
                                                                                            ? "bg-emerald-50 text-emerald-800 border border-emerald-100" 
                                                                                            : "bg-red-50 text-red-800 border border-red-100"
                                                                                    }`}>
                                                                                        {log.status}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="py-4 max-w-xs">
                                                                                    <p className="text-xs text-gray-500 font-medium truncate">
                                                                                        {log.content || (log.status === 'Absent' ? 'Marked Absent' : 'No description')}
                                                                                    </p>
                                                                                </td>
                                                                                <td className="py-4 text-right">
                                                                                    {log.status === "Present" && (
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                setSelectedHistoryLog(log);
                                                                                                router.replace(`/admin/worklogs?logId=${log._id}`, { scroll: false });
                                                                                            }}
                                                                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white hover:bg-neutral-800 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                                                        >
                                                                                            <Eye className="w-3.5 h-3.5" /> View Full
                                                                                        </button>
                                                                                    )}
                                                                                </td>
                                                                            </tr>
                                                                        ))
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {mounted && typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {selectedHistoryLog && (
                        <div className="fixed inset-0 z-[9999] overflow-hidden">
                            {/* Blurred Backdrop */}
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => {
                                    setSelectedHistoryLog(null);
                                    router.replace('/admin/worklogs', { scroll: false });
                                }}
                                className="absolute inset-0 bg-black/40 backdrop-blur-md"
                            />
                            
                            {/* Drawer Panel */}
                            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
                                <motion.div 
                                    initial={{ x: "100%" }}
                                    animate={{ x: 0 }}
                                    exit={{ x: "100%" }}
                                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                    className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col justify-between rounded-l-lg"
                                >
                                    {/* Header */}
                                    <div className="px-8 py-6 border-b border-neutral-100 flex items-center justify-between bg-gray-50/50">
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Worklog Detail</h3>
                                            <p className="text-xs text-gray-400 font-medium mt-1">Submitted: ${selectedHistoryLog.date}</p>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setSelectedHistoryLog(null);
                                                router.replace('/admin/worklogs', { scroll: false });
                                            }}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 hover:bg-red-100 hover:text-red-600  rounded-lg text-[10px] font-black uppercase tracking-widest transition-all bg-white shadow-sm text-gray-900 hover:bg-gray-50"
                                        >
                                             Close
                                        </button>
                                    </div>

                                    {/* Body */}
                                    <div className="flex-1 overflow-y-auto p-8 space-y-6">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Work Description</p>
                                            <div className="bg-gray-50 rounded-lg p-5 border border-gray-100/50">
                                                <p className="text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">${selectedHistoryLog.content}</p>
                                            </div>
                                        </div>

                                        {selectedHistoryLog.links && selectedHistoryLog.links.length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Reference Links</p>
                                                <div className="space-y-2">
                                                    {selectedHistoryLog.links.map((link, idx) => (
                                                        <a 
                                                            key={idx} 
                                                            href={link} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="flex items-center justify-between p-3.5 bg-white border border-gray-100 hover:border-black rounded-lg text-xs font-bold text-blue-600 hover:text-black transition-all group"
                                                        >
                                                            <span className="truncate pr-4 font-mono">{link}</span>
                                                            <Eye className="w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-all" />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {mounted && typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {selectedTodayLog && (
                        <div className="fixed inset-0 z-[9999] overflow-hidden">
                            {/* Blurred Backdrop */}
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedTodayLog(null)}
                                className="absolute inset-0 bg-black/40 backdrop-blur-md"
                            />
                            
                            {/* Drawer Panel */}
                            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
                                <motion.div 
                                    initial={{ x: "100%" }}
                                    animate={{ x: 0 }}
                                    exit={{ x: "100%" }}
                                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                    className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col justify-between rounded-l-lg"
                                >
                                    {/* Header */}
                                    <div className="px-8 py-6 border-b border-neutral-100 flex items-center justify-between bg-gray-50/50">
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Today's Submission Detail</h3>
                                            <p className="text-xs text-gray-400 font-medium mt-1">Submitted: ${selectedTodayLog.date}</p>
                                        </div>
                                        <button 
                                            onClick={() => setSelectedTodayLog(null)}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 hover:bg-red-100 hover:text-red-600  rounded-lg text-[10px] font-black uppercase tracking-widest transition-all bg-white shadow-sm text-gray-900 hover:bg-gray-50"
                                        >
                                            Close
                                        </button>
                                    </div>

                                    {/* Body */}
                                    <div className="flex-1 overflow-y-auto p-8 space-y-6">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Work Description</p>
                                            <div className="bg-gray-50 rounded-lg p-5 border border-gray-100/50">
                                                <p className="text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">${selectedTodayLog.content}</p>
                                            </div>
                                        </div>

                                        {selectedTodayLog.links && selectedTodayLog.links.length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Reference Links</p>
                                                <div className="space-y-2">
                                                    {selectedTodayLog.links.map((link, idx) => (
                                                        <a 
                                                            key={idx} 
                                                            href={link} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="flex items-center justify-between p-3.5 bg-white border border-gray-100 hover:border-black rounded-lg text-xs font-bold text-blue-600 hover:text-black transition-all group"
                                                        >
                                                            <span className="truncate pr-4 font-mono">{link}</span>
                                                            <Eye className="w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-all" />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
