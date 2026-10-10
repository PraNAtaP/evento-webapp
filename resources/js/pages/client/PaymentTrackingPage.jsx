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

    if (isLoading) return <p className="p-6">Memuat data pembayaran...</p>;
    if (error) return <p className="p-6 text-red-600">Gagal memuat data.</p>;

    return (
        <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-6">Rincian Pembayaran</h1>

        {data?.length === 0 && (
            <p className="text-slate-500">Belum ada pembayaran.</p>
        )}

        {data?.map((payment) => (
            <PaymentCard
            key={payment.id}
            payment={payment}
            role="client"
            onUpload={setUploadingPayment}
            />
        ))}

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