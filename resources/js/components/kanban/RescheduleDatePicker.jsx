import { useEffect, useMemo, useState } from "react";
import { formatDateToDMY, formatDateToYMD } from "../client/BookingCalendar";

const MONTH_SHORT = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/**
 * Komponen Kalender Pemilih Tanggal & Rentang (Notion/Modern Date Picker Style)
 * Sesuai lampiran referensi: 2 pill input di atas (dd/MM/yyyy), header bulan & Today < >,
 * kalender dengan sorotan range biru/brand, dan toggle "End date" di bagian bawah.
 */
export default function RescheduleDatePicker({
    initialStartDate,
    initialEndDate,
    initialMultiDay = false,
    blockedDates = [],
    onSave,
    onCancel,
    isSaving = false,
    errorMessage = "",
}) {
    const parseYmd = (str) => {
        if (!str) return null;
        const parts = String(str).slice(0, 10).split("-");
        if (parts.length !== 3) return null;
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        d.setHours(0, 0, 0, 0);
        return isNaN(d.getTime()) ? null : d;
    };

    const today = useMemo(() => {
        const t = new Date();
        t.setHours(0, 0, 0, 0);
        return t;
    }, []);

    const [startDate, setStartDate] = useState(() => parseYmd(initialStartDate) || today);
    const [endDate, setEndDate] = useState(() => parseYmd(initialEndDate) || parseYmd(initialStartDate) || today);
    const [hasEndDate, setHasEndDate] = useState(Boolean(initialMultiDay && initialEndDate));
    const [activeField, setActiveField] = useState("start"); // 'start' | 'end'
    const [viewMonth, setViewMonth] = useState(() => {
        const base = parseYmd(initialStartDate) || today;
        return new Date(base.getFullYear(), base.getMonth(), 1);
    });
    const [localError, setLocalError] = useState("");

    useEffect(() => {
        setLocalError(errorMessage || "");
    }, [errorMessage]);

    const handleToggleEndDate = () => {
        const next = !hasEndDate;
        setHasEndDate(next);
        if (next) {
            if (!endDate || endDate < startDate) {
                setEndDate(new Date(startDate));
            }
            setActiveField("end");
        } else {
            setActiveField("start");
        }
        setLocalError("");
    };

    const goPrevMonth = () => {
        setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const goNextMonth = () => {
        setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const goToday = () => {
        setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    };

    // Hitung grid 42 hari (6 minggu x 7 hari) mulai dari hari Minggu
    const calendarDays = useMemo(() => {
        const year = viewMonth.getFullYear();
        const month = viewMonth.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const startOffset = firstDayOfMonth.getDay(); // 0 (Sun) - 6 (Sat)

        const gridStart = new Date(year, month, 1 - startOffset);
        const days = [];
        for (let i = 0; i < 42; i++) {
            const d = new Date(gridStart);
            d.setDate(gridStart.getDate() + i);
            d.setHours(0, 0, 0, 0);
            days.push({
                date: d,
                ymd: formatDateToYMD(d),
                isCurrentMonth: d.getMonth() === month,
            });
        }
        return days;
    }, [viewMonth]);

    const isDateDisabled = (d, ymd) => {
        if (d < today) return true;
        return blockedDates.includes(ymd);
    };

    const hasBlockedInRange = (s, e) => {
        if (!s || !e) return false;
        const cur = new Date(s);
        const target = new Date(e);
        cur.setHours(0, 0, 0, 0);
        target.setHours(0, 0, 0, 0);
        while (cur <= target) {
            if (blockedDates.includes(formatDateToYMD(cur))) {
                return true;
            }
            cur.setDate(cur.getDate() + 1);
        }
        return false;
    };

    const handleDayClick = (dayObj) => {
        if (isDateDisabled(dayObj.date, dayObj.ymd)) return;
        setLocalError("");

        if (!hasEndDate) {
            setStartDate(dayObj.date);
            setEndDate(dayObj.date);
            return;
        }

        // Mode range (End date aktif)
        if (activeField === "start") {
            const newStart = dayObj.date;
            if (newStart > endDate) {
                setStartDate(newStart);
                setEndDate(newStart);
            } else {
                if (hasBlockedInRange(newStart, endDate)) {
                    setLocalError("Rentang tanggal melewati jadwal acara lain yang sudah terisi.");
                    return;
                }
                setStartDate(newStart);
            }
            setActiveField("end");
        } else {
            const newEnd = dayObj.date;
            if (newEnd < startDate) {
                // Jika user klik tanggal lebih awal saat pilih end, jadikan sebagai start baru
                setStartDate(newEnd);
                setActiveField("end");
            } else {
                if (hasBlockedInRange(startDate, newEnd)) {
                    setLocalError("Rentang tanggal melewati jadwal acara lain yang sudah terisi.");
                    return;
                }
                setEndDate(newEnd);
            }
        }
    };

    const handleSubmit = () => {
        const sYmd = formatDateToYMD(startDate);
        const eYmd = hasEndDate ? formatDateToYMD(endDate) : null;

        if (hasEndDate && hasBlockedInRange(startDate, endDate)) {
            setLocalError("Rentang tanggal melewati jadwal acara lain yang sudah terisi.");
            return;
        }

        onSave({
            event_date: sYmd,
            is_multi_day: hasEndDate,
            end_date: hasEndDate ? eYmd : null,
        });
    };

    return (
        <div className="mt-3 p-4 rounded-2xl border border-[#E8E2D7] bg-white text-[#2F3931] shadow-md w-full max-w-[330px] animate-fadeIn">
            {/* Baris Atas: 2 Kotak Pill Tanggal (dd/MM/yyyy) */}
            <div className="flex items-center gap-2 mb-3.5">
                <button
                    type="button"
                    onClick={() => setActiveField("start")}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-left border transition cursor-pointer font-mono ${
                        activeField === "start" || !hasEndDate
                            ? "border-[#657166] bg-[#FAF6F0] text-[#2F3931] ring-1 ring-[#657166]/30"
                            : "border-[#E8E2D7] bg-[#FAF6F0]/60 text-[#738075] hover:border-[#CFD8C4]"
                    }`}
                >
                    {formatDateToDMY(startDate)}
                </button>

                {hasEndDate && (
                    <button
                        type="button"
                        onClick={() => setActiveField("end")}
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-left border transition cursor-pointer font-mono ${
                            activeField === "end"
                                ? "border-[#657166] bg-[#FAF6F0] text-[#2F3931] ring-1 ring-[#657166]/30"
                                : "border-[#E8E2D7] bg-[#FAF6F0]/60 text-[#738075] hover:border-[#CFD8C4]"
                        }`}
                    >
                        {formatDateToDMY(endDate)}
                    </button>
                )}
            </div>

            {/* Baris Navigasi Bulan & Tahun */}
            <div className="flex items-center justify-between mb-3 px-0.5">
                <span className="text-sm font-bold text-[#2F3931]">
                    {MONTH_SHORT[viewMonth.getMonth()]} {viewMonth.getFullYear()}
                </span>

                <div className="flex items-center gap-1.5 text-xs">
                    <button
                        type="button"
                        onClick={goToday}
                        className="text-[#657166] hover:text-[#2F3931] font-semibold px-2 py-0.5 rounded-md hover:bg-[#FAF6F0] transition cursor-pointer"
                    >
                        Today
                    </button>
                    <button
                        type="button"
                        onClick={goPrevMonth}
                        className="w-6 h-6 flex items-center justify-center rounded-md text-[#657166] hover:text-[#2F3931] hover:bg-[#FAF6F0] transition cursor-pointer font-bold"
                        aria-label="Bulan sebelumnya"
                    >
                        &lsaquo;
                    </button>
                    <button
                        type="button"
                        onClick={goNextMonth}
                        className="w-6 h-6 flex items-center justify-center rounded-md text-[#657166] hover:text-[#2F3931] hover:bg-[#FAF6F0] transition cursor-pointer font-bold"
                        aria-label="Bulan berikutnya"
                    >
                        &rsaquo;
                    </button>
                </div>
            </div>

            {/* Header Nama Hari */}
            <div className="grid grid-cols-7 text-center text-[11px] font-bold text-[#738075] mb-1.5">
                {WEEKDAYS.map((day) => (
                    <div key={day} className="py-1">
                        {day}
                    </div>
                ))}
            </div>

            {/* Grid Tanggal */}
            <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
                {calendarDays.map((dayObj) => {
                    const disabled = isDateDisabled(dayObj.date, dayObj.ymd);
                    const startYmd = formatDateToYMD(startDate);
                    const endYmd = hasEndDate ? formatDateToYMD(endDate) : startYmd;
                    const isStart = dayObj.ymd === startYmd;
                    const isEnd = hasEndDate && dayObj.ymd === endYmd;
                    const isInRange = hasEndDate && dayObj.ymd > startYmd && dayObj.ymd < endYmd;
                    const isSingleSelected = !hasEndDate && isStart;

                    let btnClass = "h-8 w-full flex items-center justify-center text-xs transition relative ";

                    if (disabled) {
                        btnClass += "text-[#B6C2AA] cursor-not-allowed line-through opacity-60";
                    } else if (isSingleSelected || isStart || isEnd) {
                        btnClass += "bg-[#657166] text-white font-bold shadow-xs ";
                        if (isStart && isEnd) btnClass += "rounded-md";
                        else if (isStart && hasEndDate) btnClass += "rounded-l-md";
                        else if (isEnd) btnClass += "rounded-r-md";
                        else btnClass += "rounded-md";
                    } else if (isInRange) {
                        btnClass += "bg-[#DAEBE3] text-[#224436] font-semibold";
                    } else if (!dayObj.isCurrentMonth) {
                        btnClass += "text-[#A8B2A4] hover:bg-[#FAF6F0] rounded-md cursor-pointer";
                    } else {
                        btnClass += "text-[#2F3931] hover:bg-[#FAF6F0] rounded-md cursor-pointer font-medium";
                    }

                    return (
                        <button
                            key={dayObj.ymd}
                            type="button"
                            disabled={disabled}
                            onClick={() => handleDayClick(dayObj)}
                            className={btnClass}
                            title={blockedDates.includes(dayObj.ymd) ? "Tanggal terisi acara lain" : dayObj.ymd}
                        >
                            {dayObj.date.getDate()}
                        </button>
                    );
                })}
            </div>

            {/* Pesan Error */}
            {localError && (
                <p className="mt-2.5 text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5 font-medium">
                    {localError}
                </p>
            )}

            {/* Toggle "End date" */}
            <div className="mt-3 pt-3 border-t border-[#E8E2D7] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#2F3931]">End date</span>
                <button
                    type="button"
                    role="switch"
                    aria-checked={hasEndDate}
                    onClick={handleToggleEndDate}
                    className={`w-9 h-5 rounded-full transition-colors p-0.5 cursor-pointer flex items-center ${
                        hasEndDate ? "bg-[#657166] justify-end" : "bg-[#CFD8C4] justify-start"
                    }`}
                >
                    <span className="w-4 h-4 rounded-full bg-white shadow-xs block" />
                </button>
            </div>

            {/* Tombol Aksi */}
            <div className="mt-3 pt-2.5 border-t border-[#E8E2D7] flex items-center justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSaving}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-[#738075] border border-[#E8E2D7] hover:bg-[#FAF6F0] transition cursor-pointer"
                >
                    Batal
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className="px-3.5 py-1.5 rounded-lg text-[11px] font-bold bg-[#657166] hover:bg-[#556056] text-white border border-[#525C53] shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                    {isSaving ? "Menyimpan..." : "Simpan Jadwal"}
                </button>
            </div>
        </div>
    );
}

