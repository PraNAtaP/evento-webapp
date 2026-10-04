    import { useState } from 'react';
    import api from '../../api/axios';

    export default function UploadProofForm({ payment, onClose, onSuccess }) {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        setFile(selected);
        setError('');

        if (selected && selected.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => setPreview(ev.target.result);
        reader.readAsDataURL(selected);
        } else {
        setPreview(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
        setError('Pilih file bukti transfer dulu.');
        return;
        }

        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('payment_proof', file);

        try {
        const res = await api.post(`/payments/${payment.id}/proof`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        onSuccess(res.data.payment);
        onClose();
        } catch (err) {
        const msg =
            err.response?.data?.message ||
            err.response?.data?.errors?.payment_proof?.[0] ||
            'Gagal mengunggah bukti transfer.';
        setError(msg);
        } finally {
        setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-md p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">Unggah Bukti Transfer</h2>

            <form onSubmit={handleSubmit}>
            <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="block w-full text-sm border rounded-md p-2"
            />

            {preview && (
                <img
                src={preview}
                alt="Preview"
                className="mt-3 max-h-48 rounded-md mx-auto"
                />
            )}

            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

            <div className="flex justify-end gap-2 mt-4">
                <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md text-sm border"
                disabled={loading}
                >
                Batal
                </button>
                <button
                type="submit"
                className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
                disabled={loading}
                >
                {loading ? 'Mengunggah...' : 'Unggah'}
                </button>
            </div>
            </form>
        </div>
        </div>
    );
    }