import { useEffect, useRef, useState } from "react";
import api from "../../api/axios";
import { formatRupiah, orDash } from "../../utils/formatters";
import { formatVendorCategory } from "../../utils/vendorHelpers";

const TITLE_ID = "send-quotation-title";
const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function SendQuotationModal({ event, onClose, onSent }) {
    const dialogRef = useRef(null);
    const headingRef = useRef(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    const [dpPercentage, setDpPercentage] = useState(
        event?.dp_percentage ? String(Math.round(Number(event.dp_percentage))) : "30"
    );
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Esc menutup modal ini saja; Tab berputar di dalam modal (focus trap)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation?.();
                onCloseRef.current?.();
                return;
            }

            if (e.key !== "Tab" || !dialogRef.current) return;

            const focusable = Array.from(dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR));
            if (focusable.length === 0) {
                e.preventDefault();
                headingRef.current?.focus();
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const active = document.activeElement;

            if (e.shiftKey && (active === first || active === dialogRef.current || active === headingRef.current)) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && active === last) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Fokus ke heading saat modal muncul
    useEffect(() => {
        headingRef.current?.focus();
    }, []);

    const activeVendors = Array.isArray(event.vendors)
        ? event.vendors.filter((v) => v.offer_status !== "rejected")
        : [];

    const total = Number(event.vendors_total || 0);
    const pctNumber = Number(dpPercentage);
    const isDpValid = Number.isFinite(pctNumber) && pctNumber >= 10 && pctNumber <= 100;
    const dpAmount = isDpValid ? Math.round(total * (pctNumber / 100)) : 0;
    const pelunasanAmount = isDpValid ? Math.max(0, total - dpAmount) : 0;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;

        if (!isDpValid) {
            setError("Persentase DP harus berupa angka antara 10% sampai 100%.");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            const response = await api.post(`/events/${event.id}/send-quotation`, {
                dp_percentage: pctNumber,
            });
            await onSent?.(response.data.event);
        } catch (err) {
            const msg =
                err.response?.data?.errors?.target_status?.[0] ||
                err.response?.data?.errors?.dp_percentage?.[0] ||
                err.response?.data?.errors?.event?.[0] ||
                err.response?.data?.message ||
                "Gagal mengirim penawaran ke klien.";
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={TITLE_ID}
                className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-[#E8E2D7] flex flex-col max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E8E2D7]">
                    <div>
                        <h2
                            id={TITLE_ID}
                            ref={headingRef}
                            tabIndex={-1}
                            className="text-base font-bold text-[#2F3931] focus:outline-none"
                        >
                            Kirim Penawaran ke Klien
                        </h2>
                        <p className="text-xs text-[#738075] mt-0.5">
                            {orDash(event.event_name)} &bull; Klien: {orDash(event.client_name)}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        aria-label="Tutup dialog"
                        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-[#738075] hover:text-[#2F3931] hover:bg-[#FAF6F0] transition-colors disabled:opacity-50"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    {/* Ringkasan Vendor yang Dihitung */}
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#738075] mb-2">
                            Ringkasan Vendor ({activeVendors.length})
                        </p>
                        <ul className="divide-y divide-[#E8E2D7] rounded-xl border border-[#E8E2D7] bg-[#FAF6F0]/60 px-3 py-1 text-xs">
                            {activeVendors.map((row) => (
                                <li key={row.id} className="py-2 flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-[#2F3931] truncate">{row.business_name}</p>
                                        <p className="text-[11px] text-[#738075] truncate">
                                            {formatVendorCategory(row.category)} &bull; {orDash(row.package_name)}
                                        </p>
                                    </div>
                                    <span className="shrink-0 font-semibold text-[#2F3931]">
                                        {formatRupiah(row.price)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Total Harga Penawaran */}
                    <div className="flex items-baseline justify-between border-t border-[#E8E2D7] pt-2 px-1">
                        <span className="text-xs font-medium text-[#738075]">Total Nilai Penawaran</span>
                        <span className="text-base font-extrabold text-[#657166]">{formatRupiah(total)}</span>
                    </div>

                    {/* Catatan Venue Jika Klien Belum Punya Venue */}
                    {event.has_own_venue === false && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                            Catatan: Klien belum memiliki venue untuk acara ini.
                        </div>
                    )}

                    {/* Input Persentase DP */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label htmlFor="send-quotation-dp" className="block text-xs font-semibold text-[#2F3931]">
                                Ketentuan DP (%)
                            </label>
                            <span className="text-[11px] text-[#738075]">Batas: 10% - 100%</span>
                        </div>
                        <input
                            id="send-quotation-dp"
                            type="number"
                            min="10"
                            max="100"
                            step="1"
                            value={dpPercentage}
                            onChange={(e) => setDpPercentage(e.target.value)}
                            disabled={submitting}
                            className="w-full px-3 py-2 text-sm border border-[#E8E2D7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#657166]/20 focus:border-[#657166] disabled:bg-[#FAF6F0]"
                        />

                        {/* Simulasi Nilai DP & Pelunasan */}
                        {isDpValid && (
                            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#E8E2D7] text-xs">
                                <div className="p-2 bg-[#FAF6F0] rounded-xl">
                                    <span className="text-[10px] text-[#738075] uppercase tracking-wider block">
                                        Nominal DP
                                    </span>
                                    <span className="font-bold text-[#657166]">{formatRupiah(dpAmount)}</span>
                                </div>
                                <div className="p-2 bg-[#FAF6F0] rounded-xl">
                                    <span className="text-[10px] text-[#738075] uppercase tracking-wider block">
                                        Sisa Pelunasan
                                    </span>
                                    <span className="font-bold text-[#2F3931]">{formatRupiah(pelunasanAmount)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Peringatan Read-only */}
                    <div className="rounded-xl bg-[#FAF6F0] p-3 text-[11px] text-[#738075] border border-[#E8E2D7]">
                        Setelah penawaran dikirim, status acara akan berpindah ke <strong>Review klien</strong> dan daftar
                        vendor menjadi <strong>read-only</strong>.
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div
                            role="alert"
                            className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium"
                        >
                            {error}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-2.5 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-4 py-2 border border-[#E8E2D7] text-[#738075] font-semibold text-xs rounded-xl hover:bg-[#FAF6F0] transition-colors disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !isDpValid}
                            className="px-4 py-2 bg-[#657166] hover:bg-[#556056] text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
                        >
                            {submitting ? "Mengirim..." : "Kirim Penawaran"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
