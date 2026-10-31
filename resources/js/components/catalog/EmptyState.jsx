import React from "react";

export default function EmptyState({
    title = "Data Tidak Ditemukan",
    message = "Tidak ada hasil yang sesuai dengan kriteria atau kata kunci pencarian Anda.",
    actionText,
    onAction,
    className = "",
}) {
    return (
        <div
            className={`p-10 bg-white rounded-2xl border border-[#E8E2D7] text-center shadow-xs flex flex-col items-center justify-center gap-3 ${className}`}
        >
            <div className="w-12 h-12 rounded-2xl bg-[#FAF6F0] text-[#657166] border border-[#E8E2D7] flex items-center justify-center font-bold text-xl">
                🔍
            </div>
            <div>
                <h3 className="text-sm font-bold text-[#2F3931]">{title}</h3>
                <p className="text-xs text-[#738075] mt-1 max-w-sm leading-relaxed">
                    {message}
                </p>
            </div>
            {actionText && onAction && (
                <button
                    type="button"
                    onClick={onAction}
                    className="mt-2 px-4 py-2 bg-[#FAF6F0] hover:bg-[#E8E2D7]/50 border border-[#E8E2D7] text-[#2F3931] font-semibold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
                >
                    {actionText}
                </button>
            )}
        </div>
    );
}

