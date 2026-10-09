import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import BookingCalendar from "../../components/client/BookingCalendar";
import BookingForm from "../../components/client/BookingForm";

export default function ClientDashboard() {
    const { user, logout } = useAuth();
    const [category, setCategory] = useState("wedding");
    const queryClient = useQueryClient();

    // Hitung tanggal minimal yang diizinkan sesuai H-min kategori
    const getMinDateForCategory = (cat) => {
        const minDays = {
            wedding: 60,
            seminar: 30,
            birthday: 14,
        }[cat] || 1;

        const date = new Date();
        date.setDate(date.getDate() + minDays);
        return date;
    };

    const minDate = getMinDateForCategory(category);
    const [selectedDate, setSelectedDate] = useState(() => getMinDateForCategory("wedding"));

    // Jika kategori berubah dan selectedDate kurang dari batas H-min yang baru, sesuaikan selectedDate
    const handleCategoryChange = (newCat) => {
        setCategory(newCat);
        const newMinDate = getMinDateForCategory(newCat);
        if (selectedDate < newMinDate) {
            setSelectedDate(newMinDate);
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

    const handleBookingSuccess = () => {
        // Refresh data tanggal terisi secara realtime di kalender
        queryClient.invalidateQueries({ queryKey: ["booked-dates"] });
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-lg flex items-center justify-center shadow-xs">
                            E
                        </span>
                        <div>
                            <span className="font-extrabold text-base tracking-tight text-slate-900 block leading-tight">
                                EVENTO
                            </span>
                            <span className="text-[10px] font-semibold tracking-wider text-blue-600 uppercase">
                                Client Portal
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200">
                                {user?.name ? user.name.charAt(0).toUpperCase() : "C"}
                            </div>
                            <div className="hidden sm:block text-left">
                                <p className="text-xs font-semibold text-slate-800 leading-none">
                                    {user?.name || "Client"}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                    Role: Customer / Client
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={logout}
                            className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200 cursor-pointer"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col gap-8">
                {/* Greeting Section */}
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        Selamat Datang, {user?.name || "Client"}!
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Pilih jadwal dan lengkapi detail rencana acara Anda melalui formulir di bawah.
                    </p>
                </div>

                {/* Grid Konten */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Kolom Kiri: Kalender */}
                    <div className="lg:col-span-7 flex flex-col gap-4">
                        <BookingCalendar
                            value={selectedDate}
                            onChange={setSelectedDate}
                            minDate={minDate}
                            bookedDates={bookedDates}
                        />

                        {/* Petunjuk / Legenda Kalender */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col gap-2.5 text-xs text-slate-500">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <span className="font-semibold text-slate-700">Keterangan:</span>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
                                    <span>Tanggal Terpilih</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-slate-200 border border-slate-400 inline-block"></span>
                                    <span className="font-medium text-slate-700">Sudah Terisi (Nonaktif)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-slate-50 border border-slate-200 inline-block opacity-60"></span>
                                    <span>Belum Memenuhi H-Min</span>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-slate-100 text-[11px] text-blue-600 font-medium">
                                * Batas pemesanan untuk {category === "wedding" ? "Wedding (Minimal H-60)" : category === "seminar" ? "Seminar (Minimal H-30)" : "Birthday (Minimal H-14)"}. Tanggal sebelum batas waktu otomatis dinonaktifkan di kalender.
                            </div>
                        </div>
                    </div>

                    {/* Kolom Kanan: Form Input Booking */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                        <BookingForm
                            selectedDate={selectedDate}
                            category={category}
                            onCategoryChange={handleCategoryChange}
                            onBookingSuccess={handleBookingSuccess}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
