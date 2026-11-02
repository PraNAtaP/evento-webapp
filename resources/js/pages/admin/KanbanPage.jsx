import { useEffect, useState } from "react";
import api from "../../api/axios";
import KanbanBoard from "../../components/kanban/KanbanBoard";
import BoardInspector from "../../components/kanban/BoardInspector";
import {
    DUMMY_KANBAN_EVENTS,
    EVENT_CATEGORIES,
} from "../../data/kanbanData";

export default function KanbanPage() {
    const isExplicitDummy =
        import.meta.env.DEV && import.meta.env.VITE_USE_DUMMY_KANBAN === "true";

    const [events, setEvents] = useState(isExplicitDummy ? DUMMY_KANBAN_EVENTS : []);
    const [isLoading, setIsLoading] = useState(!isExplicitDummy);
    const [fetchError, setFetchError] = useState(null);
    const [actionError, setActionError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [dbCategories, setDbCategories] = useState([]);

    // Filter kategori mengikuti kategori acara yang dibuat EO (fallback ke daftar bawaan)
    useEffect(() => {
        let isMounted = true;
        api.get("/event-categories")
            .then((res) => {
                if (isMounted) setDbCategories(res.data?.data || []);
            })
            .catch(() => {});
        return () => {
            isMounted = false;
        };
    }, []);

    const categoryFilters =
        dbCategories.length > 0
            ? [{ value: "all", label: "Semua" }, ...dbCategories.map((c) => ({ value: c.slug, label: c.name }))]
            : EVENT_CATEGORIES;

    const fetchEvents = async () => {
        if (isExplicitDummy) return;

        setIsLoading(true);
        setFetchError(null);
        try {
            const response = await api.get("/admin/kanban");
            setEvents(response.data.events || []);
        } catch (err) {
            setFetchError(
                err.response?.data?.message || "Gagal memuat data papan Kanban dari server."
            );
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const [dpModalData, setDpModalData] = useState(null);

    // Eksekusi pemindahan status ke server
    const executeMove = async (cardId, newStatus, extraData = {}) => {
        setActionError(null);

        if (isExplicitDummy) {
            setEvents((prevEvents) =>
                prevEvents.map((evt) => {
                    const currentStatus = evt.kanban_status ?? evt.status;
                    return String(evt.id) === String(cardId) && currentStatus !== newStatus
                        ? { ...evt, kanban_status: newStatus, status: newStatus, ...extraData }
                        : evt;
                })
            );
            return;
        }

        try {
            const payload = {
                target_status: newStatus,
                ...extraData,
            };

            const response = await api.patch(`/admin/kanban/${cardId}/move`, payload);
            const updatedEvent = response.data.event;

            setEvents((prevEvents) =>
                prevEvents.map((evt) =>
                    String(evt.id) === String(cardId) ? updatedEvent : evt
                )
            );
        } catch (err) {
            const errorMsg =
                err.response?.data?.errors?.target_status?.[0] ||
                err.response?.data?.errors?.dp_percentage?.[0] ||
                err.response?.data?.message ||
                "Gagal memindahkan status acara.";
            setActionError(errorMsg);
        }
    };

    // Pindahkan kartu ke kolom lain melalui API backend
    const handleMoveCard = (cardId, newStatus) => {
        const targetEvent = events.find((evt) => String(evt.id) === String(cardId));

        // Jika EO memindahkan ke tahapan review klien, tampilkan dialog input persentase DP
        if (newStatus === "client_review") {
            const defaultPct = targetEvent?.dp_percentage
                ? Number(targetEvent.dp_percentage)
                : 30;
            setDpModalData({
                cardId,
                newStatus,
                event: targetEvent,
                dpPercentage: defaultPct,
            });
            return;
        }

        executeMove(cardId, newStatus);
    };

    const handleConfirmDpModal = () => {
        if (!dpModalData) return;
        const pct = Number(dpModalData.dpPercentage);
        if (isNaN(pct) || pct < 10 || pct > 100) {
            setActionError("Persentase DP harus berupa angka antara 10% dan 100%.");
            return;
        }

        executeMove(dpModalData.cardId, dpModalData.newStatus, {
            dp_percentage: pct,
        });
        setDpModalData(null);
    };

    // Filter kartu berdasarkan kata kunci dan kategori
    const filteredEvents = events.filter((evt) => {
        const categoryValue = evt.category || evt.kategori || "";
        const matchesCategory =
            selectedCategory === "all" ||
            categoryValue.toLowerCase() === selectedCategory.toLowerCase();

        const title = evt.event_name || evt.namaEvent || evt.title || "";
        const client = evt.client?.name || evt.namaKlien || evt.clientName || "";
        const location = evt.venue || evt.lokasi || evt.location || "";

        const query = searchQuery.toLowerCase();
        const matchesSearch =
            title.toLowerCase().includes(query) ||
            client.toLowerCase().includes(query) ||
            location.toLowerCase().includes(query);

        return matchesCategory && matchesSearch;
    });

    const handleEventUpdated = (updatedEvent) => {
        if (!updatedEvent) return;
        setEvents((prevEvents) =>
            prevEvents.map((evt) =>
                String(evt.id) === String(updatedEvent.id) ? updatedEvent : evt
            )
        );
    };

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
            {/* Header Title */}
            <div className="pb-2 border-b border-slate-200">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Papan Kanban Acara
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                    Pantau kemajuan seluruh proyek event organizer mulai dari permintaan masuk, penyusunan penawaran, review klien, pembayaran DP, persiapan teknis, hingga selesai.
                </p>
            </div>

            {/* Banner Error Aksi Perpindahan (HTTP 422) */}
            {actionError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start justify-between gap-3 text-rose-800 text-xs shadow-xs animate-shake">
                    <div className="flex items-center gap-2">
                        <svg
                            className="w-4 h-4 text-rose-600 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                        <span>
                            <strong>Perpindahan Ditolak:</strong> {actionError}
                        </span>
                    </div>
                    <button
                        onClick={() => setActionError(null)}
                        className="text-rose-500 hover:text-rose-700 font-bold"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                {/* Search Input */}
                <div className="relative flex-1 min-w-[240px]">
                    <svg
                        width="16"
                        height="16"
                        style={{ minWidth: 16, minHeight: 16 }}
                        className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari nama acara, nama klien, atau lokasi..."
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#657166]/20 focus:border-[#657166] transition-colors"
                    />
                </div>

                {/* Kategori Acara */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {categoryFilters.map((cat) => (
                        <button
                            key={cat.value}
                            onClick={() => setSelectedCategory(cat.value)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer border ${
                                selectedCategory === cat.value
                                    ? "bg-[#657166] border-[#525C53] text-white shadow-xs"
                                    : "bg-[#FAF6F0] border-[#E8E2D7] text-[#2F3931] hover:bg-[#E8E2D7]/60"
                            }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="py-20 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200">
                    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs text-slate-500 font-medium">Memuat data papan Kanban...</p>
                </div>
            )}

            {/* Fetch Error State dengan Tombol Coba Lagi */}
            {!isLoading && fetchError && (
                <div className="py-16 px-6 bg-white rounded-2xl border border-rose-200 text-center flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-1">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-base font-bold text-slate-800">Gagal Memuat Papan Kanban</h3>
                    <p className="text-xs text-slate-500 max-w-md">{fetchError}</p>
                    <button
                        onClick={fetchEvents}
                        className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
                    >
                        Coba Lagi
                    </button>
                </div>
            )}

            {/* Kanban Board Container */}
            {!isLoading && !fetchError && (
                <div className="flex-1">
                    <KanbanBoard
                        cards={filteredEvents}
                        onMoveCard={handleMoveCard}
                        onSelectCard={(card) => setSelectedEventId(card.id)}
                    />
                </div>
            )}

            {/* Board Inspector (read-only detail event) */}
            <BoardInspector
                eventId={selectedEventId}
                onClose={() => setSelectedEventId(null)}
                onQuotationSent={handleEventUpdated}
            />

            {/* Modal Input Persentase DP saat kirim penawaran ke klien */}
            {dpModalData && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Kirim Penawaran ke Klien
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {dpModalData.event?.event_name || "Acara"}
                                </p>
                            </div>
                            <button
                                onClick={() => setDpModalData(null)}
                                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4 text-xs">
                            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1">
                                <span className="text-slate-500 text-[11px] font-medium block">
                                    Total Nilai Penawaran Vendor:
                                </span>
                                <span className="text-base font-black text-slate-900">
                                    Rp{" "}
                                    {Number(
                                        dpModalData.event?.agreed_price ||
                                        dpModalData.event?.quotation_total ||
                                        dpModalData.event?.budget ||
                                        0
                                    ).toLocaleString("id-ID")}
                                </span>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Persentase Uang Muka (DP)
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="10"
                                        max="100"
                                        step="1"
                                        value={dpModalData.dpPercentage}
                                        onChange={(e) =>
                                            setDpModalData({
                                                ...dpModalData,
                                                dpPercentage: e.target.value,
                                            })
                                        }
                                        className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                    <span className="font-bold text-slate-600">%</span>
                                    <span className="text-[11px] text-slate-400">
                                        (Batas validasi: 10% - 100%)
                                    </span>
                                </div>
                            </div>

                            {/* Simulasi Nilai DP & Pelunasan */}
                            {(() => {
                                const total = Number(
                                    dpModalData.event?.agreed_price ||
                                    dpModalData.event?.quotation_total ||
                                    dpModalData.event?.budget ||
                                    0
                                );
                                const pct = Number(dpModalData.dpPercentage) || 0;
                                const dpAmount = Math.round(total * (pct / 100));
                                const pelunasan = total - dpAmount;

                                return (
                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                                        <div className="p-2.5 bg-slate-50 rounded-xl">
                                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                                                Nominal DP
                                            </span>
                                            <span className="text-xs font-bold text-blue-600">
                                                Rp {dpAmount.toLocaleString("id-ID")}
                                            </span>
                                        </div>
                                        <div className="p-2.5 bg-slate-50 rounded-xl">
                                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                                                Sisa Pelunasan
                                            </span>
                                            <span className="text-xs font-bold text-slate-700">
                                                Rp {pelunasan.toLocaleString("id-ID")}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setDpModalData(null)}
                                className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDpModal}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                            >
                                Kirim Penawaran
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
