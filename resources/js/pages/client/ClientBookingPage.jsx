import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import BookingCalendar, { generateWhatsAppUrl } from "../../components/client/BookingCalendar";
import BookingForm from "../../components/client/BookingForm";

export default function ClientBookingPage() {
    const { user } = useAuth();
    const [category, setCategory] = useState("wedding");
    const [isMultiDay, setIsMultiDay] = useState(false);
    const [isEmergencyHighlighted, setIsEmergencyHighlighted] = useState(false);
    const emergencyCardRef = useRef(null);
    const queryClient = useQueryClient();

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
    } = useQuery({
        queryKey: ["booked-dates"],
        queryFn: async () => {
            const response = await api.get("/bookings/booked-dates");
            return Array.isArray(response.data)
                ? response.data
                : response.data?.booked_dates || [];
        },
    });

    const handleBookingSuccess = () => {
        // Refresh data tanggal terisi secara realtime di kalender
        queryClient.invalidateQueries({ queryKey: ["booked-dates"] });
    };

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#2F3931] tracking-tight">
                        Pengajuan Acara Baru
                    </h1>
                    <p className="text-xs text-[#738075] mt-1">
                        Pilih jadwal ketersediaan di kalender pintar dan lengkapi detail rencana acara Anda.
                    </p>
                </div>
                <Link
                    to="/client/dashboard"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#738075] hover:text-[#2F3931] px-3.5 py-2 rounded-xl bg-white border border-[#E8E2D7] shadow-2xs transition-colors self-start sm:self-auto"
                >
                    &larr; Kembali ke Dashboard
                </Link>
            </div>

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

                {/* Kolom Kanan: Form Booking */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <BookingForm
                        selectedDate={selectedDate}
                        onDateChange={setSelectedDate}
                        isMultiDay={isMultiDay}
                        onMultiDayChange={handleMultiDayToggle}
                        bookedDates={bookedDates}
                        category={category}
                        onCategoryChange={handleCategoryChange}
                        onBookingSuccess={handleBookingSuccess}
                    />
                </div>
            </div>
        </div>
    );
}

