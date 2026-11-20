import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Bell,
    CheckCheck,
    Trash2,
    Calendar,
    CreditCard,
    Store,
    AlertOctagon,
    Info,
    ExternalLink,
    Volume2,
} from "lucide-react";
import api from "../../api/axios";

export default function NotificationBell() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [filter, setFilter] = useState("all"); // 'all' | 'unread'
    const [notifications, setNotifications] = useState([]);
    const [summary, setSummary] = useState({ unread_count: 0, total_count: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [webPermission, setWebPermission] = useState(
        typeof window !== "undefined" && "Notification" in window
            ? Notification.permission
            : "unsupported"
    );

    const dropdownRef = useRef(null);
    const previousUnreadCountRef = useRef(0);
    const hasInitialLoadedRef = useRef(false);

    // Ambil data notifikasi dari API
    const fetchNotifications = useCallback(async (isSilent = false) => {
        if (!isSilent) setIsLoading(true);
        try {
            const res = await api.get("/admin/notifications?limit=25");
            const data = res.data?.data || [];
            const sum = res.data?.summary || { unread_count: 0, total_count: 0 };

            // Cek apakah ada notifikasi baru untuk Web Notification browser
            if (
                hasInitialLoadedRef.current &&
                sum.unread_count > previousUnreadCountRef.current &&
                typeof window !== "undefined" &&
                "Notification" in window &&
                Notification.permission === "granted"
            ) {
                const newest = data[0];
                if (newest && !newest.is_read) {
                    try {
                        const browserNotif = new Notification(newest.title, {
                            body: newest.message,
                            icon: "/logo.png",
                        });
                        browserNotif.onclick = () => {
                            window.focus();
                            if (newest.action_url) {
                                navigate(newest.action_url);
                            }
                        };
                    } catch {
                        // Ignore notification errors in restrictive environments
                    }
                }
            }

            previousUnreadCountRef.current = sum.unread_count;
            hasInitialLoadedRef.current = true;
            setNotifications(data);
            setSummary(sum);
        } catch {
            // Abaikan kesalahan koneksi polling
        } finally {
            if (!isSilent) setIsLoading(false);
        }
    }, [navigate]);

    // Polling berkala setiap 20 detik & saat window focus
    useEffect(() => {
        fetchNotifications();

        const intervalId = setInterval(() => {
            fetchNotifications(true);
        }, 20000);

        const handleFocus = () => {
            fetchNotifications(true);
        };
        window.addEventListener("focus", handleFocus);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener("focus", handleFocus);
        };
    }, [fetchNotifications]);

    // Tutup popup saat klik di luar
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Meminta izin Web Notification browser
    const requestWebNotificationPermission = async () => {
        if (typeof window === "undefined" || !("Notification" in window)) {
            alert("Peramban Anda belum mendukung fitur Web Notification.");
            return;
        }

        try {
            const perm = await Notification.requestPermission();
            setWebPermission(perm);
            if (perm === "granted") {
                new Notification("EVENTO Web Notification Aktif", {
                    body: "Anda akan menerima pemberitahuan instan saat ada pesanan, pembayaran, atau aktivitas mitra baru.",
                    icon: "/logo.png",
                });
            }
        } catch {
            // Ignore error
        }
    };

    // Tandai 1 notifikasi telah dibaca
    const handleMarkAsRead = async (id, actionUrl) => {
        try {
            await api.patch(`/admin/notifications/${id}/read`);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
            setSummary((prev) => ({
                ...prev,
                unread_count: Math.max(0, prev.unread_count - 1),
            }));

            if (actionUrl) {
                setIsOpen(false);
                navigate(actionUrl);
            }
        } catch {
            // Handle error
        }
    };

    // Tandai semua notifikasi telah dibaca
    const handleMarkAllRead = async () => {
        try {
            await api.post("/admin/notifications/mark-all-read");
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setSummary((prev) => ({ ...prev, unread_count: 0 }));
        } catch {
            // Handle error
        }
    };

    // Hapus notifikasi
    const handleDelete = async (e, id) => {
        e.stopPropagation();
        try {
            await api.delete(`/admin/notifications/${id}`);
            const deleted = notifications.find((n) => n.id === id);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
            setSummary((prev) => ({
                total_count: Math.max(0, prev.total_count - 1),
                unread_count: deleted && !deleted.is_read ? Math.max(0, prev.unread_count - 1) : prev.unread_count,
            }));
        } catch {
            // Handle error
        }
    };

    // Filter daftar notifikasi
    const filteredNotifications = notifications.filter((n) => {
        if (filter === "unread") return !n.is_read;
        return true;
    });

    // Ikon berdasarkan kategori notifikasi
    const getCategoryIcon = (category) => {
        switch (category) {
            case "order":
            case "event":
                return <Calendar className="w-4 h-4 text-emerald-700" />;
            case "payment":
                return <CreditCard className="w-4 h-4 text-amber-700" />;
            case "vendor":
                return <Store className="w-4 h-4 text-sky-700" />;
            case "cancellation":
            case "cancel":
                return <AlertOctagon className="w-4 h-4 text-rose-700" />;
            default:
                return <Info className="w-4 h-4 text-[#657166]" />;
        }
    };

    // Background badge icon
    const getCategoryBg = (category) => {
        switch (category) {
            case "order":
            case "event":
                return "bg-emerald-100 border-emerald-300";
            case "payment":
                return "bg-amber-100 border-amber-300";
            case "vendor":
                return "bg-sky-100 border-sky-300";
            case "cancellation":
            case "cancel":
                return "bg-rose-100 border-rose-300";
            default:
                return "bg-[#FAF6F0] border-[#E8E2D7]";
        }
    };

    // Format waktu ramah pengguna
    const formatTimeAgo = (dateStr) => {
        if (!dateStr) return "";
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const diffInSec = Math.floor((now - date) / 1000);

            if (diffInSec < 60) return "Baru saja";
            if (diffInSec < 3600) return `${Math.floor(diffInSec / 60)} mnt lalu`;
            if (diffInSec < 86400) return `${Math.floor(diffInSec / 3600)} jam lalu`;
            return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
        } catch {
            return "";
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Tombol Lonceng Notifikasi */}
            <button
                type="button"
                onClick={() => {
                    setIsOpen((prev) => !prev);
                    if (!isOpen) fetchNotifications(true);
                }}
                className={`relative p-2 rounded-xl transition-all cursor-pointer border ${
                    isOpen
                        ? "bg-white text-[#2F3931] border-[#B6C2AA] shadow-xs"
                        : "text-[#657166] hover:text-[#2F3931] hover:bg-white border-transparent hover:border-[#E8E2D7]"
                }`}
                aria-label="Kotak Masuk Notifikasi"
                title="Kotak Masuk Notifikasi Admin"
            >
                <Bell className="w-5 h-5" />

                {/* Badge Unread Count */}
                {summary.unread_count > 0 && (
                    <>
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white shadow-2xs">
                            {summary.unread_count > 99 ? "99+" : summary.unread_count}
                        </span>
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-400 opacity-75 animate-ping" />
                    </>
                )}
            </button>

            {/* Dropdown Kotak Masuk Notifikasi */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-[#E8E2D7] overflow-hidden z-50 animate-fadeIn text-xs">
                    
                    {/* Header Kotak Masuk */}
                    <div className="p-4 bg-[#FAF6F0] border-b border-[#E8E2D7] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-[#657166] text-white flex items-center justify-center font-bold">
                                <Bell className="w-3.5 h-3.5" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-[#2F3931] text-xs">
                                    Kotak Masuk Notifikasi
                                </h3>
                                <p className="text-[10px] text-[#738075]">
                                    {summary.unread_count} belum dibaca dari {summary.total_count} total
                                </p>
                            </div>
                        </div>

                        {summary.unread_count > 0 && (
                            <button
                                type="button"
                                onClick={handleMarkAllRead}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#657166] hover:text-[#2F3931] hover:underline cursor-pointer"
                                title="Tandai semua pesan telah dibaca"
                            >
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Tandai Semua</span>
                            </button>
                        )}
                    </div>

                    {/* Banner Aktivasi Web Notification Browser */}
                    {webPermission !== "granted" && (
                        <div className="px-3.5 py-2.5 bg-sky-50 border-b border-sky-100 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-[11px] text-sky-900 font-medium">
                                <Volume2 className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                                <span>Aktifkan notifikasi pop-up desktop?</span>
                            </div>
                            <button
                                type="button"
                                onClick={requestWebNotificationPermission}
                                className="px-2 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[10px] font-bold shadow-2xs transition cursor-pointer"
                            >
                                Izinkan
                            </button>
                        </div>
                    )}

                    {/* Tab Filter: Semua vs Belum Dibaca */}
                    <div className="flex items-center border-b border-[#E8E2D7] px-4 pt-2 bg-white gap-2">
                        <button
                            type="button"
                            onClick={() => setFilter("all")}
                            className={`pb-2 px-2 text-xs font-bold transition-colors cursor-pointer border-b-2 ${
                                filter === "all"
                                    ? "border-[#657166] text-[#2F3931]"
                                    : "border-transparent text-[#738075] hover:text-[#2F3931]"
                            }`}
                        >
                            Semua ({summary.total_count})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilter("unread")}
                            className={`pb-2 px-2 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1 ${
                                filter === "unread"
                                    ? "border-[#657166] text-[#2F3931]"
                                    : "border-transparent text-[#738075] hover:text-[#2F3931]"
                            }`}
                        >
                            <span>Belum Dibaca</span>
                            {summary.unread_count > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 text-[9px]">
                                    {summary.unread_count}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Daftar Notifikasi */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-[#E8E2D7]/50">
                        {isLoading ? (
                            <div className="py-8 text-center text-[#738075]">
                                <p className="text-xs">Memuat notifikasi...</p>
                            </div>
                        ) : filteredNotifications.length === 0 ? (
                            <div className="py-10 px-4 text-center">
                                <div className="w-12 h-12 rounded-2xl bg-[#FAF6F0] border border-[#E8E2D7] flex items-center justify-center mx-auto text-[#738075] mb-2">
                                    <Bell className="w-5 h-5 text-[#A2ADA4]" />
                                </div>
                                <p className="font-bold text-[#2F3931] text-xs">
                                    {filter === "unread" ? "Tidak ada notifikasi baru" : "Kotak masuk kosong"}
                                </p>
                                <p className="text-[11px] text-[#738075] mt-0.5">
                                    Aktivitas pesanan, pembayaran, dan vendor akan muncul di sini.
                                </p>
                            </div>
                        ) : (
                            filteredNotifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => handleMarkAsRead(n.id, n.action_url)}
                                    className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 relative group ${
                                        !n.is_read ? "bg-amber-50/50 hover:bg-amber-50" : "bg-white hover:bg-[#FAF6F0]/60"
                                    }`}
                                >
                                    {/* Unread indicator dot */}
                                    {!n.is_read && (
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-4 left-1.5" />
                                    )}

                                    {/* Icon Box */}
                                    <div
                                        className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${getCategoryBg(
                                            n.category
                                        )}`}
                                    >
                                        {getCategoryIcon(n.category)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 pr-6">
                                        <div className="flex items-center justify-between gap-1">
                                            <h4
                                                className={`text-xs truncate ${
                                                    !n.is_read ? "font-extrabold text-[#2F3931]" : "font-semibold text-[#556056]"
                                                }`}
                                            >
                                                {n.title}
                                            </h4>
                                            <span className="text-[10px] text-[#738075] shrink-0 font-medium">
                                                {formatTimeAgo(n.created_at)}
                                            </span>
                                        </div>

                                        <p className="text-[11px] text-[#556056] mt-0.5 line-clamp-2 leading-relaxed">
                                            {n.message}
                                        </p>

                                        {n.action_url && (
                                            <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-[#657166] hover:text-[#2F3931]">
                                                <span>Buka rincian</span>
                                                <ExternalLink className="w-2.5 h-2.5" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Delete Button */}
                                    <button
                                        type="button"
                                        onClick={(e) => handleDelete(e, n.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-[#A2ADA4] hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-opacity absolute right-2.5 top-3.5 cursor-pointer"
                                        title="Hapus notifikasi"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer Info */}
                    <div className="p-2.5 bg-[#FAF6F0] border-t border-[#E8E2D7] text-center text-[10px] text-[#738075]">
                        <span>Notifikasi Web Real-time terhubung dengan server EVENTO</span>
                    </div>

                </div>
            )}
        </div>
    );
}
