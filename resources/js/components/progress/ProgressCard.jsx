import { useState } from 'react';
import ConfirmationModal from '../ui/ConfirmationModal'; // Tambah import modal

export default function ProgressCard({ log, onToggle }) {
    const [busy, setBusy] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false); // State untuk buka/tutup modal

    const eventName = log.assignment?.event?.event_name ?? '-';
    const vendorName = log.assignment?.vendor?.business_name ?? '-';
    const isVisible = !!log.is_visible_to_client;

    // Fungsi ini dipanggil saat user klik "Ya, Lanjutkan" di modal
    async function handleConfirm() {
        setShowConfirm(false); // Tutup modal dulu
        setBusy(true);
        await onToggle(log.id, !isVisible);
        setBusy(false);
    }

    return (
        <div className="border border-[#E8E2D7] rounded-xl p-4 bg-white shadow-sm mb-4">
            <div className="flex justify-between items-start gap-4">
                <div>
                    <p className="font-bold text-[#2F3931] text-base">{eventName}</p>
                    <p className="text-sm text-[#738075] mt-1">Vendor: {vendorName}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${isVisible ? 'bg-[#CFD8C4] text-[#33422A] border-[#B6C2AA]' : 'bg-[#FAF6F0] text-[#738075] border-[#E8E2D7]'}`}>
                    {isVisible ? 'Terlihat Klien' : 'Tersembunyi'}
                </span>
            </div>
            
            {log.note && <p className="text-sm text-[#424C43] mt-3">{log.note}</p>}
            {log.photo_url && <img src={log.photo_url} alt="Progress" className="h-40 mt-3 rounded-lg border border-[#E8E2D7] object-cover" />}
            
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-[#E8E2D7]/70">
                <span className="text-xs text-[#738075]">{new Date(log.created_at).toLocaleString('id-ID')}</span>
                <button
                    onClick={() => setShowConfirm(true)} // Klik tombol = buka modal, bukan window.confirm
                    disabled={busy}
                    className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors ${isVisible ? 'bg-[#657166] hover:bg-[#424C43]' : 'bg-[#99CDD8] hover:bg-[#89BDC8] text-[#1F4B54]'}`}
                >
                    {busy ? 'Memproses…' : (isVisible ? 'Sembunyikan' : 'Bagikan ke Klien')}
                </button>
            </div>

            {/* Panggil Template Modal yang baru kita buat */}
            <ConfirmationModal 
                isOpen={showConfirm}
                title={isVisible ? "Sembunyikan Progress?" : "Bagikan Progress?"}
                message={isVisible ? 'Progress ini tidak akan bisa dilihat lagi oleh Klien.' : 'Progress ini akan dibagikan dan bisa dilihat oleh Klien.'}
                isDanger={isVisible} // Kalau menyembunyikan, warna tombol/ikon jadi merah (warning)
                confirmText={isVisible ? "Ya, Sembunyikan" : "Ya, Bagikan"}
                onConfirm={handleConfirm}
                onCancel={() => setShowConfirm(false)}
            />
        </div>
    );
}