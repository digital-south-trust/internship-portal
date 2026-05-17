"use client";

import { Award, Download, ExternalLink, Calendar, X, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";

const THEMES = {
    1: { bg: 'bg-[#FFFDF5]', accent: 'text-[#B8860B]', border: 'border-[#DAA520]', primary: 'text-gray-900', secondary: 'text-gray-500', line: 'bg-[#DAA520]', sub: 'text-[#B8860B]', font: 'serif', pattern: 'classic' },
    2: { bg: 'bg-[#0f0f0f]', accent: 'text-[#6366f1]', border: 'border-[#4f46e5]', primary: 'text-white', secondary: 'text-gray-400', line: 'bg-[#4f46e5]', sub: 'text-[#6366f1]', font: 'sans', pattern: 'modern' },
    3: { bg: 'bg-[#f0f9ff]', accent: 'text-[#0369a1]', border: 'border-[#0284c7]', primary: 'text-[#0c4a6e]', secondary: 'text-[#0369a1]/70', line: 'bg-[#0284c7]', sub: 'text-[#0c4a6e]', font: 'serif', pattern: 'ocean' },
    4: { bg: 'bg-[#f7fee7]', accent: 'text-[#15803d]', border: 'border-[#16a34a]', primary: 'text-[#14532d]', secondary: 'text-[#15803d]/70', line: 'bg-[#16a34a]', sub: 'text-[#14532d]', font: 'serif', pattern: 'emerald' },
    5: { bg: 'bg-[#faf5ff]', accent: 'text-[#7e22ce]', border: 'border-[#9333ea]', primary: 'text-[#3b0764]', secondary: 'text-[#7e22ce]/70', line: 'bg-[#9333ea]', sub: 'text-[#3b0764]', font: 'sans', pattern: 'royal' },
};

const CertificateDesign = ({ cert, isMini = false }) => {
    if (cert.customUrl) {
        return (
            <div className={`w-full aspect-[1.414/1] bg-white relative overflow-hidden flex items-center justify-center rounded-sm ${isMini ? 'pointer-events-none' : ''}`}>
                <img src={cert.customUrl} alt="Certificate" className="w-full h-full object-contain" />
            </div>
        );
    }
    const theme = THEMES[Number(cert.themeId)] || THEMES[1];
    
    return (
        <div className={`w-full aspect-[1.414/1] ${theme.bg} relative overflow-hidden flex flex-col items-center justify-between p-[8%] select-none border border-gray-100 shadow-inner rounded-sm ${isMini ? 'pointer-events-none' : ''}`}
             style={{ containerType: 'inline-size' }}>
            
            {/* Main Decorative Frame */}
            <div className={`absolute inset-[3%] border-[4px] ${theme.border} opacity-10 rounded-sm pointer-events-none`} />
            <div className={`absolute inset-[5%] border-[1px] ${theme.border} opacity-20 rounded-sm pointer-events-none`} />
            
            {/* Corner Markers */}
            <div className={`absolute top-[3%] left-[3%] w-[5%] aspect-square border-t-2 border-l-2 ${theme.border} opacity-40`} />
            <div className={`absolute top-[3%] right-[3%] w-[5%] aspect-square border-t-2 border-r-2 ${theme.border} opacity-40`} />
            <div className={`absolute bottom-[3%] left-[3%] w-[5%] aspect-square border-b-2 border-l-2 ${theme.border} opacity-40`} />
            <div className={`absolute bottom-[3%] right-[3%] w-[5%] aspect-square border-b-2 border-r-2 ${theme.border} opacity-40`} />

            {/* Content */}
            <div className="z-10 flex flex-col items-center w-full h-full py-[2%] text-center">
                <div className="flex flex-col items-center gap-1 mb-[5%]">
                    <div className={`w-[15cqw] h-[2px] ${theme.line} opacity-40 mb-1`} />
                    <p className={`text-[3cqw] font-black ${theme.sub} uppercase tracking-[0.6em] leading-none`}>Digital South</p>
                </div>
                
                <div className="flex flex-col items-center gap-[2cqw]">
                    <h2 className={`text-[2.2cqw] font-bold ${theme.secondary} uppercase tracking-[0.4em]`}>Honorable Recognition of</h2>
                    <h1 className={`text-[11cqw] font-black ${theme.primary} uppercase leading-none tracking-tighter drop-shadow-sm`}>{cert.type || "Completion"}</h1>
                    <div className={`w-[30cqw] h-[1px] bg-gradient-to-r from-transparent via-${theme.line.replace('bg-', '')} to-transparent opacity-30 mt-1`} />
                </div>

                <div className="mt-auto mb-auto flex flex-col items-center gap-[3cqw] w-[90%]">
                    <p className={`text-[2.5cqw] font-bold ${theme.secondary} uppercase tracking-[0.2em]`}>This distinction is proudly conferred upon</p>
                    <div className="relative w-full">
                        <p className={`text-[9cqw] font-black ${theme.primary} leading-none tracking-tight pb-2`} style={{ fontFamily: theme.font === 'serif' ? 'Georgia, serif' : 'inherit' }}>
                            {cert.internName}
                        </p>
                        <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] ${theme.line} opacity-20`} />
                    </div>
                    <p className={`text-[3.2cqw] ${theme.secondary} uppercase tracking-normal leading-relaxed max-w-[85%] font-medium`}>
                        For exceptional dedication and excellence in completing the <strong className={theme.primary}>{cert.title}</strong> internship program
                    </p>
                </div>
                
                {/* Bottom Signature Section */}
                <div className="mt-auto w-full flex justify-between px-[6%] pb-[1%] items-end">
                    <div className="flex flex-col items-start gap-1">
                        <p className={`text-[1.8cqw] font-mono ${theme.secondary} opacity-60 mb-1`}>AUTH_SIGNATURE_OFFICIAL</p>
                        <div className={`w-[20cqw] h-[1px] ${theme.line} opacity-30`} />
                        <p className={`text-[2cqw] ${theme.secondary} uppercase tracking-widest font-bold`}>Program Director</p>
                    </div>
                    
                    <div className="flex flex-col items-center gap-1">
                         <div className={`w-[14cqw] aspect-square rounded-full border-2 border-double ${theme.border} opacity-20 flex items-center justify-center bg-white/40 shadow-inner rotate-12`}>
                            <Award className={`w-1/2 h-1/2 ${theme.accent} opacity-40`} />
                        </div>
                        <p className={`text-[1.5cqw] font-bold ${theme.secondary} opacity-40 uppercase tracking-tighter`}>Corporate Seal</p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                        <p className={`text-[2.5cqw] ${theme.primary} font-black tracking-tighter`}>{cert.issuedDate}</p>
                        <p className={`text-[1.8cqw] ${theme.secondary} uppercase tracking-[0.2em] font-bold`}>Certificate ID: {cert.id}</p>
                    </div>
                </div>
            </div>
            
            {/* Background Patterns based on theme */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px]" />
            </div>
            
            {Number(cert.themeId) === 1 && <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 blur-[100px] rounded-full -mr-32 -mt-32" />}
            {Number(cert.themeId) === 2 && <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />}
            {Number(cert.themeId) === 3 && (
                <div className="absolute bottom-0 left-0 w-full h-[50%] bg-gradient-to-t from-sky-500/5 to-transparent pointer-events-none" />
            )}
            {Number(cert.themeId) === 4 && (
                <>
                    <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-br-[100%] blur-[40px]" />
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-tl-[100%] blur-[40px]" />
                </>
            )}
            {Number(cert.themeId) === 5 && (
                <>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] aspect-square bg-purple-500/5 blur-[80px] rounded-full -translate-y-1/2" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] aspect-square bg-purple-500/5 blur-[80px] rounded-full translate-y-1/2" />
                </>
            )}
        </div>
    );
};

const MiniCertificate = ({ cert }) => (
    <div className="w-full h-full scale-[1] transform-origin-center">
        <CertificateDesign cert={cert} isMini={true} />
    </div>
);

export default function CertificatePage() {
    const [issuedCertificates, setIssuedCertificates] = useState([]);
    const [selectedCert, setSelectedCert] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const certRef = useRef(null);

    useEffect(() => {
        const fetchCertificates = async () => {
            const email = localStorage.getItem("userEmail") || localStorage.getItem("email");
            if (!email) return;
            try {
                const res = await fetch(`/api/admin/certificates?email=${email}`, { cache: 'no-store' });
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
                        themeId: cert.themeId || 1,
                        customUrl: cert.customUrl,
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
        if (isDownloading) return;
        setIsDownloading(true);
        const tid = toast.loading("Generating high-resolution certificate...");
        try {
            const el = certRef.current;
            if (!el) {
                toast.error("Reference node missing", { id: tid });
                return;
            }
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(el, { 
                scale: 3, // Higher scale for better quality
                useCORS: true, 
                backgroundColor: null,
                logging: false,
                allowTaint: true
            });
            const link = document.createElement('a');
            link.download = `${cert.id}_Certificate.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
            toast.success("Certificate saved to local storage", { id: tid });
        } catch (err) {
            console.error("Download failed:", err);
            toast.error("Download sequence failed. Please try again.", { id: tid });
        } finally {
            setIsDownloading(false);
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
                                    <div className="relative group/cert-visual inline-block w-full max-w-[750px]">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDownload(selectedCert); }} 
                                            disabled={isDownloading}
                                            className="absolute top-4 right-4 z-[40] w-14 h-14 bg-black text-white rounded-[1.2rem] flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer border-4 border-white group disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Download Certificate"
                                        >
                                            {isDownloading ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                                            ) : (
                                                <Download className="w-6 h-6 group-hover:animate-bounce" />
                                            )}
                                        </button>

                                        <div ref={certRef} className="w-full aspect-[1.414/1] bg-white rounded-3xl shadow-2xl overflow-hidden ring-1 ring-gray-100">
                                            <CertificateDesign cert={selectedCert} />
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
