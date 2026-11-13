import { useState, useEffect } from 'react';

export default function RejectionModal({ isOpen, onConfirm, onCancel }) {
    const [note, setNote] = useState('');
    const [showError, setShowError] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setNote('');
            setShowError(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const MIN_CHARS = 10;
    const isValid = note.trim().length >= MIN_CHARS;

    const handleConfirmClick = () => {
        if (!isValid) {
            setShowError(true);
            return;
        }
        onConfirm(note);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Background Backdrop */}
            <div 
                className="absolute inset-0 bg-[#2F3931]/40 backdrop-blur-sm animate-fadeIn" 
                onClick={onCancel}
            ></div>

            {/* Kotak Modal */}
            <div className="relative bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-scaleUp border border-[#E8E2D7]">
                <h3 className="text-xl font-extrabold text-[#2F3931] mb-2">Tolak Pembayaran</h3>
                <p className="text-sm text-[#657166] mb-4">
                    Berikan alasan mengapa bukti transfer ini ditolak agar Klien bisa memperbaikinya.
                </p>
                
                {/* Input Textarea */}
                <textarea 
                    value={note}
                    onChange={(e) => {
                        setNote(e.target.value);
                        if (e.target.value.trim().length >= MIN_CHARS) setShowError(false);
                    }}
                    placeholder="Contoh: Nominal transfer tidak sesuai dengan tagihan DP..."
                    className={`w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 mb-1 min-h-[100px] transition-colors ${
                        showError 
                        ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-400' 
                        : 'border-[#E8E2D7] focus:border-[#99CDD8] focus:ring-[#99CDD8]'
                    }`}
                />
                
                {/* Pesan Error / Counter Karakter */}
                {showError ? (
                    <p className="text-xs text-rose-600 font-semibold mb-4 animate-fadeIn">
                        ⚠️ Alasan penolakan wajib diisi minimal {MIN_CHARS} karakter.
                    </p>
                ) : (
                    <p className={`text-[11px] mb-4 text-right ${note.length > 0 && note.length < MIN_CHARS ? 'text-amber-600' : 'text-[#738075]'}`}>
                        {note.trim().length} / {MIN_CHARS} karakter minimal
                    </p>
                )}

                {/* Tombol Aksi */}
                <div className="flex gap-3 mt-2">
                    <button 
                        onClick={onCancel} 
                        className="flex-1 px-4 py-3 rounded-2xl text-sm font-bold text-[#657166] bg-[#FAF6F0] hover:bg-[#E8E2D7] border border-[#E8E2D7] transition-all duration-200 shadow-sm hover:shadow-md active:scale-90 active:shadow-none cursor-pointer"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={handleConfirmClick} 
                        className={`flex-1 px-4 py-3 rounded-2xl text-sm font-bold text-white transition-all duration-200 cursor-pointer ${
                            isValid 
                            ? "bg-gradient-to-b from-rose-500 to-rose-600 shadow-[0_5px_15px_-3px_rgba(225,29,72,0.4)] hover:shadow-[0_8px_20px_-3px_rgba(225,29,72,0.6)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none active:scale-95" 
                            : "bg-rose-300 shadow-none"
                        }`}
                    >
                        Tolak Pembayaran
                    </button>
                </div>
            </div>
        </div>
    );
}