import { useState } from 'react';
import { Eye, EyeOff, Calendar, User, Maximize2, X, Image as ImageIcon } from 'lucide-react';
import { useDialog } from '../../context/DialogContext';

export default function ProgressCard({ log, onToggle }) {
    const { showConfirm } = useDialog();
    const [busy, setBusy] = useState(false);
    const [isImageOpen, setIsImageOpen] = useState(false);

    const eventName = log.assignment?.event?.event_name ?? 'Acara Tanpa Nama';
    const vendorName = log.assignment?.vendor?.business_name ?? 'Vendor Mitra';
    const isVisible = Boolean(log.is_visible_to_client);

    const handleActionClick = async () => {
        const confirmed = await showConfirm({
            title: isVisible ? "Sembunyikan Progres?" : "Bagikan Progres ke Klien?",
            message: isVisible
                ? "Progres ini akan disembunyikan dan tidak lagi dapat dilihat oleh klien di halaman tracking acara."
                : "Progres dan foto dokumentasi ini akan dibagikan sehingga dapat dilihat oleh klien di timeline acara.",
            confirmText: isVisible ? "Ya, Sembunyikan" : "Ya, Bagikan ke Klien",
            cancelText: "Batal",
            isDanger: isVisible,
        });

        if (!confirmed) {
            return;
        }

        setBusy(true);
        try {
            await onToggle(log.id, !isVisible);
        } finally {
            setBusy(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        return isNaN(d.getTime())
            ? "-"
            : d.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
              });
    };

    return (
        <div className="bg-white rounded-2xl border border-[#E8E2D7] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
                {/* Header Card: Vendor & Event Name + Visibility Status */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-[#E8E2D7]">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#CFD8C4]/60 text-[#2D3A28] border border-[#B6C2AA]">
                                <User className="w-3 h-3 text-[#2D3A28]" />
                                <span>{vendorName}</span>
                            </span>
                        </div>
                        <h3 className="font-extrabold text-base text-[#2F3931] tracking-tight truncate">
                            {eventName}
                        </h3>
                    </div>

                    <div className="shrink-0">
                        {isVisible ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#DAEBE3] text-[#224436] border border-[#BCD4C9] shadow-2xs">
                                <Eye className="w-3.5 h-3.5" />
                                <span>Terlihat Klien</span>
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#FAF6F0] text-[#738075] border border-[#E8E2D7]">
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>Internal EO</span>
                            </span>
                        )}
                    </div>
                </div>

                {/* Catatan / Keterangan Progres */}
                <div className="mt-3.5 bg-[#FAF6F0]/70 rounded-xl p-3.5 border border-[#E8E2D7]/80">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#738075] mb-1">
                        Catatan Pekerjaan Vendor:
                    </p>
                    <p className="text-xs text-[#2F3931] leading-relaxed whitespace-pre-line font-medium">
                        {log.note || "Tidak ada catatan deskripsi yang disertakan."}
                    </p>
                </div>

                {/* Foto Dokumentasi Pekerjaan */}
                {log.photo_url && (
                    <div className="mt-3.5">
                        <div className="relative group rounded-xl overflow-hidden border border-[#E8E2D7] bg-[#FAF6F0] max-w-sm">
                            <img
                                src={log.photo_url}
                                alt={`Dokumentasi ${eventName}`}
                                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <button
                                type="button"
                                onClick={() => setIsImageOpen(true)}
                                className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold cursor-pointer backdrop-blur-[2px]"
                            >
                                <Maximize2 className="w-4 h-4" />
                                <span>Perbesar Foto</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Card: Waktu Submit & Tombol Aksi EO */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3.5 border-t border-[#E8E2D7]/80">
                <span className="text-[11px] font-medium text-[#738075] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Diperbarui: {formatDate(log.created_at)}</span>
                </span>

                <button
                    type="button"
                    onClick={handleActionClick}
                    disabled={busy}
                    className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 ${
                        isVisible
                            ? 'bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-rose-200'
                            : 'bg-[#657166] hover:bg-[#556056] text-white border border-[#525C53]'
                    }`}
                >
                    {busy ? (
                        <>
                            <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            <span>Memproses...</span>
                        </>
                    ) : isVisible ? (
                        <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Sembunyikan dari Klien</span>
                        </>
                    ) : (
                        <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Bagikan ke Klien</span>
                        </>
                    )}
                </button>
            </div>

            {/* Lightbox Modal Foto */}
            {isImageOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn"
                    onClick={() => setIsImageOpen(false)}
                >
                    <div
                        className="relative max-w-3xl w-full bg-white rounded-3xl overflow-hidden border border-white/20 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-[#E8E2D7] bg-[#FAF6F0]">
                            <div>
                                <h4 className="font-extrabold text-sm text-[#2F3931]">
                                    Dokumentasi: {eventName}
                                </h4>
                                <p className="text-[11px] text-[#738075]">
                                    Diunggah oleh {vendorName}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsImageOpen(false)}
                                className="w-8 h-8 rounded-full bg-white border border-[#E8E2D7] text-[#738075] hover:text-[#2F3931] flex items-center justify-center transition cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-4 bg-slate-900 flex items-center justify-center max-h-[75vh]">
                            <img
                                src={log.photo_url}
                                alt="Foto Full"
                                className="max-w-full max-h-[70vh] object-contain rounded-xl"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}