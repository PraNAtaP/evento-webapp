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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-[#E8E2D7] shadow-xl text-[#2F3931]">
                <h2 className="text-lg font-extrabold text-[#2F3931] mb-1">Unggah Bukti Transfer</h2>
                <p className="text-xs text-[#738075] mb-4">Pastikan gambar bukti transfer struk / m-banking terbaca jelas.</p>

                <form onSubmit={handleSubmit}>
                    <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="block w-full text-xs border border-[#E8E2D7] bg-[#FAF6F0]/50 rounded-xl p-2.5 text-[#2F3931] file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#DAEBE3] file:text-[#2C483D] cursor-pointer"
                    />

                    {preview && (
                        <img
                            src={preview}
                            alt="Preview Bukti Transfer"
                            className="mt-3 max-h-48 rounded-xl mx-auto border border-[#E8E2D7] shadow-2xs object-contain"
                        />
                    )}

                    {error && (
                        <div className="mt-3 p-2.5 bg-[#F3C3B2]/30 border border-[#F3C3B2] text-[#6B3222] rounded-xl text-xs font-medium">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-[#F0ECE1]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#E8E2D7] text-[#738075] hover:bg-[#FAF6F0] transition cursor-pointer"
                            disabled={loading}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="bg-[#657166] hover:bg-[#556056] text-white px-5 py-2 rounded-xl text-xs font-bold border border-[#525C53] disabled:opacity-50 shadow-xs transition cursor-pointer"
                            disabled={loading}
                        >
                            {loading ? 'Mengunggah...' : 'Unggah Bukti'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}