import KanbanCard from "./KanbanCard";

export default function KanbanColumn({ column, cards = [] }) {
    return (
        <div className="flex flex-col w-80 min-w-[320px] max-w-[360px] shrink-0 bg-[#F5EFEB]/90 rounded-2xl p-4 border border-[#E8E2D7] shadow-xs">
            {/* Header Kolom */}
            <div className="pb-3 border-b border-[#E8E2D7] mb-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        {/* Dot Status */}
                        <span
                            className={`w-2.5 h-2.5 rounded-full ${column.dotColor || "bg-[#CFD8C4]"}`}
                        />
                        <h3 className="font-bold text-[#2F3931] text-sm tracking-tight">
                            {column.title}
                        </h3>
                    </div>

                    {/* Counter Badge */}
                    <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${column.badgeColor || "bg-white text-[#2F3931] border border-[#E8E2D7]"}`}
                    >
                        {cards.length}
                    </span>
                </div>

                {/* Subtitle Kolom */}
                <p className="mt-1 text-[11px] text-[#738075]">
                    {column.subtitle || "Daftar Acara"}
                </p>
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
