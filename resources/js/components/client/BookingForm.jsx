import React, { useEffect, useState } from "react";
import api from "../../api/axios";

/**
 * Komponen Form Pemesanan Acara untuk Klien.
 * Menyediakan form input nama acara, kategori acara, jumlah tamu, anggaran,
 * kepemilikan venue, dan opsi multi-day.
 *
 * @param {Object} props
 * @param {Date} props.selectedDate - Tanggal yang sedang dipilih dari kalender
 * @param {function():void} [props.onBookingSuccess] - Callback saat booking berhasil dibuat
 * @param {string} [props.category] - Kategori yang sedang dipilih (opsional controlled)
 * @param {function(string):void} [props.onCategoryChange] - Callback saat kategori berubah
 */
export default function BookingForm({
    selectedDate,
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
    const [isMultiDay, setIsMultiDay] = useState(false);
    const [endDate, setEndDate] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState("");

    const category = propCategory !== undefined ? propCategory : internalCategory;

    const handleCategoryChange = (newCategory) => {
        if (propCategory === undefined) {
            setInternalCategory(newCategory);
        }
        if (onCategoryChange) {
            onCategoryChange(newCategory);
        }
    };

    // Flash message auto-dismiss setelah 5 detik
    useEffect(() => {
        if (!successMessage && !errorMessage) return;

        const timer = setTimeout(() => {
            setSuccessMessage("");
            setErrorMessage("");
        }, 5000);

        return () => clearTimeout(timer);
    }, [successMessage, errorMessage]);

    // Helper mengubah objek Date ke format YYYY-MM-DD lokal
    const formatDateToYMD = (date) => {
        if (!date) return "";
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        setFieldErrors({});
        setSuccessMessage("");

        const formattedDate = formatDateToYMD(selectedDate);

        // Validasi cepat di sisi klien sebelum request
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
        if (isMultiDay && !endDate) {
            errors.end_date = ["Tanggal selesai acara wajib diisi untuk acara multi-hari."];
        }
        if (!formattedDate) {
            setErrorMessage("Silakan pilih tanggal acara terlebih dahulu pada kalender.");
            return;
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setErrorMessage("Silakan periksa kembali data formulir yang belum lengkap.");
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
                event_date: formattedDate,
                is_multi_day: Boolean(isMultiDay),
                end_date: isMultiDay && endDate ? endDate : null,
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
            setIsMultiDay(false);
            setEndDate("");

            if (onBookingSuccess) {
                onBookingSuccess(response.data?.event);
            }
        } catch (error) {
            if (error.response) {
                const { status, data } = error.response;
                if (status === 422) {
                    // Validasi backend gagal (misal H-min tidak terpenuhi atau tanggal sudah terisi)
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
                    Lengkapi detail acara dan pastikan tanggal pemesanan memenuhi ketentuan batas waktu.
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
                    <p className="text-[11px] text-slate-400 mt-1">
                        {category === "wedding" && "Pemesanan acara pernikahan memerlukan persiapan minimal 60 hari."}
                        {category === "seminar" && "Pemesanan acara seminar memerlukan persiapan minimal 30 hari."}
                        {category === "birthday" && "Pemesanan acara ulang tahun memerlukan persiapan minimal 14 hari."}
                    </p>
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

                {/* 3. Tanggal Acara (Mulai) dari Kalender */}
                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Tanggal Acara {isMultiDay ? "(Tanggal Mulai)" : ""} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            readOnly
                            value={formatReadableDate(selectedDate)}
                            className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none cursor-default"
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
                    <p className="text-[11px] text-slate-400 mt-1">
                        Pilih tanggal langsung dengan mengklik tanggal di kalender sebelah kiri.
                    </p>
                </div>

                {/* Opsi Multi-Day */}
                <div className="pt-1">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={isMultiDay}
                            onChange={(e) => setIsMultiDay(e.target.checked)}
                            disabled={isSubmitting}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-xs font-medium text-slate-700">
                            Acara berlangsung lebih dari 1 hari (Multi-day)
                        </span>
                    </label>
                </div>

                {/* Tanggal Selesai (Jika Multi-Day) */}
                {isMultiDay && (
                    <div className="animate-fadeIn">
                        <label
                            htmlFor="endDate"
                            className="block text-xs font-semibold text-slate-700 mb-1.5"
                        >
                            Tanggal Selesai Acara <span className="text-rose-500">*</span>
                        </label>
                        <input
                            id="endDate"
                            type="date"
                            min={formatDateToYMD(selectedDate) || undefined}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            disabled={isSubmitting}
                            className={`w-full px-3.5 py-2.5 bg-white border ${
                                fieldErrors.end_date ? "border-rose-400 ring-1 ring-rose-200" : "border-slate-300"
                            } rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                        />
                        {fieldErrors.end_date && (
                            <p className="text-[11px] text-rose-600 mt-1">
                                {fieldErrors.end_date[0]}
                            </p>
                        )}
                    </div>
                )}

                {/* Grid 2 Kolom: Jumlah Tamu & Anggaran */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 4. Estimasi Jumlah Tamu */}
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

                    {/* 5. Anggaran Acara */}
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
