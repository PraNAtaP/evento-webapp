import { useState } from "react";
import { getPaymentStatus } from "../../data/kanbanData";

export default function KanbanCard({ card }) {
    // Normalisasi properti (mendukung properti baru maupun fallback)
    const eventName = card.namaEvent || card.title || "Acara Tanpa Judul";
    const clientName = card.namaKlien || card.clientName || "-";
    const category = card.kategori || card.category || "Umum";
    const eventDate = card.tanggalEvent || card.date || "-";
    const contractValue = Number(card.nilaiKontrak ?? card.budget) || 0;
    const paidValue = Number(card.jumlahDibayar) || 0;

    // Kalkulasi badge status pembayaran dari persentase
    const payment = getPaymentStatus(contractValue, paidValue, card.customStatus);

    const [isDragging, setIsDragging] = useState(false);

    const handleDragStart = (e) => {
        e.dataTransfer.setData("text/plain", String(card.id));
        e.dataTransfer.effectAllowed = "move";
        setIsDragging(true);
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onDragEnd={() => setIsDragging(false)}
            className={`bg-white rounded-xl p-4 shadow-xs border border-slate-200/80 hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col gap-2.5 cursor-grab active:cursor-grabbing group ${
                isDragging ? "opacity-50" : ""
            }`}
        >
            {/* Judul Acara */}
            <h4 className="text-sm font-bold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors">
                {eventName}
            </h4>

            {/* Kategori Acara */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <svg
                    width="14"
                    height="14"
                    style={{ minWidth: 14, minHeight: 14 }}
                    className="w-3.5 h-3.5 text-slate-400 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"
                    />
                </svg>
                <span className="truncate font-medium">{category}</span>
            </div>

            {/* Nama Klien */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <svg
                    width="14"
                    height="14"
                    style={{ minWidth: 14, minHeight: 14 }}
                    className="w-3.5 h-3.5 text-slate-400 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                </svg>
                <span className="truncate font-medium">{clientName}</span>
            </div>

            {/* Tanggal Event */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                <svg
                    width="14"
                    height="14"
                    style={{ minWidth: 14, minHeight: 14 }}
                    className="w-3.5 h-3.5 text-slate-400 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                </svg>
                <span>{eventDate}</span>
            </div>

            {/* Badge Status Pembayaran */}
            <div>
                <span
                    className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md border ${payment.badgeClass}`}
                >
                    {payment.label}
                </span>
            </div>

        </div>
    );
}
