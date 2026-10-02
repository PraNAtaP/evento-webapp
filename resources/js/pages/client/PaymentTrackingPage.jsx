    import { useState } from 'react';
    import { useQuery, useQueryClient } from '@tanstack/react-query';
    import api from '../../api/axios';
    import PaymentCard from '../../components/payment/PaymentCard';
    import UploadProofForm from '../../components/payment/UploadProofForm';

    export default function PaymentTrackingPage() {
    const queryClient = useQueryClient();
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
        </div>
    );
    }