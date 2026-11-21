import { useState } from "react";
import { Star, X, CheckCircle2, AlertCircle } from "lucide-react";
import api from "../../api/axios";

export default function EventReviewModal({ event, onClose, onSuccess }) {
    const assignments = event?.vendor_assignments || event?.vendorAssignments || [];
    const vendors = assignments.map((a) => a.vendor).filter(Boolean);

    const [revieweeType, setRevieweeType] = useState(vendors.length > 0 ? "vendor" : "eo");
    const [selectedVendorId, setSelectedVendorId] = useState(
        vendors[0]?.id || assignments[0]?.vendor_id || ""
    );
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccessMsg("");

        try {
            const payload = {
                reviewee_type: revieweeType,
                vendor_id: revieweeType === "vendor" ? selectedVendorId : null,
                rating,
                comment,
            };

            const res = await api.post(`/events/${event.id}/reviews`, payload);
            setSuccessMsg(res.data?.message || "Ulasan dan rating berhasil dikirim!");
            setTimeout(() => {
                if (onSuccess) onSuccess();
                onClose();
            }, 1200);
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                err.response?.data?.errors?.rating?.[0] ||
                "Gagal mengirim ulasan.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-3xl border border-[#E8E2D7] shadow-2xl w-full max-w-lg p-6 sm:p-8 relative">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-5 right-5 p-2 text-[#738075] hover:text-[#2F3931] rounded-xl hover:bg-[#FAF6F0] transition cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center font-bold">
                        <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-base font-extrabold text-[#2F3931]">
                            Beri Ulasan & Penilaian Bintang
                        </h2>
                        <p className="text-xs text-[#738075]">
                            Acara: <strong>{event?.event_name}</strong>
                        </p>
                    </div>
                </div>

                {successMsg && (
                    <div role="alert" className="p-3 mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{successMsg}</span>
                    </div>
                )}

                {error && (
                    <div role="alert" className="p-3 mb-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Tipe Penerima Ulasan: Vendor atau EO */}
                    <div>
                        <label className="block text-xs font-bold text-[#2F3931] mb-1.5">
                            Pihak yang Ingin Anda Nilai:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setRevieweeType("vendor")}
                                className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                                    revieweeType === "vendor"
                                        ? "bg-[#657166] text-white border-[#657166]"
                                        : "bg-[#FAF6F0] text-[#738075] border-[#E8E2D7] hover:text-[#2F3931]"
                                }`}
                            >
                                Mitra Vendor
                            </button>
                            <button
                                type="button"
                                onClick={() => setRevieweeType("eo")}
                                className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                                    revieweeType === "eo"
                                        ? "bg-[#657166] text-white border-[#657166]"
                                        : "bg-[#FAF6F0] text-[#738075] border-[#E8E2D7] hover:text-[#2F3931]"
                                }`}
                            >
                                Tim EO Evento
                            </button>
                        </div>
                    </div>

                    {/* Pilih Vendor jika revieweeType === 'vendor' */}
                    {revieweeType === "vendor" && (
                        <div>
                            <label className="block text-xs font-bold text-[#2F3931] mb-1.5">
                                Pilih Mitra Vendor:
                            </label>
                            {vendors.length > 0 ? (
                                <select
                                    value={selectedVendorId}
                                    onChange={(e) => setSelectedVendorId(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-[#FAF6F0]/50 border border-[#E8E2D7] focus:border-[#657166] rounded-xl text-xs text-[#2F3931] outline-hidden cursor-pointer"
                                >
                                    {vendors.map((v) => (
                                        <option key={v.id} value={v.id}>
                                            {v.business_name} ({v.category || "Vendor"})
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-xs text-[#738075] italic">
                                    Tidak ada daftar vendor spesifik pada acara ini.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Interaktif Rating Bintang 1-5 */}
                    <div className="py-2 text-center bg-[#FAF6F0]/50 rounded-2xl border border-[#E8E2D7] p-4">
                        <label className="block text-xs font-bold text-[#2F3931] mb-2">
                            Pilih Rating Kepuasan:
                        </label>
                        <div className="flex items-center justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => {
                                const isFilled = (hoverRating || rating) >= star;
                                return (
                                    <button
                                        type="button"
                                        key={star}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        onClick={() => setRating(star)}
                                        className="p-1 transition-transform hover:scale-125 cursor-pointer"
                                    >
                                        <Star
                                            className={`w-8 h-8 ${
                                                isFilled
                                                    ? "fill-amber-400 text-amber-500"
                                                    : "text-[#D1CBC0]"
                                            }`}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                        <span className="inline-block mt-2 text-xs font-bold text-amber-900 bg-amber-100 px-3 py-0.5 rounded-full border border-amber-200">
                            {rating === 5
                                ? "⭐⭐⭐⭐⭐ Sangat Memuaskan!"
                                : rating === 4
                                ? "⭐⭐⭐⭐ Memuaskan"
                                : rating === 3
                                ? "⭐⭐⭐ Cukup Baik"
                                : rating === 2
                                ? "⭐⭐ Kurang Puas"
                                : "⭐ Sangat Kurang"}
                        </span>
                    </div>

                    {/* Komentar Ulasan */}
                    <div>
                        <label className="block text-xs font-bold text-[#2F3931] mb-1.5">
                            Tulis Ulasan & Testimoni:
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Bagikan pengalaman Anda mengenai pelayanan, kerapian, ketepatan waktu, dan kualitas tim..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full px-4 py-2.5 bg-[#FAF6F0]/50 border border-[#E8E2D7] focus:border-[#657166] rounded-xl text-xs text-[#2F3931] outline-hidden"
                        />
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl bg-white hover:bg-[#FAF6F0] border border-[#E8E2D7] text-xs font-bold text-[#738075] transition cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2 rounded-xl bg-[#657166] hover:bg-[#4E594F] text-[#FAF6F0] text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
                        >
                            {loading ? "Mengirim..." : "Kirim Ulasan & Rating"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
