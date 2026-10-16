    import { useState } from 'react';
    import api from '../../api/axios';

    export default function RevisionModal({ event, onClose, onSuccess }) {
    const [note, setNote] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!note.trim()) {
        setError('Catatan revisi wajib diisi.');
        return;
        }

        setLoading(true);
        setError('');

        try {
        const res = await api.post(
            `/client/events/${event.id}/request-revision`,
            { note }
        );
        alert(res.data.message);
        onSuccess();
        onClose();
        } catch (err) {
        const msg =
            err.response?.data?.message ||
            err.response?.data?.errors?.note?.[0] ||
            'Gagal mengirim permintaan revisi.';
        setError(msg);
        } finally {
        setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl flex flex-col gap-4">
            <div>
            <h3 className="text-base font-bold text-slate-900">
                Minta Revisi Penawaran
            </h3>
            <p className="text-xs text-slate-500 mt-1">
                Berikan catatan kepada tim EO terkait perubahan atau penyesuaian yang Anda inginkan pada acara <strong>{event.event_name}</strong>.
            </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Contoh: Mohon kurangi jumlah katering atau ganti konsep dekorasi..."
                rows={4}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />

            {error && <p className="text-xs text-red-600">{error}</p>}

            <div className="flex items-center justify-end gap-2.5">
                <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                Batal
                </button>

                <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                {loading ? 'Mengirim...' : 'Kirim Permintaan Revisi'}
                </button>
            </div>
            </form>
        </div>
        </div>
    );
    }