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

    if (isLoading) return <p className="p-6">Memuat data pembayaran...</p>;
    if (error) return <p className="p-6 text-red-600">Gagal memuat data.</p>;

    const pending = data?.filter((p) => p.status === 'pending_verification') || [];

    return (
        <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-6">Verifikasi Pembayaran</h1>

        {pending.length === 0 ? (
            <p className="text-slate-500">
            Tidak ada pembayaran yang menunggu verifikasi.
            </p>
        ) : (
            pending.map((payment) => (
            <PaymentCard
                key={payment.id}
                payment={payment}
                role="eo"
                onVerify={handleVerify}
            />
            ))
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