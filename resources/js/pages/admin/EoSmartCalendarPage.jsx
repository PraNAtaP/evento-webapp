import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import BookingCalendar, {
    checkRangeOverlap,
    formatDateToDMY,
    formatDateToYMD,
} from "../../components/client/BookingCalendar";
import LocationPicker from "../../components/location/LocationPicker";
import { CATEGORY_LABELS } from "../../data/kanbanData";
import { formatCurrencyInput, formatDate, formatNumber, formatRupiah, parseCurrencyInput } from "../../utils/formatters";

export default function EoSmartCalendarPage() {
    const queryClient = useQueryClient();
    const [selectedDate, setSelectedDate] = useState(() => new Date());
    const [isMultiDay, setIsMultiDay] = useState(false);
    const [customEndDate, setCustomEndDate] = useState("");
    const [category, setCategory] = useState("wedding");

    // Mode klien: pilih akun klien terdaftar atau ketik manual nama klien (untuk kontak mendadak via WA/langsung)
    const [clientMode, setClientMode] = useState("manual"); // 'manual' | 'registered'
    const [selectedClientId, setSelectedClientId] = useState("");
    const [manualClientName, setManualClientName] = useState("");
    const [manualClientContact, setManualClientContact] = useState("");

    const [eventName, setEventName] = useState("");
    const [guestCount, setGuestCount] = useState("");
    const [budget, setBudget] = useState("");
    const [hasOwnVenue, setHasOwnVenue] = useState(false);
    const [venue, setVenue] = useState("");
    const [location, setLocation] = useState(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});

    // State read-only detail acara ketika tanggal terblokir diklik oleh EO
    const [inspectedEvent, setInspectedEvent] = useState(null);
    const [inspectedDateStr, setInspectedDateStr] = useState("");

    // Ambil kategori aktif
    const { data: dbCategories = [] } = useQuery({
        queryKey: ["event-categories"],
        queryFn: async () => {
            const res = await api.get("/event-categories");
            return res.data?.data || [];
        },
    });

    // Ambil data Smart Calendar EO (booked_dates, events_by_date, daftar clients)
    const { data: calendarData, isLoading: isCalendarLoading } = useQuery({
        queryKey: ["admin-smart-calendar"],
        queryFn: async () => {
            const res = await api.get("/admin/smart-calendar");
            return res.data;
        },
    });

    const bookedDates = calendarData?.booked_dates || [];
    const eventsByDate = calendarData?.events_by_date || {};
    const registeredClients = calendarData?.clients || [];

    const startDate = Array.isArray(selectedDate) ? selectedDate[0] : selectedDate;
    const calendarEndDate = Array.isArray(selectedDate) && selectedDate[1] ? selectedDate[1] : null;
    const effectiveEndDateStr = customEndDate || (calendarEndDate ? formatDateToYMD(calendarEndDate) : "");

    const handleCalendarSelect = (val) => {
        // Saat EO klik tanggal kosong baru, tutup panel read-only jika sebelumnya terbuka dan siapkan form input
        setInspectedEvent(null);
        setInspectedDateStr("");
        setSelectedDate(val);
        if (Array.isArray(val) && val[1]) {
            setCustomEndDate(formatDateToYMD(val[1]));
        } else {
            setCustomEndDate("");
        }
    };

    const handleBookedDateClick = (dateStr) => {
        const matchedEvent = eventsByDate[dateStr];
        if (matchedEvent) {
            setInspectedEvent(matchedEvent);
            setInspectedDateStr(dateStr);
            setErrorMessage("");
        }
    };

    const handleMultiDayToggle = (checked) => {
        setIsMultiDay(checked);
        const base = Array.isArray(selectedDate) ? selectedDate[0] : selectedDate;
        if (checked) {
            setSelectedDate([base, base]);
        } else {
            setSelectedDate(base);
            setCustomEndDate("");
        }
    };

    const handleEndDateInput = (newEndStr) => {
        setCustomEndDate(newEndStr);
        if (!newEndStr) return;

        const [y, m, d] = newEndStr.split("-").map(Number);
        const endObj = new Date(y, m - 1, d);
        endObj.setHours(0, 0, 0, 0);

        const startObj = new Date(startDate);
        startObj.setHours(0, 0, 0, 0);

        if (endObj < startObj) {
            setFieldErrors((prev) => ({
                ...prev,
                end_date: ["Tanggal selesai tidak boleh lebih awal dari tanggal mulai."],
            }));
            return;
        }

        if (checkRangeOverlap(startObj, endObj, bookedDates)) {
            setFieldErrors((prev) => ({
                ...prev,
                end_date: ["Rentang tanggal melewati tanggal yang sudah terisi."],
            }));
            return;
        }

        setFieldErrors((prev) => {
            const copy = { ...prev };
            delete copy.end_date;
            return copy;
        });

        setSelectedDate([startObj, endObj]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");
        setFieldErrors({});

        const formattedStart = formatDateToYMD(startDate);
        const errors = {};

        if (clientMode === "registered" && !selectedClientId) {
            errors.client_id = ["Silakan pilih akun klien terdaftar."];
        }
        if (clientMode === "manual" && !manualClientName.trim()) {
            errors.manual_client_name = ["Nama klien pemesan wajib diisi."];
        }
        if (!eventName.trim()) {
            errors.event_name = ["Nama acara wajib diisi."];
        }
        if (!guestCount || parseInt(guestCount, 10) < 1) {
            errors.guest_count = ["Estimasi jumlah tamu wajib diisi."];
        }
        if (!budget || parseFloat(budget) < 0) {
            errors.budget = ["Anggaran acara wajib diisi."];
        }
        if (hasOwnVenue && !venue.trim()) {
            errors.venue = ["Nama atau alamat lokasi acara wajib diisi."];
        }
        if (hasOwnVenue && !location) {
            errors.lat = ["Pilih titik lokasi venue di peta."];
        }
        if (!formattedStart) {
            setErrorMessage("Silakan pilih tanggal acara pada kalender.");
            return;
        }
        if (bookedDates.includes(formattedStart)) {
            setErrorMessage("Tanggal mulai sudah terisi. Pilih tanggal lain yang masih tersedia.");
            return;
        }
        if (isMultiDay) {
            if (!effectiveEndDateStr) {
                errors.end_date = ["Tanggal selesai wajib diisi."];
            } else if (checkRangeOverlap(startDate, new Date(effectiveEndDateStr), bookedDates)) {
                errors.end_date = ["Rentang tanggal melewati jadwal yang sudah terisi."];
            }
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setErrorMessage("Silakan lengkapi seluruh kolom yang ditandai wajib.");
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                client_id: clientMode === "registered" ? parseInt(selectedClientId, 10) : null,
                manual_client_name: clientMode === "manual" ? manualClientName.trim() : null,
                manual_client_contact: clientMode === "manual" ? manualClientContact.trim() || null : null,
                event_name: eventName.trim(),
                category,
                guest_count: parseInt(guestCount, 10),
                budget: parseFloat(budget),
                has_own_venue: Boolean(hasOwnVenue),
                venue: hasOwnVenue ? venue.trim() : null,
                lat: hasOwnVenue && location ? location.lat : null,
                lng: hasOwnVenue && location ? location.lng : null,
                event_date: formattedStart,
                is_multi_day: Boolean(isMultiDay),
                end_date: isMultiDay && effectiveEndDateStr ? effectiveEndDateStr : null,
            };

            const res = await api.post("/admin/smart-calendar/bookings", payload);

            setSuccessMessage(res.data?.message || "Acara berhasil ditambahkan oleh EO.");

            // Reset formulir
            setEventName("");
            setManualClientName("");
            setManualClientContact("");
            setSelectedClientId("");
            setGuestCount("");
            setBudget("");
            setHasOwnVenue(false);
            setVenue("");
            setLocation(null);
            setCustomEndDate("");

            // Segarkan data Smart Calendar EO, Pesanan Masuk, Kanban, dan tanggal terisi Klien
            queryClient.invalidateQueries(["admin-smart-calendar"]);
            queryClient.invalidateQueries(["admin-event-orders"]);
            queryClient.invalidateQueries(["booked-dates"]);
        } catch (err) {
            if (err.response?.status === 422) {
                setErrorMessage(err.response.data?.message || "Validasi gagal.");
                if (err.response.data?.errors) {
                    setFieldErrors(err.response.data.errors);
                }
            } else {
                setErrorMessage(err.response?.data?.message || "Terjadi kesalahan saat menyimpan pesanan manual.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">
            {/* Header Info */}
            <div className="bg-white rounded-2xl border border-[#E8E2D7] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <span className="inline-block text-[10px] font-bold text-[#224436] bg-[#DAEBE3] px-2.5 py-0.5 rounded-full border border-[#BCD4C9] mb-1 uppercase tracking-wider">
                        Input Manual & Pemesanan Mendadak
                    </span>
                    <h1 className="text-xl font-extrabold text-[#2F3931]">
                        Smart Calendar EO
                    </h1>
                    <p className="text-xs text-[#738075] mt-0.5">
                        Masukkan jadwal acara secara langsung (bypass batas H-min) atau klik tanggal berwarna hijau tua untuk memeriksa detail acara yang sudah terisi secara read-only.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Kolom Kiri: Kalender Interaktif EO */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                    <BookingCalendar
                        value={selectedDate}
                        onChange={handleCalendarSelect}
                        minDate={new Date()}
                        bookedDates={bookedDates}
                        selectRange={isMultiDay}
                        category={category}
                        eoMode={true}
                        onBookedDateClick={handleBookedDateClick}
                    />

                    {/* Legenda Kalender EO */}
                    <div className="bg-white rounded-2xl border border-[#E8E2D7] p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs text-[#2F3931]">
                        <span className="font-bold">Keterangan Kalender EO:</span>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-[#CFD8C4] border border-[#B6C2AA] inline-block"></span>
                            <span>Tanggal Kosong (Dapat Diinput)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-[#657166] inline-block"></span>
                            <span className="font-bold">Terblokir / Terisi (Klik untuk Read-Only Detail)</span>
                        </div>
                    </div>

                    {isCalendarLoading && (
                        <p className="text-xs text-[#738075] animate-pulse">Memuat data jadwal acara...</p>
                    )}
                </div>

                {/* Kolom Kanan: Read-Only Detail Acara Terblokir ATAU Form Input Manual EO */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                    {inspectedEvent ? (
                        /* PANEL READ-ONLY KETIKA TANGGAL TERBLOKIR DIKLIK EO */
                        <div className="bg-white rounded-2xl border-2 border-[#657166] p-6 shadow-md flex flex-col gap-4 animate-fadeIn">
                            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E8E2D7]">
                                <div>
                                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#657166] text-white mb-1">
                                        Detail Acara (Read-Only)
                                    </span>
                                    <h3 className="text-lg font-extrabold text-[#2F3931] leading-tight">
                                        {inspectedEvent.event_name}
                                    </h3>
                                    <p className="text-xs text-[#738075] mt-0.5">
                                        Tanggal Terklik: {formatDate(inspectedDateStr)}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setInspectedEvent(null);
                                        setInspectedDateStr("");
                                    }}
                                    className="px-2.5 py-1 text-xs font-bold bg-[#FAF6F0] hover:bg-[#E8E2D7] text-[#2F3931] rounded-lg border border-[#E8E2D7] cursor-pointer"
                                >
                                    Tutup & Input Baru
                                </button>
                            </div>

                            {/* Bidang-bidang Read-Only yang Terisi */}
                            <div className="space-y-3 text-xs">
                                <div className="p-3 bg-[#FAF6F0] rounded-xl border border-[#E8E2D7]">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#738075] block">
                                        Sumber & Pemesan Acara
                                    </span>
                                    <p className="font-bold text-[#2F3931] text-sm mt-0.5">
                                        {inspectedEvent.client_name}
                                    </p>
                                    {inspectedEvent.manual_client_contact && (
                                        <p className="text-[11px] text-[#556056] mt-0.5">
                                            Kontak: {inspectedEvent.manual_client_contact}
                                        </p>
                                    )}
                                    {inspectedEvent.client_email && !inspectedEvent.booked_by_eo && (
                                        <p className="text-[11px] text-[#556056] mt-0.5">
                                            Email: {inspectedEvent.client_email}
                                        </p>
                                    )}
                                    <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded bg-[#DAEBE3] text-[#224436] border border-[#BCD4C9]">
                                        {inspectedEvent.booked_by_eo ? "Diinput Manual oleh EO" : "Dipesan Langsung oleh Klien"}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-white rounded-xl border border-[#E8E2D7]">
                                        <span className="text-[10px] font-bold uppercase text-[#738075] block">Kategori</span>
                                        <span className="font-bold text-[#2F3931] mt-0.5 block">
                                            {CATEGORY_LABELS[inspectedEvent.category] || inspectedEvent.category}
                                        </span>
                                    </div>
                                    <div className="p-3 bg-white rounded-xl border border-[#E8E2D7]">
                                        <span className="text-[10px] font-bold uppercase text-[#738075] block">Status Tahap</span>
                                        <span className="font-bold text-[#1D4A54] uppercase mt-0.5 block">
                                            {inspectedEvent.kanban_status}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-3 bg-white rounded-xl border border-[#E8E2D7]">
                                    <span className="text-[10px] font-bold uppercase text-[#738075] block">Jadwal Pelaksanaan</span>
                                    <span className="font-bold text-[#2F3931] mt-0.5 block">
                                        {inspectedEvent.is_multi_day && inspectedEvent.end_date
                                            ? `${formatDate(inspectedEvent.event_date)} - ${formatDate(inspectedEvent.end_date)}`
                                            : formatDate(inspectedEvent.event_date)}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-white rounded-xl border border-[#E8E2D7]">
                                        <span className="text-[10px] font-bold uppercase text-[#738075] block">Estimasi Tamu</span>
                                        <span className="font-bold text-[#2F3931] mt-0.5 block">
                                            {formatNumber(inspectedEvent.guest_count)} orang
                                        </span>
                                    </div>
                                    <div className="p-3 bg-white rounded-xl border border-[#E8E2D7]">
                                        <span className="text-[10px] font-bold uppercase text-[#738075] block">Anggaran / Nilai</span>
                                        <span className="font-bold text-[#1D4A54] mt-0.5 block">
                                            {formatRupiah(inspectedEvent.agreed_price || inspectedEvent.estimated_budget)}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-3 bg-white rounded-xl border border-[#E8E2D7]">
                                    <span className="text-[10px] font-bold uppercase text-[#738075] block">Lokasi / Venue</span>
                                    <span className="font-semibold text-[#2F3931] mt-0.5 block">
                                        {inspectedEvent.has_own_venue
                                            ? inspectedEvent.venue || "Lokasi disediakan pemesan"
                                            : "Rekomendasi Venue dari EO"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* FORMULIR INPUT ACARA MANUAL EO */
                        <div className="bg-white rounded-2xl border border-[#E8E2D7] p-6 shadow-xs flex flex-col gap-5">
                            <div>
                                <span className="text-[11px] font-bold text-[#738075] uppercase tracking-wider">
                                    Formulir Input EO
                                </span>
                                <h3 className="text-lg font-bold text-[#2F3931] mt-0.5">
                                    Tambah Pesanan Acara Manual
                                </h3>
                                <p className="text-xs text-[#738075] mt-1">
                                    Data akan langsung masuk ke daftar Pesanan Masuk dan memblokir tanggal terkait.
                                </p>
                            </div>

                            {errorMessage && (
                                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-start justify-between gap-3">
                                    <p className="font-semibold">{errorMessage}</p>
                                    <button type="button" onClick={() => setErrorMessage("")} className="font-bold text-base leading-none cursor-pointer">&times;</button>
                                </div>
                            )}

                            {successMessage && (
                                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs flex items-start justify-between gap-3">
                                    <p className="font-semibold">{successMessage}</p>
                                    <button type="button" onClick={() => setSuccessMessage("")} className="font-bold text-base leading-none cursor-pointer">&times;</button>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                {/* Pilihan Sumber Data Klien */}
                                <div className="p-3 bg-[#FAF6F0] rounded-xl border border-[#E8E2D7]">
                                    <label className="block text-xs font-bold text-[#2F3931] mb-2">
                                        Identitas Klien Pemesan <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="flex items-center gap-2 mb-3">
                                        <button
                                            type="button"
                                            onClick={() => setClientMode("manual")}
                                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                                                clientMode === "manual"
                                                    ? "bg-[#657166] text-white border-[#525C53]"
                                                    : "bg-white text-[#738075] border-[#E8E2D7]"
                                            }`}
                                        >
                                            Input Nama Manual (WA/Langsung)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setClientMode("registered")}
                                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                                                clientMode === "registered"
                                                    ? "bg-[#657166] text-white border-[#525C53]"
                                                    : "bg-white text-[#738075] border-[#E8E2D7]"
                                            }`}
                                        >
                                            Pilih Akun Klien
                                        </button>
                                    </div>

                                    {clientMode === "manual" ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            <div>
                                                <input
                                                    type="text"
                                                    value={manualClientName}
                                                    onChange={(e) => setManualClientName(e.target.value)}
                                                    placeholder="Nama Klien (cth: Andi & Sari)"
                                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#99CDD8]"
                                                />
                                                {fieldErrors.manual_client_name && (
                                                    <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.manual_client_name[0]}</p>
                                                )}
                                            </div>
                                            <div>
                                                <input
                                                    type="text"
                                                    value={manualClientContact}
                                                    onChange={(e) => setManualClientContact(e.target.value)}
                                                    placeholder="No. WhatsApp / Telp (opsional)"
                                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#99CDD8]"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <select
                                                value={selectedClientId}
                                                onChange={(e) => setSelectedClientId(e.target.value)}
                                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#99CDD8]"
                                            >
                                                <option value="">-- Pilih Akun Klien Terdaftar --</option>
                                                {registeredClients.map((c) => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.name} ({c.email})
                                                    </option>
                                                ))}
                                            </select>
                                            {fieldErrors.client_id && (
                                                <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.client_id[0]}</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Kategori Acara */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Kategori Acara <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        disabled={isSubmitting}
                                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#99CDD8]"
                                    >
                                        {dbCategories.length > 0 ? (
                                            dbCategories.map((cat) => (
                                                <option key={cat.id} value={cat.slug}>
                                                    {cat.name}
                                                </option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="wedding">Wedding / Pernikahan</option>
                                                <option value="seminar">Seminar / Konferensi</option>
                                                <option value="birthday">Birthday / Ulang Tahun</option>
                                            </>
                                        )}
                                    </select>
                                </div>

                                {/* Nama Acara */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Nama Acara <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={eventName}
                                        onChange={(e) => setEventName(e.target.value)}
                                        placeholder="Contoh: Resepsi Pernikahan Andi & Sari (Urgent)"
                                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#99CDD8]"
                                    />
                                    {fieldErrors.event_name && (
                                        <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.event_name[0]}</p>
                                    )}
                                </div>

                                {/* Multi-Day Checkbox */}
                                <div>
                                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={isMultiDay}
                                            onChange={(e) => handleMultiDayToggle(e.target.checked)}
                                            disabled={isSubmitting}
                                            className="w-4 h-4 text-[#657166] rounded border-slate-300 cursor-pointer"
                                        />
                                        <span className="text-xs font-semibold text-slate-800">
                                            Acara lebih dari 1 hari (Rentang Hari)
                                        </span>
                                    </label>
                                </div>

                                {/* Tanggal Mulai & Selesai */}
                                <div className={isMultiDay ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : ""}>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            {isMultiDay ? "Tanggal Mulai" : "Tanggal Acara"} <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={formatDateToDMY(startDate)}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 font-mono"
                                        />
                                    </div>

                                    {isMultiDay && (
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                                Tanggal Selesai <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={effectiveEndDateStr ? formatDateToDMY(effectiveEndDateStr) : ""}
                                                    placeholder="dd/MM/yyyy"
                                                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 font-mono cursor-pointer"
                                                />
                                                <input
                                                    type="date"
                                                    min={formatDateToYMD(startDate) || undefined}
                                                    value={effectiveEndDateStr}
                                                    onChange={(e) => handleEndDateInput(e.target.value)}
                                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                                />
                                            </div>
                                            {fieldErrors.end_date && (
                                                <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.end_date[0]}</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Tamu & Budget */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            Estimasi Tamu <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={guestCount}
                                            onChange={(e) => setGuestCount(e.target.value)}
                                            placeholder="Contoh: 250"
                                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#99CDD8]"
                                        />
                                        {fieldErrors.guest_count && (
                                            <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.guest_count[0]}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            Anggaran / Budget (Rp) <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={formatCurrencyInput(budget)}
                                                onChange={(e) => setBudget(parseCurrencyInput(e.target.value))}
                                                placeholder="Contoh: 50.000.000"
                                                className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#99CDD8]"
                                            />
                                        </div>
                                        {fieldErrors.budget && (
                                            <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.budget[0]}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Lokasi Punya Sendiri */}
                                <div>
                                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={hasOwnVenue}
                                            onChange={(e) => {
                                                setHasOwnVenue(e.target.checked);
                                                if (!e.target.checked) setLocation(null);
                                            }}
                                            className="w-4 h-4 text-[#657166] rounded border-slate-300 cursor-pointer"
                                        />
                                        <span className="text-xs font-medium text-slate-700">
                                            Klien sudah memiliki lokasi / venue sendiri
                                        </span>
                                    </label>
                                </div>

                                {hasOwnVenue && (
                                    <div className="space-y-3 animate-fadeIn">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                                Nama Gedung & Alamat Lokasi <span className="text-rose-500">*</span>
                                            </label>
                                            <textarea
                                                rows={2}
                                                value={venue}
                                                onChange={(e) => setVenue(e.target.value)}
                                                placeholder="Alamat lengkap gedung / lokasi acara..."
                                                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#99CDD8]"
                                            />
                                            {fieldErrors.venue && (
                                                <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.venue[0]}</p>
                                            )}
                                        </div>

                                        <div>
                                            <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                                                Titik Lokasi Venue <span className="text-rose-500">*</span>
                                            </span>
                                            <LocationPicker
                                                value={location}
                                                onChange={setLocation}
                                                disabled={isSubmitting}
                                                hasError={Boolean(fieldErrors.lat || fieldErrors.lng)}
                                                searchQuery={venue}
                                            />
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="mt-2 w-full px-4 py-3 bg-[#657166] hover:bg-[#556056] disabled:bg-[#657166]/50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed border border-[#525C53]"
                                >
                                    {isSubmitting ? "Menyimpan Pesanan..." : "Simpan Pesanan Acara (EO)"}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

