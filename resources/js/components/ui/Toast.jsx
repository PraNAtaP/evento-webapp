import { useEffect } from 'react';

export default function Toast({ type = "success", message, onClose, duration = 3000 }) {
    // Auto close setelah beberapa detik
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => { onClose(); }, duration);
            return () => clearTimeout(timer);
        }
    }, [message, duration, onClose]);

    if (!message) return null;
    const isSuccess = type === "success";

    return (
        <div className={`fixed top-6 right-6 z-[60] px-5 py-4 rounded-2xl shadow-2xl border flex items-center gap-4 animate-slideInRight min-w-[280px] ${
            isSuccess 
            ? "bg-white border-l-4 border-l-green-500 text-[#2F3931]" 
            : "bg-white border-l-4 border-l-rose-500 text-[#2F3931]"
        }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                isSuccess ? 'bg-green-100 text-green-600' : 'bg-rose-100 text-rose-600'
            }`}>
                {isSuccess ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                )}
            </div>
            <div className="flex-1">
                <p className="text-sm font-bold">{isSuccess ? 'Berhasil!' : 'Gagal!'}</p>
                <p className="text-xs text-[#738075] mt-0.5">{message}</p>
            </div>
            <button onClick={onClose} className="text-[#738075] hover:text-[#2F3931] transition-colors p-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
    );
}