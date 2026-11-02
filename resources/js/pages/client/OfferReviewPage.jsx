    import { useState } from 'react';
    import { useQuery, useQueryClient } from '@tanstack/react-query';
    import { useNavigate } from 'react-router-dom';
    import api from '../../api/axios';
    import EventOfferCard from '../../components/offer/EventOfferCard';
    import RevisionModal from '../../components/offer/RevisionModal';

    export default function OfferReviewPage() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [revisionEvent, setRevisionEvent] = useState(null);

    const { data, isLoading, error } = useQuery({
        queryKey: ['client-events'],
        queryFn: async () => {
        const res = await api.get('/client/events');
        return res.data.events;
        },
    });

    const handleSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['client-events'] });
    };

    if (isLoading) return <p className="p-6">Memuat data penawaran...</p>;
    if (error) return <p className="p-6 text-red-600">Gagal memuat data.</p>;

    const reviewEvents = data?.filter((e) => e.kanban_status === 'client_review') || [];

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 flex flex-col gap-6">
        <div>
            <h1 className="text-2xl font-bold text-[#2F3931] tracking-tight">
                Review Penawaran Paket Acara
            </h1>
            <p className="text-xs text-[#738075] mt-1">
                Tinjau rincian penawaran yang telah disusun dan dikurasi oleh tim Event Organizer.
            </p>
        </div>

        {reviewEvents.length === 0 ? (
            <div className="bg-white border border-[#E8E2D7] rounded-2xl p-8 text-center shadow-xs">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF6F0] text-[#657166] flex items-center justify-center font-bold text-xl mb-3 border border-[#E8E2D7]">
                    📋
                </div>
                <h3 className="text-sm font-bold text-[#2F3931]">
                    Tidak Ada Penawaran Menunggu Review
                </h3>
                <p className="text-xs text-[#738075] mt-1">
                    Semua penawaran acara Anda saat ini sudah diproses atau belum diterbitkan oleh EO.
                </p>
            </div>
        ) : (
            reviewEvents.map((event) => (
            <EventOfferCard
                key={event.id}
                event={event}
                onRevision={setRevisionEvent}
                onSuccess={handleSuccess}
            />
            ))
        )}

        {revisionEvent && (
            <RevisionModal
            event={revisionEvent}
            onClose={() => setRevisionEvent(null)}
            onSuccess={handleSuccess}
            />
        )}

        <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#738075] hover:text-[#2F3931] transition-colors cursor-pointer self-start"
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