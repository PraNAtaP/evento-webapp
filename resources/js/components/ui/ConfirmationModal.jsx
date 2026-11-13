import { useEffect } from 'react';

export default function ConfirmationModal({ 
    isOpen, 
    title = "Konfirmasi", 
    message, 
    onConfirm, 
    onCancel, 
    confirmText = "Ya, Lanjutkan", 
    cancelText = "Batal", 
    isDanger = false
}) {
    // Mencegah scroll di background saat modal terbuka
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop dengan efek Blur & Gelap */}
            <div 
                className="absolute inset-0 bg-[#2F3931]/40 backdrop-blur-sm transition-opacity animate-fadeIn"
                onClick={onCancel}
            ></div>

            {/* Kotak Modal */}
            <div className="relative bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl animate-scaleUp border border-[#E8E2D7]">
                {/* Ikon Bulat Berbasis SVG */}
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-inner ${
                    isDanger ? 'bg-rose-100 text-rose-600' : 'bg-[#FDE8D3] text-[#D97706]' 
                }`}>
                    {isDanger ? (
                        // Ikon Peringatan/Alert
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    ) : (
                        // Ikon Tanya/Info
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                </div>

                <h3 className="text-xl font-extrabold text-center text-[#2F3931] mb-2">{title}</h3>
                <p className="text-sm text-center text-[#657166] mb-8 leading-relaxed">{message}</p>
                
                {/* Tombol Aksi */}
                <div className="flex gap-3 w-full">
                    <button 
                        onClick={onCancel} 
                        className="flex-1 px-4 py-3 rounded-2xl text-sm font-bold text-[#657166] bg-[#FAF6F0] hover:bg-[#E8E2D7] border border-[#E8E2D7] transition-all active:scale-95"
                    >
                        {cancelText}
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className={`flex-1 px-4 py-3 rounded-2xl text-sm font-bold text-white transition-all shadow-lg active:scale-95 ${
                            isDanger 
                            ? "bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-rose-500/30" 
                            : "bg-gradient-to-r from-[#657166] to-[#424C43] hover:from-[#424C43] hover:to-[#2F3931] shadow-[#657166]/30"
                        }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}