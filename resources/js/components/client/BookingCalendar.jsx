import React, { useState } from "react";
import Calendar from "react-calendar";
import "./BookingCalendar.css";

/**
 * Konfigurasi lead time (waktu persiapan minimum) per kategori acara
 */
export const CATEGORY_CONFIG = {
    wedding: {
        label: "Wedding",
        minDays: 60,
        badgeText: "Batas Minimal: H-60",
    },
    seminar: {
        label: "Seminar",
        minDays: 30,
        badgeText: "Batas Minimal: H-30",
    },
    birthday: {
        label: "Birthday",
        minDays: 14,
        badgeText: "Batas Minimal: H-14",
    },
};

/**
 * Helper menghasilkan URL WhatsApp dengan template pesan konsultasi pemesanan mendadak
 */
export const generateWhatsAppUrl = ({
    phone = "6281234567890",
    category = "wedding",
    targetDate = "",
}) => {
    const config = CATEGORY_CONFIG[category] || { label: category, minDays: 0 };
    const dateFormatted = targetDate ? ` pada tanggal ${targetDate}` : "";
    const text = `Halo Admin EO Evento, saya ingin konsultasi pemesanan acara mendadak kurang dari batas waktu persiapan untuk kategori ${config.label}${dateFormatted}. Apakah masih ada slot darurat yang tersedia?`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
};

/**
 * Helper mengubah objek Date ke format YYYY-MM-DD lokal
 */
export const formatDateToYMD = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

/**
 * Helper mengubah objek Date atau string YYYY-MM-DD ke format dd-MM-yyyy lokal
 */
export const formatDateToDMY = (date) => {
    if (!date) return "";
    let d;
    if (typeof date === "string" && date.includes("-")) {
        const parts = date.split("-");
        if (parts.length === 3 && parts[0].length === 4) {
            d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        } else {
            d = new Date(date);
        }
    } else {
        d = new Date(date);
    }
    if (isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
};

/**
 * Helper memeriksa apakah rentang tanggal [start, end] melewati tanggal yang sudah dibooking
 */
export const checkRangeOverlap = (start, end, bookedList) => {
    if (!start || !end || !bookedList || !bookedList.length) return false;
    const current = new Date(start);
    const targetEnd = new Date(end);
    current.setHours(0, 0, 0, 0);
    targetEnd.setHours(0, 0, 0, 0);

    // Tukar posisi jika end lebih awal dari start
    if (current > targetEnd) {
        const temp = new Date(current);
        current.setTime(targetEnd.getTime());
        targetEnd.setTime(temp.getTime());
    }

    while (current <= targetEnd) {
        const ymd = formatDateToYMD(current);
        if (bookedList.includes(ymd)) {
            return true;
        }
        current.setDate(current.getDate() + 1);
    }
    return false;
};

/**
 * Komponen BookingCalendar untuk Modul Klien.
 * Menampilkan kalender interaktif yang dinamis mendisable tanggal di bawah batas minimal kategori,
 * mendeteksi pemesanan mendadak, serta menyediakan notice edukatif dan tombol kontak WhatsApp EO.
 *
 * @param {Object} props
 * @param {Date|Array<Date>|null} [props.value] - Tanggal atau array rentang [start, end]
 * @param {function(Date|Array<Date>):void} [props.onChange] - Callback saat tanggal/rentang berubah
 * @param {Date} [props.minDate] - Batas minimal tanggal (berdasarkan H-min kategori)
 * @param {Array<string>} [props.bookedDates] - Array tanggal terisi ["YYYY-MM-DD"]
 * @param {boolean} [props.selectRange] - Aktifkan mode rentang multi-hari
 * @param {string} [props.category] - Kategori aktif (wedding, seminar, birthday)
 * @param {function(string):void} [props.onRangeConflict] - Callback saat rentang menabrak tanggal terisi
 * @param {function(string):void} [props.onEmergencyBookingNotice] - Callback saat user mencoba memilih tanggal < H-min
 */
export default function BookingCalendar({
    value,
    onChange,
    minDate = new Date(),
    bookedDates = [],
    selectRange = false,
    category = "wedding",
    onRangeConflict,
    onEmergencyBookingNotice,
}) {
    const [internalDate, setInternalDate] = useState(new Date());
    const [rangeWarning, setRangeWarning] = useState("");
    const [emergencyNotice, setEmergencyNotice] = useState(null);

    const activeDate = value !== undefined ? value : internalDate;
    const catConfig = CATEGORY_CONFIG[category] || {
        label: category,
        minDays: 0,
        badgeText: "Batas Minimal",
    };

    const formatReadableDate = (date) => {
        if (!date) return "-";
        return new Intl.DateTimeFormat("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        }).format(date);
    };

    const handleDateChange = (newVal) => {
        setRangeWarning("");

        // Jika dalam mode rentang hari (selectRange)
        if (selectRange && Array.isArray(newVal)) {
            const [start, end] = newVal;

            if (start && end) {
                // Periksa apakah rentang menabrak tanggal yang sudah terisi (abu-abu)
                const isOverlapping = checkRangeOverlap(start, end, bookedDates);

                if (isOverlapping) {
                    const errorMsg =
                        "Rentang tanggal yang dipilih melewati tanggal yang sudah terisi. Silakan pilih rentang tanggal lain.";
                    setRangeWarning(errorMsg);
                    if (onRangeConflict) {
                        onRangeConflict(errorMsg);
                    }
                    // Batalkan pemilihan rentang yang bentrok, pertahankan tanggal mulai saja
                    const fallback = [start, start];
                    if (value === undefined) setInternalDate(fallback);
                    if (onChange) onChange(fallback);
                    return;
                }
            }
        }

        if (value === undefined) {
            setInternalDate(newVal);
        }
        if (onChange) {
            onChange(newVal);
        }
    };

    // Helper periksa apakah tanggal berada di bawah batas waktu persiapan H-min
    const isBelowLeadTime = (date) => {
        const check = new Date(date);
        check.setHours(0, 0, 0, 0);
        const limit = new Date(minDate);
        limit.setHours(0, 0, 0, 0);
        return check < limit;
    };

    // Nonaktifkan tanggal yang sudah terisi di database atau di bawah batas minimal kategori
    const isTileDisabled = ({ date, view }) => {
        if (view === "month") {
            if (isBelowLeadTime(date)) {
                return true;
            }
            const dateStr = formatDateToYMD(date);
            return bookedDates.includes(dateStr);
        }
        return false;
    };

    // Tambahkan class CSS khusus untuk styling tile
    const getTileClassName = ({ date, view }) => {
        if (view === "month") {
            const dateStr = formatDateToYMD(date);
            if (bookedDates.includes(dateStr)) {
                return "react-calendar__tile--booked";
            }
            if (isBelowLeadTime(date)) {
                return "react-calendar__tile--below-lead-time";
            }
        }
        return "";
    };

    // Render metadata tersembunyi pada setiap tile untuk identifikasi tanggal saat dicoba klik
    const getTileContent = ({ date, view }) => {
        if (view === "month") {
            const dateStr = formatDateToYMD(date);
            return <span className="calendar-tile-meta hidden" data-date={dateStr} />;
        }
        return null;
    };

    // Deteksi upaya klik pengguna pada tile yang dinonaktifkan
    const handleCalendarClickCapture = (e) => {
        const tile = e.target.closest(".react-calendar__tile");
        if (!tile) return;

        // Upaya memilih tanggal di bawah batas minimal persiapan kategori (Pemesanan Mendadak)
        if (tile.classList.contains("react-calendar__tile--below-lead-time")) {
            e.preventDefault();
            e.stopPropagation();

            const meta = tile.querySelector(".calendar-tile-meta");
            const clickedDateStr = meta?.getAttribute("data-date") || "";

            let readable = "";
            if (clickedDateStr) {
                const parts = clickedDateStr.split("-");
                if (parts.length === 3) {
                    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                    readable = formatReadableDate(d);
                }
            }

            setEmergencyNotice({
                rawDate: clickedDateStr,
                formattedDate: readable,
                category,
            });

            if (onEmergencyBookingNotice) {
                onEmergencyBookingNotice(clickedDateStr);
            }
        } else if (tile.classList.contains("react-calendar__tile--booked")) {
            e.preventDefault();
            e.stopPropagation();
            setRangeWarning("Tanggal ini sudah terisi dan tidak dapat dipilih.");
        }
    };

    // Hitung jumlah hari dalam rentang jika array [start, end]
    const calculateDuration = (start, end) => {
        if (!start || !end) return 1;
        const s = new Date(start).setHours(0, 0, 0, 0);
        const e = new Date(end).setHours(0, 0, 0, 0);
        const diffTime = Math.abs(e - s);
        return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };

    return (
        <div className="evento-calendar-wrapper flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
                {/* Header Kalender & Badge Batas Waktu Kategori */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                    <div>
                        <h3 className="text-base font-bold text-slate-800">
                            Kalender Pemesanan Acara
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {selectRange
                                ? "Mode Rentang Hari: Klik tanggal mulai, lalu klik tanggal selesai acara."
                                : "Gunakan tombol navigasi panah untuk berpindah bulan atau tahun."}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
                            {catConfig.label}: {catConfig.badgeText}
                        </span>
                    </div>
                </div>

                {/* Notice Edukatif Pemesanan Mendadak (Jika Klien Mencoba Memilih Tanggal < H-Min) */}
                {emergencyNotice && (
                    <div className="mb-4 bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
                        <div className="flex items-start gap-2.5 flex-1">
                            <span className="mt-0.5 text-amber-700">
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                            </span>
                            <div>
                                <p className="font-bold text-amber-950">
                                    Pemberitahuan Batas Waktu Persiapan Acara
                                </p>
                                <p className="mt-0.5 text-amber-800 leading-relaxed">
                                    {emergencyNotice.formattedDate && (
                                        <span className="font-semibold underline mr-1">
                                            {emergencyNotice.formattedDate}
                                        </span>
                                    )}
                                    berada di bawah batas minimal persiapan kategori {catConfig.label} ({catConfig.badgeText}).
                                </p>
                                <p className="mt-1 font-semibold text-amber-900">
                                    Butuh acara mendadak kurang dari batas waktu persiapan? Hubungi Admin EO via WhatsApp.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <a
                                href={generateWhatsAppUrl({
                                    category,
                                    targetDate: emergencyNotice.formattedDate || emergencyNotice.rawDate,
                                })}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    width="14"
                                    height="14"
                                    fill="currentColor"
                                    className="w-3.5 h-3.5"
                                >
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.888 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.711 1.456h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.411Z" />
                                </svg>
                                <span>Hubungi Admin EO</span>
                            </a>

                            <button
                                type="button"
                                onClick={() => setEmergencyNotice(null)}
                                className="p-1.5 text-amber-700 hover:text-amber-950 font-bold text-base leading-none cursor-pointer"
                                title="Tutup pemberitahuan"
                                aria-label="Tutup pemberitahuan"
                            >
                                &times;
                            </button>
                        </div>
                    </div>
                )}

                {/* Notifikasi Peringatan Jika Rentang Menabrak Tanggal Terisi (Tanpa Emoticon) */}
                {rangeWarning && (
                    <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-xl text-xs flex items-start justify-between gap-2 animate-fadeIn">
                        <p className="font-semibold">{rangeWarning}</p>
                        <button
                            type="button"
                            onClick={() => setRangeWarning("")}
                            className="text-rose-400 hover:text-rose-700 font-bold text-sm leading-none cursor-pointer"
                            title="Tutup peringatan"
                            aria-label="Tutup peringatan"
                        >
                            &times;
                        </button>
                    </div>
                )}

                {/* Area Interaktif Kalender dengan Event Capture */}
                <div
                    className="calendar-capture-wrapper"
                    onClickCapture={handleCalendarClickCapture}
                >
                    <Calendar
                        value={activeDate}
                        onChange={handleDateChange}
                        locale="id-ID"
                        minDate={minDate}
                        selectRange={selectRange}
                        tileDisabled={isTileDisabled}
                        tileClassName={getTileClassName}
                        tileContent={getTileContent}
                        prev2Label="«"
                        prevLabel="‹"
                        nextLabel="›"
                        next2Label="»"
                        minDetail="decade"
                    />
                </div>

                {/* Preview Tanggal Terpilih */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                    <span className="text-slate-500 font-medium">
                        {selectRange ? "Rentang Acara Terpilih:" : "Tanggal Terpilih:"}
                    </span>

                    {selectRange && Array.isArray(activeDate) ? (
                        activeDate[0] && activeDate[1] && activeDate[0].getTime() !== activeDate[1].getTime() ? (
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                                    {formatReadableDate(activeDate[0])} — {formatReadableDate(activeDate[1])}
                                </span>
                                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                    {calculateDuration(activeDate[0], activeDate[1])} Hari
                                </span>
                            </div>
                        ) : (
                            <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                                {formatReadableDate(activeDate[0] || activeDate)} (Klik tanggal selesai)
                            </span>
                        )
                    ) : (
                        <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                            {formatReadableDate(Array.isArray(activeDate) ? activeDate[0] : activeDate)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

