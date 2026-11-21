import { useState } from "react";
import { Star, Eye, X, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import api from "../../api/axios";
import { useDialog } from "../../context/DialogContext";

export default function EventOfferCard({ event, onRevision, onSuccess }) {
    const { confirm: showConfirm, alert: showAlert } = useDialog();
    const [isApproving, setIsApproving] = useState(false);
    const [isTermsOpen, setIsTermsOpen] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [previewPhoto, setPreviewPhoto] = useState(null);
    const [selectedVendorReviews, setSelectedVendorReviews] = useState(null);

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

    const assignments = event.vendor_assignments || event.vendorAssignments || [];

    const totalHarga = assignments.reduce(
        (sum, a) => sum + parseFloat(a.locked_price || 0),
        0
    );

    const dpPercent = Number(event.dp_percentage) || 30;

    const handleApprove = async () => {
        if (!termsAccepted) {
            await showAlert({
                title: "Persetujuan S&K Diperlukan",
                message: "Silakan baca dan centang persetujuan Syarat dan Ketentuan terlebih dahulu.",
                type: "warning",
            });
            return;
        }

        const yakin = await showConfirm({
            title: "Setujui Penawaran Acara?",
            message: `Setujui semua penawaran untuk acara "${event.event_name}"?\n\nTotal Biaya: ${rupiah(totalHarga)}\n\nSetelah disetujui, tagihan Down Payment (DP) akan otomatis diterbitkan.`,
            confirmText: "Ya, Setujui Penawaran",
            type: "info",
        });
        if (!yakin) return;

        setIsApproving(true);
        try {
            const res = await api.post(
                `/client/events/${event.id}/approve-quotation`,
                {
                    terms_accepted: true,
                }
            );

            await showAlert({
                title: "Penawaran Disetujui",
                message: res.data.message || "Penawaran berhasil disetujui. Tagihan DP telah diterbitkan.",
                type: "success",
            });
            onSuccess();
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                err.response?.data?.errors?.event?.[0] ||
                err.response?.data?.errors?.terms_accepted?.[0] ||
                "Gagal menyetujui penawaran.";

            await showAlert({
                title: "Gagal Menyetujui",
                message: msg,
                type: "danger",
            });
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
                <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-950 border border-amber-300">
                    Menunggu Persetujuan Anda
                </span>
            </div>

            {/* Daftar Paket Layanan (Foto & Rating Terbuka, Kontak Masked) */}
            <div className="flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                    <p className="text-[11px] uppercase font-bold tracking-wider text-[#738075]">
                        Rincian Mitra Vendor & Portofolio yang Disusun EO
                    </p>
                    <span className="text-[10px] text-[#738075] bg-[#FAF6F0] px-2 py-0.5 rounded border border-[#E8E2D7]">
                        Klik foto untuk memperbesar
                    </span>
                </div>

                {assignments.length === 0 ? (
                    <p className="text-xs text-[#738075] italic p-4 bg-[#FAF6F0] rounded-xl border border-[#E8E2D7]">
                        Belum ada item layanan yang ditawarkan.
                    </p>
                ) : (
                    assignments.map((assignment) => {
                        const vendor = assignment.vendor || {};
                        const pkg = assignment.package || {};
                        const rawCategory = vendor.category || "Layanan";
                        const categoryLabel = rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1);

                        // Kumpulkan seluruh foto paket dan portofolio
                        const photos = [
                            pkg.image_url,
                            ...(pkg.images?.map((img) => img.image_url) || []),
                            vendor.image_url,
                        ].filter(Boolean);

                        const avgRating = vendor.average_rating || 5.0;
                        const reviewCount = vendor.review_count || vendor.reviews?.length || 0;
                        const firstReview = vendor.reviews?.[0] || null;

                        return (
                            <div
                                key={assignment.id}
                                className="flex flex-col gap-3 p-4 bg-[#FAF6F0]/60 rounded-2xl border border-[#E8E2D7] hover:border-[#CFD8C4] transition shadow-2xs"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#CFD8C4]/60 text-[#2D3A28] border border-[#B6C2AA]">
                                                {categoryLabel}
                                            </span>

                                            {/* Rating Bintang Vendor Terkurasi */}
                                            {avgRating > 0 && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-300">
                                                    <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                                                    <span>{avgRating} ({reviewCount} Ulasan)</span>
                                                </span>
                                            )}

                                            <span className="text-[10px] font-semibold text-[#657166]">
                                                Mitra Terkurasi Evento
                                            </span>
                                        </div>

                                        <p className="text-sm font-bold text-[#2F3931] mt-1.5">
                                            {assignment.package_name || pkg.package_name || `Paket ${categoryLabel}`}
                                        </p>

                                        {pkg.description && (
                                            <p className="text-xs text-[#738075] mt-0.5 leading-relaxed">
                                                {pkg.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="text-left sm:text-right shrink-0">
                                        <span className="text-[10px] text-[#738075] block font-medium">Biaya Paket:</span>
                                        <span className="text-sm font-black text-[#1D4A54]">
                                            {rupiah(assignment.locked_price || pkg.price)}
                                        </span>
                                    </div>
                                </div>

                                {/* Strip Galeri Foto Portofolio Vendor */}
                                {photos.length > 0 && (
                                    <div className="pt-2 border-t border-[#E8E2D7]/70">
                                        <span className="text-[10px] font-bold text-[#738075] block mb-1.5 flex items-center gap-1">
                                            <ImageIcon className="w-3 h-3 text-[#657166]" />
                                            <span>Foto Portofolio Layanan:</span>
                                        </span>
                                        <div className="flex items-center gap-2 overflow-x-auto py-1">
                                            {photos.slice(0, 4).map((src, pIdx) => (
                                                <div
                                                    key={pIdx}
                                                    onClick={() => setPreviewPhoto(src)}
                                                    className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-[#E8E2D7] bg-white shrink-0 cursor-pointer group hover:border-[#657166] transition shadow-2xs"
                                                    title="Klik untuk memperbesar foto"
                                                >
                                                    <img
                                                        src={src}
                                                        alt="Foto Portofolio"
                                                        className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                                                    />
                                                    <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                        <Eye className="w-4 h-4 text-white" />
                                                    </div>
                                                    {pIdx === 3 && photos.length > 4 && (
                                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-black text-[10px]">
                                                            +{photos.length - 4} Foto
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Ulasan & Testimoni Klien Terdahulu */}
                                {firstReview && (
                                    <div className="p-3 bg-white rounded-xl border border-[#E8E2D7] text-xs">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <div className="flex items-center gap-1 text-amber-500">
                                                {[...Array(firstReview.rating || 5)].map((_, i) => (
                                                    <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-500" />
                                                ))}
                                                <span className="text-[10px] font-bold text-[#738075] ml-1">
                                                    &bull; {firstReview.client?.name || "Klien Terverifikasi"}
                                                </span>
                                            </div>

                                            {reviewCount > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedVendorReviews(vendor)}
                                                    className="text-[10px] font-bold text-[#657166] hover:underline cursor-pointer"
                                                >
                                                    Lihat Semua Ulasan ({reviewCount}) &rarr;
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-[#2F3931] italic leading-snug">
                                            &ldquo;{firstReview.comment}&rdquo;
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Total Penawaran */}
            {assignments.length > 0 && (
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
            {assignments.length > 0 && (
                <div className="bg-[#FDE8D3]/40 border border-[#E8CEB2] rounded-xl p-3 text-xs text-[#5A3A1D] flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span>
                        <strong>Estimasi DP:</strong> {dpPercent}% — dibayarkan setelah persetujuan penawaran.
                    </span>
                    <span className="font-extrabold">
                        {rupiah(totalHarga * (dpPercent / 100))}
                    </span>
                </div>
            )}

            {/* Syarat dan Ketentuan */}
            <div className="border border-[#E8E2D7] rounded-xl overflow-hidden">
                <button
                    type="button"
                    onClick={() => setIsTermsOpen(!isTermsOpen)}
                    className="w-full flex items-center justify-between gap-3 p-4 bg-[#FAF6F0] text-left hover:bg-[#F3EEE6] transition-colors cursor-pointer"
                >
                    <div>
                        <p className="text-sm font-bold text-[#2F3931]">
                            Syarat dan Ketentuan EVENTO
                        </p>
                        <p className="text-[11px] text-[#738075] mt-1">
                            Versi 1.0 — Harap baca sebelum menyetujui penawaran.
                        </p>
                    </div>
                    <span className="text-sm font-bold text-[#657166]">
                        {isTermsOpen ? "Tutup ▲" : "Baca S&K ▼"}
                    </span>
                </button>

                {isTermsOpen && (
                    <div className="p-4 flex flex-col gap-3 text-xs text-[#59645A] leading-relaxed">
                        <div>
                            <p className="font-bold text-[#2F3931] mb-1">
                                1. Ketentuan Umum
                            </p>
                            <p>
                                Penawaran ini disusun berdasarkan ketersediaan mitra vendor yang telah dikurasi oleh tim Event Organizer EVENTO. Harga paket yang tertera mengikat setelah disetujui.
                            </p>
                        </div>
                        <div>
                            <p className="font-bold text-[#2F3931] mb-1">
                                2. Pembayaran dan Down Payment (DP)
                            </p>
                            <p>
                                Klien wajib melakukan pembayaran Down Payment (DP) sebesar {dpPercent}% dalam waktu maksimal 3x24 jam setelah penawaran disetujui. Pembayaran pelunasan wajib diselesaikan sesuai termin yang disepakati sebelum hari pelaksanaan acara.
                            </p>
                        </div>
                        <div>
                            <p className="font-bold text-[#2F3931] mb-1">
                                3. Pembatalan dan Pengembalian Dana
                            </p>
                            <p>
                                Pembatalan sepihak oleh klien dapat mengakibatkan hangusnya DP sesuai kebijakan pembatalan yang berlaku demi menjamin komitmen mitra vendor yang telah memblokir jadwal.
                            </p>
                        </div>
                    </div>
                )}

                <div className="p-4 bg-white border-t border-[#E8E2D7] flex items-center gap-2.5">
                    <input
                        type="checkbox"
                        id={`terms-${event.id}`}
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="w-4 h-4 rounded text-[#657166] focus:ring-[#657166] border-[#E8E2D7] cursor-pointer"
                    />
                    <label
                        htmlFor={`terms-${event.id}`}
                        className="text-xs text-[#2F3931] font-semibold cursor-pointer select-none"
                    >
                        Saya telah membaca, memahami, dan menyetujui Syarat dan Ketentuan EVENTO untuk acara ini.
                    </label>
                </div>
            </div>

            {/* Banner Acara Dibatalkan */}
            {event.kanban_status === "cancelled" && (
                <div className="bg-rose-50 border border-rose-300 rounded-xl p-4 text-rose-900 text-xs">
                    <p className="font-bold">Acara Dibatalkan oleh EO. Alasan: {event.cancellation_reason || "-"}</p>
                    <p className="mt-1 text-rose-700">Penawaran ini tidak lagi dapat disetujui atau diajukan revisi.</p>
                </div>
            )}

            {/* Tombol Aksi */}
            {event.kanban_status !== "cancelled" ? (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2">
                    <button
                        onClick={handleApprove}
                        disabled={
                            isApproving ||
                            assignments.length === 0 ||
                            !termsAccepted
                        }
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
            ) : null}

            {/* Modal Lightbox Foto Portofolio */}
            {previewPhoto && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
                    onClick={() => setPreviewPhoto(null)}
                >
                    <div className="relative max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl">
                        <button
                            type="button"
                            onClick={() => setPreviewPhoto(null)}
                            className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black text-white rounded-full transition cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <img
                            src={previewPhoto}
                            alt="Preview Portofolio"
                            className="max-w-full max-h-[85vh] object-contain rounded-2xl"
                        />
                    </div>
                </div>
            )}

            {/* Modal Riwayat Ulasan Lengkap Vendor */}
            {selectedVendorReviews && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
                    onClick={() => setSelectedVendorReviews(null)}
                >
                    <div
                        className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden border border-[#E8E2D7] shadow-2xl p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E8E2D7]">
                            <div>
                                <h3 className="font-extrabold text-base text-[#2F3931]">
                                    Ulasan & Rating Mitra
                                </h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                                    <span className="text-xs font-black text-amber-900">
                                        {selectedVendorReviews.average_rating || 5}
                                    </span>
                                    <span className="text-xs text-[#738075]">
                                        ({selectedVendorReviews.review_count || selectedVendorReviews.reviews?.length || 0} Ulasan Klien)
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedVendorReviews(null)}
                                className="p-1.5 text-[#738075] hover:text-[#2F3931] rounded-xl hover:bg-[#FAF6F0] transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto space-y-3 pr-1 flex-1">
                            {selectedVendorReviews.reviews?.map((rev, idx) => (
                                <div
                                    key={idx}
                                    className="p-3.5 bg-[#FAF6F0]/60 rounded-2xl border border-[#E8E2D7] text-xs"
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="font-extrabold text-[#2F3931]">
                                            {rev.client?.name || "Klien Terverifikasi"}
                                        </span>
                                        <div className="flex items-center">
                                            {[...Array(rev.rating || 5)].map((_, i) => (
                                                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-500" />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-[#556056] leading-relaxed italic">
                                        &ldquo;{rev.comment}&rdquo;
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="pt-3 mt-3 border-t border-[#E8E2D7] flex justify-end">
                            <button
                                type="button"
                                onClick={() => setSelectedVendorReviews(null)}
                                className="px-4 py-2 rounded-xl bg-[#657166] text-white text-xs font-bold transition cursor-pointer hover:bg-[#4E594F]"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
