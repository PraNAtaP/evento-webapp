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
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E8E2D7] flex flex-col gap-4">
            <div>
            <h3 className="text-base font-bold text-[#2F3931]">
                Minta Revisi Penawaran
            </h3>
            <p className="text-xs text-[#738075] mt-1">
                Berikan catatan kepada tim EO terkait perubahan atau penyesuaian yang Anda inginkan pada acara <strong>{event.event_name}</strong>.
            </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Contoh: Mohon kurangi jumlah katering atau ganti konsep dekorasi..."
                rows={4}
                className="w-full text-xs p-3 bg-[#FAF6F0] border border-[#E8E2D7] text-[#2F3931] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#657166]/20 focus:border-[#657166]"
            />

            {error && <p className="text-xs text-rose-600">{error}</p>}

            <div className="flex items-center justify-end gap-2.5">
                <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[#738075] hover:bg-[#FAF6F0] rounded-xl transition-colors cursor-pointer border border-[#E8E2D7]"
                >
                Batal
                </button>

                <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-xs font-bold text-white bg-[#657166] hover:bg-[#556056] rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50 border border-[#525C53]"
                >
                {loading ? 'Mengirim...' : 'Kirim Permintaan Revisi'}
                </button>
            </div>
            </form>
        </div>
        </div>
    );
    }