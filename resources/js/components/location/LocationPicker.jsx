import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Perbaikan ikon marker default Leaflet yang tidak ter-resolve oleh bundler (Vite/Webpack)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

/** Pusat peta default: Kota Malang. */
const DEFAULT_CENTER = [-7.9797, 112.6304];
const DEFAULT_ZOOM = 13;
const FOCUS_ZOOM = 15;

const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search?format=json&countrycodes=id&limit=5&q=";
const SEARCH_MIN_INTERVAL_MS = 1000;
const SEARCH_MAX_RESULTS = 5;
const SEARCH_LABEL_MAX_LENGTH = 30;
const SEARCH_NOT_FOUND_MESSAGE = "Tempat tidak ditemukan. Coba kata kunci lain atau klik langsung di peta.";
const SEARCH_FAILED_MESSAGE = "Gagal mencari tempat. Periksa koneksi Anda atau klik langsung di peta.";

const GEOLOCATION_ERROR_MESSAGES = {
    1: "Izin lokasi ditolak. Aktifkan izin lokasi di browser atau pilih titik secara manual di peta.",
    2: "Lokasi Anda tidak dapat ditentukan saat ini. Silakan pilih titik secara manual di peta.",
    3: "Waktu permintaan lokasi habis. Silakan coba lagi atau pilih titik secara manual di peta.",
};

/**
 * Menaruh pin saat peta diklik.
 */
function ClickHandler({ onPick, disabled }) {
    useMapEvents({
        click(e) {
            if (!disabled) {
                onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
            }
        },
    });
    return null;
}

/**
 * Menggerakkan peta (flyTo) setiap kali value berubah.
 */
function FlyToValue({ value }) {
    const map = useMap();
    const lat = value?.lat;
    const lng = value?.lng;

    useEffect(() => {
        if (lat == null || lng == null) return;
        map.flyTo([lat, lng], Math.max(map.getZoom(), FOCUS_ZOOM), { duration: 0.8 });
    }, [lat, lng, map]);

    return null;
}

/**
 * Komponen pemilih titik lokasi berbasis peta OpenStreetMap (react-leaflet).
 * Customer dapat mengklik peta untuk menaruh pin, menggeser pin, atau memakai lokasi perangkat.
 *
 * @param {Object} props
 * @param {{lat: number, lng: number}|null} props.value - Titik lokasi terpilih
 * @param {function({lat: number, lng: number}):void} props.onChange - Callback saat titik berubah
 * @param {boolean} [props.disabled] - Nonaktifkan interaksi
 * @param {boolean} [props.hasError] - Tampilkan border error
 * @param {string} [props.searchQuery] - Kata kunci awal untuk pencarian tempat (mis. nama gedung)
 */
export default function LocationPicker({ value, onChange, disabled = false, hasError = false, searchQuery = "" }) {
    const markerRef = useRef(null);
    const [isLocating, setIsLocating] = useState(false);
    const [geoError, setGeoError] = useState("");
    const [searchInput, setSearchInput] = useState(searchQuery);
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [searchMessage, setSearchMessage] = useState("");
    const lastSearchRequestAtRef = useRef(0);

    useEffect(() => {
        setSearchInput(searchQuery);
    }, [searchQuery]);

    const markerHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker) {
                    const { lat, lng } = marker.getLatLng();
                    onChange({ lat, lng });
                }
            },
        }),
        [onChange]
    );

    const clearSearchFeedback = () => {
        setSearchResults([]);
        setSearchMessage("");
    };

    const handlePick = (point) => {
        setGeoError("");
        clearSearchFeedback();
        onChange(point);
    };

    const selectSearchResult = (result) => {
        clearSearchFeedback();
        onChange({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) });
    };

    const runSearch = async (rawQuery) => {
        const query = (rawQuery || "").trim();
        if (!query || isSearching) return;

        setIsSearching(true);
        clearSearchFeedback();

        const waitMs = SEARCH_MIN_INTERVAL_MS - (Date.now() - lastSearchRequestAtRef.current);
        if (waitMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, waitMs));
        }
        lastSearchRequestAtRef.current = Date.now();

        try {
            const response = await fetch(NOMINATIM_SEARCH_URL + encodeURIComponent(query));
            if (!response.ok) {
                throw new Error(`Nominatim error ${response.status}`);
            }
            const results = await response.json();

            if (!Array.isArray(results) || results.length === 0) {
                setSearchMessage(SEARCH_NOT_FOUND_MESSAGE);
            } else if (results.length === 1) {
                selectSearchResult(results[0]);
            } else {
                setSearchResults(results.slice(0, SEARCH_MAX_RESULTS));
            }
        } catch {
            setSearchMessage(SEARCH_FAILED_MESSAGE);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === "Enter") {
            // Cegah submit form induk (BookingForm)
            e.preventDefault();
            runSearch(searchInput);
        }
    };

    const handleUseMyLocation = () => {
        setGeoError("");

        if (!("geolocation" in navigator)) {
            setGeoError("Browser Anda tidak mendukung fitur lokasi. Silakan pilih titik secara manual di peta.");
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setIsLocating(false);
                onChange({ lat: position.coords.latitude, lng: position.coords.longitude });
            },
            (error) => {
                setIsLocating(false);
                setGeoError(
                    GEOLOCATION_ERROR_MESSAGES[error.code] ||
                        "Gagal mengambil lokasi Anda. Silakan pilih titik secara manual di peta."
                );
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const hasValue = value?.lat != null && value?.lng != null;
    const initialCenter = hasValue ? [value.lat, value.lng] : DEFAULT_CENTER;
    const initialZoom = hasValue ? FOCUS_ZOOM : DEFAULT_ZOOM;

    const trimmedSearchQuery = (searchQuery || "").trim();
    const searchQueryLabel =
        trimmedSearchQuery.length > SEARCH_LABEL_MAX_LENGTH
            ? `${trimmedSearchQuery.slice(0, SEARCH_LABEL_MAX_LENGTH)}…`
            : trimmedSearchQuery;

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] text-slate-500">
                    Klik peta untuk menaruh pin, lalu geser pin untuk menyesuaikan titik.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => runSearch(trimmedSearchQuery)}
                        disabled={disabled || isSearching || !trimmedSearchQuery}
                        title={trimmedSearchQuery ? `Cari "${trimmedSearchQuery}" di peta` : "Isi nama gedung dulu untuk mencari"}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <svg
                            width="12"
                            height="12"
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2.5"
                        >
                            <circle cx="11" cy="11" r="7" />
                            <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
                        </svg>
                        <span>{trimmedSearchQuery ? `Cari "${searchQueryLabel}" di peta` : "Cari di peta"}</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleUseMyLocation}
                        disabled={disabled || isLocating}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isLocating ? (
                            <span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                            <svg
                                width="12"
                                height="12"
                                className="w-3 h-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2.5"
                            >
                                <circle cx="12" cy="12" r="3" />
                                <path strokeLinecap="round" d="M12 2v3m0 14v3M2 12h3m14 0h3" />
                            </svg>
                        )}
                        <span>{isLocating ? "Mencari lokasi..." : "Pakai lokasi saya"}</span>
                    </button>
                </div>
            </div>

            {!trimmedSearchQuery && (
                <p className="text-[11px] text-slate-400 text-right">Isi nama gedung dulu untuk mencari</p>
            )}

            <div className="flex items-center gap-2">
                <input
                    id="locationSearch"
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Cari tempat, mis. Hotel Atria Malang"
                    disabled={disabled}
                    className="flex-1 min-w-0 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <button
                    type="button"
                    onClick={() => runSearch(searchInput)}
                    disabled={disabled || isSearching || !searchInput.trim()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {isSearching ? (
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                        <svg
                            width="12"
                            height="12"
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2.5"
                        >
                            <circle cx="11" cy="11" r="7" />
                            <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
                        </svg>
                    )}
                    <span>Cari</span>
                </button>
            </div>

            {isSearching && (
                <p className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                    Mencari...
                </p>
            )}

            {searchResults.length > 0 && (
                <ul className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                    {searchResults.map((result) => (
                        <li key={result.place_id ?? `${result.lat},${result.lon}`}>
                            <button
                                type="button"
                                onClick={() => selectSearchResult(result)}
                                disabled={disabled}
                                className="w-full text-left px-3 py-2 text-[11px] text-slate-700 hover:bg-blue-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
                            >
                                {result.display_name}
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {searchMessage && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                    {searchMessage}
                </p>
            )}

            <div
                className={`relative z-0 w-full overflow-hidden rounded-xl border ${
                    hasError ? "border-rose-400 ring-1 ring-rose-200" : "border-slate-300"
                }`}
            >
                <MapContainer
                    center={initialCenter}
                    zoom={initialZoom}
                    scrollWheelZoom
                    style={{ height: 350, width: "100%" }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <ClickHandler onPick={handlePick} disabled={disabled} />
                    <FlyToValue value={value} />
                    {hasValue && (
                        <Marker
                            position={[value.lat, value.lng]}
                            draggable={!disabled}
                            eventHandlers={markerHandlers}
                            ref={markerRef}
                        />
                    )}
                </MapContainer>
            </div>

            {geoError && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                    {geoError}
                </p>
            )}

            <p className="text-[11px] text-slate-500">
                {hasValue ? (
                    <>
                        Koordinat terpilih:{" "}
                        <span className="font-mono font-semibold text-slate-800">
                            {value.lat.toFixed(7)}, {value.lng.toFixed(7)}
                        </span>
                    </>
                ) : (
                    "Belum ada titik lokasi yang dipilih."
                )}
            </p>
        </div>
    );
}
