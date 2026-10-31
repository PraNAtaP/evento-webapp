import React, { useEffect, useState } from "react";

export default function SearchInput({
    value = "",
    onChange,
    placeholder = "Cari...",
    debounceMs = 300,
    className = "",
}) {
    const [searchTerm, setSearchTerm] = useState(value);

    // Sinkronkan state lokal saat prop value dari URL search params berubah
    useEffect(() => {
        setSearchTerm(value);
    }, [value]);

    // Debounce callback onChange
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== value) {
                onChange?.(searchTerm);
            }
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [searchTerm, debounceMs, onChange, value]);

    return (
        <div className={`relative flex items-center ${className}`}>
            <span className="absolute left-3.5 text-[#738075] pointer-events-none">
                <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
            </span>
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-10 pr-9 py-2.5 text-xs bg-white border border-[#E8E2D7] rounded-xl text-[#2F3931] placeholder-[#738075]/70 focus:outline-none focus:ring-2 focus:ring-[#657166]/20 focus:border-[#657166] transition-all shadow-2xs"
            />
            {searchTerm && (
                <button
                    type="button"
                    onClick={() => {
                        setSearchTerm("");
                        onChange?.("");
                    }}
                    className="absolute right-3 text-[#738075] hover:text-[#2F3931] text-xs font-bold p-1 rounded-full hover:bg-[#FAF6F0] transition-colors cursor-pointer"
                    title="Hapus pencarian"
                >
                    &times;
                </button>
            )}
        </div>
    );
}

