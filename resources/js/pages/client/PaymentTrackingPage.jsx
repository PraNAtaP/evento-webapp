import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
    import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import PaymentCard from '../../components/payment/PaymentCard';
import UploadProofForm from '../../components/payment/UploadProofForm';

export default function PaymentTrackingPage() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [uploadingPayment, setUploadingPayment] = useState(null);

    const { data, isLoading, error } = useQuery({
        queryKey: ['payments'],
        queryFn: async () => {
            const res = await api.get('/payments');
            return res.data.payments;
        },
    });

    const handleUploadSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['payments'] });
    };

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto p-4 md:p-6 text-center py-16">
                <div className="w-8 h-8 border-3 border-[#657166] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-xs text-[#738075]">Memuat data tagihan dan riwayat pembayaran...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto p-4 md:p-6">
                <div className="p-4 bg-[#F3C3B2]/30 border border-[#F3C3B2] text-[#6B3222] rounded-2xl text-xs font-semibold">
                    Gagal memuat data pembayaran. Pastikan Anda sudah masuk ke akun yang valid.
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
            {/* Header */}
            <div>
                <span className="inline-block text-[11px] font-bold text-[#5C3F22] bg-[#FDE8D3] px-3 py-0.5 rounded-full border border-[#E8CEB2] mb-1.5">
                    PEMBAYARAN & INVOICE
                </span>
                <h1 className="text-xl font-extrabold text-[#2F3931] tracking-tight">
                    Rincian Pembayaran Acara
                </h1>
                <p className="text-xs text-[#738075] mt-0.5">
                    Pantau status verifikasi uang muka (DP) dan unggah bukti transfer pelunasan acara Anda.
                </p>
            </div>

            {data?.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#E8E2D7] p-10 text-center shadow-xs">
                    <p className="text-sm font-semibold text-[#2F3931]">Belum ada tagihan pembayaran aktif.</p>
                    <p className="text-xs text-[#738075] mt-1">Tagihan DP akan otomatis muncul setelah pengajuan acara Anda dikonfirmasi oleh EO.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {data?.map((payment) => (
                        <PaymentCard
                            key={payment.id}
                            payment={payment}
                            role="client"
                            onUpload={setUploadingPayment}
                        />
                    ))}
                </div>
            )}

        {uploadingPayment && (
            <UploadProofForm
            payment={uploadingPayment}
            onClose={() => setUploadingPayment(null)}
            onSuccess={handleUploadSuccess}
            />
        )}

        {/* Tombol Kembali di bawah */}
        <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-blue-600 mt-6 transition-colors cursor-pointer"
        >
            <svg
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
            </svg>
            Kembali
        </button>
        </div>
    );
}