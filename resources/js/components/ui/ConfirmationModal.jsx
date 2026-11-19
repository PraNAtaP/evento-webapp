import { useEffect } from 'react';

export default function ConfirmationModal({
    isOpen,
    title = "Konfirmasi",
    message,
    onConfirm,
    onCancel,
    confirmText = "Ya, Lanjutkan",
    cancelText = "Batal",
    isDanger = false,
    isAlert = false,
    type = isDanger ? "danger" : "info",
}) {
    // Mencegah scroll di background saat modal terbuka & support keyboard ESC
    useEffect(() => {
        if (!isOpen) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (isAlert || !cancelText) {
                    if (onConfirm) onConfirm();
                } else {
                    if (onCancel) onCancel();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, isAlert, cancelText, onConfirm, onCancel]);

    if (!isOpen) return null;

    const resolvedType = isDanger ? 'danger' : type;
    const hideCancel = isAlert || cancelText === null;

    // Helper Ikon dan Styling berdasarkan Type
    const getThemeConfig = () => {
        switch (resolvedType) {
            case 'danger':
            case 'error':
                return {
                    iconBg: 'bg-rose-100 text-rose-600',
                    confirmBtn: 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-rose-500/30 text-white',
                    icon: (
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    ),
                };
            case 'warning':
                return {
                    iconBg: 'bg-amber-100 text-amber-600',
                    confirmBtn: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/30 text-white',
                    icon: (
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    ),
                };
            case 'success':
                return {
                    iconBg: 'bg-emerald-100 text-emerald-600',
                    confirmBtn: 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-emerald-600/30 text-white',
                    icon: (
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    ),
                };
            case 'info':
            default:
                return {
                    iconBg: 'bg-[#DAEBE3] text-[#224436]',
                    confirmBtn: 'bg-gradient-to-r from-[#657166] to-[#424C43] hover:from-[#424C43] hover:to-[#2F3931] shadow-[#657166]/30 text-white',
                    icon: (
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    ),
                };
        }
    };

    const theme = getThemeConfig();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop dengan efek Blur & Gelap */}
            <div
                className="absolute inset-0 bg-[#2F3931]/40 backdrop-blur-sm transition-opacity animate-fadeIn"
                onClick={hideCancel ? onConfirm : onCancel}
            ></div>

            {/* Kotak Modal */}
            <div className="relative bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl animate-scaleUp border border-[#E8E2D7] text-center">
                {/* Ikon Bulat */}
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-inner ${theme.iconBg}`}>
                    {theme.icon}
                </div>

                <h3 className="text-xl font-extrabold text-[#2F3931] mb-2">{title}</h3>
                <p className="text-sm text-[#657166] mb-8 leading-relaxed whitespace-pre-line">{message}</p>

                {/* Tombol Aksi */}
                <div className="flex gap-3 w-full">
                    {!hideCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-4 py-3 rounded-2xl text-sm font-bold text-[#657166] bg-[#FAF6F0] hover:bg-[#E8E2D7] border border-[#E8E2D7] transition-all active:scale-95 cursor-pointer"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`${hideCancel ? 'w-full' : 'flex-1'} px-4 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg active:scale-95 cursor-pointer ${theme.confirmBtn}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
