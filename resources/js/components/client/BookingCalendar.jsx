import React, { useState } from "react";
import Calendar from "react-calendar";
import "./BookingCalendar.css";

/**
 * Helper mengubah objek Date ke format YYYY-MM-DD lokal
 */
export const formatDateToYMD = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
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
 * Menampilkan kalender interaktif yang mendukung pemilihan tanggal tunggal
 * maupun rentang multi-hari (selectRange), lengkap dengan deteksi bentrok jadwal.
 *
 * @param {Object} props
 * @param {Date|Array<Date>|null} [props.value] - Tanggal atau array rentang [start, end]
 * @param {function(Date|Array<Date>):void} [props.onChange] - Callback saat tanggal/rentang berubah
 * @param {Date} [props.minDate] - Batas minimal tanggal (berdasarkan H-min kategori)
 * @param {Array<string>} [props.bookedDates] - Array tanggal terisi ["YYYY-MM-DD"]
 * @param {boolean} [props.selectRange] - Aktifkan mode rentang multi-hari
 * @param {function(string):void} [props.onRangeConflict] - Callback saat rentang menabrak tanggal terisi
 */
export default function BookingCalendar({
    value,
    onChange,
    minDate = new Date(),
    bookedDates = [],
    selectRange = false,
    onRangeConflict,
}) {
    const [internalDate, setInternalDate] = useState(new Date());
    const [rangeWarning, setRangeWarning] = useState("");

    const activeDate = value !== undefined ? value : internalDate;

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

    // Nonaktifkan tanggal yang sudah terisi di database
    const isTileDisabled = ({ date, view }) => {
        if (view === "month") {
            const dateStr = formatDateToYMD(date);
            return bookedDates.includes(dateStr);
        }
        return false;
    };

    // Tambahkan class CSS khusus untuk tanggal yang sudah terisi
    const getTileClassName = ({ date, view }) => {
        if (view === "month") {
            const dateStr = formatDateToYMD(date);
            if (bookedDates.includes(dateStr)) {
                return "react-calendar__tile--booked";
            }
        }
        return "";
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
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
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

                    {selectRange && (
                        <span className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                            Rentang Multi-Hari Aktif
                        </span>
                    )}
                </div>

                {/* Notifikasi Peringatan Jika Rentang Menabrak Tanggal Terisi (Tanpa Emoticon) */}
                {rangeWarning && (
                    <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-xl text-xs flex items-start justify-between gap-2 animate-fadeIn">
                        <p className="font-semibold">{rangeWarning}</p>
                        <button
                            type="button"
                            onClick={() => setRangeWarning("")}
                            className="text-rose-400 hover:text-rose-700 font-bold text-sm leading-none cursor-pointer"
                        >
                            &times;
                        </button>
                    </div>
                )}

                {/* React Calendar */}
                <Calendar
                    value={activeDate}
                    onChange={handleDateChange}
                    locale="id-ID"
                    minDate={minDate}
                    selectRange={selectRange}
                    tileDisabled={isTileDisabled}
                    tileClassName={getTileClassName}
                    prev2Label="«"
                    prevLabel="‹"
                    nextLabel="›"
                    next2Label="»"
                    minDetail="decade"
                />

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
