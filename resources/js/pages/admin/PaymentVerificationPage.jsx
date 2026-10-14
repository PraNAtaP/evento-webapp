    import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
    import { useNavigate } from 'react-router-dom';
    import api from '../../api/axios';
    import PaymentCard from '../../components/payment/PaymentCard';

export default function PaymentVerificationPage() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { data, isLoading, error } = useQuery({
        queryKey: ['payments'],
        queryFn: async () => {
            const res = await api.get('/payments');
            return res.data.payments;
        },
    });

    const verifyMutation = useMutation({
        mutationFn: async ({ paymentId, action, rejectionNote }) => {
            const res = await api.patch(`/payments/${paymentId}/verify`, {
                action,
                rejection_note: rejectionNote,
            });
            return res.data;
        },
        onSuccess: (data) => {
            alert(data.message);
            queryClient.invalidateQueries({ queryKey: ['payments'] });
        },
        onError: (err) => {
            alert('Gagal: ' + (err.response?.data?.message || err.message));
        },
    });

    const handleVerify = (payment, action) => {
        let rejectionNote = null;

        if (action === 'reject') {
            rejectionNote = prompt('Alasan penolakan:');
            if (!rejectionNote) return;
        }

        verifyMutation.mutate({
            paymentId: payment.id,
            action,
            rejectionNote,
        });
    };

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto p-4 md:p-6 text-center py-16">
                <div className="w-8 h-8 border-3 border-[#657166] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-xs text-[#738075]">Memeriksa antrean pembayaran yang menunggu verifikasi...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto p-4 md:p-6">
                <div className="p-4 bg-[#F3C3B2]/30 border border-[#F3C3B2] text-[#6B3222] rounded-2xl text-xs font-semibold">
                    Gagal memuat antrean verifikasi pembayaran.
                </div>
            </div>
        );
    }

    const pending = data?.filter((p) => p.status === 'pending_verification') || [];

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
            {/* Header */}
            <div>
                <span className="inline-block text-[11px] font-bold text-[#1D4A54] bg-[#99CDD8]/40 px-3 py-0.5 rounded-full border border-[#85BAC5] mb-1.5">
                    MODUL EO & FINANCE
                </span>
                <h1 className="text-xl font-extrabold text-[#2F3931] tracking-tight">
                    Verifikasi Pembayaran Klien
                </h1>
                <p className="text-xs text-[#738075] mt-0.5">
                    Tinjau bukti struk transfer DP / pelunasan dari klien sebelum mengesahkan booking acara.
                </p>
            </div>

            {pending.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#E8E2D7] p-10 text-center shadow-xs">
                    <div className="w-12 h-12 bg-[#DAEBE3] rounded-2xl mx-auto mb-3 flex items-center justify-center text-[#2C483D] border border-[#BCD4C9]">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <p className="text-sm font-bold text-[#2F3931]">Semua Bukti Transfer Selesai Diverifikasi</p>
                    <p className="text-xs text-[#738075] mt-1">Saat ini tidak ada pembayaran tertunda yang memerlukan tindakan persetujuan Anda.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {pending.map((payment) => (
                        <PaymentCard
                            key={payment.id}
                            payment={payment}
                            role="eo"
                            onVerify={handleVerify}
                        />
                    ))}
                </div>
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