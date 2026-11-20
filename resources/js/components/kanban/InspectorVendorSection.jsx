import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Clock, CheckCircle2, Wallet, FileText } from "lucide-react";
import api from "../../api/axios";
import { formatRupiah, orDash } from "../../utils/formatters";
import {
    formatVendorCategory,
    getOfferStatusMeta,
    isNegotiatedPrice,
} from "../../utils/vendorHelpers";
import VendorPickerModal from "./VendorPickerModal";
import SendQuotationModal from "./SendQuotationModal";
import VendorPayoutModal from "../invoice/VendorPayoutModal";

function getErrorMessage(err, fallback) {
    return err.response?.data?.errors?.event?.[0] || err.response?.data?.message || fallback;
}

function VendorRow({ row, canManage, isConfirming, isRemoving, error, onAskRemove, onCancelRemove, onRemove, onOpenPayout }) {
    const statusMeta = getOfferStatusMeta(row.offer_status);
    const isRejected = row.offer_status === "rejected";
    const isAccepted = row.offer_status === "accepted";
    const negotiated = isNegotiatedPrice(row.price, row.package_price);
    const isPayoutPending = isAccepted && row.payout_status !== "paid";

    return (
        <li className={`rounded-xl border p-3.5 transition-colors ${
            isPayoutPending 
                ? "border-amber-300 bg-amber-50/25 shadow-2xs" 
                : "border-[#E8E2D7] bg-white"
        }`}>
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#738075]">
                        {formatVendorCategory(row.category)}
                    </p>
                    <p className="text-sm font-bold text-[#2F3931] break-words">{orDash(row.business_name)}</p>
                    <p className="text-xs text-[#738075] break-words">{orDash(row.package_name)}</p>
                </div>
                {statusMeta && (
                    <span
                        className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusMeta.className}`}
                    >
                        {statusMeta.label}
                    </span>
                )}
            </div>

            <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
                <span
                    className={`text-sm font-bold ${isRejected ? "text-[#738075] line-through" : "text-[#2F3931]"}`}
                >
                    {formatRupiah(row.price)}
                </span>
                {negotiated && (
                    <span className="text-[11px] text-[#738075]">
                        <span className="line-through">{formatRupiah(row.package_price)}</span> harga paket
                    </span>
                )}
            </div>

            {row.notes && <p className="mt-1 text-xs text-[#738075] break-words">Catatan: {row.notes}</p>}
            {isRejected && (
                <p className="mt-1 text-xs text-rose-600 font-medium break-words">
                    Alasan ditolak: {orDash(row.rejection_reason)}
                </p>
            )}

            {isAccepted && (
                <div className={`mt-3 pt-2.5 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                    isPayoutPending ? "border-amber-200" : "border-[#E8E2D7]"
                }`}>
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                        row.payout_status === 'paid' 
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                            : 'bg-amber-100 text-amber-950 border-amber-300'
                    }`}>
                        {row.payout_status === 'paid' ? (
                            <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Honor Lunas</span>
                            </>
                        ) : (
                            <>
                                <Clock className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                                <span>Honor Belum Dicairkan</span>
                            </>
                        )}
                    </span>
                    
                    <button
                        type="button"
                        onClick={() => onOpenPayout && onOpenPayout(row.id)}
                        className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs ${
                            row.payout_status === 'paid'
                                ? 'bg-[#FAF6F0] hover:bg-[#F2ECE3] text-[#2F3931] border border-[#E8E2D7]'
                                : 'bg-[#D97706] hover:bg-[#B45309] text-white shadow-xs'
                        }`}
                    >
                        {row.payout_status === 'paid' ? (
                            <>
                                <FileText className="w-3.5 h-3.5 text-[#657166]" />
                                <span>Lihat Voucher Kas</span>
                            </>
                        ) : (
                            <>
                                <Wallet className="w-3.5 h-3.5 text-white" />
                                <span>Bayar Honor Vendor →</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {error && (
                <p role="alert" className="mt-2 text-xs text-rose-600">
                    {error}
                </p>
            )}

            {canManage && (
                <div className="mt-2 flex items-center justify-end gap-2">
                    {isConfirming ? (
                        <>
                            <span className="mr-auto text-xs text-[#738075]">
                                {row.offer_status === "accepted"
                                    ? "Vendor sudah menerima tawaran ini. Hapus?"
                                    : "Hapus vendor ini dari acara?"}
                            </span>
                            <button
                                type="button"
                                onClick={onCancelRemove}
                                disabled={isRemoving}
                                className="px-2.5 py-1 text-xs font-semibold text-[#738075] hover:bg-[#FAF6F0] rounded-lg transition-colors disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={onRemove}
                                disabled={isRemoving}
                                className="px-2.5 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {isRemoving ? "Menghapus..." : "Ya, hapus"}
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={onAskRemove}
                            className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                            Hapus
                        </button>
                    )}
                </div>
            )}
        </li>
    );
}

/**
 * Section Vendor pada Board Inspector.
 * Tambah/hapus dan kirim penawaran hanya tersedia bila `event.can_manage_vendors`; selain itu daftar read-only.
 * Harga tidak dapat diedit setelah ditambahkan: untuk mengubahnya, hapus lalu tambah ulang.
 */
export default function InspectorVendorSection({ event, onChanged, onPickerToggle, onQuotationSent }) {
    const [pickerOpen, setPickerOpen] = useState(false);
    const [sendModalOpen, setSendModalOpen] = useState(false);
    const [activePayoutAssignmentId, setActivePayoutAssignmentId] = useState(null);
    const [confirmId, setConfirmId] = useState(null);
    const [removingId, setRemovingId] = useState(null);
    const [rowErrors, setRowErrors] = useState({});
    const addButtonRef = useRef(null);
    const wasPickerOpen = useRef(false);

    const handleOpenPicker = () => {
        onPickerToggle?.(true);
        setPickerOpen(true);
    };

    const handleClosePicker = () => {
        onPickerToggle?.(false);
        setPickerOpen(false);
    };

    const handleOpenSendModal = () => {
        onPickerToggle?.(true);
        setSendModalOpen(true);
    };

    const handleCloseSendModal = () => {
        onPickerToggle?.(false);
        setSendModalOpen(false);
    };

    // Bersihkan status picker jika komponen di-unmount saat modal terbuka
    useEffect(() => {
        return () => {
            onPickerToggle?.(false);
        };
    }, [onPickerToggle]);

    // Kembalikan fokus ke tombol pemicu saat modal ditutup
    useEffect(() => {
        if (wasPickerOpen.current && !pickerOpen) {
            addButtonRef.current?.focus();
        }
        wasPickerOpen.current = pickerOpen;
    }, [pickerOpen]);

    if (!event.show_vendor_section) return null;

    const vendors = Array.isArray(event.vendors) ? event.vendors : [];
    const canManage = Boolean(event.can_manage_vendors);
    const hasRejected = vendors.some((row) => row.offer_status === "rejected");

    const handleRemove = async (row) => {
        setRemovingId(row.id);
        setRowErrors((errors) => ({ ...errors, [row.id]: null }));

        try {
            await api.delete(`/events/${event.id}/vendors/${row.id}`);
            setConfirmId(null);
            await onChanged?.();
        } catch (err) {
            if (err.response?.status === 404) {
                setConfirmId(null);
                await onChanged?.();
            } else {
                setRowErrors((errors) => ({ ...errors, [row.id]: getErrorMessage(err, "Gagal menghapus vendor.") }));
            }
        } finally {
            setRemovingId(null);
        }
    };

    const handleAdded = async () => {
        handleClosePicker();
        await onChanged?.();
    };

    const handleQuotationSent = async (updatedEvent) => {
        handleCloseSendModal();
        await onQuotationSent?.(updatedEvent);
        await onChanged?.();
    };

    return (
        <section className="py-4 border-b border-[#E8E2D7] last:border-b-0" aria-labelledby="inspector-vendor-title">
            <div className="mb-3 flex items-center justify-between gap-2">
                <h3
                    id="inspector-vendor-title"
                    className="text-[11px] font-semibold uppercase tracking-wider text-[#738075]"
                >
                    Vendor
                </h3>
                {canManage && (
                    <button
                        ref={addButtonRef}
                        type="button"
                        onClick={handleOpenPicker}
                        className="px-3 py-1.5 bg-[#657166] hover:bg-[#556056] text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
                    >
                        + Tambah vendor
                    </button>
                )}
            </div>

            {canManage && event.has_own_venue === false && (
                <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Klien belum punya venue.
                </div>
            )}

            {canManage && (
                <p className="mb-3 text-[11px] text-[#738075]">
                    Vendor yang ditambahkan langsung menerima tawaran di dashboard-nya.
                </p>
            )}

            {/* Banner Prioritas Tindakan EO jika ada Honor Vendor Belum Dicairkan */}
            {vendors.some(v => v.offer_status === "accepted" && v.payout_status !== "paid") && (
                <div className="mb-3.5 p-3.5 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-2.5 shadow-2xs animate-fadeIn">
                    <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                    <div className="text-xs">
                        <p className="font-bold text-amber-950">
                            Perhatian: Terdapat Honor Vendor Belum Dicairkan
                        </p>
                        <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                            Mitra vendor yang telah menerima pekerjaan memerlukan pencairan honorarium. Klik tombol oranye <strong>Bayar Honor Vendor</strong> pada kartu vendor di bawah untuk menyelesaikan transfer.
                        </p>
                    </div>
                </div>
            )}

            {vendors.length === 0 ? (
                <p className="text-sm text-[#738075]">Belum ada vendor</p>
            ) : (
                <ul className="space-y-2">
                    {vendors.map((row) => (
                        <VendorRow
                            key={row.id}
                            row={row}
                            canManage={canManage}
                            isConfirming={confirmId === row.id}
                            isRemoving={removingId === row.id}
                            error={rowErrors[row.id]}
                            onAskRemove={() => setConfirmId(row.id)}
                            onCancelRemove={() => {
                                setConfirmId(null);
                                setRowErrors((errors) => ({ ...errors, [row.id]: null }));
                            }}
                            onRemove={() => handleRemove(row)}
                            onOpenPayout={setActivePayoutAssignmentId}
                        />
                    ))}
                </ul>
            )}

            <div className="mt-3 flex items-baseline justify-between gap-2 border-t border-[#E8E2D7] pt-3">
                <div>
                    <span className="text-xs text-[#738075]">Total</span>
                    {hasRejected && (
                        <span className="ml-1 text-[10px] text-[#738075]">(tanpa vendor yang menolak)</span>
                    )}
                </div>
                <span className="text-sm font-bold text-[#2F3931]">{formatRupiah(event.vendors_total)}</span>
            </div>

            {canManage && (
                <div className="mt-4 pt-3 border-t border-[#E8E2D7] flex flex-col gap-2">
                    <button
                        type="button"
                        disabled={!event.can_send_quotation}
                        onClick={handleOpenSendModal}
                        className={`w-full py-2.5 px-4 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 ${
                            event.can_send_quotation
                                ? "bg-[#657166] hover:bg-[#556056] text-white"
                                : "bg-[#FAF6F0] text-[#738075] cursor-not-allowed border border-[#E8E2D7]"
                        }`}
                    >
                        Kirim penawaran ke klien
                    </button>
                    {!event.can_send_quotation &&
                        Array.isArray(event.send_quotation_blockers) &&
                        event.send_quotation_blockers.length > 0 && (
                            <div className="space-y-1">
                                {event.send_quotation_blockers.map((msg, idx) => (
                                    <p key={idx} className="text-[11px] text-amber-700 flex items-start gap-1">
                                        <span className="text-amber-500 font-bold shrink-0">&bull;</span>
                                        <span>{msg}</span>
                                    </p>
                                ))}
                            </div>
                        )}
                </div>
            )}

            {pickerOpen && (
                <VendorPickerModal
                    eventId={event.id}
                    onClose={handleClosePicker}
                    onAdded={handleAdded}
                />
            )}

            {sendModalOpen && (
                <SendQuotationModal
                    event={event}
                    onClose={handleCloseSendModal}
                    onSent={handleQuotationSent}
                />
            )}

            {activePayoutAssignmentId && (
                <VendorPayoutModal
                    assignmentId={activePayoutAssignmentId}
                    isEo={true}
                    onClose={() => setActivePayoutAssignmentId(null)}
                    onSuccess={() => {
                        setActivePayoutAssignmentId(null);
                        onChanged?.();
                    }}
                />
            )}
        </section>
    );
}
