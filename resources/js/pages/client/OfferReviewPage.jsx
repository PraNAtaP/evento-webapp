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
        <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-6">Review Penawaran Vendor</h1>

        {reviewEvents.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-md p-6 text-center">
            <p className="text-slate-500">
                Tidak ada penawaran yang menunggu review Anda saat ini.
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