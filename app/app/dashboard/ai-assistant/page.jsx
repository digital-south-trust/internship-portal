"use client";

import { useState, useRef, useEffect } from "react";
import {
    Send,
    Youtube,
    Mail,
    Plus,
    PanelLeft,
    PanelLeftClose,
    Pin,
    PinOff,
    Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import ReactMarkdown from "react-markdown";

export default function AIAssistantPage() {
    const [conversations, setConversations] = useState([]);
    const [currentConversationId, setCurrentConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isResolved, setIsResolved] = useState(null);
    const [aiResponseCount, setAiResponseCount] = useState(0);
    const [showResolutionCheck, setShowResolutionCheck] = useState(false);
    const [noCount, setNoCount] = useState(0);
    const [showMentorHelp, setShowMentorHelp] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isNewChatMode, setIsNewChatMode] = useState(true);
    const [mentorRequestStatus, setMentorRequestStatus] = useState(null); // 'sending', 'sent', 'error'
    const scrollRef = useRef(null);
    const inputRef = useRef(null);

    const userEmail = typeof window !== 'undefined' ? localStorage.getItem("userEmail") : null;

    useEffect(() => { fetchConversations(); }, []);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, loading]);

    const [sidebarShrink, setSidebarShrink] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('sidebarShrinked') === 'true';
        }
        return false;
    });

    useEffect(() => {
        const handleShrink = (e) => setSidebarShrink(e.detail);
        window.addEventListener('sidebar-shrink', handleShrink);
        return () => window.removeEventListener('sidebar-shrink', handleShrink);
    }, []);

    const fetchConversations = async () => {
        if (!userEmail) return;
        try {
            const res = await fetch(`/api/ai/chat?email=${userEmail}`);
            if (res.ok) setConversations(await res.json());
        } catch (err) { console.error("Failed to fetch conversations"); }
    };

    const startNewChat = () => {
        setCurrentConversationId(null);
        setMessages([]);
        setIsNewChatMode(true);
        setAiResponseCount(0);
        setIsResolved(null);
        setShowResolutionCheck(false);
        setNoCount(0);
        setShowMentorHelp(false);
        setMentorRequestStatus(null);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleDeleteChat = async (e, id) => {
        e.stopPropagation();
        try {
            const res = await fetch(`/api/ai/chat?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                if (currentConversationId === id) startNewChat();
                setConversations(prev => prev.filter(c => c._id !== id));
                toast.success('Chat deleted');
            }
        } catch (err) { toast.error('Failed to delete'); }
    };

    const handlePinChat = async (e, id, currentPinned) => {
        e.stopPropagation();
        // Max 3 pinned chats
        if (!currentPinned) {
            const pinnedCount = conversations.filter(c => c.isPinned).length;
            if (pinnedCount >= 3) { toast.error('Maximum 3 pinned chats allowed'); return; }
        }
        // Optimistically update local state immediately
        setConversations(prev => {
            const updated = prev.map(c =>
                c._id === id ? { ...c, isPinned: !currentPinned } : c
            );
            // Sort: pinned first, then by date
            return updated.sort((a, b) => {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                return new Date(b.updatedAt) - new Date(a.updatedAt);
            });
        });
        toast.success(currentPinned ? 'Unpinned' : 'Pinned');
        // Persist to server in background
        try {
            await fetch('/api/ai/chat', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId: id, isPinned: !currentPinned })
            });
        } catch (err) { toast.error('Failed to save pin status'); }
    };

    const loadConversation = async (id) => {
        setLoading(true);
        setCurrentConversationId(id);
        setIsNewChatMode(false);
        try {
            const res = await fetch(`/api/ai/chat?id=${id}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages.map((m, i) => ({ ...m, id: Date.now() + i })));
                setAiResponseCount(data.aiResponseCount || 0);
                setIsResolved(data.isResolved);
                setShowResolutionCheck(false);
            }
        } catch (err) { toast.error("Failed to load chat history"); }
        finally { setLoading(false); }
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;
        const userMessage = { role: "user", content: input, id: Date.now() };
        setMessages(prev => [...prev, userMessage]);
        setIsNewChatMode(false);
        const currentInput = input;
        setInput("");
        setLoading(true);
        setShowResolutionCheck(false);

        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: currentInput, email: userEmail,
                    conversationId: currentConversationId,
                    history: messages.map(m => ({ role: m.role, content: m.content }))
                })
            });
            const data = await res.json();
            if (res.ok) {
                setMessages(prev => [...prev, { role: "assistant", content: data.content, id: Date.now() + 1 }]);
                setAiResponseCount(data.aiResponseCount);
                if (!currentConversationId) { setCurrentConversationId(data.conversationId); fetchConversations(); }
                // Only show resolution check for technical responses
                if (data.responseType === 'technical') {
                    setTimeout(() => setShowResolutionCheck(true), 1000);
                }
                // Check if AI detected a repeated question
                if (data.repeated) {
                    setShowMentorHelp(true);
                }
            } else if (res.status === 429) {
                // Daily limit reached - show as a chat message
                setMessages(prev => [...prev, {
                    role: "assistant",
                    content: "⚠️ " + (data.message || "Daily limit reached. Contact admin for more access."),
                    id: Date.now() + 1
                }]);
            } else { toast.error(data.message || "Something went wrong"); }
        } catch (err) { toast.error("Failed to connect to AI assistant"); }
        finally { setLoading(false); }
    };

    const handleResolution = async (resolved) => {
        setIsResolved(resolved);
        setShowResolutionCheck(false);

        if (!resolved) {
            const newNoCount = noCount + 1;
            setNoCount(newNoCount);

            if (newNoCount === 1) {
                // First time "No" - ask AI for a better explanation
                setLoading(true);
                const followUpText = "I didn't quite understand that. Could you explain it in a more classified, structured way with clear examples?";

                // Add user follow-up message locally
                setMessages(prev => [...prev, { role: "user", content: followUpText, id: Date.now() }]);

                try {
                    const res = await fetch("/api/ai/chat", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            message: followUpText,
                            email: userEmail,
                            conversationId: currentConversationId,
                            history: messages.map(m => ({ role: m.role, content: m.content }))
                        })
                    });
                    const data = await res.json();
                    if (res.ok) {
                        setMessages(prev => [...prev, { role: "assistant", content: data.content, id: Date.now() + 1 }]);
                        setAiResponseCount(data.aiResponseCount);
                        // Show resolution check again after AI clarifies
                        setTimeout(() => setShowResolutionCheck(true), 2000);
                    }
                } catch (err) { toast.error("Failed to get clarified response"); }
                finally { setLoading(false); }
            } else if (newNoCount >= 2) {
                // Second time "No" - offer mentor help
                setShowMentorHelp(true);
            }
        }

        try {
            await fetch("/api/ai/chat", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conversationId: currentConversationId, isResolved: resolved })
            });

            if (resolved) {
                setMessages(prev => [...prev, {
                    role: "assistant",
                    content: "Great! I'm glad I could help. Feel free to ask if you have any other questions.",
                    id: Date.now() + 2
                }]);
            }
        } catch (err) { console.error("Resolution update failed"); }
    };

    const handleRequestMentorHelp = async (confirm) => {
        if (!confirm) {
            setShowMentorHelp(false);
            return;
        }

        setMentorRequestStatus('sending');
        try {
            const lastQuestion = messages.filter(m => m.role === 'user').pop()?.content || "Intern Doubt";
            const res = await fetch("/api/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: 'Intern Doubt',
                    description: `AI Assistant was unable to resolve a doubt. 
                    User Email: ${userEmail}
                    Latest Question: ${lastQuestion}
                    Conversation ID: ${currentConversationId}`,
                    reportedBy: userEmail,
                    status: 'Open'
                })
            });
            if (res.ok) {
                setMentorRequestStatus('sent');
                toast.success("Request sent to technical mentors");
            } else {
                setMentorRequestStatus('error');
                toast.error("Failed to create ticket");
            }
        } catch (err) {
            setMentorRequestStatus('error');
            toast.error("Error connecting to support");
        }
    };

    const renderContent = (content) => {
        return (
            <div className="prose prose-base prose-neutral max-w-none 
                prose-headings:text-gray-900 prose-headings:font-bold prose-headings:text-base
                prose-p:text-gray-800 prose-p:text-[16px] prose-p:leading-relaxed prose-p:my-1
                prose-strong:text-gray-900 prose-strong:font-bold
                prose-ul:my-2 prose-ol:my-2 prose-li:text-[16px] prose-li:text-gray-800
                prose-code:text-[14px] prose-code:bg-neutral-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-gray-800 prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-neutral-900 prose-pre:text-neutral-100 prose-pre:rounded-lg prose-pre:text-[14px]
                prose-a:text-blue-600 prose-a:underline
            ">
                <ReactMarkdown>{content}</ReactMarkdown>
            </div>
        );
    };

    // Show mentor help if: user said No 3 times OR AI detected repeated question
    const showSupportOption = showMentorHelp;

    /* 
     * Position: fixed, anchored to the RIGHT of the main nav sidebar.
     * Main sidebar = md:ml-64 = 16rem = 256px.
     * This covers the entire content area while keeping the nav sidebar visible.
     */
    return (
        <div className={`fixed top-0 right-0 bottom-0 transition-all duration-300 ${sidebarShrink ? 'md:left-20' : 'md:left-64'} z-[40] flex bg-white overflow-hidden`}>
            {/* ── HISTORY SIDEBAR ── */}
            <AnimatePresence initial={false}>
                {sidebarOpen && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 280, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-[#fafafa] border-r border-neutral-100 flex flex-col overflow-hidden flex-shrink-0"
                    >
                        <div className="p-5 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[13px] font-bold uppercase tracking-[0.15em] text-neutral-400">History</span>
                                <button onClick={() => setSidebarOpen(false)} className="p-1.5 hover:bg-neutral-200 rounded-md transition-colors">
                                    <PanelLeftClose className="w-5 h-5 text-neutral-400" />
                                </button>
                            </div>
                            <button
                                onClick={startNewChat}
                                className="w-full py-3 bg-black text-white rounded-lg text-[13px] font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> New Chat
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5 custom-scrollbar">
                            {conversations.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-32 opacity-25">
                                    <p className="text-[11px] font-bold uppercase tracking-widest">No History</p>
                                </div>
                            ) : (
                                conversations.map(conv => (
                                    <div
                                        key={conv._id}
                                        onClick={() => loadConversation(conv._id)}
                                        className={`w-full p-4 rounded-lg text-left transition-all cursor-pointer group relative flex items-center gap-2 ${currentConversationId === conv._id
                                            ? 'bg-white shadow-sm ring-1 ring-neutral-100 text-black'
                                            : 'hover:bg-neutral-100 text-neutral-500'
                                            }`}
                                    >
                                        {conv.isPinned && <Pin className="w-5 h-5 text-neutral-300 flex-shrink-0 rotate-45" />}
                                        <p className="text-[18px] font-bold truncate leading-snug flex-1">{conv.title}</p>
                                        <div className="hidden group-hover:flex items-center gap-1.5 flex-shrink-0">
                                            <button
                                                onClick={(e) => handlePinChat(e, conv._id, conv.isPinned)}
                                                className={`p-1.5 rounded-lg hover:bg-neutral-200 transition-colors ${conv.isPinned ? 'text-black' : 'text-neutral-400'}`}
                                                title={conv.isPinned ? 'Unpin' : 'Pin'}
                                            >
                                                {conv.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteChat(e, conv._id)}
                                                className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── CHAT AREA ── */}
            <div className="flex-1 flex flex-col min-w-0 bg-white relative">
                {!sidebarOpen && (
                    <div className="w-full flex items-center justify-between px-6 py-3 border-b border-neutral-100 bg-white flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <button onClick={() => setSidebarOpen(true)} className="p-2 bg-neutral-50 hover:bg-neutral-100 rounded-lg text-neutral-500 hover:text-black transition-all">
                                <PanelLeft className="w-4 h-4" />
                            </button>
                            <button onClick={startNewChat} className="px-4 py-2 bg-black text-white rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all flex items-center gap-2">
                                <Plus className="w-3.5 h-3.5" /> New Chat
                            </button>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-300">AI Assistant</span>
                    </div>
                )}

                <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 md:px-16 lg:px-28 space-y-5 scroll-smooth custom-scrollbar pt-16 pb-8">
                    {isNewChatMode && messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-8 pb-16">
                            <div className="w-64 h-64 md:w-80 md:h-80">
                                <img src="/ai picture.jpg" alt="AI Agent" className="w-full h-full object-contain" />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                                What can I help with?
                            </h1>
                        </div>
                    ) : (
                        <>
                            <AnimatePresence initial={false}>
                                {messages.map((m) => (
                                    <motion.div key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex flex-col space-y-1 max-w-[85%] md:max-w-[80%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                            <div className={`px-5 py-4 rounded-2xl text-base leading-relaxed ${m.role === 'user'
                                                ? 'bg-[#f4f4f4] text-gray-800 rounded-tr-none'
                                                : 'text-gray-900 font-medium'
                                                }`}>
                                                {renderContent(m.content)}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-neutral-50 px-3 py-2 rounded-xl flex gap-1.5 items-center">
                                        <span className="w-1 h-1 bg-neutral-300 rounded-full animate-bounce" />
                                        <span className="w-1 h-1 bg-neutral-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <span className="w-1 h-1 bg-neutral-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    </div>
                                </div>
                            )}

                            {showResolutionCheck && !loading && (
                                <div className="flex justify-center py-4">
                                    <div className="bg-white border border-neutral-100 shadow-lg rounded-2xl p-6 text-center space-y-3 max-w-xs">
                                        <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Query Resolved?</p>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleResolution(true)} className="flex-1 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-bold uppercase">Yes</button>
                                            <button onClick={() => handleResolution(false)} className="flex-1 py-1.5 bg-red-50 text-red-500 rounded-lg text-[9px] font-bold uppercase">No</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {showSupportOption && (
                                <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-8 text-center space-y-4">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-bold text-gray-900 uppercase">Need more help?</h3>
                                        <p className="text-[8px] text-neutral-400 font-bold uppercase italic tracking-widest leading-relaxed">
                                            It seems you still have doubts. Would you like to connect with a technical mentor?
                                        </p>
                                    </div>

                                    {mentorRequestStatus === 'sent' ? (
                                        <div className="py-2 px-4 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-bold uppercase flex items-center justify-center gap-2 mx-auto w-fit">
                                            <Mail className="w-3.5 h-3.5" /> Request Sent! Mentors will contact you soon.
                                        </div>
                                    ) : (
                                        <div className="flex gap-2 justify-center pt-2">
                                            <button
                                                disabled={mentorRequestStatus === 'sending'}
                                                onClick={() => handleRequestMentorHelp(true)}
                                                className="px-6 py-2 bg-black text-white rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all flex items-center gap-2"
                                            >
                                                {mentorRequestStatus === 'sending' ? 'Sending...' : 'Yes, Connect'}
                                            </button>
                                            <button
                                                disabled={mentorRequestStatus === 'sending'}
                                                onClick={() => handleRequestMentorHelp(false)}
                                                className="px-6 py-2 bg-white border border-neutral-200 text-neutral-500 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-neutral-50 transition-all"
                                            >
                                                No, Thanks
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="p-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-[#111] border border-[#222] rounded-2xl p-2 pl-6 flex items-center gap-4">
                            <input
                                ref={inputRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                                placeholder="Ask me anything..."
                                className="flex-1 py-4 text-base text-white outline-none bg-transparent"
                            />
                            <button onClick={handleSend} disabled={!input.trim() || loading} className="w-12 h-12 bg-white text-black rounded-xl flex items-center justify-center disabled:opacity-20 transition-all hover:scale-105 active:scale-95 shadow-lg">
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 3px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #eee; border-radius: 10px; }
            `}</style>
        </div>
    );
}
