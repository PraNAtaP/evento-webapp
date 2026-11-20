import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Printer, X, ShieldCheck, Check, Clock, Upload, DollarSign, Building } from "lucide-react";
import api from "../../api/axios";

export default function VendorPayoutModal({ assignmentId, isEo = false, onClose, onSuccess }) {
    const queryClient = useQueryClient();
    const [nominal, setNominal] = useState("");
    const [note, setNote] = useState("");
    const [proofFile, setProofFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    useEffect(() => {
        document.body.classList.add("modal-print-open");
        return () => {
            document.body.classList.remove("modal-print-open");
        };
    }, []);

    const { data: invoiceData, isLoading, error } = useQuery({
        queryKey: ["vendor-invoice", assignmentId],
        queryFn: async () => {
            const res = await api.get(`/vendor-assignments/${assignmentId}/invoice`);
            return res.data.data;
        },
        enabled: Boolean(assignmentId),
    });

    const formatRupiah = (num) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(num || 0);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDisburse = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage(null);

        const formData = new FormData();
        if (nominal) formData.append("nominal", nominal);
        if (note) formData.append("note", note);
        if (proofFile) formData.append("proof", proofFile);

        try {
            await api.post(`/admin/vendor-assignments/${assignmentId}/payout`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            queryClient.invalidateQueries({ queryKey: ["vendor-invoice", assignmentId] });
            queryClient.invalidateQueries({ queryKey: ["board-inspector"] });
            queryClient.invalidateQueries({ queryKey: ["vendor-active-jobs"] });
            if (onSuccess) onSuccess();
        } catch (err) {
            setErrorMessage(err.response?.data?.message || "Gagal mencatat pencairan honor vendor.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isPaid = invoiceData?.assignment?.payout_status === "paid";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto print-modal-backdrop print:p-0 print:static print:bg-transparent print:overflow-visible">
            {/* Direct print rules for A4 Paper standard sizing */}
            <style dangerouslySetInnerHTML={{ __html: `
                @page {
                    size: A4 portrait;
                    margin: 12mm 15mm;
                }
                @media print {
                    html, body {
                        background: #ffffff !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                    }
                    .print-modal-container {
                        max-width: 100% !important;
                        width: 100% !important;
                        box-shadow: none !important;
                        border: none !important;
                        border-radius: 0 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                }
            `}} />
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto border border-[#E8E2D7] print-modal-container print:max-w-none print:w-full print:max-h-none print:shadow-none print:border-none print:rounded-none print:my-0">
                
                {/* Header Modal */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E2D7] bg-[#FAF6F0] print:hidden">
                    <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#2F3931] text-sm sm:text-base">
                            {isPaid ? "Voucher Pencairan Honor Vendor" : "Tagihan & Pembayaran Vendor"}
                        </span>
                        {isPaid && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                Sudah Ditransfer
                            </span>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#657166] hover:bg-[#525C53] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Cetak Voucher</span>
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

                {/* Konten Dokumen */}
                <div className="overflow-y-auto p-6 sm:p-8 text-[#2F3931] font-sans print-modal-body print:p-0 print:overflow-visible print:w-full">
                    {isLoading ? (
                        <div className="py-16 text-center text-sm text-[#738075]">
                            Memuat data honorarium vendor...
                        </div>
                    ) : error ? (
                        <div className="py-10 text-center text-rose-700 text-sm">
                            Gagal memuat rincian invoice vendor.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-5">
                            
                            {/* KOP RESMI VOUCHER */}
                            <div className="flex justify-between items-start pb-4 border-b border-[#E8E2D7]">
                                <div>
                                    <h2 className="text-lg font-black text-[#2F3931]">
                                        {invoiceData.company.name}
                                    </h2>
                                    <p className="text-xs text-[#738075]">Penyaluran Honorarium Mitra Vendor</p>
                                    <p className="text-[11px] text-[#738075] mt-1 font-mono">
                                        No. Dokumen: {invoiceData.payout_receipt_number || invoiceData.vendor_invoice_number}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="inline-block">
                                        {isPaid ? (
                                            <span className="text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-300 text-emerald-950 bg-emerald-100 inline-block">
                                                LUNAS DITRANSFER
                                            </span>
                                        ) : (
                                            <span className="text-[11px] font-bold px-3 py-1 rounded-full border border-amber-300 text-amber-950 bg-amber-100 inline-block">
                                                MENUNGGU PENCAIRAN
                                            </span>
                                        )}
                                    </div>
                                    {invoiceData.payout_date && (
                                        <p className="text-[11px] text-[#738075] mt-1">
                                            Tanggal: {invoiceData.payout_date}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* DETAIL VENDOR & REKENING PENERIMA */}
                            <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#E8E2D7] grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#738075] block">
                                        Penerima Honor (Mitra Vendor):
                                    </span>
                                    <p className="text-sm font-extrabold text-[#2F3931] mt-0.5">
                                        {invoiceData.vendor.business_name}
                                    </p>
                                    <p className="text-xs text-[#556056]">Kategori: {invoiceData.vendor.category}</p>
                                    <p className="text-xs text-[#556056]">Kontak: {invoiceData.vendor.contact_number}</p>
                                </div>

                                <div className="bg-white p-3 rounded-xl border border-[#E8E2D7]">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#657166] block flex items-center gap-1">
                                        <Building className="w-3 h-3" /> Rekening Tujuan Pencairan:
                                    </span>
                                    <p className="font-extrabold text-sm text-[#2F3931] mt-1">
                                        {invoiceData.vendor.bank_name}
                                    </p>
                                    <p className="font-mono text-sm font-bold text-[#1D4A54]">
                                        {invoiceData.vendor.bank_account_number}
                                    </p>
                                    <p className="text-[11px] text-[#738075]">
                                        a.n. {invoiceData.vendor.bank_account_holder}
                                    </p>
                                </div>
                            </div>

                            {/* RINCIAN PEKERJAAN ACARA */}
                            <div className="border border-[#E8E2D7] rounded-xl overflow-hidden text-xs">
                                <div className="bg-[#FAF6F0] px-4 py-2.5 font-bold border-b border-[#E8E2D7] text-[#556056]">
                                    Pekerjaan Acara Terkait
                                </div>
                                <div className="p-4 space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-[#738075]">Nama Acara:</span>
                                        <span className="font-bold text-[#2F3931]">{invoiceData.event.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#738075]">Tanggal Pelaksanaan:</span>
                                        <span className="text-[#2F3931]">{invoiceData.event.date}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#738075]">Paket Dipesan:</span>
                                        <span className="font-medium text-[#2F3931]">{invoiceData.assignment.package_name}</span>
                                    </div>
                                    <div className="pt-2 border-t border-[#E8E2D7] flex justify-between items-baseline">
                                        <span className="font-bold text-[#2F3931]">Total Honorarium Disepakati:</span>
                                        <strong className="text-base font-black text-[#1D4A54]">
                                            {formatRupiah(invoiceData.assignment.locked_price)}
                                        </strong>
                                    </div>
                                </div>
                            </div>

                            {/* JIKA SUDAH LUNAS: BUKTI BAYAR & CATATAN */}
                            {isPaid && (
                                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-xs space-y-2">
                                    <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                                        <ShieldCheck className="w-4 h-4 text-emerald-700" />
                                        <span>Bukti Penyaluran Dana EO ke Vendor Sah</span>
                                    </div>
                                    <p className="text-[11px] text-[#556056]">
                                        Nominal Dicairkan: <strong className="text-[#2F3931]">{formatRupiah(invoiceData.assignment.payout_nominal)}</strong>
                                    </p>
                                    {invoiceData.assignment.payout_note && (
                                        <p className="text-[11px] text-[#556056]">
                                            Catatan: {invoiceData.assignment.payout_note}
                                        </p>
                                    )}
                                    {invoiceData.assignment.payout_proof_url && (
                                        <div className="mt-2">
                                            <a
                                                href={invoiceData.assignment.payout_proof_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs font-bold text-[#1D4A54] hover:underline inline-flex items-center gap-1"
                                            >
                                                Lihat Gambar Bukti Transfer Bank &rarr;
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* FORM DISBURSEMENT KHUSUS EO (Bila belum lunas) */}
                            {isEo && !isPaid && (
                                <form onSubmit={handleDisburse} className="mt-2 p-5 bg-[#FAF6F0] rounded-2xl border border-[#E8E2D7] space-y-3.5 print:hidden">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-[#2F3931]">
                                        Form Pencairan Uang ke Vendor (EO Action)
                                    </h4>

                                    {errorMessage && (
                                        <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
                                            {errorMessage}
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-[11px] font-bold text-[#556056] block mb-1">
                                            Nominal Ditransfer (Rp):
                                        </label>
                                        <input
                                            type="number"
                                            defaultValue={invoiceData.assignment.locked_price}
                                            onChange={(e) => setNominal(e.target.value)}
                                            className="w-full text-xs font-bold px-3 py-2 bg-white rounded-xl border border-[#E8E2D7] focus:outline-hidden focus:ring-1 focus:ring-[#657166]"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-bold text-[#556056] block mb-1">
                                            Catatan / Nomor Referensi Transfer:
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Contoh: Transfer m-BCA Ref: 9812498"
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-[#E8E2D7] focus:outline-hidden focus:ring-1 focus:ring-[#657166]"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-bold text-[#556056] block mb-1">
                                            Unggah Struk Bukti Transfer (Opsional):
                                        </label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setProofFile(e.target.files[0])}
                                            className="w-full text-xs text-[#738075]"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-2.5 bg-[#657166] hover:bg-[#525C53] text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                                    >
                                        {isSubmitting ? "Menyimpan Pencairan..." : "Tandai Honor Vendor LUNAS Ditransfer"}
                                    </button>
                                </form>
                            )}

                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
