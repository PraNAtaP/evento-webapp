import { useState } from "react";
import KanbanCard from "./KanbanCard";

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
            style={{
                backgroundColor: isDragOver ? "#ffffff" : column.columnBg || "rgba(241, 245, 249, 0.8)",
                borderColor: isDragOver ? column.headerBg || "#3b82f6" : column.columnBorder || "#e2e8f0",
            }}
            className={`flex flex-col w-80 min-w-[320px] max-w-[360px] shrink-0 rounded-2xl p-3.5 border shadow-xs transition-all duration-200 ${
                isDragOver
                    ? "ring-2 ring-offset-1 ring-slate-400/40 shadow-md"
                    : ""
            }`}
        >
            {/* Header Kolom */}
            <div className="pb-3 border-b border-[#E8E2D7] mb-3">
                <div className="flex items-center justify-between gap-2">
                    <h3
                        style={{
                            backgroundColor: column.headerBg || column.color || "#64748b",
                            color: column.headerText || "#ffffff",
                        }}
                        className="font-bold text-xs tracking-tight px-3 py-1 rounded-lg shadow-2xs"
                    >
                        {column.title}
                    </h3>

                    {/* Counter Badge */}
                    <span
                        style={{
                            color: column.counterColor || "#475569",
                        }}
                        className="text-sm font-extrabold px-1"
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
