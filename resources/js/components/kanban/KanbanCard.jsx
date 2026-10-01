import { formatRupiah, getPaymentStatus } from "../../data/kanbanData";

export default function KanbanCard({ card }) {
    // Normalisasi properti (mendukung properti baru maupun fallback)
    const eventName = card.namaEvent || card.title || "Acara Tanpa Judul";
    const clientName = card.namaKlien || card.clientName || "-";
    const category = card.kategori || card.category || "Umum";
    const eventDate = card.tanggalEvent || card.date || "-";
    const contractValue = Number(card.nilaiKontrak ?? card.budget) || 0;
    const paidValue = Number(card.jumlahDibayar) || 0;
    const location = card.lokasi || card.location;
    const daysLeft = card.hariTersisa ?? card.daysLeft;

    // Kalkulasi badge status pembayaran dari persentase
    const payment = getPaymentStatus(contractValue, paidValue, card.customStatus);

    const getCategoryBadgeClass = (cat) => {
        switch (cat?.toLowerCase()) {
            case "pernikahan":
            case "wedding":
                return "bg-rose-50 text-rose-700 border-rose-200";
            case "gathering kantor":
            case "corporate":
                return "bg-blue-50 text-blue-700 border-blue-200";
            case "ulang tahun":
            case "birthday":
                return "bg-amber-50 text-amber-700 border-amber-200";
            case "seminar":
                return "bg-indigo-50 text-indigo-700 border-indigo-200";
            default:
                return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    return (
        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200/80 hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col gap-3 cursor-pointer group">
            {/* Header Kartu: Kategori & Sisa Hari */}
            <div className="flex items-center justify-between gap-2">
                <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(
                        category
                    )}`}
                >
                    {category}
                </span>

                {daysLeft !== undefined && (
                    <span
                        className={`text-[11px] font-medium ${
                            daysLeft <= 7
                                ? "text-rose-600 font-semibold"
                                : "text-slate-500"
                        }`}
                    >
                        {daysLeft <= 0 ? "Hari Ini" : `${daysLeft} hari lagi`}
                    </span>
                )}
            </div>

            {/* Judul Acara & Nama Klien */}
            <div>
                <h4 className="text-sm font-bold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors">
                    {eventName}
                </h4>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
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
            </div>

            {/* Lokasi Acara jika ada */}
            {location && (
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
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                    </svg>
                    <span className="truncate">{location}</span>
                </div>
            )}

            {/* Badge Status Pembayaran (Dihitung dari persentase jumlahDibayar / nilaiKontrak) */}
            <div className="pt-1">
                <div className="flex items-center justify-between gap-2">
                    <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${payment.badgeClass}`}
                    >
                        <span
                            className={`w-1.5 h-1.5 rounded-full ${payment.dotColor}`}
                        />
                        <span>{payment.label}</span>
                    </span>

                    {/* Nominal sudah terbayar jika ada dan belum 100% */}
                    {paidValue > 0 && paidValue < contractValue && (
                        <span className="text-[10px] text-slate-400">
                            Masuk: {formatRupiah(paidValue, true)}
                        </span>
                    )}
                </div>
            </div>

            {/* Footer Kartu: Tanggal Event & Nilai Kontrak (Rupiah) */}
            <div className="pt-2.5 mt-auto border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                {/* Tanggal Event */}
                <div className="flex items-center gap-1.5 text-slate-600 font-medium">
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

                {/* Nilai Kontrak */}
                <span className="text-slate-900 font-bold bg-slate-50 px-2.5 py-1 rounded-md text-[11px] border border-slate-200">
                    {formatRupiah(contractValue)}
                </span>
            </div>
        </div>
    );
}
