import { useState } from 'react';

export default function ProgressCard({ log, onToggle }) {
    const [busy, setBusy] = useState(false);
    const eventName = log.assignment?.event?.event_name ?? '-';
    const vendorName = log.assignment?.vendor?.business_name ?? '-';
    const isVisible = !!log.is_visible_to_client;

    async function handleClick() {
        if (!window.confirm(isVisible ? 'Sembunyikan dari Klien?' : 'Bagikan ke Klien?')) return;
        setBusy(true);
        await onToggle(log.id, !isVisible);
        setBusy(false);
    }

    return (
        <div className="border rounded-lg p-4 bg-white shadow-sm mb-4">
            <div className="flex justify-between items-start gap-4">
                <div>
                    <p className="font-semibold text-slate-900">{eventName}</p>
                    <p className="text-sm text-slate-600">Vendor: {vendorName}</p>
                </div>
                <span className={`px-3 py-1 rounded-md text-xs font-medium ${isVisible ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {isVisible ? 'Terlihat Klien' : 'Tersembunyi'}
                </span>
            </div>
            {log.note && <p className="text-sm text-slate-700 mt-3">{log.note}</p>}
            {log.photo_url && <img src={log.photo_url} alt="Progress" className="h-40 mt-3 rounded-md border" />}
            
            <div className="flex justify-between items-center mt-4">
                <span className="text-xs text-slate-500">{new Date(log.created_at).toLocaleString('id-ID')}</span>
                <button
                    onClick={handleClick}
                    disabled={busy}
                    className={`px-4 py-2 rounded-md text-sm text-white ${isVisible ? 'bg-slate-700' : 'bg-blue-600'}`}
                >
                    {busy ? 'Memproses…' : (isVisible ? 'Sembunyikan' : 'Bagikan ke Klien')}
                </button>
            </div>
        </div>
    );
}