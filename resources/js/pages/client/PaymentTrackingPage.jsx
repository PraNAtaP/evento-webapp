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
    const [activeTab, setActiveTab] = useState('dp'); // 'dp' atau 'pelunasan'

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

    if (isLoading) return <p className="p-6 text-[#738075]">Memuat data pembayaran...</p>;
    if (error) return <p className="p-6 text-red-600">Gagal memuat data.</p>;

    // Filter data berdasarkan tab yang aktif
    const filteredPayments = data?.filter((p) => 
        p.payment_type === activeTab && 
        ['awaiting_dp', 'on_progress', 'done'].includes(p.event?.kanban_status)
    ) || [];

    return (
        <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-black text-[#2F3931] tracking-tight mb-2">
            Rincian Pembayaran
        </h1>
        <p className="text-sm text-[#738075] mb-6">
            Pantau status verifikasi dana muka (DP) dan unggah bukti transfer pelunasan acara Anda.
        </p>

        {/* TABS (Pemisah DP & Pelunasan) */}
        <div className="flex border-b border-[#E8E2D7] mb-6">
            <button
            onClick={() => setActiveTab('dp')}
            className={`pb-3 px-6 font-bold text-sm transition-colors relative cursor-pointer ${
                activeTab === 'dp' ? 'text-[#657166]' : 'text-[#A8B2A4] hover:text-[#738075]'
            }`}
            >
            Down Payment (DP)
            {activeTab === 'dp' && (
                <span className="absolute bottom-0 left-0 w-full h-1 bg-[#657166] rounded-t-md"></span>
            )}
            </button>
            <button
            onClick={() => setActiveTab('pelunasan')}
            className={`pb-3 px-6 font-bold text-sm transition-colors relative cursor-pointer ${
                activeTab === 'pelunasan' ? 'text-[#657166]' : 'text-[#A8B2A4] hover:text-[#738075]'
            }`}
            >
            Pelunasan
            {activeTab === 'pelunasan' && (
                <span className="absolute bottom-0 left-0 w-full h-1 bg-[#657166] rounded-t-md"></span>
            )}
            </button>
        </div>

        {/* Daftar Kartu */}
        <div className="flex flex-col gap-4">
            {filteredPayments.length === 0 ? (
            <div className="bg-[#F3F0EA] border border-[#E8E2D7] rounded-2xl p-8 text-center">
                <p className="text-[#738075]">Belum ada tagihan untuk kategori ini.</p>
            </div>
            ) : (
            filteredPayments.map((payment) => (
                <PaymentCard
                key={payment.id}
                payment={payment}
                role="client"
                onUpload={setUploadingPayment}
                />
            ))
            )}
        </div>

        {uploadingPayment && (
            <UploadProofForm
            payment={uploadingPayment}
            onClose={() => setUploadingPayment(null)}
            onSuccess={handleUploadSuccess}
            />
        )}

        {/* Tombol Kembali */}
        <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm text-[#738075] hover:text-[#2F3931] mt-8 transition-colors cursor-pointer font-medium"
        >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali
        </button>
        </div>
    );
    }