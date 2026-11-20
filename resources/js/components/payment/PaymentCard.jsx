    import { useState } from 'react';
    import PaymentStatusBadge from './PaymentStatusBadge';
    import ClientInvoiceModal from '../invoice/ClientInvoiceModal';

    function ProofModal({ url, onClose }) {
        return (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <div
                    className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-[#E8E2D7]">
                        <h3 className="font-bold text-[#2F3931] text-sm">Bukti Transfer Pembayaran</h3>
                        <button
                            onClick={onClose}
                            className="text-[#738075] hover:text-[#2F3931] transition-colors p-1 rounded-lg hover:bg-[#F3F0EA]"
                        >
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Image */}
                    <div className="overflow-auto max-h-[75vh] flex items-center justify-center bg-[#F3F0EA] p-4">
                        <img
                            src={url}
                            alt="Bukti Transfer"
                            className="max-w-full max-h-[65vh] object-contain rounded-xl"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                        {/* Fallback untuk file non-gambar (PDF, dll) */}
                        <div
                            className="hidden flex-col items-center gap-3 text-[#738075] py-10"
                        >
                            <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                            <p className="text-sm font-medium">File tidak dapat ditampilkan sebagai gambar.</p>
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-bold text-[#99CDD8] hover:underline"
                            >
                                Buka di tab baru
                            </a>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 border-t border-[#E8E2D7] flex justify-end gap-2">
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-[#738075] hover:text-[#2F3931] border border-[#E8E2D7] hover:bg-[#F3F0EA] px-3 py-1.5 rounded-xl transition-colors"
                        >
                            Buka di Tab Baru
                        </a>
                        <button
                            onClick={onClose}
                            className="text-xs font-bold bg-[#2F3931] text-white px-4 py-1.5 rounded-xl hover:bg-[#4A534B] transition-colors"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    export default function PaymentCard({ payment, role, onUpload, onVerify, isReadOnly = false }) {
    const [proofOpen, setProofOpen] = useState(false);
    const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
    const isCancelled = isReadOnly || payment.event?.kanban_status === 'cancelled';
    const rupiah = (n) =>
        new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        }).format(n);

    const formatTanggal = (isoDate) => {
        if (!isoDate) return '-';
        return new Date(isoDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        });
    };

    const isLunas = payment.status === 'paid';

    return (
        <div className="border border-[#E8E2D7] rounded-2xl p-5 mb-4 bg-white shadow-sm hover:shadow-md transition-shadow">
        {/* Header Kartu */}
        <div className="flex justify-between items-start mb-4 pb-3 border-b border-[#E8E2D7]">
            <div>
            <h3 className="font-bold text-lg text-[#2F3931]">
                {payment.payment_type === 'dp' ? 'Down Payment (DP)' : 'Pelunasan'}
            </h3>
            <p className="text-sm text-[#738075] font-medium">
                {payment.event?.event_name || 'Nama Acara'}
            </p>
            <p className="text-xs text-[#738075] mt-0.5">
                Pelaksanaan: {formatTanggal(payment.event?.event_date)}
            </p>
            </div>
            <div className="text-right">
            <p className="font-black text-xl text-[#2F3931]">
                {rupiah(payment.nominal)}
            </p>
            <PaymentStatusBadge status={payment.status} />
            </div>
        </div>

        {/* Pesan Penolakan (Jika Ada) */}
        {payment.rejection_note && (
            <div className="mb-4 bg-rose-50 text-rose-900 text-sm p-3.5 rounded-xl border border-rose-300 font-medium">
            <span className="font-bold text-rose-950">Catatan Penolakan EO:</span> {payment.rejection_note}
            </div>
        )}

        {/* Tombol Aksi & Bukti */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-2">
            <div className="flex gap-2">
            {/* Tombol Upload Bukti (Klien) */}
            {role === 'client' && payment.status === 'unpaid' && (
                isCancelled ? (
                    <span className="inline-block text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
                        Acara Dibatalkan (Unggah Ditutup)
                    </span>
                ) : (
                    <button
                    onClick={() => onUpload && onUpload(payment)}
                    className="bg-[#657166] hover:bg-[#4A534B] text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer"
                    >
                    Unggah Bukti Transfer
                    </button>
                )
            )}

            {/* Tombol Verifikasi (EO) */}
            {role === 'eo' && payment.status === 'pending_verification' && (
                <>
                <button
                    onClick={() => onVerify(payment, 'approve')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 px-4 py-2 rounded-xl text-sm font-bold shadow-xs transition-colors cursor-pointer"
                >
                    Tandai Lunas
                </button>
                <button
                    onClick={() => onVerify(payment, 'reject')}
                    className="bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-rose-300 px-4 py-2 rounded-xl text-sm font-bold shadow-xs transition-colors cursor-pointer"
                >
                    Tolak
                </button>
                </>
            )}

            {/* Link Bukti Transfer */}
            {payment.payment_proof_url && (
                <>
                <button
                onClick={() => setProofOpen(true)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#99CDD8] hover:text-[#7AB5C2] transition-colors px-3 py-2 cursor-pointer"
                >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Lihat Bukti
                </button>
                {proofOpen && (
                    <ProofModal
                        url={`/storage/${payment.payment_proof_url}`}
                        onClose={() => setProofOpen(false)}
                    />
                )}
                </>
            )}
            </div>

            {/* Tombol Dokumen (Lihat Invoice & Kwitansi) */}
            <div className="flex gap-2">
            {/* Invoice: Muncul jika BELUM lunas */}
            {!isLunas && (
                <button
                type="button"
                onClick={() => setInvoiceModalOpen(true)}
                className="border border-[#CFD8C4] text-[#2F3931] hover:bg-[#FAF6F0] px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                title="Lihat lembar invoice tagihan resmi"
                >
                Lihat Invoice
                </button>
            )}

            {/* Kwitansi: Muncul jika SUDAH lunas */}
            {isLunas && (
                <button
                type="button"
                onClick={() => setInvoiceModalOpen(true)}
                className="bg-[#DAEBE3] border border-[#BCD4C9] text-[#224436] hover:bg-[#C5DED4] px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                title="Cetak Kuitansi / Bukti Pembayaran Sah"
                >
                Cetak Kuitansi
                </button>
            )}
            </div>
        </div>

        {invoiceModalOpen && (
            <ClientInvoiceModal
                paymentId={payment.id}
                onClose={() => setInvoiceModalOpen(false)}
            />
        )}
        </div>
    );
    }