import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import { formatEventDate, formatRupiah } from "../../data/kanbanData";

export default function ClientQuotationsSection() {
    const queryClient = useQueryClient();
    const [selectedEventForRevision, setSelectedEventForRevision] = useState(null);
    const [revisionNote, setRevisionNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionMessage, setActionMessage] = useState(null);

    const { data: events = [], isLoading } = useQuery({
        queryKey: ["client-events"],
        queryFn: async () => {
            const response = await api.get("/client/events");
            return response.data.events || [];
        },
    });

    const handleApprove = async (eventId) => {
        setIsSubmitting(true);
        setActionMessage(null);
        try {
            const response = await api.post(`/client/events/${eventId}/approve-quotation`);
            setActionMessage({
                type: "success",
                text: response.data.message || "Penawaran berhasil disetujui! Tagihan DP telah dibuat.",
            });
            queryClient.invalidateQueries({ queryKey: ["client-events"] });
        } catch (err) {
            setActionMessage({
                type: "error",
                text: err.response?.data?.message || "Gagal menyetujui penawaran.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRequestRevision = async (e) => {
        e.preventDefault();
        if (!selectedEventForRevision) return;

        setIsSubmitting(true);
        setActionMessage(null);
        try {
            const response = await api.post(
                `/client/events/${selectedEventForRevision.id}/request-revision`,
                { note: revisionNote }
            );
            setActionMessage({
                type: "success",
                text: response.data.message || "Permintaan revisi berhasil dikirim ke EO.",
            });
            setSelectedEventForRevision(null);
            setRevisionNote("");
            queryClient.invalidateQueries({ queryKey: ["client-events"] });
        } catch (err) {
            setActionMessage({
                type: "error",
                text: err.response?.data?.message || "Gagal mengirim permintaan revisi.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter event yang sedang dalam tahap review klien
    const reviewEvents = events.filter((e) => e.kanban_status === "client_review");

    if (isLoading || reviewEvents.length === 0) {
        return null;
    }

    return (
        <section className="bg-white rounded-2xl border border-[#E8E2D7] p-6 shadow-xs flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8E2D7]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF6F0] text-[#657166] border border-[#E8E2D7] flex items-center justify-center font-bold text-base shrink-0">
                        📋
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-[#2F3931]">
                            Penawaran EO Menunggu Persetujuan Anda
                        </h2>
                        <p className="text-xs text-[#738075] mt-0.5">
                            Tinjau rincian penawaran paket layanan yang telah dikurasi oleh tim Event Organizer.
                        </p>
                    </div>
                </div>

                <span className="self-start sm:self-auto px-3 py-1 text-xs font-bold text-[#5A3A1D] bg-[#FDE8D3] rounded-full border border-[#E8CEB2]">
                    {reviewEvents.length} Penawaran Masuk
                </span>
            </div>

            {/* Alert Notifikasi Aksi */}
            {actionMessage && (
                <div
                    className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between ${
                        actionMessage.type === "success"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-rose-50 text-rose-800 border border-rose-200"
                    }`}
                >
                    <span>{actionMessage.text}</span>
                    <button
                        onClick={() => setActionMessage(null)}
                        className="text-slate-400 hover:text-slate-600 font-bold ml-2 cursor-pointer"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Daftar Kartu Penawaran */}
            <div className="flex flex-col gap-4">
                {reviewEvents.map((evt) => {
                    const totalPenawaran = Number(evt.quotation_total) || 0;

                    return (
                        <div
                            key={evt.id}
                            className="bg-[#FAF6F0] rounded-xl p-5 border border-[#E8E2D7] flex flex-col gap-4"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <h3 className="text-base font-bold text-[#2F3931]">
                                        {evt.event_name}
                                    </h3>
                                    <p className="text-xs text-[#738075] mt-0.5">
                                        Pelaksanaan: {formatEventDate(evt.event_date)} &bull; Lokasi: {evt.venue || "Lokasi menyusul"}
                                    </p>
                                </div>

                                <div className="text-left sm:text-right">
                                    <span className="text-[10px] text-[#738075] block font-medium">Total Nilai Penawaran:</span>
                                    <span className="text-base sm:text-lg font-black text-[#2F3931]">
                                        {formatRupiah(totalPenawaran)}
                                    </span>
                                </div>
                            </div>

                            {/* Tombol Navigasi ke Halaman Detail */}
                            <div className="flex items-center justify-end pt-2 border-t border-[#E8E2D7]/60">
                                <Link
                                    to="/client/offers"
                                    className="px-4 py-2.5 text-xs font-bold text-white bg-[#657166] hover:bg-[#556056] rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 border border-[#525C53]"
                                >
                                    <span>Lihat Rincian & Review Penawaran</span>
                                    <span>&rarr;</span>
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal Input Catatan Revisi */}
            {selectedEventForRevision && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E8E2D7] flex flex-col gap-4">
                        <div>
                            <h3 className="text-base font-bold text-[#2F3931]">
                                Minta Revisi Penawaran
                            </h3>
                            <p className="text-xs text-[#738075] mt-1">
                                Berikan catatan kepada tim EO terkait perubahan atau penyesuaian yang Anda inginkan pada acara <strong>{selectedEventForRevision.event_name}</strong>.
                            </p>
                        </div>

                        <form onSubmit={handleRequestRevision} className="flex flex-col gap-4">
                            <textarea
                                value={revisionNote}
                                onChange={(e) => setRevisionNote(e.target.value)}
                                placeholder="Contoh: Mohon kurangi jumlah katering atau ganti konsep dekorasi..."
                                rows="4"
                                className="w-full text-xs p-3 bg-[#FAF6F0] border border-[#E8E2D7] text-[#2F3931] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#657166]/20 focus:border-[#657166]"
                            />

                            <div className="flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedEventForRevision(null);
                                        setRevisionNote("");
                                    }}
                                    className="px-4 py-2 text-xs font-semibold text-[#738075] hover:bg-[#FAF6F0] rounded-xl transition-colors cursor-pointer border border-[#E8E2D7]"
                                >
                                    Batal
                                </button>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-xs font-bold text-white bg-[#657166] hover:bg-[#556056] rounded-xl transition-colors cursor-pointer shadow-xs border border-[#525C53]"
                                >
                                    Kirim Permintaan Revisi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
}
