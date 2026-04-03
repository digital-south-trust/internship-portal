"use client";

import { Award, Download, ExternalLink, Calendar, X, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export default function CertificatePage() {
    const [issuedCertificates, setIssuedCertificates] = useState([]);
    const [selectedCert, setSelectedCert] = useState(null);

    useEffect(() => {
        const fetchCertificates = async () => {
            const email = localStorage.getItem("userEmail") || localStorage.getItem("email");
            if (!email) return;
            try {
                const res = await fetch(`/api/admin/certificates?email=${email}`);
                if (res.ok) {
                    const data = await res.json();
                    const formatted = data.map(cert => ({
                        id: cert.certificateId,
                        title: cert.title,
                        issuedDate: new Date(cert.issuedDate).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' }),
                        issuer: cert.issuer,
                        type: cert.type || "Completion",
                        image: "/cert-preview.png"
                    }));
                    setIssuedCertificates(formatted);
                }
            } catch (error) {
                console.error("Failed to fetch certificates:", error);
            }
        };
        fetchCertificates();
    }, []);

    const handleDownload = (id) => {
        alert(`Downloading Certificate ${id}...`);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-2 h-8 bg-black rounded-full" />
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">Certifications</h1>
                       </div>
                </div>
            </div>

            <div className="w-full relative z-10 space-y-8">
                {issuedCertificates.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full relative z-10">
                        {issuedCertificates.map((cert) => (
                            <motion.div
                                key={cert.id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={() => setSelectedCert(cert)}
                                className="group bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-gray-300/30 hover:border-black/10 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col aspect-square relative"
                            >
                                <div className="flex-1 bg-gray-50/50 relative overflow-hidden flex flex-col items-center justify-center p-8 border-b border-gray-50 group-hover:bg-gray-50 transition-colors">
                                    <div className="w-24 h-24 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                        <Award className="w-10 h-10 text-gray-300 group-hover:text-black transition-colors" />
                                    </div>
                                    <div className="absolute top-6 right-6 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-100/50 shadow-sm">
                                        Official
                                    </div>
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white to-transparent opacity-50" />
                                    <div className="absolute left-6 top-6 w-12 h-12 bg-gray-100/50 rounded-full blur-xl group-hover:bg-gray-200/50 transition-colors" />
                                </div>
                                <div className="p-8 bg-white space-y-5">
                                    <div className="space-y-1.5">
                                        <h3 className="text-[22px] font-black text-gray-900 uppercase tracking-tighter truncate leading-none group-hover:text-black transition-colors">{cert.title}</h3>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{cert.id}</p>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50/80">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <span className="text-[11px] font-bold tracking-tight">{cert.issuedDate}</span>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors border border-gray-100 group-hover:border-black">
                                            <ExternalLink className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[3rem] border-2 border-dashed border-gray-50 p-20 text-center space-y-6">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto shadow-inner text-gray-200">
                            <Award className="w-8 h-8" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">No Certifications Yet</h3>
                            <p className="text-[11px] text-gray-400 max-w-xs mx-auto font-medium">Your completed certifications will manifest here once project validation is cleared.</p>
                        </div>
                    </div>
                )}

                <AnimatePresence>
                    {selectedCert && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedCert(null)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                            >
                                <div className="p-6 md:p-8 flex justify-between items-center bg-gray-50/80 border-b border-gray-100 backdrop-blur-xl relative z-20 shadow-sm text-left">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-black text-white rounded-[1.2rem] flex items-center justify-center shadow-lg shadow-black/20 ring-4 ring-gray-100">
                                            <Award className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none">{selectedCert.title}</h3>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-2">Certificate Details</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedCert(null)} className="w-14 h-14 bg-white border border-gray-200 rounded-[1.2rem] flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all shadow-sm">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar flex flex-col lg:flex-row gap-10 bg-white relative z-10 text-left">
                                    <div className="flex-[2] bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-12 aspect-[4/3] relative group shadow-inner overflow-hidden text-center">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none" />
                                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none" />
                                        <Award className="w-24 h-24 text-gray-200 group-hover:text-gray-300 transition-colors mb-6 relative z-10 drop-shadow-sm" />
                                        <h4 className="text-2xl font-black text-gray-400 uppercase tracking-widest text-center opacity-50 relative z-10">{selectedCert.title}<br /><span className="text-sm tracking-normal mt-2 block opacity-80">(Certificate Document Render Area)</span></h4>
                                        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                        <div className="absolute top-6 left-6 px-3 py-1.5 bg-gray-100 text-gray-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-gray-200 shadow-sm opacity-50">DOCUMENT PREVIEW</div>
                                    </div>
                                    <div className="flex-1 space-y-8 flex flex-col text-left">
                                        <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-6 flex-1 shadow-sm">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Certificate ID</label>
                                                <div className="text-sm font-bold text-gray-900 truncate bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">{selectedCert.id}</div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Date Issued</label>
                                                <div className="flex items-center gap-3 text-sm font-bold text-gray-900 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                                    <Calendar className="w-5 h-5 text-gray-400" />
                                                    {selectedCert.issuedDate}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <button onClick={() => handleDownload(selectedCert.id)} className="w-full py-5 bg-black hover:bg-gray-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.5rem] flex items-center justify-center gap-3 shadow-xl shadow-black/10 hover:shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all">
                                                <Download className="w-5 h-5" /> Download PDF
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
