import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import BookingCalendar, { generateWhatsAppUrl } from "../../components/client/BookingCalendar";
import BookingForm from "../../components/client/BookingForm";
import ClientQuotationsSection from "../../components/client/ClientQuotationsSection";
import ProgressTimeline from "../../components/client/ProgressTimeline";

export default function ClientDashboard() {
    const { user, logout } = useAuth();
    const [category, setCategory] = useState("wedding");
    const [isMultiDay, setIsMultiDay] = useState(false);
    const [isEmergencyHighlighted, setIsEmergencyHighlighted] = useState(false);
    const emergencyCardRef = useRef(null);
    const queryClient = useQueryClient();
    const [events, setEvents] = useState([]);

    // Ambil daftar kategori aktif dari database
    const { data: dbCategories = [] } = useQuery({
        queryKey: ["event-categories"],
        queryFn: async () => {
            const res = await api.get("/event-categories");
            return res.data?.data || [];
        },
    });

    // Hitung tanggal minimal yang diizinkan sesuai H-min kategori
    const getMinDateForCategory = (cat) => {
        const found = dbCategories.find(
            (c) => c.slug === cat || c.name.toLowerCase() === cat.toLowerCase()
        );
        const minDays = found
            ? found.min_booking_days
            : {
                  wedding: 60,
                  seminar: 30,
                  birthday: 14,
              }[cat] || 1;

        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + minDays);
        return date;
    };

    const minDate = getMinDateForCategory(category);
    const [selectedDate, setSelectedDate] = useState(() => getMinDateForCategory("wedding"));

    // Jika kategori berubah dan selectedDate kurang dari batas H-min yang baru, sesuaikan selectedDate
    const handleCategoryChange = (newCat) => {
        setCategory(newCat);
        const newMinDate = getMinDateForCategory(newCat);
        const currentCheckDate = Array.isArray(selectedDate) ? selectedDate[0] : selectedDate;

        if (currentCheckDate < newMinDate) {
            setSelectedDate(isMultiDay ? [newMinDate, newMinDate] : newMinDate);
        }
    };

    // Handler saat klien mencoba memilih tanggal di bawah batas minimal di kalender
    const handleEmergencyNoticeTrigger = () => {
        setIsEmergencyHighlighted(true);
        setTimeout(() => {
            setIsEmergencyHighlighted(false);
        }, 3600);
    };

    // Handler pergantian mode multi-day (range hari)
    const handleMultiDayToggle = (checked) => {
        setIsMultiDay(checked);
        if (checked) {
            const baseDate = Array.isArray(selectedDate) ? selectedDate[0] : selectedDate;
            setSelectedDate([baseDate, baseDate]);
        } else {
            const baseDate = Array.isArray(selectedDate) ? selectedDate[0] : selectedDate;
            setSelectedDate(baseDate);
        }
    };

    // Mengambil daftar tanggal yang sudah terisi di database
    const {
        data: bookedDates = [],
        isLoading: isDatesLoading,
    } = useQuery({
        queryKey: ["booked-dates"],
        queryFn: async () => {
            const response = await api.get("/bookings/booked-dates");
            return Array.isArray(response.data)
                ? response.data
                : response.data?.booked_dates || [];
        },
    });

    // Lokasi titik venue dari BookingForm (state tetap di form, dilaporkan ke sini)
    const [eventLocation, setEventLocation] = useState(null);
    const [seasonState, setSeasonState] = useState({ status: "idle", data: null, message: "", isRangeError: false });

    const seasonStartDate = Array.isArray(selectedDate) ? selectedDate[0] : selectedDate;
    const seasonDateKey = seasonStartDate instanceof Date && !Number.isNaN(seasonStartDate.getTime())
        ? [
            seasonStartDate.getFullYear(),
            String(seasonStartDate.getMonth() + 1).padStart(2, "0"),
            String(seasonStartDate.getDate()).padStart(2, "0"),
        ].join("-")
        : null;
    const seasonLat = eventLocation?.lat ?? null;
    const seasonLng = eventLocation?.lng ?? null;

    // Ambil perkiraan musim (debounce 500 ms, request lama dibatalkan saat input berubah)
    useEffect(() => {
        if (seasonLat === null || seasonLng === null || !seasonDateKey) {
            setSeasonState({ status: "idle", data: null, message: "", isRangeError: false });
            return undefined;
        }

        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setSeasonState((prev) => ({ ...prev, status: "loading" }));
            try {
                const response = await api.post(
                    "/musim",
                    { latitude: seasonLat, longitude: seasonLng, tanggal: seasonDateKey },
                    { signal: controller.signal }
                );
                setSeasonState({ status: "success", data: response.data, message: "", isRangeError: false });
            } catch (error) {
                if (error?.name === "CanceledError" || error?.name === "AbortError" || error?.code === "ERR_CANCELED") {
                    return;
                }
                const validationErrors = error?.response?.data?.errors;
                const firstValidationError = validationErrors ? Object.values(validationErrors).flat()[0] : null;
                const isRangeError = error?.response?.status === 422 && !validationErrors;
                const serverMessage = error?.response?.data?.message;
                setSeasonState({
                    status: "error",
                    data: null,
                    isRangeError,
                    message: firstValidationError || serverMessage || "Perkiraan musim belum bisa dimuat.",
                });
            }
        }, 500);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [seasonLat, seasonLng, seasonDateKey]);

    // Fetch events untuk Progress Tracker
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await api.get("/client/events");
                setEvents(res.data.events || []);
            } catch (err) {
                console.error("Gagal fetch events:", err);
            }
        };
        fetchEvents();
    }, []);

    const handleBookingSuccess = () => {
        // Refresh data tanggal terisi secara realtime di kalender
        queryClient.invalidateQueries({ queryKey: ["booked-dates"] });
    };

    return (
        <div className="flex flex-col gap-8 max-w-7xl mx-auto">
            {/* Greeting Section */}
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    Selamat Datang, {user?.name || "Client"}!
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Pilih jadwal dan lengkapi detail rencana acara Anda melalui kalender pintar dan formulir di bawah.
                </p>
            </div>

            {/* Penawaran Masuk (Client Review) */}
            <ClientQuotationsSection />

            {/* Grid Konten */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Kolom Kiri: Kalender & Notice Edukatif */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                    <BookingCalendar
                        value={selectedDate}
                        onChange={setSelectedDate}
                        minDate={minDate}
                        bookedDates={bookedDates}
                        selectRange={isMultiDay}
                        category={category}
                        onEmergencyBookingNotice={handleEmergencyNoticeTrigger}
                    />

                    {/* Petunjuk / Legenda Kalender */}
                    <div className="bg-white rounded-2xl border border-[#E8E2D7] p-4 shadow-xs flex flex-col gap-2.5 text-xs text-[#2F3931]">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <span className="font-bold text-[#2F3931]">Keterangan:</span>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-[#CFD8C4] border border-[#B6C2AA] inline-block"></span>
                                <span>Tersedia</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-[#F3C3B2] border border-[#EAAFA0] inline-block"></span>
                                <span>Urgent</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-[#FDE8D3] border border-[#E8CEB2] inline-block"></span>
                                <span>Terblokir</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-[#657166] inline-block"></span>
                                <span className="font-bold text-[#2F3931]">Sudah terisi</span>
                            </div>
                        </div>
                        <div className="pt-2 border-t border-[#E8E2D7] text-[11px] text-[#738075] font-medium">
                            {(() => {
                                const found = dbCategories.find(
                                    (c) => c.slug === category || c.name.toLowerCase() === category.toLowerCase()
                                );
                                const name = found ? found.name : category.charAt(0).toUpperCase() + category.slice(1);
                                const days = found ? found.min_booking_days : ({ wedding: 60, seminar: 30, birthday: 14 }[category] || 1);
                                return `* Batas persiapan: ${name} (Minimal H-${days}).`;
                            })()}
                        </div>
                    </div>

                    {/* Widget Musim */}
                    <div className="bg-[#DAEBE3] rounded-2xl border border-[#CFD8C4] p-4 shadow-xs text-[#2F3931]">
                        <div className="flex items-center gap-2 mb-1">
                            {seasonState.status === "success" && seasonState.data?.ikon ? (
                                <span className="text-sm leading-none" role="img" aria-label="Ikon Musim">
                                    {seasonState.data.ikon}
                                </span>
                            ) : (
                                <span className="w-2.5 h-2.5 rounded-full bg-[#657166]"></span>
                            )}
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[#424C43]">
                                Widget Musim
                            </h4>
                        </div>
                        {seasonState.status === "idle" && (
                            <p className="text-[11px] text-[#556056] mt-0.5 leading-relaxed">
                                Pilih tanggal dan titik lokasi untuk melihat perkiraan musim.
                            </p>
                        )}
                        {seasonState.status === "loading" && (
                            <p className="text-[11px] text-[#556056] mt-0.5 leading-relaxed animate-pulse">
                                Memuat perkiraan musim...
                            </p>
                        )}
                        {seasonState.status === "success" && seasonState.data && (
                            <>
                                <p className="text-xs font-extrabold text-[#2F3931]">
                                    {seasonState.data.musim}
                                </p>
                                <p className="text-[11px] text-[#556056] mt-0.5 leading-relaxed">
                                    {seasonState.data.saran}
                                </p>
                                {Array.isArray(seasonState.data.tips) && seasonState.data.tips.length > 0 && (
                                    <ul className="mt-1.5 flex flex-col gap-0.5">
                                        {seasonState.data.tips.slice(0, 3).map((tip) => (
                                            <li key={tip} className="flex items-start gap-1.5 text-[11px] text-[#556056] leading-relaxed">
                                                <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#657166] shrink-0"></span>
                                                <span>{tip}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <p className="text-[11px] text-[#738075] mt-1.5 font-medium">
                                    ~{Math.round(seasonState.data.hujan_mm_bulan)} mm/bulan &middot; {seasonState.data.suhu_min}&ndash;{seasonState.data.suhu_max}&deg;C
                                </p>
                            </>
                        )}
                        {seasonState.status === "error" && (
                            <>
                                <p className="text-[11px] text-[#556056] mt-0.5 leading-relaxed">
                                    {seasonState.message}
                                </p>
                                {seasonState.isRangeError && (
                                    <p className="text-[11px] text-[#556056] mt-1 leading-relaxed">
                                        Umumnya Oktober sampai Maret adalah musim hujan. Pertimbangkan opsi indoor atau tenda untuk acara Anda.
                                    </p>
                                )}
                            </>
                        )}
                        <p className="text-[10px] text-[#738075] mt-2 leading-snug">
                            Perkiraan kecenderungan, bukan prediksi cuaca harian. Data: Open-Meteo.com
                        </p>
                    </div>

                    {/* PROGRESS TIMELINE DI BAWAH WIDGET MUSIM */}
                    {events.length > 0 && (
                        <div className="flex flex-col gap-3">
                            <h3 className="text-sm font-bold text-[#2F3931] uppercase tracking-wider">
                                Progress Acara
                            </h3>
                            {events.map((evt) => (
                                <ProgressTimeline key={evt.id} event={evt} />
                            ))}
                        </div>
                    )}

                    {/* Kartu Edukasi & Kontak EO */}
                    <div
                        ref={emergencyCardRef}
                        className={`bg-white rounded-2xl border ${
                            isEmergencyHighlighted
                                ? "border-[#F3C3B2] emergency-highlight-active"
                                : "border-[#E8E2D7]"
                        } p-5 shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}
                    >
                        <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-[#FDE8D3] text-[#63482B] flex items-center justify-center shrink-0 border border-[#E8CEB2]">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.888 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.711 1.456h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.411Z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-[#2F3931]">
                                    Pemesanan Mendadak (Urgent / Fast-Track)
                                </h4>
                                <p className="text-xs text-[#556056] mt-0.5 leading-relaxed">
                                    Butuh acara mendadak kurang dari batas waktu persiapan? Hubungi Admin EO via WhatsApp.
                                </p>
                                <p className="text-[11px] text-[#738075] mt-1">
                                    Persiapan minimum standar: Wedding (H-60), Seminar (H-30), Birthday (H-14).
                                </p>
                            </div>
                        </div>

                        <a
                            href={generateWhatsAppUrl({ category })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto"
                        >
                            <span>Hubungi Admin EO via WhatsApp</span>
                        </a>
                    </div>
                </div>

                {/* Kolom Kanan: Tombol Pembayaran + Form Booking */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <Link
                        to="/client/payments"
                        className="bg-white hover:bg-[#FAF6F0] rounded-2xl border border-[#E8E2D7] hover:border-[#CFD8C4] p-4 sm:p-5 shadow-xs transition-all duration-200 flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-[#FDE8D3] text-[#63482B] border border-[#E8CEB2] flex items-center justify-center shrink-0 group-hover:bg-[#F3C3B2] transition-colors">
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                            </div>
                            <div>
                                <span className="inline-block text-[10px] font-bold text-[#63482B] uppercase tracking-wider bg-[#FDE8D3] px-2 py-0.5 rounded-full border border-[#E8CEB2] mb-0.5">
                                    Pembayaran
                                </span>
                                <p className="text-sm sm:text-base font-bold text-[#2F3931] group-hover:text-[#424C43] transition-colors leading-tight">
                                    Rincian Pembayaran
                                </p>
                                <p className="text-[11px] text-[#738075] mt-0.5">
                                    Pantau tagihan DP 50% dan pelunasan
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#DAEBE3] text-[#424C43] text-xs font-bold group-hover:bg-[#CFD8C4] group-hover:translate-x-0.5 transition-all shrink-0">
                            <span>Buka</span>
                            <span className="text-sm leading-none">&rarr;</span>
                        </div>
                    </Link>

                    <BookingForm
                        selectedDate={selectedDate}
                        onDateChange={setSelectedDate}
                        isMultiDay={isMultiDay}
                        onMultiDayChange={handleMultiDayToggle}
                        bookedDates={bookedDates}
                        category={category}
                        onCategoryChange={handleCategoryChange}
                        onBookingSuccess={handleBookingSuccess}
                        onLocationChange={setEventLocation}
                    />
                </div>
            </div>
        </div>
    );
}