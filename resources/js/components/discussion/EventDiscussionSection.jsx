import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, User, Clock, ShieldCheck, RefreshCw } from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { formatDateTime } from "../../utils/formatters";

export default function EventDiscussionSection({ eventId, eventTitle = "Acara" }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    const fetchDiscussions = async () => {
        if (!eventId) return;
        setLoading(true);
        try {
            const res = await api.get(`/events/${eventId}/discussions`);
            setMessages(res.data?.data || []);
        } catch (err) {
            console.error("Gagal memuat diskusi acara:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDiscussions();
        // Polling riwayat pesan setiap 8 detik agar percakapan tetap sinkron
        const interval = setInterval(() => {
            if (!sending) fetchDiscussions();
        }, 8000);
        return () => clearInterval(interval);
    }, [eventId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || sending) return;

        setSending(true);
        try {
            const res = await api.post(`/events/${eventId}/discussions`, {
                message: inputMessage.trim(),
            });
            const newMsg = res.data?.data;
            if (newMsg) {
                setMessages((prev) => [...prev, newMsg]);
            }
            setInputMessage("");
        } catch (err) {
            console.error("Gagal mengirim pesan diskusi:", err);
        } finally {
            setSending(false);
        }
    };

    const getRoleBadge = (role) => {
        if (role === "eo") {
            return {
                label: "EO Evento",
                className: "bg-[#99CDD8]/40 text-[#1F4B54] border-[#86BAC5]",
            };
        }
        if (role === "vendor") {
            return {
                label: "Mitra Vendor",
                className: "bg-[#CFD8C4] text-[#33422A] border-[#B6C2AA]",
            };
        }
        return {
            label: "Klien Pemesan",
            className: "bg-[#FDE8D3] text-[#63482B] border-[#E8CEB2]",
        };
    };

    return (
        <div className="bg-white rounded-2xl border border-[#E8E2D7] p-5 shadow-xs flex flex-col">
            {/* Header Diskusi */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E8E2D7]">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#DAEBE3] text-[#224436] flex items-center justify-center font-bold">
                        <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-extrabold text-[#2F3931]">
                            Diskusi & Catatan Khusus Acara
                        </h3>
                        <p className="text-[11px] text-[#738075]">
                            Ruang koordinasi langsung antara Klien dan Tim Event Organizer
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={fetchDiscussions}
                        disabled={loading}
                        className="p-1.5 text-[#738075] hover:text-[#2F3931] hover:bg-[#FAF6F0] rounded-lg transition cursor-pointer"
                        title="Segarkan diskusi"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                    </button>
                    <span className="text-[10px] font-bold text-[#738075] bg-[#FAF6F0] px-2.5 py-1 rounded-full border border-[#E8E2D7]">
                        {messages.length} Catatan
                    </span>
                </div>
            </div>

            {/* Area Pesan Thread */}
            <div className="flex-1 overflow-y-auto max-h-80 min-h-[160px] p-3 space-y-3 bg-[#FAF6F0]/40 rounded-xl border border-[#E8E2D7]/70">
                {loading && messages.length === 0 ? (
                    <div className="flex justify-center items-center h-32 text-xs text-[#738075]">
                        Memuat riwayat diskusi...
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-center text-[#738075]">
                        <MessageSquare className="w-6 h-6 text-[#A0AAA2] mb-1.5" />
                        <p className="text-xs font-bold text-[#2F3931]">Belum ada catatan diskusi</p>
                        <p className="text-[11px] text-[#738075]">
                            Kirim pesan pertama untuk berdiskusi mengenai rundown, tema, atau instruksi khusus.
                        </p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.user_id === user?.id;
                        const badge = getRoleBadge(msg.sender_role || msg.user?.role);

                        return (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[11px] font-extrabold text-[#2F3931]">
                                        {msg.user?.name || "Pengguna"}
                                    </span>
                                    <span
                                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${badge.className}`}
                                    >
                                        {badge.label}
                                    </span>
                                    <span className="text-[10px] text-[#A0AAA2] flex items-center gap-0.5">
                                        <Clock className="w-2.5 h-2.5" />
                                        {formatDateTime(msg.created_at)}
                                    </span>
                                </div>

                                <div
                                    className={`p-3 rounded-2xl max-w-md text-xs leading-relaxed shadow-2xs break-words ${
                                        isMe
                                            ? "bg-[#657166] text-white rounded-tr-xs"
                                            : "bg-white text-[#2F3931] border border-[#E8E2D7] rounded-tl-xs"
                                    }`}
                                >
                                    {msg.message}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Kirim Pesan */}
            <form onSubmit={handleSendMessage} className="mt-3 flex items-center gap-2">
                <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ketik catatan, instruksi rundown, atau pertanyaan..."
                    className="flex-1 px-4 py-2.5 bg-white border border-[#E8E2D7] focus:border-[#657166] rounded-xl text-xs text-[#2F3931] outline-hidden transition shadow-2xs"
                />
                <button
                    type="submit"
                    disabled={sending || !inputMessage.trim()}
                    className="px-4 py-2.5 bg-[#657166] hover:bg-[#4E594F] text-[#FAF6F0] rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                >
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{sending ? "..." : "Kirim"}</span>
                </button>
            </form>
        </div>
    );
}
