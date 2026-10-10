import React from "react";

/**
 * Menampilkan informasi titik lokasi acara untuk Event Organizer (EO).
 *
 * @param {Object} props
 * @param {boolean} props.hasOwnVenue - Apakah klien memiliki venue sendiri
 * @param {number|string|null} [props.lat] - Latitude titik venue
 * @param {number|string|null} [props.lng] - Longitude titik venue
 */
export default function EventLocationInfo({ hasOwnVenue, lat, lng }) {
    if (!hasOwnVenue) {
        return <p className="text-xs text-slate-500">Lokasi dipilih oleh EO</p>;
    }

    if (lat == null || lng == null || lat === "" || lng === "") {
        return <p className="text-xs text-slate-500">Titik lokasi belum ditentukan</p>;
    }

    const latNumber = Number(lat);
    const lngNumber = Number(lng);

    return (
        <div className="flex flex-col gap-1">
            <a
                href={`https://www.google.com/maps?q=${latNumber},${lngNumber}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
                <svg
                    width="14"
                    height="14"
                    style={{ minWidth: 14, minHeight: 14 }}
                    className="w-3.5 h-3.5 shrink-0"
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
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Buka di Google Maps</span>
            </a>
            <span className="text-[11px] font-mono text-slate-400">
                {latNumber.toFixed(7)}, {lngNumber.toFixed(7)}
            </span>
        </div>
    );
}
