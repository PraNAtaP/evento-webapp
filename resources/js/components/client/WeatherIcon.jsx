import React from "react";

const CLOUD = "M7 18a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17 8.5a4.75 4.75 0 0 1 0 9.5H7z";

/**
 * Ikon cuaca SVG inline berdasarkan kategori musim dari API /musim.
 *
 * @param {Object} props
 * @param {"sangat_basah"|"basah"|"pancaroba"|"kemarau"} props.kategori - Kategori musim
 * @param {string} [props.className] - Kelas ukuran/warna tambahan
 */
export default function WeatherIcon({ kategori, className = "w-14 h-14" }) {
    const common = {
        viewBox: "0 0 48 48",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 2.2,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className,
        role: "img",
    };

    if (kategori === "kemarau") {
        return (
            <svg {...common} aria-label="Cerah">
                <circle cx="24" cy="24" r="8" fill="#F2C94C" stroke="#C99A1E" />
                <g stroke="#C99A1E">
                    <path d="M24 5v6M24 37v6M5 24h6M37 24h6M10.6 10.6l4.2 4.2M33.2 33.2l4.2 4.2M10.6 37.4l4.2-4.2M33.2 14.8l4.2-4.2" />
                </g>
            </svg>
        );
    }

    if (kategori === "pancaroba") {
        return (
            <svg {...common} aria-label="Cerah berawan dan gerimis">
                <circle cx="17" cy="15" r="5.5" fill="#F2C94C" stroke="#C99A1E" />
                <path d="M17 3v3M5 15h3M8.5 6.5l2 2M25.5 6.5l-2 2" stroke="#C99A1E" />
                <g transform="translate(6 6) scale(1.35)">
                    <path d={CLOUD} fill="#FFFFFF" stroke="#657166" strokeWidth={1.7} />
                </g>
                <path d="M20 40l-1.5 3M28 40l-1.5 3M36 40l-1.5 3" stroke="#5B8DB8" />
            </svg>
        );
    }

    if (kategori === "sangat_basah") {
        return (
            <svg {...common} aria-label="Hujan lebat dan petir">
                <g transform="translate(2 0) scale(1.65)">
                    <path d={CLOUD} fill="#E3E6E1" stroke="#424C43" strokeWidth={1.4} />
                </g>
                <path d="M26 30l-5 8h6l-4 8" stroke="#E0A800" fill="none" strokeWidth={2.6} />
                <path d="M13 36l-2 4M37 36l-2 4M13 44l-1 2" stroke="#5B8DB8" />
            </svg>
        );
    }

    return (
        <svg {...common} aria-label="Hujan">
            <g transform="translate(2 0) scale(1.65)">
                <path d={CLOUD} fill="#EEF0EC" stroke="#657166" strokeWidth={1.4} />
            </g>
            <path d="M15 36l-2.5 5M25 36l-2.5 5M35 36l-2.5 5M20 43l-1.5 3M30 43l-1.5 3" stroke="#5B8DB8" />
        </svg>
    );
}

