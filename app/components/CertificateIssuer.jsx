"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Award, Upload, Download, ChevronRight, Check, Image as ImageIcon, Sparkles, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

const TEMPLATES = [
    { id: 1, name: "Classic Gold", bg: "#FFFDF5", accent: "#B8860B", border: "#DAA520", textColor: "#1a1a1a", font: "Georgia", pattern: "classic" },
    { id: 2, name: "Modern Dark", bg: "#0f0f0f", accent: "#6366f1", border: "#4f46e5", textColor: "#ffffff", font: "Inter", pattern: "modern" },
    { id: 3, name: "Ocean Blue", bg: "#f0f9ff", accent: "#0369a1", border: "#0284c7", textColor: "#0c4a6e", font: "Georgia", pattern: "ocean" },
    { id: 4, name: "Emerald Pro", bg: "#f0fdf4", accent: "#15803d", border: "#16a34a", textColor: "#14532d", font: "Georgia", pattern: "emerald" },
    { id: 5, name: "Royal Purple", bg: "#faf5ff", accent: "#7e22ce", border: "#9333ea", textColor: "#3b0764", font: "Inter", pattern: "royal" },
];

function drawCertificate(canvas, template, data) {
    if (!canvas || !template) return;
    const ctx = canvas.getContext("2d");
    const W = 1200, H = 850;
    canvas.width = W; canvas.height = H;

    // Clear and background
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = template.bg;
    ctx.fillRect(0, 0, W, H);

    // Border
    ctx.strokeStyle = template.border;
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 30, W - 60, H - 60);
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, W - 80, H - 80);

    // Corner accents
    const corners = [[50, 50], [W - 50, 50], [50, H - 50], [W - 50, H - 50]];
    corners.forEach(([cx, cy]) => {
        ctx.fillStyle = template.accent;
        ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.fill();
    });

    // Pattern decorations
    if (template.pattern === "classic") {
        ctx.strokeStyle = template.border + "30";
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) { ctx.strokeRect(35 + i * 3, 35 + i * 3, W - 70 - i * 6, H - 70 - i * 6); }
    } else if (template.pattern === "modern") {
        ctx.fillStyle = template.accent + "15";
        ctx.fillRect(0, 0, W * 0.4, H);
        ctx.fillStyle = template.accent + "08";
        for (let i = 0; i < 10; i++) { ctx.fillRect(W - 200 + i * 20, 0, 10, H); }
    } else if (template.pattern === "ocean") {
        for (let i = 0; i < 3; i++) {
            ctx.beginPath(); ctx.strokeStyle = template.accent + "15"; ctx.lineWidth = 40;
            ctx.arc(W / 2, H + 200 + i * 80, 600 + i * 80, Math.PI, 0); ctx.stroke();
        }
    } else if (template.pattern === "emerald") {
        ctx.fillStyle = template.accent + "08";
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(300, 0); ctx.lineTo(0, 300); ctx.fill();
        ctx.beginPath(); ctx.moveTo(W, H); ctx.lineTo(W - 300, H); ctx.lineTo(W, H - 300); ctx.fill();
    } else if (template.pattern === "royal") {
        ctx.fillStyle = template.accent + "10";
        ctx.beginPath(); ctx.arc(W / 2, -100, 400, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(W / 2, H + 100, 400, 0, Math.PI * 2); ctx.fill();
    }

    // Top decorative line
    ctx.fillStyle = template.accent;
    ctx.fillRect(W / 2 - 60, 70, 120, 4);

    // Organization
    ctx.fillStyle = template.accent;
    ctx.font = `bold 16px ${template.font}, serif`;
    ctx.textAlign = "center";
    ctx.fillText("DIGITAL SOUTH", W / 2, 110);

    // Title
    ctx.fillStyle = template.textColor;
    ctx.font = `bold 54px ${template.font}, serif`;
    ctx.fillText("CERTIFICATE", W / 2, 190);
    ctx.font = `22px ${template.font}, serif`;
    ctx.fillStyle = template.accent;
    ctx.fillText("OF ACHIEVEMENT", W / 2, 220);

    // Divider
    ctx.fillStyle = template.accent;
    ctx.fillRect(W / 2 - 120, 245, 240, 3);

    // "Presented to"
    ctx.fillStyle = template.textColor + "aa";
    ctx.font = `italic 18px ${template.font}, serif`;
    ctx.fillText("This certificate is proudly presented to", W / 2, 305);

    // Name
    ctx.fillStyle = template.textColor;
    ctx.font = `bold 62px ${template.font}, serif`;
    ctx.fillText(data.name || "Intern Name", W / 2, 380);

    // Underline
    const nameW = ctx.measureText(data.name || "Intern Name").width;
    ctx.strokeStyle = template.accent;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(W / 2 - nameW / 2 - 20, 395); ctx.lineTo(W / 2 + nameW / 2 + 20, 395); ctx.stroke();

    // Description
    ctx.fillStyle = template.textColor + "cc";
    ctx.font = `20px ${template.font}, serif`;
    const desc = `For successfully completing the ${data.track || "Internship"} program`;
    ctx.fillText(desc, W / 2, 445);

    // Certificate title
    ctx.fillStyle = template.accent;
    ctx.font = `bold 26px ${template.font}, serif`;
    ctx.fillText(`"${data.title || "Internship Completion"}"`, W / 2, 495);

    // Project info
    if (data.project) {
        ctx.fillStyle = template.textColor + "99";
        ctx.font = `16px ${template.font}, serif`;
        ctx.fillText(`Project: ${data.project}`, W / 2, 545);
    }

    // Bottom section
    ctx.fillStyle = template.accent;
    ctx.fillRect(W / 2 - 120, 595, 240, 2);

    // Date & ID
    ctx.fillStyle = template.textColor + "88";
    ctx.font = `14px ${template.font}, sans-serif`;
    const d = new Date();
    const dateStr = d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    ctx.textAlign = "left";
    ctx.fillText(`Date: ${dateStr}`, 140, 710);
    ctx.textAlign = "right";
    ctx.fillText(`Certificate ID: ${data.certId || "DS-CERT-XXXX"}`, W - 140, 710);

    // Signatures
    ctx.strokeStyle = template.accent + "60";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(200, 780); ctx.lineTo(400, 780); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W - 400, 780); ctx.lineTo(W - 200, 780); ctx.stroke();

    ctx.fillStyle = template.textColor + "99";
    ctx.font = `14px ${template.font}, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("Program Director", 300, 805);
    ctx.fillText("Chief Executive", W - 300, 805);

    // Seal
    ctx.beginPath(); ctx.arc(W / 2, 740, 45, 0, Math.PI * 2);
    ctx.fillStyle = template.accent + "15"; ctx.fill();
    ctx.strokeStyle = template.accent; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = template.accent;
    ctx.font = `bold 12px ${template.font}, sans-serif`;
    ctx.fillText("DIGITAL", W / 2, 737);
    ctx.fillText("SOUTH", W / 2, 750);
}

export default function CertificateIssuer({ user, projects, certificates, setCertificates, showModal, setShowModal }) {
    const [step, setStep] = useState("list"); // list, issue
    const [selectedTemplate, setSelectedTemplate] = useState(1);
    const [selectedProject, setSelectedProject] = useState("");
    const [certTitle, setCertTitle] = useState("");
    const [customImage, setCustomImage] = useState(null);
    const [useCustom, setUseCustom] = useState(false);
    const [isIssuing, setIsIssuing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(null); // ID of cert being deleted
    const [viewingCert, setViewingCert] = useState(null); 
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (user?.track) setCertTitle(`${user.track} Internship Completion`);
    }, [user?.track]);

    const renderPreview = useCallback((node) => {
        const targetCanvas = node || canvasRef.current;
        if (!targetCanvas || useCustom || viewingCert?.customUrl) return;
        
        // Use viewingCert if available, fallback to selectedTemplate
        const activeThemeId = viewingCert?.themeId || selectedTemplate;
        const tpl = TEMPLATES.find(t => t.id === Number(activeThemeId)) || TEMPLATES[0];
        
        const name = viewingCert?.internName || user?.fullName || "Intern";
        const track = viewingCert?.track || user?.track;
        const title = viewingCert?.title || certTitle;
        const certId = viewingCert?.certificateId || "DS-CERT-PREVIEW";

        requestAnimationFrame(() => {
            drawCertificate(targetCanvas, tpl, {
                name,
                track,
                title,
                project: selectedProject,
                certId
            });
        });
    }, [selectedTemplate, certTitle, selectedProject, user, useCustom, viewingCert]);

    // Callback ref to handle immediate drawing when canvas mounts
    const setCanvasRef = useCallback(node => {
        if (node) {
            canvasRef.current = node;
            renderPreview(node);
        }
    }, [renderPreview]);

    useEffect(() => { 
        if ((step === "issue" || step === "view") && canvasRef.current) {
            renderPreview();
            // High-frequency failsafe rendering for the first 500ms
            const timers = [10, 50, 150, 300, 600].map(ms => setTimeout(renderPreview, ms));
            return () => timers.forEach(t => clearTimeout(t));
        }
    }, [step, renderPreview]);

    const handleCustomUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => { setCustomImage(ev.target.result); setUseCustom(true); };
        reader.readAsDataURL(file);
    };

    const handleDownload = () => {
        if (useCustom && customImage) {
            const a = document.createElement("a");
            a.href = customImage;
            a.download = `certificate_${user?.fullName?.replace(/\s+/g, "_")}.png`;
            a.click();
        } else if (canvasRef.current) {
            const a = document.createElement("a");
            a.href = canvasRef.current.toDataURL("image/png");
            a.download = `certificate_${user?.fullName?.replace(/\s+/g, "_")}.png`;
            a.click();
        }
    };

    const handleDelete = async (certId) => {
        if (!confirm("Are you sure you want to PERMANENTLY DELETE this certificate?")) return;
        setIsDeleting(certId);
        const tid = toast.loading("Executing identity extraction...");
        try {
            const res = await fetch(`/api/admin/certificates?id=${certId}`, { method: "DELETE" });
            if (res.ok) {
                setCertificates(prev => prev.filter(c => c._id !== certId));
                toast.success("Certificate purged from database", { id: tid });
            } else {
                toast.error("Deletion sequence failed", { id: tid });
            }
        } catch {
            toast.error("Network Link Unstable", { id: tid });
        } finally {
            setIsDeleting(null);
        }
    };

    const handleIssue = async () => {
        if (!certTitle.trim() && !useCustom) return toast.error("Please provide a certificate title");
        setIsIssuing(true);
        const tid = toast.loading("Processing certificate issuance...");
        try {
            let finalCustomUrl = null;

            // 1. If custom image used, upload it first
            if (useCustom && customImage) {
                // customImage is base64 from reader.readAsDataURL
                const blob = await (await fetch(customImage)).blob();
                const file = new File([blob], "custom_certificate.png", { type: "image/png" });
                
                const formData = new FormData();
                formData.append("file", file);
                formData.append("email", user.email);
                formData.append("type", "Certificates");

                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: formData
                });
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    finalCustomUrl = uploadData.url;
                } else {
                    throw new Error("Custom image upload failed");
                }
            }

            // 2. Create certificate record
            const res = await fetch("/api/admin/certificates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    internEmail: user.email,
                    internName: user.fullName,
                    title: certTitle || (useCustom ? "Professional Certificate" : ""),
                    track: user.track,
                    type: "Completion",
                    themeId: Number(selectedTemplate),
                    customUrl: finalCustomUrl
                })
            });
            if (res.ok) {
                const newCert = await res.json();
                setCertificates(prev => [newCert, ...prev]);
                toast.success("Certificate issued successfully!", { id: tid });
                setStep("list");
            } else {
                toast.error("Issuance sequence failed", { id: tid });
            }
        } catch (err) {
            toast.error(err.message || "Network Link Unstable", { id: tid });
        } finally {
            setIsIssuing(false);
        }
    };

    const openIssue = () => {
        setViewingCert(null);
        setStep("issue");
    };

    const openView = (cert) => {
        setViewingCert(cert);
        setUseCustom(false);
        if (cert.themeId) setSelectedTemplate(cert.themeId);
        setStep("issue"); // Reuse the step UI
    };

    if (!showModal) return null;

    return (
        <AnimatePresence>
            {showModal && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => { setShowModal(false); setStep("list"); }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md" />

                    <AnimatePresence mode="wait">
                        {step === "list" ? (
                            <motion.div key="list" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">

                                {/* Header */}
                                <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-lg shadow-black/10">
                                    <Award className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Certificates</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{certificates.length} Total Records for {user?.fullName}</p>
                                </div>
                            </div>
                            <button onClick={() => { setShowModal(false); setStep("list"); }}
                                className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 transition-all shadow-sm">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-8 overflow-y-auto flex-1 bg-white">
                            {certificates.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                                        <Award className="w-10 h-10 text-gray-200" />
                                    </div>
                                    <p className="text-sm font-black text-gray-300 uppercase tracking-widest">No Certificates Yet</p>
                                    <p className="text-[10px] text-gray-400 font-medium">Click below to issue the first certificate.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {certificates.map((cert, idx) => (
                                        <div key={cert._id || `cert-${idx}`} className="group bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] rounded-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
                                            <div className="relative z-10 flex justify-between items-start mb-6">
                                                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-inner group-hover:scale-110 transition-transform">
                                                    <Award className="w-6 h-6 text-emerald-600" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        onClick={() => openView(cert)}
                                                        className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-500 hover:text-black hover:border-black transition-all shadow-sm group/view"
                                                        title="View Certificate"
                                                    >
                                                        <Sparkles className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(cert._id)}
                                                        disabled={isDeleting === cert._id}
                                                        className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-300 hover:text-red-500 hover:border-red-500 transition-all shadow-sm group/del"
                                                        title="Delete Certificate"
                                                    >
                                                        <Trash2 className={`w-4 h-4 ${isDeleting === cert._id ? 'animate-pulse' : ''}`} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="relative z-10 space-y-4">
                                                <h3 className="text-lg font-black text-gray-900 leading-tight">{cert.title}</h3>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 inline-block px-2 py-1 rounded-lg border border-gray-100 truncate max-w-full">
                                                    ID: {cert.certificateId}
                                                </p>
                                                <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                                        {new Date(cert.issuedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                    </span>
                                                    <span className="text-[10px] text-emerald-600 font-bold uppercase">Active</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button onClick={openIssue}
                                className="px-8 py-4 bg-black text-white rounded-[1.25rem] text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10 flex items-center gap-2">
                                <Award className="w-4 h-4" /> Issue New Certificate
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="issue" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="relative w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setStep("list")}
                                    className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-black transition-all shadow-sm">
                                    <ChevronRight className="w-4 h-4 rotate-180" />
                                </button>
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">{viewingCert ? "Review Certificate" : "Issue Certificate"}</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">For {user?.fullName}</p>
                                </div>
                            </div>
                            <button onClick={() => { setShowModal(false); setStep("list"); }}
                                className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 transition-all shadow-sm">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                {/* Left: Controls */}
                                <div className="space-y-5">
                                    {/* Certificate Title */}
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Certificate Title</label>
                                        <input className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold text-gray-800 focus:outline-none focus:ring-4 focus:ring-black/5 transition-all disabled:opacity-70 disabled:grayscale-[0.5]"
                                            value={viewingCert ? viewingCert.title : certTitle} 
                                            onChange={e => setCertTitle(e.target.value)}
                                            disabled={!!viewingCert}
                                            placeholder="E.g. Full Stack Web Development" />
                                    </div>

                                    {/* Project Selection */}
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Link to Project (Optional)</label>
                                        <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
                                            disabled={!!viewingCert}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold text-gray-800 focus:outline-none focus:ring-4 focus:ring-black/5 appearance-none cursor-pointer disabled:opacity-70">
                                            <option value="">No project linked</option>
                                            {projects.map((p, idx) => <option key={p._id || `proj-${idx}`} value={p.projectName}>{p.projectName}</option>)}
                                        </select>
                                    </div>

                                    {/* Template Selection */}
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Choose Template</label>
                                        <div className="grid grid-cols-5 gap-2">
                                            {TEMPLATES.map(tpl => (
                                                <button key={tpl.id} 
                                                    onClick={() => { if (!viewingCert) { setSelectedTemplate(tpl.id); setUseCustom(false); } }}
                                                    disabled={!!viewingCert}
                                                    className={`relative p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 group ${selectedTemplate === tpl.id && !useCustom ? "border-black shadow-lg scale-105" : "border-gray-100 hover:border-gray-300"} disabled:hover:scale-100 disabled:cursor-not-allowed`}>
                                                    <div className="w-full h-10 rounded-lg" style={{ background: tpl.bg, border: `2px solid ${tpl.border}` }} />
                                                    <span className="text-[7px] font-black uppercase tracking-wider text-gray-500 group-hover:text-black">{tpl.name}</span>
                                                    {selectedTemplate === tpl.id && !useCustom && (
                                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-black rounded-full flex items-center justify-center">
                                                            <Check className="w-3 h-3 text-white" />
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {!viewingCert && (
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Or Upload Custom Certificate</label>
                                            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleCustomUpload} className="hidden" />
                                            <button onClick={() => fileInputRef.current?.click()}
                                                className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border-2 border-dashed ${useCustom ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-400 border-gray-200 hover:border-black hover:text-black"}`}>
                                                {useCustom ? <><Check className="w-4 h-4" /> Custom Image Loaded</> : <><Upload className="w-4 h-4" /> Upload PNG / JPG</>}
                                            </button>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-2">
                                        <button onClick={() => setStep("list")}
                                            className="flex-1 py-3 bg-gray-50 text-gray-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-100">
                                            Back
                                        </button>
                                        <button onClick={handleDownload}
                                            className="flex-1 py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all border border-gray-200 flex items-center justify-center gap-2">
                                            <Download className="w-3.5 h-3.5" /> Download PNG
                                        </button>
                                        {!viewingCert && (
                                            <button onClick={handleIssue} disabled={isIssuing}
                                                className="flex-[1.5] py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 shadow-lg flex items-center justify-center gap-2">
                                                <Sparkles className="w-3.5 h-3.5" /> {isIssuing ? "Issuing..." : "Issue Certificate"}
                                            </button>
                                        )}
                                    </div>
                                    
                                    {viewingCert && (
                                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-2">
                                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                                <Check className="w-3 h-3" /> Record Authenticated
                                            </p>
                                            <p className="text-[10px] text-emerald-600/70 font-medium leading-relaxed">
                                                This is a digital reproduction of the issued record ID: <span className="font-bold underline">{viewingCert.certificateId}</span>.
                                                Template choice: <span className="font-bold">{TEMPLATES.find(t => t.id === Number(viewingCert.themeId))?.name || `Default (RAW: ${viewingCert.themeId})`}</span>.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Right: Preview */}
                                <div className="bg-gray-100 rounded-3xl p-4 flex items-center justify-center min-h-[400px] shadow-inner">
                                    { (useCustom && customImage) ? (
                                        <img src={customImage} alt="Custom certificate" className="max-w-full max-h-[500px] rounded-2xl shadow-xl border border-white" />
                                    ) : (viewingCert?.customUrl) ? (
                                        <img src={viewingCert.customUrl} alt="Issued certificate" className="max-w-full max-h-[500px] rounded-2xl shadow-xl border border-white" />
                                    ) : (
                                        <canvas ref={setCanvasRef} className="max-w-full max-h-[500px] rounded-2xl shadow-xl border border-white" style={{ width: "100%", height: "auto" }} />
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
        )}
        </AnimatePresence>
    );
}
