import { useState } from 'react';
import api from '../../api/axios';

    export default function EventOfferCard({ event, onRevision, onSuccess }) {
    const [isApproving, setIsApproving] = useState(false);

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

    const totalHarga = event.vendor_assignments?.reduce(
        (sum, a) => sum + parseFloat(a.locked_price || 0),
        0
    );

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
            'Gagal menyetujui penawaran.';
        alert('Gagal: ' + msg);
        } finally {
        setIsApproving(false);
        }
    };

    return (
        <div className="border rounded-md p-5 mb-4 bg-white shadow-sm">
        {/* Header Event */}
        <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-100">
            <div>
            <h2 className="text-lg font-semibold text-slate-900">
                {event.event_name}
            </h2>
            <p className="text-sm text-slate-500">
                Tanggal acara: {formatTanggal(event.event_date)}
            </p>
            </div>
            <span className="px-3 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-700">
            Menunggu Persetujuan
            </span>
        </div>

        {/* Daftar Vendor */}
        <div className="space-y-3 mb-4">
            <p className="text-xs uppercase font-bold tracking-wider text-slate-400">
            Vendor yang Ditawarkan
            </p>

            {event.vendor_assignments?.length === 0 ? (
            <p className="text-sm text-slate-500 italic">
                Belum ada vendor yang ditawarkan.
            </p>
            ) : (
            event.vendor_assignments?.map((assignment) => (
                <div
                key={assignment.id}
                className="flex justify-between items-center p-3 bg-slate-50 rounded-md"
                >
                <div>
                    <p className="font-medium text-slate-900">
                    {assignment.vendor?.business_name || 'Vendor'}
                    </p>
                    <p className="text-xs text-slate-500">
                    {assignment.vendor?.category || '-'} &middot;{' '}
                    {assignment.package?.package_name || 'Paket'}
                    </p>
                </div>
                <p className="font-semibold text-slate-900">
                    {rupiah(assignment.locked_price)}
                </p>
                </div>
            ))
            )}
        </div>

        {/* Total */}
        {event.vendor_assignments?.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 mb-4 flex justify-between items-center">
            <span className="text-sm font-medium text-emerald-900">
                Total Penawaran
            </span>
            <span className="text-lg font-bold text-emerald-700">
                {rupiah(totalHarga)}
            </span>
            </div>
        )}
        {/* Estimasi DP */}
{event.vendor_assignments?.length > 0 && (
    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4 text-xs text-blue-800">
        <strong>Estimasi DP:</strong> 30% ({rupiah(totalHarga * 0.3)}) — dibayarkan setelah persetujuan.
    </div>
)}

        {/* Tombol Aksi */}
        <div className="flex gap-2">
            <button
            onClick={handleApprove}
            disabled={isApproving || event.vendor_assignments?.length === 0}
            className="flex-1 bg-emerald-600 text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
            {isApproving ? 'Memproses...' : 'Setujui Penawaran'}
            </button>
            <button
            onClick={() => onRevision(event)}
            disabled={isApproving}
            className="flex-1 bg-white border border-red-300 text-red-600 px-4 py-2.5 rounded-md text-sm font-medium hover:bg-red-50 disabled:opacity-50 cursor-pointer"
            >
            Minta Revisi
            </button>
        </div>
        </div>
    );
}