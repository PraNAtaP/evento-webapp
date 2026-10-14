import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { checkRangeOverlap, formatDateToDMY, formatDateToYMD } from "./BookingCalendar";

/**
 * Komponen Form Pemesanan Acara untuk Klien.
 * Menyediakan form input nama acara, kategori acara, jumlah tamu, anggaran,
 * kepemilikan venue, serta rentang tanggal multi-hari terintegrasi kalender.
 *
 * @param {Object} props
 * @param {Date|Array<Date>} props.selectedDate - Tanggal tunggal atau rentang [startDate, endDate]
 * @param {function(Date|Array<Date>):void} [props.onDateChange] - Callback saat tanggal diubah via form
 * @param {boolean} [props.isMultiDay] - Status mode multi-day
 * @param {function(boolean):void} [props.onMultiDayChange] - Callback saat mode multi-day berubah
 * @param {Array<string>} [props.bookedDates] - Daftar tanggal terisi untuk validasi overlap
 * @param {function():void} [props.onBookingSuccess] - Callback saat booking berhasil dibuat
 * @param {string} [props.category] - Kategori terpilih (wedding, seminar, birthday)
 * @param {function(string):void} [props.onCategoryChange] - Callback saat kategori berubah
 */
export default function BookingForm({
    selectedDate,
    onDateChange,
    isMultiDay: propIsMultiDay,
    onMultiDayChange,
    bookedDates = [],
    onBookingSuccess,
    category: propCategory,
    onCategoryChange,
}) {
    const [eventName, setEventName] = useState("");
    const [internalCategory, setInternalCategory] = useState("wedding");
    const [guestCount, setGuestCount] = useState("");
    const [budget, setBudget] = useState("");
    const [hasOwnVenue, setHasOwnVenue] = useState(false);
    const [venue, setVenue] = useState("");

    const [internalIsMultiDay, setInternalIsMultiDay] = useState(false);
    const [customEndDate, setCustomEndDate] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState("");

    const category = propCategory !== undefined ? propCategory : internalCategory;
    const isMultiDay = propIsMultiDay !== undefined ? propIsMultiDay : internalIsMultiDay;

    // Menentukan startDate dan endDate dari selectedDate
    const startDate = Array.isArray(selectedDate) ? selectedDate[0] : selectedDate;
    const calendarEndDate = Array.isArray(selectedDate) && selectedDate[1] ? selectedDate[1] : null;

    // Effective end date (bisa dari kalender range atau manual input date)
    const effectiveEndDateStr = customEndDate || (calendarEndDate ? formatDateToYMD(calendarEndDate) : "");

    const handleCategoryChange = (newCategory) => {
        if (propCategory === undefined) {
            setInternalCategory(newCategory);
        }
        if (onCategoryChange) {
            onCategoryChange(newCategory);
        }
    };

    const handleMultiDayToggle = (checked) => {
        if (propIsMultiDay === undefined) {
            setInternalIsMultiDay(checked);
        }
        if (onMultiDayChange) {
            onMultiDayChange(checked);
        }
        if (!checked) {
            setCustomEndDate("");
        }
    };

    // Handler sinkronisasi dua arah saat user mengubah tanggal selesai via form date picker
    const handleEndDateChange = (newEndDateStr) => {
        setCustomEndDate(newEndDateStr);

        if (!newEndDateStr) return;

        const parts = newEndDateStr.split("-");
        if (parts.length !== 3) return;
        const [y, m, d] = parts.map(Number);
        const newEnd = new Date(y, m - 1, d);
        newEnd.setHours(0, 0, 0, 0);

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        if (newEnd < start) {
            setFieldErrors((prev) => ({
                ...prev,
                end_date: ["Tanggal selesai acara tidak boleh lebih awal dari tanggal mulai."],
            }));
            return;
        }

        if (checkRangeOverlap(start, newEnd, bookedDates)) {
            setFieldErrors((prev) => ({
                ...prev,
                end_date: ["Rentang tanggal yang dipilih melewati tanggal yang sudah terisi."],
            }));
            return;
        }

        setFieldErrors((prev) => {
            const updated = { ...prev };
            delete updated.end_date;
            return updated;
        });

        // Sinkronkan ke kalender
        if (onDateChange) {
            onDateChange([start, newEnd]);
        }
    };

    // Sinkronkan customEndDate jika calendarEndDate berubah dari kalender
    useEffect(() => {
        if (calendarEndDate) {
            setCustomEndDate(formatDateToYMD(calendarEndDate));
        }
    }, [calendarEndDate]);

    // Flash message auto-dismiss setelah 5 detik
    useEffect(() => {
        if (!successMessage && !errorMessage) return;

        const timer = setTimeout(() => {
            setSuccessMessage("");
            setErrorMessage("");
        }, 5000);

        return () => clearTimeout(timer);
    }, [successMessage, errorMessage]);

    const formatReadableDate = (date) => {
        if (!date) return "-";
        return new Intl.DateTimeFormat("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        }).format(date);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        setFieldErrors({});
        setSuccessMessage("");

        const formattedStartDate = formatDateToYMD(startDate);

        // Validasi cepat di sisi klien
        const errors = {};
        if (!eventName.trim()) {
            errors.event_name = ["Nama acara wajib diisi."];
        }
        if (!category) {
            errors.category = ["Kategori acara wajib dipilih."];
        }
        if (!guestCount || parseInt(guestCount, 10) < 1) {
            errors.guest_count = ["Estimasi jumlah tamu wajib diisi (minimal 1)."];
        }
        if (!budget || parseFloat(budget) < 0) {
            errors.budget = ["Anggaran acara wajib diisi."];
        }
        if (hasOwnVenue && !venue.trim()) {
            errors.venue = ["Nama gedung atau alamat lokasi acara wajib diisi jika sudah memiliki lokasi sendiri."];
        }

        if (!formattedStartDate) {
            setErrorMessage("Silakan pilih tanggal acara terlebih dahulu pada kalender.");
            return;
        }

        if (isMultiDay) {
            if (!effectiveEndDateStr) {
                errors.end_date = ["Tanggal selesai acara wajib ditentukan untuk acara multi-hari."];
            } else if (new Date(effectiveEndDateStr) < new Date(formattedStartDate)) {
                errors.end_date = ["Tanggal selesai acara tidak boleh lebih awal dari tanggal mulai."];
            } else if (checkRangeOverlap(startDate, new Date(effectiveEndDateStr), bookedDates)) {
                errors.end_date = ["Rentang tanggal yang dipilih melewati tanggal yang sudah terisi."];
            }
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setErrorMessage("Silakan periksa kembali data formulir yang belum sesuai.");
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                event_name: eventName.trim(),
                category,
                guest_count: parseInt(guestCount, 10),
                budget: parseFloat(budget),
                has_own_venue: Boolean(hasOwnVenue),
                venue: hasOwnVenue ? venue.trim() : null,
                event_date: formattedStartDate,
                is_multi_day: Boolean(isMultiDay),
                end_date: isMultiDay && effectiveEndDateStr ? effectiveEndDateStr : null,
            };

            const response = await api.post("/bookings", payload);

            setSuccessMessage(
                response.data?.message || "Booking acara berhasil dibuat."
            );

            // Reset form input
            setEventName("");
            setGuestCount("");
            setBudget("");
            setHasOwnVenue(false);
            setVenue("");
            setCustomEndDate("");

            if (onBookingSuccess) {
                onBookingSuccess(response.data?.event);
            }
        } catch (error) {
            if (error.response) {
                const { status, data } = error.response;
                if (status === 422) {
                    setErrorMessage(data.message || "Validasi gagal. Silakan periksa kembali data Anda.");
                    if (data.errors) {
                        setFieldErrors(data.errors);
                    }
                } else if (status === 403) {
                    setErrorMessage("Akses ditolak. Hanya akun klien yang dapat melakukan booking.");
                } else {
                    setErrorMessage(data.message || "Terjadi kesalahan saat memproses booking.");
                }
            } else {
                setErrorMessage("Gagal terhubung ke server. Pastikan koneksi internet stabil.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col gap-5">
            <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Formulir Pemesanan
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                    Buat Jadwal Acara Baru
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                    Lengkapi detail acara dan pastikan rentang tanggal tidak bertabrakan dengan jadwal yang sudah ada.
                </p>
            </div>

            {/* Flash Message Error (Tanpa Emoticon) */}
            {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-start justify-between gap-3 transition-all animate-fadeIn">
                    <div className="flex-1">
                        <p className="font-semibold">{errorMessage}</p>
                        {fieldErrors.event_date && (
                            <p className="text-rose-600 mt-1 font-medium">
                                {fieldErrors.event_date.join(", ")}
                            </p>
                        )}
                        {fieldErrors.end_date && (
                            <p className="text-rose-600 mt-1 font-medium">
                                {fieldErrors.end_date.join(", ")}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => setErrorMessage("")}
                        className="text-rose-400 hover:text-rose-700 font-bold text-base leading-none cursor-pointer"
                        title="Tutup pesan"
                        aria-label="Tutup pesan"
                    >
                        &times;
                    </button>
                </div>
            )}

            {/* Flash Message Sukses (Tanpa Emoticon) */}
            {successMessage && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs flex items-start justify-between gap-3 transition-all animate-fadeIn">
                    <p className="font-semibold flex-1">{successMessage}</p>
                    <button
                        type="button"
                        onClick={() => setSuccessMessage("")}
                        className="text-emerald-500 hover:text-emerald-700 font-bold text-base leading-none cursor-pointer"
                        title="Tutup pesan"
                        aria-label="Tutup pesan"
                    >
                        &times;
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* 1. Dropdown Kategori Acara */}
                <div>
                    <label
                        htmlFor="category"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                        Kategori Acara <span className="text-rose-500">*</span>
                    </label>
                    <select
                        id="category"
                        value={category}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        disabled={isSubmitting}
                        className={`w-full px-3.5 py-2.5 bg-white border ${
                            fieldErrors.category ? "border-rose-400 ring-1 ring-rose-200" : "border-slate-300"
                        } rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer`}
                    >
                        <option value="wedding">Wedding / Pernikahan (Batas Minimal H-60)</option>
                        <option value="seminar">Seminar / Konferensi (Batas Minimal H-30)</option>
                        <option value="birthday">Birthday / Ulang Tahun (Batas Minimal H-14)</option>
                    </select>
                    {fieldErrors.category && (
                        <p className="text-[11px] text-rose-600 mt-1">
                            {fieldErrors.category[0]}
                        </p>
                    )}
                </div>

                {/* 2. Nama Acara */}
                <div>
                    <label
                        htmlFor="eventName"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                        Nama Acara <span className="text-rose-500">*</span>
                    </label>
                    <input
                        id="eventName"
                        type="text"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        placeholder="Contoh: Pernikahan Budi & Siti / Seminar Teknologi AI"
                        maxLength={150}
                        disabled={isSubmitting}
                        className={`w-full px-3.5 py-2.5 bg-white border ${
                            fieldErrors.event_name ? "border-rose-400 ring-1 ring-rose-200" : "border-slate-300"
                        } rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                    />
                    {fieldErrors.event_name && (
                        <p className="text-[11px] text-rose-600 mt-1">
                            {fieldErrors.event_name[0]}
                        </p>
                    )}
                </div>

                {/* 3. Checkbox Acara Multi-Hari */}
                <div className="pt-1">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={isMultiDay}
                            onChange={(e) => handleMultiDayToggle(e.target.checked)}
                            disabled={isSubmitting}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-slate-800">
                            Acara lebih dari 1 hari (Rentang Hari / Multi-day)
                        </span>
                    </label>
                    <p className="text-[11px] text-slate-400 ml-6 mt-0.5">
                        Centang opsi ini untuk memilih tanggal mulai dan selesai secara langsung di kalender.
                    </p>
                </div>

                {/* 4. Tampilan Tanggal Acara (Format Seragam dd-MM-yyyy) */}
                <div className={isMultiDay ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : ""}>
                    {/* Tanggal Mulai */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            {isMultiDay ? "Tanggal Mulai" : "Tanggal Acara"} <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                readOnly
                                value={formatDateToDMY(startDate)}
                                placeholder="dd/MM/yyyy"
                                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none cursor-default font-mono tracking-wide"
                            />
                            <span className="absolute right-3.5 top-3 text-slate-400 pointer-events-none">
                                <svg
                                    width="14"
                                    height="14"
                                    className="w-3.5 h-3.5 text-slate-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                            pilih dari kalender
                        </p>
                    </div>

                    {/* Tanggal Selesai (Jika Multi-Day) */}
                    {isMultiDay && (
                        <div className="animate-fadeIn">
                            <label
                                htmlFor="endDateInput"
                                className="block text-xs font-semibold text-slate-700 mb-1.5"
                            >
                                Tanggal Selesai <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                {/* Tampilan seragam teks berformat dd-MM-yyyy */}
                                <input
                                    type="text"
                                    readOnly
                                    value={effectiveEndDateStr ? formatDateToDMY(effectiveEndDateStr) : ""}
                                    placeholder="dd/MM/yyyy"
                                    className={`w-full pl-3.5 pr-10 py-2.5 bg-white border ${
                                        fieldErrors.end_date ? "border-rose-400 ring-1 ring-rose-200" : "border-slate-300"
                                    } rounded-xl text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer font-mono tracking-wide`}
                                />
                                <span className="absolute right-3.5 top-3 text-slate-400 pointer-events-none">
                                    <svg
                                        width="14"
                                        height="14"
                                        className="w-3.5 h-3.5 text-slate-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                </span>
                                {/* Native datepicker overlay untuk memicu pemilih tanggal dan sinkronisasi real-time */}
                                <input
                                    id="endDateInput"
                                    type="date"
                                    min={formatDateToYMD(startDate) || undefined}
                                    value={effectiveEndDateStr}
                                    onChange={(e) => handleEndDateChange(e.target.value)}
                                    disabled={isSubmitting}
                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                    title="Pilih tanggal selesai acara"
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">
                                klik untuk buka pemilih tanggal
                            </p>
                            {fieldErrors.end_date && (
                                <p className="text-[11px] text-rose-600 mt-1">
                                    {fieldErrors.end_date[0]}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* 5. Estimasi Jumlah Tamu & Anggaran */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label
                            htmlFor="guestCount"
                            className="block text-xs font-semibold text-slate-700 mb-1.5"
                        >
                            Estimasi Tamu <span className="text-rose-500">*</span>
                        </label>
                        <input
                            id="guestCount"
                            type="number"
                            min="1"
                            value={guestCount}
                            onChange={(e) => setGuestCount(e.target.value)}
                            placeholder="Contoh: 250"
                            disabled={isSubmitting}
                            className={`w-full px-3.5 py-2.5 bg-white border ${
                                fieldErrors.guest_count ? "border-rose-400 ring-1 ring-rose-200" : "border-slate-300"
                            } rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                        />
                        {fieldErrors.guest_count && (
                            <p className="text-[11px] text-rose-600 mt-1">
                                {fieldErrors.guest_count[0]}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="budget"
                            className="block text-xs font-semibold text-slate-700 mb-1.5"
                        >
                            Anggaran / Budget (Rp) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400 pointer-events-none">
                                Rp
                            </span>
                            <input
                                id="budget"
                                type="number"
                                min="0"
                                step="100000"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                placeholder="Contoh: 50000000"
                                disabled={isSubmitting}
                                className={`w-full pl-10 pr-3.5 py-2.5 bg-white border ${
                                    fieldErrors.budget ? "border-rose-400 ring-1 ring-rose-200" : "border-slate-300"
                                } rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                            />
                        </div>
                        {fieldErrors.budget && (
                            <p className="text-[11px] text-rose-600 mt-1">
                                {fieldErrors.budget[0]}
                            </p>
                        )}
                    </div>
                </div>

                {/* 6. Checkbox Lokasi Punya Sendiri */}
                <div className="pt-1">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                        <input
                            id="hasOwnVenue"
                            type="checkbox"
                            checked={hasOwnVenue}
                            onChange={(e) => setHasOwnVenue(e.target.checked)}
                            disabled={isSubmitting}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-xs font-medium text-slate-700">
                            Saya sudah memiliki lokasi / venue sendiri
                        </span>
                    </label>
                </div>

                {/* 7. Input Teks Alamat Lokasi (Jika Checkbox Dicentang) */}
                {hasOwnVenue && (
                    <div className="animate-fadeIn">
                        <label
                            htmlFor="venue"
                            className="block text-xs font-semibold text-slate-700 mb-1.5"
                        >
                            Nama Gedung & Alamat Lokasi Acara <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            id="venue"
                            rows={2}
                            value={venue}
                            onChange={(e) => setVenue(e.target.value)}
                            placeholder="Contoh: Gedung Serbaguna Puri Ardhya Garini, Jl. Protokol Halim Perdanakusuma, Jakarta Timur"
                            maxLength={255}
                            disabled={isSubmitting}
                            className={`w-full px-3.5 py-2.5 bg-white border ${
                                fieldErrors.venue ? "border-rose-400 ring-1 ring-rose-200" : "border-slate-300"
                            } rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none`}
                        />
                        {fieldErrors.venue && (
                            <p className="text-[11px] text-rose-600 mt-1">
                                {fieldErrors.venue[0]}
                            </p>
                        )}
                    </div>
                )}

                {/* Tombol Submit */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-2 w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <>
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            <span>Memproses Booking...</span>
                        </>
                    ) : (
                        <span>Ajukan Booking Acara</span>
                    )}
                </button>
            </form>
        </div>
    );
}
