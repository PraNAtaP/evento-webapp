import { useState } from "react";
import KanbanCard from "./KanbanCard";

// Warna teks counter mengikuti warna solid judul kolom (class ditulis penuh agar terdeteksi Tailwind)
const COUNTER_TEXT_COLORS = {
    "bg-amber-500": "text-amber-500",
    "bg-blue-500": "text-blue-500",
    "bg-purple-500": "text-purple-500",
    "bg-emerald-500": "text-emerald-500",
};

export default function KanbanColumn({ column, cards = [], onMoveCard }) {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e) => {
        // preventDefault wajib agar elemen ini menjadi drop target yang valid
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (!isDragOver) {
            setIsDragOver(true);
        }
    };

    const handleDragLeave = (e) => {
        // Abaikan event leave saat pointer hanya pindah ke elemen anak
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsDragOver(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const cardId = e.dataTransfer.getData("text/plain");
        if (cardId && onMoveCard) {
            onMoveCard(cardId, column.id);
        }
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col w-80 min-w-[320px] max-w-[360px] shrink-0 rounded-2xl p-3.5 border shadow-xs transition-colors ${
                isDragOver
                    ? "bg-blue-50 border-blue-400 ring-2 ring-blue-300"
                    : "bg-slate-100/80 border-slate-200/90"
            }`}
        >
            {/* Header Kolom */}
            <div className="pb-3 border-b border-slate-200/70 mb-3">
                <div className="flex items-center justify-between gap-2">
                    <h3
                        className={`font-normal text-sm tracking-tight px-3 py-1 rounded-md text-white ${column.dotColor || "bg-slate-500"}`}
                    >
                        {column.title}
                    </h3>

                    {/* Counter Badge */}
                    <span
                        className={`text-sm font-semibold ${COUNTER_TEXT_COLORS[column.dotColor] || "text-slate-500"}`}
                    >
                        {cards.length}
                    </span>
                </div>
            </div>

            {/* List Kartu */}
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-270px)] pr-0.5">
                {cards.length > 0 ? (
                    cards.map((card) => <KanbanCard key={card.id} card={card} />)
                ) : (
                    <div className="py-8 px-4 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white/40">
                        <svg
                            width="32"
                            height="32"
                            style={{ minWidth: 32, minHeight: 32 }}
                            className="w-8 h-8 text-slate-300 mx-auto mb-1.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                        </svg>
                        <p className="text-xs text-slate-400 font-medium">
                            Tidak ada acara di tahap ini
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
