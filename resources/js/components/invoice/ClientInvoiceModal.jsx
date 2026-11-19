import React, { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Printer, X, Copy, Check, Download, ShieldCheck, Clock, AlertCircle } from "lucide-react";
import api from "../../api/axios";

export default function ClientInvoiceModal({ paymentId, onClose }) {
    const printAreaRef = useRef(null);
    const [copiedAccount, setCopiedAccount] = React.useState(null);

    const { data: invoiceData, isLoading, error } = useQuery({
        queryKey: ["payment-invoice", paymentId],
        queryFn: async () => {
            const res = await api.get(`/payments/${paymentId}/invoice`);
            return res.data.data;
        },
        enabled: Boolean(paymentId),
    });

    const formatRupiah = (num) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(num || 0);
    };

    const handleCopy = (text, key) => {
        navigator.clipboard.writeText(text);
        setCopiedAccount(key);
        setTimeout(() => setCopiedAccount(null), 2000);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto border border-[#E8E2D7]">
                
                {/* Modal Action Header (Tidak ikut tercetak saat diprint) */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E2D7] bg-[#FAF6F0] print:hidden">
                    <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#2F3931] text-sm sm:text-base">
                            {invoiceData?.title || "Pratinjau Dokumen Keuangan"}
                        </span>
                        {invoiceData?.document_type === "receipt" && (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                                Sah / Lunas
                            </span>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#657166] hover:bg-[#525C53] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Cetak / Simpan PDF</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 text-[#738075] hover:text-[#2F3931] hover:bg-[#E8E2D7] rounded-xl transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Document Body (Area yang tercetak) */}
                <div className="overflow-y-auto p-6 sm:p-10 text-[#2F3931] font-sans print:p-0 print:overflow-visible" ref={printAreaRef}>
                    {isLoading ? (
                        <div className="py-20 text-center text-sm text-[#738075]">
                            Menyiapkan lembar dokumen resmi...
                        </div>
                    ) : error ? (
                        <div className="py-12 text-center text-rose-700 text-sm">
                            Gagal memuat rincian invoice.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6 printable-document">
                            
                            {/* KOP SURAT RESMI */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b-2 border-[#2F3931]">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl font-black tracking-tight text-[#2F3931]">
                                            {invoiceData.company.name}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#556056] font-medium mt-1">
                                        {invoiceData.company.legal_name}
                                    </p>
                                    <p className="text-[11px] text-[#738075] max-w-sm mt-0.5">
                                        {invoiceData.company.address}
                                    </p>
                                    <p className="text-[11px] text-[#738075] mt-0.5">
                                        Telp: {invoiceData.company.phone} &bull; Email: {invoiceData.company.email}
                                    </p>
                                </div>

                                <div className="text-left sm:text-right shrink-0">
                                    <span className="text-xs font-black tracking-widest uppercase text-[#657166] block">
                                        {invoiceData.title}
                                    </span>
                                    <p className="text-sm font-extrabold text-[#2F3931] mt-0.5">
                                        {invoiceData.receipt_number || invoiceData.invoice_number}
                                    </p>
                                    <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border">
                                        {invoiceData.payment.status === "paid" ? (
                                            <span className="bg-emerald-50 text-emerald-800 border-emerald-300 inline-flex items-center gap-1">
                                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                                                LUNAS
                                            </span>
                                        ) : (
                                            <span className="bg-amber-50 text-amber-800 border-amber-300 inline-flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5 text-amber-700" />
                                                MENUNGGU PEMBAYARAN
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* INFORMASI TANGGAL & PIHAK KLIEN */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-[#FAF6F0] p-5 rounded-2xl border border-[#E8E2D7]">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#738075] block">
                                        Ditagihkan Kepada:
                                    </span>
                                    <p className="font-extrabold text-sm text-[#2F3931] mt-0.5">
                                        {invoiceData.client.name}
                                    </p>
                                    <p className="text-xs text-[#556056]">{invoiceData.client.email}</p>
                                    {invoiceData.client.contact !== "-" && (
                                        <p className="text-xs text-[#556056]">Kontak: {invoiceData.client.contact}</p>
                                    )}
                                    <div className="mt-3 pt-2.5 border-t border-[#E8E2D7]">
                                        <p className="text-xs font-bold text-[#2F3931]">
                                            Acara: {invoiceData.event.name}
                                        </p>
                                        <p className="text-[11px] text-[#738075]">
                                            Pelaksanaan: {invoiceData.event.date} &bull; Kategori: {invoiceData.event.category}
                                        </p>
                                        <p className="text-[11px] text-[#738075]">
                                            Venue: {invoiceData.event.venue}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col justify-between sm:items-end text-left sm:text-right">
                                    <div className="space-y-1">
                                        <p className="text-xs text-[#738075]">
                                            Tanggal Terbit: <strong className="text-[#2F3931]">{invoiceData.issue_date}</strong>
                                        </p>
                                        {invoiceData.paid_date && (
                                            <p className="text-xs text-[#738075]">
                                                Tanggal Verifikasi Lunas: <strong className="text-emerald-800">{invoiceData.paid_date}</strong>
                                            </p>
                                        )}
                                        {!invoiceData.paid_date && invoiceData.due_date && (
                                            <p className="text-xs text-[#738075]">
                                                Jatuh Tempo: <strong className="text-rose-700">{invoiceData.due_date}</strong>
                                            </p>
                                        )}
                                        <p className="text-xs text-[#738075]">
                                            Termin: <strong className="text-[#2F3931]">{invoiceData.payment.type_label}</strong>
                                        </p>
                                    </div>

                                    {invoiceData.payment.status === "paid" && (
                                        <div className="mt-4 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-left sm:text-right">
                                            <p className="text-[10px] font-bold text-emerald-800 uppercase">
                                                Diverifikasi Sah Oleh:
                                            </p>
                                            <p className="text-xs font-black text-emerald-900">
                                                {invoiceData.payment.verified_by}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* TABEL RINCIAN ITEM KONTRAK & PENAWARAN */}
                            <div>
                                <h4 className="text-xs font-extrabold text-[#2F3931] uppercase tracking-wider mb-2.5">
                                    Rincian Paket & Layanan Acara
                                </h4>
                                <div className="border border-[#E8E2D7] rounded-xl overflow-hidden">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-[#FAF6F0] border-b border-[#E8E2D7] text-[#556056] font-bold">
                                                <th className="py-2.5 px-3 w-10 text-center">No</th>
                                                <th className="py-2.5 px-3">Layanan / Vendor</th>
                                                <th className="py-2.5 px-3">Nama Paket</th>
                                                <th className="py-2.5 px-3 text-right">Harga Kontrak</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#E8E2D7]">
                                            {invoiceData.items.map((it, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50">
                                                    <td className="py-2.5 px-3 text-center text-[#738075]">{idx + 1}</td>
                                                    <td className="py-2.5 px-3 font-semibold text-[#2F3931]">
                                                        {it.category}
                                                        <span className="block text-[11px] font-normal text-[#738075]">
                                                            {it.vendor_name}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-3 text-[#556056]">{it.package_name}</td>
                                                    <td className="py-2.5 px-3 text-right font-bold text-[#2F3931]">
                                                        {formatRupiah(it.price)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* RINGKASAN TAGIHAN & PEMBAYARAN */}
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
                                {/* Instruksi Pembayaran (Muncul jika belum lunas) */}
                                <div className="w-full sm:w-1/2">
                                    <h4 className="text-xs font-extrabold text-[#2F3931] uppercase tracking-wider mb-2">
                                        Instruksi Pembayaran Resmi:
                                    </h4>
                                    <div className="space-y-2">
                                        {invoiceData.company.bank_accounts.map((b, idx) => (
                                            <div key={idx} className="p-3 bg-[#FAF6F0] rounded-xl border border-[#E8E2D7] flex items-center justify-between text-xs">
                                                <div>
                                                    <span className="font-bold text-[#2F3931]">{b.bank}</span>
                                                    <p className="font-mono text-sm font-bold text-[#1D4A54] mt-0.5">{b.account_number}</p>
                                                    <p className="text-[10px] text-[#738075]">a.n. {b.account_holder}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopy(b.account_number, `bank-${idx}`)}
                                                    className="p-1.5 text-[#657166] hover:bg-[#E8E2D7] rounded-lg transition print:hidden"
                                                    title="Salin nomor rekening"
                                                >
                                                    {copiedAccount === `bank-${idx}` ? (
                                                        <Check className="w-4 h-4 text-emerald-600" />
                                                    ) : (
                                                        <Copy className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-[#738075] mt-2 italic">
                                        * Harap sertakan nomor invoice pada berita transfer dan unggah bukti transfer ke web EVENTO.
                                    </p>
                                </div>

                                {/* Kotak Total Keuangan */}
                                <div className="w-full sm:w-5/12 bg-[#FAF6F0] p-4 rounded-2xl border border-[#E8E2D7] space-y-2">
                                    <div className="flex justify-between text-xs text-[#738075]">
                                        <span>Total Nilai Kontrak Acara:</span>
                                        <strong className="text-[#2F3931] font-semibold">
                                            {formatRupiah(invoiceData.financial_summary.total_contract)}
                                        </strong>
                                    </div>
                                    <div className="flex justify-between text-xs text-[#738075]">
                                        <span>Total Telah Dibayar:</span>
                                        <span className="text-emerald-700 font-semibold">
                                            {formatRupiah(invoiceData.financial_summary.total_paid)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs text-[#738075]">
                                        <span>Sisa Tagihan:</span>
                                        <span className="text-[#2F3931]">
                                            {formatRupiah(invoiceData.financial_summary.remaining_balance)}
                                        </span>
                                    </div>
                                    <div className="pt-2.5 mt-1 border-t-2 border-[#E8E2D7] flex justify-between items-baseline">
                                        <span className="text-xs font-black uppercase text-[#2F3931]">
                                            {invoiceData.payment.status === "paid" ? "Jumlah Dibayarkan:" : "Tagihan Invoice Ini:"}
                                        </span>
                                        <strong className="text-lg font-black text-[#1D4A54]">
                                            {formatRupiah(invoiceData.payment.nominal)}
                                        </strong>
                                    </div>
                                </div>
                            </div>

                            {/* TANDA TANGAN / CAP OTORISASI */}
                            <div className="pt-6 border-t border-[#E8E2D7] flex justify-between items-end">
                                <div className="text-[10px] text-[#A8B2A4] max-w-xs">
                                    Dokumen ini diterbitkan secara sah oleh sistem manajemen EVENTO dan diakui sebagai bukti transaksi yang berkekuatan hukum.
                                </div>

                                <div className="text-center w-48">
                                    <p className="text-xs text-[#738075] mb-12">
                                        Finance & Billing Dept,
                                    </p>
                                    <div className="border-b border-[#2F3931] pb-1">
                                        <span className="font-extrabold text-xs text-[#2F3931]">
                                            {invoiceData.payment.verified_by}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-[#738075] mt-1">
                                        EVENTO Event Management
                                    </p>
                                </div>
                            </div>

                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
