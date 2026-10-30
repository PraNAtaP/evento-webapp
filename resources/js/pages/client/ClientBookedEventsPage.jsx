import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../api/axios";
import ProgressTimeline from "../../components/client/ProgressTimeline";
import PaymentCard from "../../components/payment/PaymentCard";
import UploadProofForm from "../../components/payment/UploadProofForm";
import { CATEGORY_LABELS } from "../../data/kanbanData";
import { formatRupiah } from "../../utils/formatters";

export default function ClientBookedEventsPage() {
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [uploadingPayment, setUploadingPayment] = useState(null);
    const [page, setPage] = useState(1);

    // 1. Fetch seluruh acara yang sudah dibooking oleh klien
    const {
        data: eventsData,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["client-events-list"],
        queryFn: async () => {
            const res = await api.get("/client/events");
            return res.data.events || [];
        },
    });

    const events = eventsData || [];

    // Pagination lokal jika jumlah acara > 10
    const perPage = 10;
    const totalPages = Math.ceil(events.length / perPage);
    const displayedEvents = events.slice((page - 1) * perPage, page * perPage);

    // Acara yang sedang dipilih/diklik untuk melihat progress & pembayaran
    const activeEvent = events.find((evt) => evt.id === selectedEventId) || null;

    const handleUploadSuccess = () => {
        refetch();
    };

    const formatDateRange = (evt) => {
        if (!evt?.event_date) return "-";
        const start = new Date(evt.event_date).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
        if (evt.is_multi_day && evt.end_date) {
            const end = new Date(evt.end_date).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
            });
            return `${start} - ${end}`;
        }
        return start;
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "request":
                return {
                    label: "Menunggu Review EO",
                    className: "bg-[#99CDD8]/30 text-[#1D4A54] border-[#86BAC5]",
                };
            case "drafting_quotation":
                return {
                    label: "Penyusunan Penawaran",
                    className: "bg-[#DAEBE3] text-[#224436] border-[#BCD4C9]",
                };
            case "client_review":
                return {
                    label: "Review Penawaran Klien",
                    className: "bg-[#FDE8D3] text-[#5A3A1D] border-[#E8CEB2]",
                };
            case "awaiting_dp":
                return {
                    label: "Menunggu Pembayaran DP",
                    className: "bg-[#F3C3B2]/40 text-[#552316] border-[#E8CEB2]",
                };
            case "on_progress":
                return {
                    label: "Sedang Dikerjakan",
                    className: "bg-[#CFD8C4] text-[#2D3A28] border-[#B6C2AA]",
                };
            case "done":
                return {
                    label: "Selesai Diselenggarakan",
                    className: "bg-[#657166] text-white border-[#525C53]",
                };
            case "rejected":
                return {
                    label: "Ditolak EO",
                    className: "bg-rose-50 text-rose-700 border-rose-200",
                };
            default:
                return {
                    label: status || "Diproses",
                    className: "bg-[#FAF6F0] text-[#738075] border-[#E8E2D7]",
                };
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">
            {/* Header Halaman */}
            <div>
                <h1 className="text-xl font-extrabold text-[#2F3931]">
                    Acara yang Telah Dibooking
                </h1>
                <p className="text-xs text-[#738075] mt-0.5">
                    Pilih salah satu acara Anda untuk melihat progress pelaksanaan dan rincian pembayarannya secara spesifik.
                </p>
            </div>

            {/* Layout Dua Kolom: Daftar Acara (Kiri) dan Detail Progress & Pembayaran (Kanan) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Kolom Kiri: Daftar Kartu Acara */}
                <div className="lg:col-span-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between pb-1">
                        <span className="text-xs font-bold text-[#738075] uppercase tracking-wider">
                            Daftar Acara ({events.length})
                        </span>
                        {selectedEventId && (
                            <button
                                type="button"
                                onClick={() => setSelectedEventId(null)}
                                className="text-[11px] font-semibold text-[#657166] hover:underline cursor-pointer"
                            >
                                Tutup Pilihan
                            </button>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="bg-white rounded-2xl border border-[#E8E2D7] p-8 text-center">
                            <div className="w-7 h-7 border-3 border-[#657166] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-xs text-[#738075]">Memuat daftar acara...</p>
                        </div>
                    ) : isError ? (
                        <div className="bg-white rounded-2xl border border-rose-200 p-6 text-center text-xs text-rose-700">
                            Gagal memuat acara. Silakan refresh halaman.
                        </div>
                    ) : events.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-[#E8E2D7] p-8 text-center text-xs text-[#738075]">
                            <p className="font-bold text-[#2F3931] mb-1">Belum ada acara yang diajukan</p>
                            <p className="text-[11px]">Gunakan menu Kalender Booking untuk mengajukan acara baru.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {displayedEvents.map((evt) => {
                                const isSelected = evt.id === selectedEventId;
                                const statusBadge = getStatusBadge(evt.kanban_status);
                                const catLabel = CATEGORY_LABELS[evt.category] || evt.category || "Acara";

                                return (
                                    <div
                                        key={evt.id}
                                        onClick={() => setSelectedEventId(evt.id)}
                                        className={`rounded-2xl border p-4 shadow-xs transition-all cursor-pointer text-left relative ${
                                            isSelected
                                                ? "bg-white border-[#657166] ring-2 ring-[#657166]/20 shadow-md"
                                                : "bg-white border-[#E8E2D7] hover:border-[#CFD8C4] hover:bg-[#FAF6F0]/50"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <h3 className="text-sm font-extrabold text-[#2F3931] leading-tight">
                                                {evt.event_name}
                                            </h3>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${statusBadge.className}`}>
                                                {statusBadge.label}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-[#738075] mb-2">
                                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#CFD8C4]/40 text-[#2D3A28] border border-[#B6C2AA]">
                                                {catLabel}
                                            </span>
                                            <span>&bull;</span>
                                            <span>📅 {formatDateRange(evt)}</span>
                                        </div>

                                        {evt.venue && (
                                            <p className="text-[11px] text-[#738075] truncate mb-2.5">
                                                📍 {evt.venue}
                                            </p>
                                        )}

                                        <div className="pt-2.5 border-t border-[#E8E2D7]/70 flex items-center justify-between text-xs">
                                            <span className="text-[11px] text-[#738075]">Estimasi Biaya:</span>
                                            <span className="font-extrabold text-[#1D4A54]">
                                                {formatRupiah(evt.agreed_price || evt.estimated_budget || evt.budget)}
                                            </span>
                                        </div>

                                        <div className="mt-2.5 pt-2 border-t border-[#FAF6F0] flex items-center justify-end text-[11px] font-bold text-[#657166] gap-1">
                                            <span>{isSelected ? "Sedang Dilihat" : "Klik untuk Lihat Detail"}</span>
                                            <span>&rarr;</span>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Pagination jika > 10 acara */}
                            {totalPages > 1 && (
                                <div className="p-3 bg-white rounded-2xl border border-[#E8E2D7] flex items-center justify-between text-xs text-[#738075] mt-1">
                                    <span>Hal {page} dari {totalPages}</span>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            disabled={page <= 1}
                                            onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                            className="px-2.5 py-1 bg-[#FAF6F0] border border-[#E8E2D7] rounded-lg disabled:opacity-40 font-bold"
                                        >
                                            Prev
                                        </button>
                                        <button
                                            type="button"
                                            disabled={page >= totalPages}
                                            onClick={() => setPage((p) => p + 1)}
                                            className="px-2.5 py-1 bg-[#FAF6F0] border border-[#E8E2D7] rounded-lg disabled:opacity-40 font-bold"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Kolom Kanan: Rincian Progress & Pembayaran untuk Acara yang Dipilih */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                    {activeEvent ? (
                        <div className="flex flex-col gap-6 animate-fadeIn">
                            {/* Banner Acara Aktif */}
                            <div className="bg-[#DAEBE3]/50 rounded-2xl border border-[#CFD8C4] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#224436] bg-[#DAEBE3] px-2 py-0.5 rounded-full border border-[#BCD4C9]">
                                        Detail Acara Terpilih
                                    </span>
                                    <h2 className="text-lg font-black text-[#2F3931] mt-1">
                                        {activeEvent.event_name}
                                    </h2>
                                    <p className="text-xs text-[#556056] mt-0.5">
                                        Tanggal Pelaksanaan: {formatDateRange(activeEvent)}
                                    </p>
                                </div>

                                <div className="text-left sm:text-right">
                                    <span className="text-[11px] text-[#556056] block">Status Terkini:</span>
                                    <span className={`inline-block mt-0.5 text-xs font-bold px-3 py-1 rounded-full border ${getStatusBadge(activeEvent.kanban_status).className}`}>
                                        {getStatusBadge(activeEvent.kanban_status).label}
                                    </span>
                                </div>
                            </div>

                            {/* Section 1: Progress Acara */}
                            <div className="bg-white rounded-2xl border border-[#E8E2D7] p-5 shadow-xs">
                                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#E8E2D7]">
                                    <span className="w-7 h-7 rounded-lg bg-[#DAEBE3] text-[#224436] flex items-center justify-center font-bold text-xs">
                                        1
                                    </span>
                                    <div>
                                        <h3 className="text-sm font-extrabold text-[#2F3931]">
                                            Progress Tahapan Acara
                                        </h3>
                                        <p className="text-[11px] text-[#738075]">
                                            Pantau progres persiapan acara oleh tim Event Organizer
                                        </p>
                                    </div>
                                </div>

                                <ProgressTimeline event={activeEvent} />
                            </div>

                            {/* Section 2: Rincian Pembayaran Acara */}
                            <div className="bg-white rounded-2xl border border-[#E8E2D7] p-5 shadow-xs">
                                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#E8E2D7]">
                                    <span className="w-7 h-7 rounded-lg bg-[#FDE8D3] text-[#63482B] flex items-center justify-center font-bold text-xs">
                                        2
                                    </span>
                                    <div>
                                        <h3 className="text-sm font-extrabold text-[#2F3931]">
                                            Rincian Pembayaran Acara
                                        </h3>
                                        <p className="text-[11px] text-[#738075]">
                                            Tagihan DP dan pelunasan khusus untuk acara ini
                                        </p>
                                    </div>
                                </div>

                                {activeEvent.payments && activeEvent.payments.length > 0 ? (
                                    <div className="flex flex-col gap-3">
                                        {activeEvent.payments.map((payment) => (
                                            <PaymentCard
                                                key={payment.id}
                                                payment={{ ...payment, event: activeEvent }}
                                                role="client"
                                                onUpload={setUploadingPayment}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-xs text-[#738075] bg-[#FAF6F0]/40 rounded-xl border border-dashed border-[#E8E2D7]">
                                        <p className="font-bold text-[#2F3931]">Belum ada tagihan pembayaran diterbitkan</p>
                                        <p className="text-[11px] mt-1">
                                            {activeEvent.kanban_status === "request" || activeEvent.kanban_status === "drafting_quotation"
                                                ? "Tagihan DP 50% akan otomatis dibuat setelah Anda menyetujui penawaran vendor dari EO."
                                                : "Hubungi admin EO jika tagihan belum tersedia."}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Empty State Saat Belum Ada Acara yang Dipilih */
                        <div className="bg-white rounded-2xl border-2 border-dashed border-[#E8E2D7] p-12 text-center text-[#738075] shadow-xs">
                            <div className="w-14 h-14 rounded-2xl bg-[#FAF6F0] flex items-center justify-center mx-auto mb-3 border border-[#E8E2D7] text-2xl">
                                📋
                            </div>
                            <h3 className="text-sm font-extrabold text-[#2F3931] mb-1">
                                Belum Ada Acara yang Dipilih
                            </h3>
                            <p className="text-xs max-w-sm mx-auto leading-relaxed text-[#738075]">
                                Silakan klik salah satu acara pada daftar di sebelah kiri untuk menampilkan progress tahapan dan rincian pembayarannya.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Unggah Bukti Transfer */}
            {uploadingPayment && (
                <UploadProofForm
                    payment={uploadingPayment}
                    onClose={() => setUploadingPayment(null)}
                    onSuccess={handleUploadSuccess}
                />
            )}
        </div>
    );
}

