import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    AlertTriangle,
    Coins,
    CheckCircle2,
    Lock,
    MessageSquare,
    Camera,
    MapPin,
    Calendar,
    Clock,
    Check,
    ClipboardList,
} from "lucide-react";
import api from "../../api/axios";
import ProgressTimeline from "../../components/client/ProgressTimeline";
import PaymentCard from "../../components/payment/PaymentCard";
import UploadProofForm from "../../components/payment/UploadProofForm";
import { CATEGORY_LABELS } from "../../data/kanbanData";
import { formatRupiah } from "../../utils/formatters";

// ─── Komponen Modal Ajukan Pembatalan ──────────────────────────────────────────
function CancellationRequestModal({ event, onClose, onSuccess }) {
    const [step, setStep] = useState("loading"); // loading | policy | confirm | submitting
    const [policy, setPolicy] = useState(null);
    const [reason, setReason] = useState("");
    const [error, setError] = useState("");
    const [agreed, setAgreed] = useState(false);

    // Fetch kebijakan DP saat modal dibuka
    useEffect(() => {
        api.get(`/client/events/${event.id}/cancellation-request/policy`)
            .then((res) => {
                setPolicy(res.data);
                setStep("policy");
            })
            .catch(() => {
                setError("Gagal memuat informasi kebijakan pembatalan.");
                setStep("policy");
            });
    }, [event.id]);

    const handleSubmit = async () => {
        if (!reason.trim() || reason.trim().length < 10) {
            setError("Alasan pembatalan minimal 10 karakter.");
            return;
        }
        if (!agreed) {
            setError("Anda harus mencentang pernyataan konfirmasi terlebih dahulu.");
            return;
        }
        setStep("submitting");
        setError("");
        try {
            await api.post(`/client/events/${event.id}/cancellation-request`, { reason });
            onSuccess();
            onClose();
        } catch (e) {
            setError(e?.response?.data?.errors?.reason?.[0] || e?.response?.data?.errors?.event?.[0] || "Gagal mengajukan pembatalan.");
            setStep("confirm");
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E2D7]">
                    <h3 className="font-black text-[#2F3931] text-sm">Ajukan Pembatalan Acara</h3>
                    <button onClick={onClose} className="text-[#738075] hover:text-[#2F3931] p-1 rounded-lg hover:bg-[#F3F0EA] transition-colors">
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="px-6 py-5 flex flex-col gap-4">
                    {/* Loading */}
                    {step === "loading" && (
                        <div className="text-center py-8 text-sm text-[#738075]">Memuat kebijakan pembatalan…</div>
                    )}

                    {/* Policy + Form */}
                    {(step === "policy" || step === "confirm" || step === "submitting") && (
                        <>
                            {/* Info Acara */}
                            <div className="bg-[#FAF6F0] rounded-xl border border-[#E8E2D7] px-4 py-3">
                                <p className="text-xs text-[#738075]">Acara yang akan dibatalkan:</p>
                                <p className="font-black text-sm text-[#2F3931] mt-0.5">{event.event_name}</p>
                                {event.event_date && (
                                    <p className="text-xs text-[#738075] mt-0.5">
                                        Pelaksanaan: {new Date(event.event_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                                    </p>
                                )}
                            </div>

                            {/* Peringatan DP Hangus */}
                            {policy?.is_dp_forfeited ? (
                                <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 flex gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-black text-xs text-amber-800">DP Akan Hangus</p>
                                        <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                                            {policy.forfeit_reason || `Acara sudah kurang dari ${policy.dp_forfeit_days} hari lagi sehingga DP tidak dapat dikembalikan jika pembatalan disetujui.`}
                                        </p>
                                    </div>
                                </div>
                            ) : policy && (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex gap-3">
                                    <Coins className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-black text-xs text-emerald-800">DP Berpotensi Dikembalikan</p>
                                        <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                                            Karena acara masih lebih dari {policy.dp_forfeit_days} hari ke depan ({policy.days_until_event} hari lagi), DP Anda berpotensi dapat dikembalikan jika pembatalan disetujui. Tim EO akan menghubungi Anda lebih lanjut.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Textarea Alasan */}
                            <div>
                                <label className="text-xs font-bold text-[#2F3931] block mb-1.5">
                                    Alasan Pembatalan <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => { setReason(e.target.value); setError(""); }}
                                    rows={4}
                                    placeholder="Jelaskan alasan Anda membatalkan acara ini (minimal 10 karakter)…"
                                    className="w-full border border-[#E8E2D7] rounded-xl px-3 py-2.5 text-sm text-[#2F3931] placeholder:text-[#B8C5B8] focus:outline-none focus:ring-2 focus:ring-[#657166]/30 focus:border-[#657166] resize-none bg-white"
                                    disabled={step === "submitting"}
                                />
                                <p className="text-[11px] text-[#738075] mt-1">{reason.length}/1000 karakter</p>
                            </div>

                            {/* Checkbox Konfirmasi */}
                            <label className="flex items-start gap-2.5 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={agreed}
                                    onChange={(e) => { setAgreed(e.target.checked); setError(""); }}
                                    className="mt-0.5 w-4 h-4 accent-[#657166] shrink-0"
                                    disabled={step === "submitting"}
                                />
                                <span className="text-xs text-[#556056] leading-relaxed">
                                    Saya memahami bahwa pembatalan akan menghentikan seluruh proses acara, dan{" "}
                                    <strong className={policy?.is_dp_forfeited ? "text-amber-700" : "text-[#2F3931]"}>
                                        {policy?.is_dp_forfeited
                                            ? "DP yang telah dibayarkan tidak dapat dikembalikan (hangus)."
                                            : "pengembalian DP bergantung pada keputusan EO."}
                                    </strong>
                                </span>
                            </label>

                            {/* Error */}
                            {error && (
                                <p className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</p>
                            )}
                        </>
                    )}
                </div>

                {/* Footer Aksi */}
                {(step === "policy" || step === "confirm" || step === "submitting") && (
                    <div className="px-6 py-4 border-t border-[#E8E2D7] flex justify-end gap-2">
                        <button
                            onClick={onClose}
                            disabled={step === "submitting"}
                            className="text-sm font-semibold text-[#738075] border border-[#E8E2D7] hover:bg-[#F3F0EA] px-4 py-2 rounded-xl transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={step === "submitting" || !reason.trim() || !agreed}
                            className="text-sm font-bold bg-rose-600 hover:bg-rose-700 disabled:bg-rose-200 disabled:cursor-not-allowed text-white px-5 py-2 rounded-xl transition-colors"
                        >
                            {step === "submitting" ? "Mengajukan…" : "Ajukan Pembatalan"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Modal Pratinjau Gambar ───────────────────────────────────────────────────
function ImagePreviewModal({ src, onClose }) {
    if (!src) return null;
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fadeIn"
            onClick={onClose}
        >
            <div className="relative max-w-4xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 bg-black/60 hover:bg-black/90 text-white w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg transition z-10"
                >
                    &times;
                </button>
                <img src={src} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
            </div>
        </div>
    );
}

// ─── Modal Detail Profil & Paket Vendor ─────────────────────────────────────────
function ClientVendorDetailModal({ assignment, isUnmasked, onClose, onPreviewImage }) {
    if (!assignment) return null;

    const vendor = assignment.vendor || {};
    const pkg = assignment.package || {};

    const getSocialMediaUrl = (handle) => {
        if (!handle) return null;
        const clean = handle.trim();
        if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;
        const username = clean.replace(/^@/, "");
        return `https://instagram.com/${username}`;
    };

    const getWhatsAppUrl = (phone) => {
        if (!phone) return null;
        let clean = phone.replace(/[^0-9]/g, "");
        if (clean.startsWith("0")) clean = "62" + clean.substring(1);
        return `https://wa.me/${clean}`;
    };

    const getInitial = (name) => {
        if (!name) return "V";
        return name.charAt(0).toUpperCase();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
            onClick={onClose}
        >
            <div
                className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Modal */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E2D7] bg-[#FAF6F0]/70">
                    <div className="flex items-center gap-3">
                        {vendor.image_url ? (
                            <img
                                src={vendor.image_url}
                                alt={vendor.business_name}
                                className="w-11 h-11 rounded-2xl object-cover border border-[#E8E2D7] shadow-2xs shrink-0 cursor-pointer"
                                onClick={() => onPreviewImage && onPreviewImage(vendor.image_url)}
                            />
                        ) : (
                            <div className="w-11 h-11 rounded-2xl bg-[#DAEBE3] text-[#224436] font-extrabold text-base flex items-center justify-center border border-[#BCD4C9] shrink-0">
                                {getInitial(vendor.business_name)}
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-base text-[#2F3931] leading-tight">
                                    {vendor.business_name || "Mitra Vendor"}
                                </h3>
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#CFD8C4]/60 text-[#2D3A28] border border-[#B6C2AA]">
                                    {vendor.category || "Vendor"}
                                </span>
                            </div>
                            <p className="text-[11px] text-[#738075] mt-0.5">
                                {isUnmasked ? "Profil resmi mitra vendor terverifikasi" : "Mitra vendor terpilih oleh Event Organizer"}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[#738075] hover:text-[#2F3931] p-1.5 rounded-xl hover:bg-[#F3F0EA] transition cursor-pointer"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Konten Scrollable */}
                <div className="overflow-y-auto p-6 space-y-5 flex-1">
                    {/* Status Masking Banner */}
                    {isUnmasked ? (
                        <div className="bg-[#DAEBE3]/50 border border-[#BCD4C9] rounded-2xl p-4 flex items-start gap-3 text-[#224436]">
                            <CheckCircle2 className="w-5 h-5 text-[#224436] shrink-0 mt-0.5" />
                            <div className="text-xs leading-relaxed">
                                <p className="font-extrabold">Profil & Kontak Resmi Vendor Terbuka</p>
                                <p className="text-[#3F5B4E] mt-0.5">
                                    Pembayaran DP telah diverifikasi. Anda dapat langsung melihat portofolio resmi, kontak WhatsApp, serta berkoordinasi dengan vendor ini.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-900">
                            <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                            <div className="text-xs leading-relaxed">
                                <p className="font-extrabold">Kontak Langsung Vendor Dirahasiakan Sementara</p>
                                <p className="text-amber-800 mt-0.5">
                                    Nama bisnis asli, nomor WhatsApp, dan akun media sosial vendor akan terbuka otomatis segera setelah pembayaran Down Payment (DP) Anda diverifikasi oleh tim EO.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Informasi Kontak & Sosmed (Hanya jika unmasked) */}
                    {isUnmasked && (
                        <div className="bg-white rounded-2xl border border-[#E8E2D7] p-4.5 space-y-3.5 shadow-2xs">
                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#738075]">
                                Informasi Kontak & Portofolio Vendor
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* WhatsApp / Telepon */}
                                {vendor.contact_number ? (
                                    <a
                                        href={getWhatsAppUrl(vendor.contact_number)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2.5 p-3 rounded-xl bg-[#FAF6F0] hover:bg-[#DAEBE3]/50 border border-[#E8E2D7] transition text-xs text-[#2F3931]"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                                            <MessageSquare className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <span className="block text-[10px] text-[#738075] font-semibold">WhatsApp / Telepon</span>
                                            <span className="block font-bold truncate text-emerald-800">
                                                {vendor.contact_number}
                                            </span>
                                        </div>
                                        <span className="text-xs text-emerald-600 font-bold shrink-0">Chat ↗</span>
                                    </a>
                                ) : (
                                    <div className="p-3 rounded-xl bg-[#FAF6F0] border border-[#E8E2D7] text-xs text-[#738075]">
                                        <span className="block text-[10px] font-semibold">Kontak</span>
                                        <span>Dikoordinasikan via EO</span>
                                    </div>
                                )}

                                {/* Media Sosial / Instagram */}
                                {vendor.social_media ? (
                                    <a
                                        href={getSocialMediaUrl(vendor.social_media)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2.5 p-3 rounded-xl bg-[#FAF6F0] hover:bg-[#99CDD8]/20 border border-[#E8E2D7] transition text-xs text-[#2F3931]"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0">
                                            <Camera className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <span className="block text-[10px] text-[#738075] font-semibold">Portofolio / Instagram</span>
                                            <span className="block font-bold truncate text-[#1D4A54]">
                                                {vendor.social_media}
                                            </span>
                                        </div>
                                        <span className="text-xs text-[#1D4A54] font-bold shrink-0">Buka ↗</span>
                                    </a>
                                ) : (
                                    <div className="p-3 rounded-xl bg-[#FAF6F0] border border-[#E8E2D7] text-xs text-[#738075]">
                                        <span className="block text-[10px] font-semibold">Sosial Media</span>
                                        <span>Belum dicantumkan</span>
                                    </div>
                                )}
                            </div>

                            {/* Alamat Vendor */}
                            {vendor.address && (
                                <div className="text-xs text-[#556056] bg-[#FAF6F0]/60 p-3 rounded-xl border border-[#E8E2D7] flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-[#738075] shrink-0 mt-0.5" />
                                    <div className="leading-relaxed">
                                        <span className="font-bold text-[#2F3931]">Alamat Vendor: </span>
                                        {vendor.address}
                                    </div>
                                </div>
                            )}

                            {/* Deskripsi Usaha */}
                            {vendor.description && (
                                <div className="text-xs text-[#556056] leading-relaxed bg-[#FAF6F0]/60 p-3 rounded-xl border border-[#E8E2D7]">
                                    <span className="font-bold text-[#2F3931] block mb-0.5">Tentang Profil Usaha:</span>
                                    <p className="whitespace-pre-line">{vendor.description}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Informasi Paket yang Diambil */}
                    <div className="bg-white rounded-2xl border border-[#E8E2D7] p-4.5 space-y-3.5 shadow-2xs">
                        <div className="flex items-center justify-between pb-2.5 border-b border-[#E8E2D7]">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#738075]">
                                    Paket Layanan yang Dipilih
                                </span>
                                <h4 className="text-sm font-extrabold text-[#2F3931] mt-0.5">
                                    {assignment.package_name || pkg.package_name || "Paket Khusus"}
                                </h4>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] text-[#738075] block">Harga Terkunci</span>
                                <span className="text-sm font-black text-[#1D4A54]">
                                    {formatRupiah(assignment.locked_price || pkg.price)}
                                </span>
                            </div>
                        </div>

                        {/* Deskripsi Paket */}
                        {pkg.description && (
                            <div className="text-xs text-[#556056] leading-relaxed">
                                <span className="font-bold text-[#2F3931] block mb-1">Rincian & Cakupan Layanan:</span>
                                <p className="bg-[#FAF6F0] p-3 rounded-xl border border-[#E8E2D7] whitespace-pre-line">
                                    {pkg.description}
                                </p>
                            </div>
                        )}

                        {/* Foto Utama & Galeri Paket */}
                        {(pkg.image_url || (pkg.images && pkg.images.length > 0)) && (
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-[#2F3931] block">
                                    Foto & Dokumentasi Paket:
                                </span>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                    {pkg.image_url && (
                                        <div
                                            className="group relative rounded-xl overflow-hidden border border-[#E8E2D7] bg-[#FAF6F0] aspect-4/3 cursor-pointer shadow-2xs hover:shadow-md transition"
                                            onClick={() => onPreviewImage && onPreviewImage(pkg.image_url)}
                                        >
                                            <img
                                                src={pkg.image_url}
                                                alt={pkg.package_name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                                                Foto Utama
                                            </span>
                                        </div>
                                    )}

                                    {pkg.images &&
                                        pkg.images.map((img, idx) => (
                                            <div
                                                key={img.id || idx}
                                                className="group relative rounded-xl overflow-hidden border border-[#E8E2D7] bg-[#FAF6F0] aspect-4/3 cursor-pointer shadow-2xs hover:shadow-md transition"
                                                onClick={() => onPreviewImage && onPreviewImage(img.image_url)}
                                            >
                                                <img
                                                    src={img.image_url}
                                                    alt={`Galeri ${idx + 1}`}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Progres Terverifikasi dari Vendor (Progress Logs) */}
                    {assignment.progressLogs && assignment.progressLogs.length > 0 && (
                        <div className="bg-white rounded-2xl border border-[#E8E2D7] p-4.5 space-y-3 shadow-2xs">
                            <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D7]">
                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#738075]">
                                    Laporan Persiapan Vendor ({assignment.progressLogs.length})
                                </h4>
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                    Diverifikasi EO
                                </span>
                            </div>

                            <div className="space-y-2.5">
                                {assignment.progressLogs.map((log) => (
                                    <div
                                        key={log.id}
                                        className="bg-[#FAF6F0]/70 p-3 rounded-xl border border-[#E8E2D7] flex items-start gap-3"
                                    >
                                        {log.photo_url && (
                                            <img
                                                src={log.photo_url}
                                                alt="Dokumentasi progres"
                                                className="w-14 h-14 rounded-lg object-cover border border-[#E8E2D7] shrink-0 cursor-pointer shadow-2xs"
                                                onClick={() => onPreviewImage && onPreviewImage(log.photo_url)}
                                            />
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs text-[#2F3931] leading-relaxed whitespace-pre-line font-medium">
                                                {log.note}
                                            </p>
                                            {log.created_at && (
                                                <span className="block text-[10px] text-[#738075] mt-1">
                                                    {new Date(log.created_at).toLocaleDateString("id-ID", {
                                                        day: "numeric",
                                                        month: "short",
                                                        year: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}{" "}
                                                    WIB
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Modal */}
                <div className="px-6 py-4 border-t border-[#E8E2D7] bg-[#FAF6F0]/70 flex items-center justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl text-xs font-bold bg-[#2F3931] hover:bg-[#455247] text-white transition cursor-pointer"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ClientBookedEventsPage() {
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [uploadingPayment, setUploadingPayment] = useState(null);
    const [cancellationEvent, setCancellationEvent] = useState(null);
    const [selectedVendorAssignment, setSelectedVendorAssignment] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
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
            case "cancelled":
                return {
                    label: "Dibatalkan oleh EO",
                    className: "bg-rose-100 text-rose-800 border-rose-300",
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
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>{formatDateRange(evt)}</span>
                                            </span>
                                        </div>

                                        {evt.venue && (
                                            <p className="text-[11px] text-[#738075] truncate mb-2.5 flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                <span>{evt.venue}</span>
                                            </p>
                                        )}

                                        {evt.kanban_status === "drafting_quotation" && evt.revision_note && (
                                            <div className="mb-2.5 rounded-lg border border-[#E8E2D7] bg-white px-2.5 py-2 text-black">
                                                <p className="text-[10px] font-bold uppercase tracking-wider">Revisi Anda sedang diproses EO</p>
                                                <p className="text-[11px] leading-snug mt-0.5 break-words">{evt.revision_note}</p>
                                            </div>
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

                            {/* Pagination (Hanya muncul jika total acara > 10) */}
                            {events.length > perPage && (
                                <div className="p-3 bg-white rounded-2xl border border-[#E8E2D7] flex items-center justify-between text-xs text-[#738075] mt-1 shadow-2xs">
                                    <span>
                                        Hal <strong>{page}</strong> dari <strong>{totalPages}</strong> ({events.length} acara)
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            disabled={page <= 1}
                                            onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                            className="px-2.5 py-1 bg-[#FAF6F0] hover:bg-[#E8E2D7]/50 border border-[#E8E2D7] rounded-lg disabled:opacity-40 font-bold transition cursor-pointer"
                                        >
                                            Sebelumnya
                                        </button>

                                        {Array.from({ length: totalPages }).map((_, idx) => {
                                            const pageNum = idx + 1;
                                            return (
                                                <button
                                                    key={pageNum}
                                                    type="button"
                                                    onClick={() => setPage(pageNum)}
                                                    className={`w-6 h-6 rounded-md font-bold text-xs transition cursor-pointer ${
                                                        page === pageNum
                                                            ? "bg-[#657166] text-white"
                                                            : "bg-white border border-[#E8E2D7] text-[#2F3931] hover:bg-[#FAF6F0]"
                                                    }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}

                                        <button
                                            type="button"
                                            disabled={page >= totalPages}
                                            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                                            className="px-2.5 py-1 bg-[#FAF6F0] hover:bg-[#E8E2D7]/50 border border-[#E8E2D7] rounded-lg disabled:opacity-40 font-bold transition cursor-pointer"
                                        >
                                            Selanjutnya
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
                            {/* Peringatan Acara Dibatalkan oleh EO */}
                            {activeEvent.kanban_status === "cancelled" && (
                                <div
                                    role="alert"
                                    className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 shadow-xs flex items-start gap-3.5 text-rose-900 animate-fadeIn"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-rose-200/80 border border-rose-300 text-rose-700 flex items-center justify-center font-black text-lg shrink-0">
                                        !
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-200 text-rose-800 px-2.5 py-0.5 rounded-full border border-rose-300">
                                                Status: Dibatalkan
                                            </span>
                                            {activeEvent.cancelled_at && (
                                                <span className="text-[11px] text-rose-600 font-medium">
                                                    Dibatalkan pada {new Date(activeEvent.cancelled_at).toLocaleDateString("id-ID", {
                                                        day: "numeric",
                                                        month: "long",
                                                        year: "numeric",
                                                    })}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-base font-black text-rose-950 mt-1">
                                            Acara Dibatalkan oleh EO. Alasan: {activeEvent.cancellation_reason || "Tidak ada rincian alasan yang disertakan."}
                                        </h3>
                                        <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                                            Seluruh interaksi dan jadwal acara ini telah dihentikan dalam mode Read-Only.
                                        </p>
                                    </div>
                                </div>
                            )}

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

                                <div className="text-left sm:text-right flex flex-col items-start sm:items-end gap-2">
                                    <div>
                                        <span className="text-[11px] text-[#556056] block">Status Terkini:</span>
                                        <span className={`inline-block mt-0.5 text-xs font-bold px-3 py-1 rounded-full border ${getStatusBadge(activeEvent.kanban_status).className}`}>
                                            {getStatusBadge(activeEvent.kanban_status).label}
                                        </span>
                                    </div>

                                    {/* Tombol Ajukan Pembatalan */}
                                    {["drafting_quotation", "client_review", "awaiting_dp", "on_progress"].includes(activeEvent.kanban_status) && (
                                        activeEvent.cancellation_request_status === "pending" ? (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>Menunggu Review EO</span>
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => setCancellationEvent(activeEvent)}
                                                className="text-[11px] font-bold text-rose-600 border border-rose-200 hover:bg-rose-50 px-3 py-1 rounded-full transition-colors cursor-pointer"
                                            >
                                                Ajukan Pembatalan
                                            </button>
                                        )
                                    )}

                                    {/* Notif hasil review pembatalan */}
                                    {activeEvent.cancellation_request_status === "rejected" && (
                                        <div className="text-left bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 max-w-xs">
                                            <p className="text-[10px] font-black text-orange-700">Pembatalan Ditolak EO</p>
                                            <p className="text-[10px] text-orange-600 mt-0.5">{activeEvent.cancellation_review_note}</p>
                                        </div>
                                    )}
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

                            {/* Section 2: Daftar Mitra Vendor Acara */}
                            <div className="bg-white rounded-2xl border border-[#E8E2D7] p-5 shadow-xs">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#E8E2D7]">
                                    <div className="flex items-center gap-2">
                                        <span className="w-7 h-7 rounded-lg bg-[#99CDD8]/40 text-[#1D4A54] border border-[#86BAC5] flex items-center justify-center font-bold text-xs shrink-0">
                                            2
                                        </span>
                                        <div>
                                            <h3 className="text-sm font-extrabold text-[#2F3931]">
                                                Daftar Mitra Vendor Acara
                                            </h3>
                                            <p className="text-[11px] text-[#738075]">
                                                {activeEvent.is_vendor_unmasked
                                                    ? "Profil resmi, portofolio media sosial, kontak WhatsApp, dan paket layanan mitra vendor"
                                                    : "Daftar mitra vendor penugasan acara. Kontak & profil resmi terbuka setelah DP diverifikasi"}
                                            </p>
                                        </div>
                                    </div>

                                    {activeEvent.is_vendor_unmasked ? (
                                        <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#DAEBE3] text-[#224436] border border-[#BCD4C9] flex items-center gap-1.5 shrink-0">
                                            <Check className="w-3.5 h-3.5" />
                                            <span>Profil Resmi Terbuka</span>
                                        </span>
                                    ) : (
                                        <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FAF6F0] text-[#738075] border border-[#E8E2D7] flex items-center gap-1.5 shrink-0">
                                            <Lock className="w-3.5 h-3.5" />
                                            <span>Kontak Terbuka Pasca-DP</span>
                                        </span>
                                    )}
                                </div>

                                {activeEvent.vendorAssignments && activeEvent.vendorAssignments.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                        {activeEvent.vendorAssignments.map((assignment) => {
                                            const vendor = assignment.vendor || {};
                                            const pkg = assignment.package || {};
                                            const isUnmasked = activeEvent.is_vendor_unmasked;

                                            return (
                                                <div
                                                    key={assignment.id}
                                                    className="bg-[#FAF6F0]/50 hover:bg-[#FAF6F0] rounded-2xl border border-[#E8E2D7] p-4 flex flex-col justify-between transition-all hover:shadow-xs group"
                                                >
                                                    <div>
                                                        {/* Header Vendor Card */}
                                                        <div className="flex items-start gap-3">
                                                            {vendor.image_url ? (
                                                                <img
                                                                    src={vendor.image_url}
                                                                    alt={vendor.business_name}
                                                                    className="w-12 h-12 rounded-xl object-cover border border-[#E8E2D7] shrink-0"
                                                                />
                                                            ) : (
                                                                <div className="w-12 h-12 rounded-xl bg-[#DAEBE3] text-[#224436] font-black text-base flex items-center justify-center border border-[#BCD4C9] shrink-0">
                                                                    {(vendor.business_name || "V").charAt(0).toUpperCase()}
                                                                </div>
                                                            )}

                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-[#CFD8C4]/60 text-[#2D3A28] border border-[#B6C2AA]">
                                                                        {vendor.category || "Layanan"}
                                                                    </span>
                                                                    {assignment.eo_offer_status && (
                                                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white text-[#738075] border border-[#E8E2D7]">
                                                                            {assignment.eo_offer_status}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <h4 className="font-extrabold text-sm text-[#2F3931] mt-1 truncate">
                                                                    {vendor.business_name || "Mitra Vendor EO"}
                                                                </h4>

                                                                {isUnmasked && vendor.address && (
                                                                    <p className="text-[10px] text-[#738075] truncate mt-0.5 flex items-center gap-1">
                                                                        <MapPin className="w-3 h-3 shrink-0" />
                                                                        <span>{vendor.address}</span>
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Rincian Paket */}
                                                        <div className="mt-3 pt-3 border-t border-[#E8E2D7]/70 bg-white/70 p-2.5 rounded-xl border border-[#E8E2D7]/60">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="min-w-0 flex-1">
                                                                    <span className="text-[10px] text-[#738075] font-semibold block">
                                                                        Paket:
                                                                    </span>
                                                                    <p className="text-xs font-bold text-[#2F3931] truncate">
                                                                        {assignment.package_name || pkg.package_name || "Paket Khusus"}
                                                                    </p>
                                                                </div>
                                                                <div className="text-right shrink-0">
                                                                    <span className="text-[10px] text-[#738075] block">Biaya:</span>
                                                                    <span className="text-xs font-black text-[#1D4A54]">
                                                                        {formatRupiah(assignment.locked_price || pkg.price)}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Info Sosmed & Kontak Cepat jika unmasked */}
                                                            {isUnmasked ? (
                                                                <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-[#E8E2D7]/50 text-[10px]">
                                                                    {vendor.contact_number && (
                                                                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                                            <MessageSquare className="w-3 h-3" />
                                                                            <span>{vendor.contact_number}</span>
                                                                        </span>
                                                                    )}
                                                                    {vendor.social_media && (
                                                                        <span className="inline-flex items-center gap-1 font-semibold text-[#1D4A54] bg-[#99CDD8]/20 px-2 py-0.5 rounded border border-[#86BAC5]">
                                                                            <Camera className="w-3 h-3" />
                                                                            <span>{vendor.social_media}</span>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <p className="text-[10px] text-[#738075] mt-1.5 italic flex items-center gap-1">
                                                                    <Lock className="w-3 h-3 shrink-0" />
                                                                    <span>Kontak & sosmed terbuka setelah DP diverifikasi</span>
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Tombol Aksi Lihat Profil & Paket */}
                                                    <div className="mt-3.5 pt-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedVendorAssignment(assignment)}
                                                            className="w-full py-2 px-3 rounded-xl bg-white hover:bg-[#DAEBE3] text-[#2F3931] hover:text-[#224436] font-bold text-xs border border-[#E8E2D7] hover:border-[#BCD4C9] transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                                                        >
                                                            <span>Lihat Profil & Rincian Paket</span>
                                                            <span className="text-[11px]">→</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-xs text-[#738075] bg-[#FAF6F0]/40 rounded-xl border border-dashed border-[#E8E2D7]">
                                        <p className="font-bold text-[#2F3931]">Belum ada mitra vendor yang ditugaskan</p>
                                        <p className="text-[11px] mt-1">
                                            Tim Event Organizer akan segera memilihkan mitra vendor terbaik sesuai kebutuhan acara Anda.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Section 3: Rincian Pembayaran Acara */}
                            <div className="bg-white rounded-2xl border border-[#E8E2D7] p-5 shadow-xs">
                                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#E8E2D7]">
                                    <span className="w-7 h-7 rounded-lg bg-[#FDE8D3] text-[#63482B] flex items-center justify-center font-bold text-xs">
                                        3
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
                                                isReadOnly={activeEvent.kanban_status === "cancelled"}
                                                onUpload={activeEvent.kanban_status === "cancelled" ? undefined : setUploadingPayment}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-xs text-[#738075] bg-[#FAF6F0]/40 rounded-xl border border-dashed border-[#E8E2D7]">
                                        <p className="font-bold text-[#2F3931]">Belum ada tagihan pembayaran diterbitkan</p>
                                        <p className="text-[11px] mt-1">
                                            {activeEvent.kanban_status === "cancelled"
                                                ? "Acara ini telah dibatalkan oleh EO."
                                                : activeEvent.kanban_status === "request" || activeEvent.kanban_status === "drafting_quotation"
                                                ? "Tagihan DP 50% akan otomatis dibuat setelah Anda menyetujui penawaran dari EO."
                                                : "Hubungi admin EO jika tagihan belum tersedia."}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Empty State Saat Belum Ada Acara yang Dipilih */
                        <div className="bg-white rounded-2xl border-2 border-dashed border-[#E8E2D7] p-12 text-center text-[#738075] shadow-xs">
                            <div className="w-14 h-14 rounded-2xl bg-[#FAF6F0] flex items-center justify-center mx-auto mb-3 border border-[#E8E2D7] text-[#738075]">
                                <ClipboardList className="w-7 h-7" />
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

            {/* Modal Ajukan Pembatalan */}
            {cancellationEvent && (
                <CancellationRequestModal
                    event={cancellationEvent}
                    onClose={() => setCancellationEvent(null)}
                    onSuccess={() => {
                        refetch();
                        setCancellationEvent(null);
                    }}
                />
            )}

            {/* Modal Detail Profil & Paket Vendor */}
            {selectedVendorAssignment && (
                <ClientVendorDetailModal
                    assignment={selectedVendorAssignment}
                    isUnmasked={activeEvent?.is_vendor_unmasked}
                    onClose={() => setSelectedVendorAssignment(null)}
                    onPreviewImage={(src) => setPreviewImage(src)}
                />
            )}

            {/* Modal Pratinjau Gambar Penuh */}
            {previewImage && (
                <ImagePreviewModal
                    src={previewImage}
                    onClose={() => setPreviewImage(null)}
                />
            )}
        </div>
    );
}

