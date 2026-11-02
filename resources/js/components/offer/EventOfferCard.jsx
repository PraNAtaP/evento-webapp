import { useState } from "react";
import api from "../../api/axios";

export default function EventOfferCard({ event, onRevision, onSuccess }) {
    const [isApproving, setIsApproving] = useState(false);

    const rupiah = (n) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(n);

    const formatTanggal = (isoDate) => {
        if (!isoDate) return "-";
        return new Date(isoDate).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const totalHarga = event.vendor_assignments?.reduce(
        (sum, a) => sum + parseFloat(a.locked_price || 0),
        0
    );

    const dpPercent = Number(event.dp_percentage) || 30;

    const handleApprove = async () => {
        const yakin = confirm(
            `Setujui semua penawaran untuk acara "${event.event_name}"?\n\nTotal: ${rupiah(totalHarga)}\n\nTagihan DP akan otomatis dibuat.`
        );
        if (!yakin) return;

        setIsApproving(true);
        try {
            const res = await api.post(`/client/events/${event.id}/approve-quotation`);
            alert(res.data.message);
            onSuccess();
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                err.response?.data?.errors?.event?.[0] ||
                "Gagal menyetujui penawaran.";
            alert("Gagal: " + msg);
        } finally {
            setIsApproving(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-[#E8E2D7] p-6 mb-5 shadow-xs flex flex-col gap-4">
            {/* Header Event */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E8E2D7]">
                <div>
                    <h2 className="text-base font-bold text-[#2F3931]">
                        {event.event_name}
                    </h2>
                    <p className="text-xs text-[#738075] mt-0.5">
                        Tanggal Pelaksanaan: {formatTanggal(event.event_date)} &bull; Lokasi: {event.venue || "Lokasi menyusul"}
                    </p>
                </div>
                <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold bg-[#FDE8D3] text-[#5A3A1D] border border-[#E8CEB2]">
                    Menunggu Persetujuan Anda
                </span>
            </div>

            {/* Daftar Paket Layanan (Vendor Masked) */}
            <div className="flex flex-col gap-3">
                <p className="text-[11px] uppercase font-bold tracking-wider text-[#738075]">
                    Rincian Layanan & Fasilitas yang Disusun EO
                </p>

                {event.vendor_assignments?.length === 0 ? (
                    <p className="text-xs text-[#738075] italic p-4 bg-[#FAF6F0] rounded-xl border border-[#E8E2D7]">
                        Belum ada item layanan yang ditawarkan.
                    </p>
                ) : (
                    event.vendor_assignments?.map((assignment) => {
                        const rawCategory = assignment.vendor?.category || "Layanan";
                        const categoryLabel = rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1);

                        return (
                            <div
                                key={assignment.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#FAF6F0] rounded-xl border border-[#E8E2D7]"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#CFD8C4]/60 text-[#2D3A28] border border-[#B6C2AA]">
                                            {categoryLabel}
                                        </span>
                                        <span className="text-xs font-semibold text-[#657166]">
                                            Mitra Terkurasi Evento
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-[#2F3931] mt-1.5">
                                        {assignment.package?.package_name || `Paket ${categoryLabel}`}
                                    </p>
                                    {assignment.package?.description && (
                                        <p className="text-xs text-[#738075] mt-0.5 leading-relaxed">
                                            {assignment.package.description}
                                        </p>
                                    )}
                                </div>
                                <div className="text-left sm:text-right shrink-0">
                                    <span className="text-[10px] text-[#738075] block font-medium">Biaya Paket:</span>
                                    <span className="text-sm font-extrabold text-[#2F3931]">
                                        {rupiah(assignment.locked_price)}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Total Penawaran */}
            {event.vendor_assignments?.length > 0 && (
                <div className="bg-[#FAF6F0] border border-[#E8E2D7] rounded-xl p-4 flex justify-between items-center">
                    <span className="text-xs font-bold text-[#738075]">
                        Total Nilai Penawaran
                    </span>
                    <span className="text-base font-black text-[#2F3931]">
                        {rupiah(totalHarga)}
                    </span>
                </div>
            )}

            {/* Estimasi DP */}
            {event.vendor_assignments?.length > 0 && (
                <div className="bg-[#FDE8D3]/40 border border-[#E8CEB2] rounded-xl p-3 text-xs text-[#5A3A1D] flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span>
                        <strong>Estimasi DP:</strong> {dpPercent}% — dibayarkan setelah persetujuan penawaran.
                    </span>
                    <span className="font-extrabold">
                        {rupiah(totalHarga * (dpPercent / 100))}
                    </span>
                </div>
            )}

            {/* Tombol Aksi */}
            <div className="flex items-center gap-2.5 pt-2">
                <button
                    onClick={handleApprove}
                    disabled={isApproving || event.vendor_assignments?.length === 0}
                    className="flex-1 bg-[#657166] hover:bg-[#556056] text-white font-bold text-xs rounded-xl shadow-xs transition-colors px-4 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border border-[#525C53]"
                >
                    {isApproving ? "Memproses..." : "Setujui Penawaran"}
                </button>
                <button
                    onClick={() => onRevision(event)}
                    disabled={isApproving}
                    className="flex-1 bg-white border border-[#E8E2D7] text-[#738075] hover:bg-[#FAF6F0] hover:text-[#2F3931] font-bold text-xs rounded-xl shadow-xs transition-colors px-4 py-2.5 disabled:opacity-50 cursor-pointer"
                >
                    Minta Penyesuaian / Revisi
                </button>
            </div>
        </div>
    );
}