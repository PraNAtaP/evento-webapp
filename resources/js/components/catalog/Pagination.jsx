import React from "react";

export default function Pagination({
    currentPage = 1,
    lastPage = 1,
    total = 0,
    from = 0,
    to = 0,
    onPageChange,
    className = "",
}) {
    if (lastPage <= 1) return null;

    // Hitung nomor halaman yang ditampilkan
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (lastPage <= maxVisible) {
            for (let i = 1; i <= lastPage; i++) pages.push(i);
        } else {
            pages.push(1);
            let start = Math.max(2, currentPage - 1);
            let end = Math.min(lastPage - 1, currentPage + 1);

            if (currentPage <= 3) {
                end = 4;
            } else if (currentPage >= lastPage - 2) {
                start = lastPage - 3;
            }

            if (start > 2) pages.push("...");
            for (let i = start; i <= end; i++) pages.push(i);
            if (end < lastPage - 1) pages.push("...");

            pages.push(lastPage);
        }

        return pages;
    };

    return (
        <div
            className={`flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-white rounded-2xl border border-[#E8E2D7] shadow-2xs text-xs text-[#738075] ${className}`}
        >
            <div>
                Menampilkan{" "}
                <strong className="text-[#2F3931]">{from || 0}</strong> -{" "}
                <strong className="text-[#2F3931]">{to || 0}</strong> dari{" "}
                <strong className="text-[#2F3931]">{total}</strong> data
            </div>

            <div className="flex items-center gap-1.5">
                <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="px-3 py-1.5 rounded-lg border border-[#E8E2D7] bg-[#FAF6F0] text-[#2F3931] hover:bg-[#E8E2D7]/50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition-colors cursor-pointer"
                >
                    Sebelumnya
                </button>

                <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, idx) => {
                        if (page === "...") {
                            return (
                                <span key={`dots-${idx}`} className="px-2 text-slate-400 select-none">
                                    ...
                                </span>
                            );
                        }

                        const isActive = page === currentPage;
                        return (
                            <button
                                key={`page-${page}`}
                                type="button"
                                onClick={() => onPageChange(page)}
                                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    isActive
                                        ? "bg-[#657166] text-white shadow-2xs"
                                        : "bg-white border border-[#E8E2D7] text-[#2F3931] hover:bg-[#FAF6F0]"
                                }`}
                            >
                                {page}
                            </button>
                        );
                    })}
                </div>

                <button
                    type="button"
                    disabled={currentPage >= lastPage}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="px-3 py-1.5 rounded-lg border border-[#E8E2D7] bg-[#FAF6F0] text-[#2F3931] hover:bg-[#E8E2D7]/50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition-colors cursor-pointer"
                >
                    Selanjutnya
                </button>
            </div>
        </div>
    );
}

