import React, { useState } from "react";
import Calendar from "react-calendar";
import "./BookingCalendar.css";

/**
 * Komponen BookingCalendar untuk Modul Klien.
 * Menampilkan kalender interaktif untuk memilih tanggal acara dengan navigasi bulan dan tahun.
 *
 * @param {Object} props
 * @param {Date|null} [props.value] - Tanggal terpilih (controlled)
 * @param {function(Date):void} [props.onChange] - Callback saat tanggal dipilih
 */
export default function BookingCalendar({ value, onChange }) {
    const [internalDate, setInternalDate] = useState(new Date());

    const activeDate = value !== undefined ? value : internalDate;

    const handleDateChange = (newDate) => {
        if (value === undefined) {
            setInternalDate(newDate);
        }
        if (onChange) {
            onChange(newDate);
        }
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

    return (
        <div className="evento-calendar-wrapper flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div>
                        <h3 className="text-base font-bold text-slate-800">
                            Kalender Pemesanan Acara
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Gunakan tombol navigasi panah untuk berpindah bulan atau tahun.
                        </p>
                    </div>
                </div>

                {/* React Calendar */}
                <Calendar
                    value={activeDate}
                    onChange={handleDateChange}
                    locale="id-ID"
                    prev2Label="«"
                    prevLabel="‹"
                    nextLabel="›"
                    next2Label="»"
                    minDetail="decade"
                />

                {/* Preview Tanggal Terpilih */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">
                        Tanggal Terpilih:
                    </span>
                    <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                        {formatReadableDate(activeDate)}
                    </span>
                </div>
            </div>
        </div>
    );
}
