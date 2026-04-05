"use client";

import { Award, Download, ExternalLink, Calendar, X, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";

const MiniCertificate = ({ cert }) => (
    <div className="w-full h-full bg-white relative overflow-hidden p-[8%] flex flex-col items-center justify-between pointer-events-none select-none">
        {/* Borders */}
        <div className="absolute inset-[4%] border-[1px] border-amber-400/30 rounded-sm" />
        <div className="absolute inset-[6%] border-[0.5px] border-amber-200/20 rounded-sm" />
        
        {/* Content */}
        <div className="z-10 flex flex-col items-center w-full h-full py-[2%]">
            <div className="w-[10%] h-[1px] bg-amber-400 mb-[2%]" />
            <p className="text-[5px] font-bold text-amber-600 uppercase tracking-widest leading-none">Digital South</p>
            
            <div className="flex flex-col items-center mt-[8%] gap-1">
                <h2 className="text-[4px] font-medium text-gray-400 uppercase tracking-[0.2em]">Certificate of</h2>
                <h1 className="text-[12px] font-black text-gray-900 uppercase leading-none tracking-tighter">{cert.type || "Completion"}</h1>
            </div>

            <div className="w-[30%] h-[0.5px] bg-amber-200 my-[6%]" />
            
            <div className="flex flex-col items-center gap-1">
                <p className="text-[4px] font-bold text-gray-400 uppercase tracking-widest">Presented to</p>
                <p className="text-[10px] font-black text-gray-800 truncate w-full text-center" style={{ fontFamily: 'Georgia, serif' }}>{cert.internName}</p>
            </div>

            <p className="text-[4px] text-gray-400 uppercase tracking-tight line-clamp-1 w-[85%] text-center mt-[4%] font-bold opacity-80">{cert.title}</p>
            
            {/* Bottom details */}
            <div className="mt-auto w-full flex justify-between px-[10%] pb-[4%]">
                <div className="flex flex-col items-start">
                    <div className="w-[20px] h-[0.5px] bg-gray-200 mb-0.5" />
                    <p className="text-[3px] text-gray-300 uppercase">Issuer</p>
                </div>
                <div className="flex flex-col items-end">
                    <p className="text-[3px] text-gray-400 font-bold mb-0.5">{cert.issuedDate}</p>
                    <p className="text-[3px] text-gray-300 uppercase">Issued</p>
                </div>
            </div>
            
            {/* Seal */}
            <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-[12%] aspect-square rounded-full border-[0.5px] border-amber-400/50 bg-amber-50/50 flex items-center justify-center">
                <Award className="w-[60%] h-[60%] text-amber-500/40" />
            </div>
        </div>
    </div>
);

export default function CertificatePage() {
    const [issuedCertificates, setIssuedCertificates] = useState([]);
    const [selectedCert, setSelectedCert] = useState(null);
    const certRef = useRef(null);

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
                        rawDate: cert.issuedDate,
                        issuer: cert.issuer || "Digital South",
                        internName: cert.internName,
                        track: cert.track,
                        type: cert.type || "Completion",
                    }));
                    setIssuedCertificates(formatted);
                }
            } catch (error) {
                console.error("Failed to fetch certificates:", error);
            }
        };
        fetchCertificates();
    }, []);

    const handleDownload = async (cert) => {
        try {
            const el = certRef.current;
            if (!el) return;
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const link = document.createElement('a');
            link.download = `${cert.id}_Certificate.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error("Download failed:", err);
            alert("Download failed. Please try again.");
        }
    };

    return (
        <div className="space-y-8 pb-32">
            {/* Standardized Tactical Header */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-3xl -mx-8 -mt-8 px-8 py-5 border-b border-gray-100 shadow-sm mb-12">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-8 bg-black rounded-full" />
                        <h1 className="text-2xl font-black text-black tracking-tighter uppercase leading-none">
                            Certificate
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl flex items-center gap-2">
                             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Total Nodes</span>
                             <div className="w-4 h-4 rounded-md bg-black flex items-center justify-center text-[8px] font-black text-white">
                                 {issuedCertificates.length}
                             </div>
                        </div>
                    </div>
                </div>
            </header>

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
                                <div className="flex-1 bg-gray-50/20 relative overflow-hidden flex items-center justify-center p-8 border-b border-gray-50/50 group-hover:bg-gray-50 transition-all duration-500">
                                    {/* Larger Realistic Preview Frame */}
                                    <div className="w-[85%] aspect-[1.414/1] relative">
                                        <div className="absolute inset-0 bg-black/5 rounded-xl blur-3xl group-hover:bg-black/10 transition-colors transform translate-y-4" />
                                        <div className="relative w-full h-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex items-center justify-center">
                                            <MiniCertificate cert={cert} />
                                        </div>
                                    </div>

                                    <div className="absolute top-6 right-6 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-100/50 shadow-sm z-20">
                                        Official
                                    </div>
                                    <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-white to-transparent opacity-50 z-10" />
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
            </div>

            <AnimatePresence>
                {selectedCert && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
                    >
                        <div onClick={() => setSelectedCert(null)} className="absolute inset-0 bg-black/40 backdrop-blur-md" />
                        
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100"
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
                                <button onClick={() => setSelectedCert(null)} className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all shadow-sm">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col lg:flex-row gap-10 bg-white relative z-10 text-left no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                <style jsx>{`
                                    .no-scrollbar::-webkit-scrollbar {
                                        display: none;
                                    }
                                `}</style>
                                
                                <div className="flex-[2] flex items-center justify-center">
                                    <div className="relative group/cert-visual inline-block w-full max-w-[650px]">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDownload(selectedCert); }} 
                                            className="absolute top-2 right-2 z-[40] w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer border-4 border-white"
                                            title="Download Certificate"
                                        >
                                            <Download className="w-5 h-5" />
                                        </button>

                                        <div ref={certRef} className="w-full aspect-[1.414/1] bg-white border-2 border-gray-200 rounded-2xl shadow-xl relative overflow-hidden">
                                            <div className="absolute inset-3 border-2 border-amber-300/40 rounded-xl pointer-events-none" />
                                            <div className="absolute inset-5 border border-amber-200/30 rounded-lg pointer-events-none" />
                                            
                                            <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-amber-400/60 rounded-tl-lg" />
                                            <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-amber-400/60 rounded-tr-lg" />
                                            <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-amber-400/60 rounded-bl-lg" />
                                            <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-amber-400/60 rounded-br-lg" />

                                            <div className="flex flex-col items-center justify-center h-full px-10 py-8 text-center relative z-10">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-6 h-px bg-amber-400" />
                                                    <ShieldCheck className="w-5 h-5 text-amber-500" />
                                                    <div className="w-6 h-px bg-amber-400" />
                                                </div>
                                                <p className="text-[9px] font-bold text-amber-600 uppercase tracking-[0.4em] mb-4">Digital South Internship Program</p>
                                                
                                                <h2 className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.5em] mb-2">Certificate of</h2>
                                                <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tight leading-none mb-6">{selectedCert.type}</h1>
                                                
                                                <div className="flex items-center gap-3 mb-6 w-3/4">
                                                    <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-300" />
                                                    <Award className="w-6 h-6 text-amber-500" />
                                                    <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-300" />
                                                </div>
                                                
                                                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.3em] mb-2">This is awarded to</p>
                                                <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight mb-4" style={{ fontFamily: 'Georgia, serif' }}>
                                                    {selectedCert.internName || "Intern Name"}
                                                </h2>
                                                
                                                <p className="text-[11px] text-gray-500 max-w-md leading-relaxed mb-6">
                                                    For successfully completing the <strong className="text-gray-700">{selectedCert.title}</strong> internship program 
                                                    {selectedCert.track ? ` in the ${selectedCert.track} track` : ''}, 
                                                    demonstrating exceptional skill, dedication, and professional growth.
                                                </p>
                                                
                                                <div className="flex items-end justify-between w-full max-w-md mt-auto pt-4">
                                                    <div className="text-left">
                                                        <div className="w-24 h-px bg-gray-300 mb-2" />
                                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{selectedCert.issuer}</p>
                                                        <p className="text-[7px] text-gray-300 uppercase tracking-widest">Program Director</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[8px] font-bold text-gray-500 mb-1">{selectedCert.issuedDate}</p>
                                                        <p className="text-[7px] text-gray-300 uppercase tracking-widest">Date Issued</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[8px] font-mono text-gray-400 mb-1">{selectedCert.id}</p>
                                                        <p className="text-[7px] text-gray-300 uppercase tracking-widest">Certificate ID</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full lg:w-80 shrink-0 space-y-6 flex flex-col text-left">
                                    <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-5 flex-1 shadow-sm">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Certificate ID</label>
                                            <div className="text-sm font-bold text-gray-900 truncate bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">{selectedCert.id}</div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Recipient</label>
                                            <div className="text-sm font-bold text-gray-900 bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">{selectedCert.internName || "—"}</div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Date Issued</label>
                                            <div className="flex items-center gap-2.5 text-sm font-bold text-gray-900 bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                {selectedCert.issuedDate}
                                            </div>
                                        </div>
                                        {selectedCert.track && (
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Track</label>
                                                <div className="text-sm font-bold text-gray-900 bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">{selectedCert.track}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
