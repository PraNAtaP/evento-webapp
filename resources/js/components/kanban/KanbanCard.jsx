import { useState } from "react";
import {
    CATEGORY_LABELS,
    formatEventDate,
    formatRupiah,
    getPaymentStatus,
} from "../../data/kanbanData";

export default function KanbanCard({ card, onSelectCard }) {
    const eventName = card.event_name || card.namaEvent || card.title || "Acara Tanpa Judul";
    const clientName = card.client?.name || card.namaKlien || card.clientName || "-";
    const rawCategory = card.category || card.kategori || "wedding";
    const categoryLabel = CATEGORY_LABELS[rawCategory] || rawCategory;
    const kanbanStatus = card.kanban_status || card.status || "request";

    const estimatedBudget = Number(card.estimated_budget ?? card.budget ?? card.nilaiKontrak) || 0;
    const agreedPrice = Number(card.agreed_price) || 0;
    const quotationTotal = Number(card.quotation_total) || 0;
    const paidAmount = Number(card.paid_amount ?? card.jumlahDibayar) || 0;

    // Format tanggal acara
    let formattedDate = formatEventDate(card.event_date || card.tanggalEvent || card.date);
    if (card.is_multi_day && card.end_date) {
        formattedDate = `${formattedDate} - ${formatEventDate(card.end_date)}`;
    }

    // Badge pembayaran: hanya muncul mulai kolom awaiting_dp
    const showPaymentBadge = ["awaiting_dp", "on_progress", "done"].includes(kanbanStatus);
    const payment = getPaymentStatus(agreedPrice, paidAmount);

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
            onClick={() => onSelectCard?.(card)}
            className={`bg-white rounded-xl p-4 shadow-xs border border-slate-200/80 hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col gap-2.5 cursor-grab active:cursor-grabbing group ${
                isDragging ? "opacity-50" : ""
            }`}
        >
            {/* Judul Acara */}
            <h4 className="text-sm font-bold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors">
                {eventName}
            </h4>

            {/* Kategori Acara (tanpa background kotak, gaya mirip baris tanggal) */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
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
                <span className="truncate">{categoryLabel}</span>
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
                <span className="truncate">{formattedDate}</span>
            </div>

            {/* Bagian Finansial Sesuai Tahapan Kanban */}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5 mt-0.5">
                {kanbanStatus === "request" && (
                    <div className="flex items-center justify-between text-xs">
                        <span
                            style={{
                                backgroundColor: "rgba(153, 205, 216, 0.25)",
                                color: "#184048",
                                borderColor: "#99cdd8",
                            }}
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded border"
                        >
                            Est. Klien
                        </span>
                        <span className="font-bold text-slate-800">
                            {formatRupiah(estimatedBudget, true)}
                        </span>
                    </div>
                )}

                {kanbanStatus === "drafting_quotation" && (
                    <div className="flex flex-col gap-1 text-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-500">Est. Klien:</span>
                            <span className="text-slate-600 font-medium">
                                {formatRupiah(estimatedBudget, true)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span style={{ color: "#224436" }} className="text-[11px] font-bold">Total Sementara:</span>
                            <span style={{ color: "#224436" }} className="font-extrabold">
                                {formatRupiah(quotationTotal, true)}
                            </span>
                        </div>
                    </div>
                )}

                {kanbanStatus === "client_review" && (
                    <div className="flex items-center justify-between text-xs">
                        <span style={{ color: "#5a3a1d" }} className="text-[11px] font-bold">Total Penawaran:</span>
                        <span style={{ color: "#5a3a1d" }} className="font-extrabold">
                            {formatRupiah(quotationTotal, true)}
                        </span>
                    </div>
                )}

                {["awaiting_dp", "on_progress", "done"].includes(kanbanStatus) && (
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-medium">Nilai Kontrak:</span>
                            <span className="font-bold text-slate-800">
                                {formatRupiah(agreedPrice, true)}
                            </span>
                        </div>

                        {showPaymentBadge && (
                            <span
                                className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md border ${payment.badgeClass}`}
                            >
                                {payment.label}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
