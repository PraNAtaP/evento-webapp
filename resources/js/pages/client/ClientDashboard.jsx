import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import BookingCalendar from "../../components/client/BookingCalendar";

export default function ClientDashboard() {
    const { user, logout } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date());

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
                        Pilih jadwal dan pesan tanggal acara Anda melalui kalender di bawah.
                    </p>
                </div>

                {/* Grid Konten */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Kolom Kalender */}
                    <div className="lg:col-span-7">
                        <BookingCalendar
                            value={selectedDate}
                            onChange={setSelectedDate}
                        />
                    </div>

                    {/* Kolom Info Kalender */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                                Panduan Kalender
                            </span>
                            <h2 className="text-base font-bold text-slate-800 mt-1">
                                Navigasi Tanggal Acara
                            </h2>
                            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                                Klik tanggal pada kalender untuk menentukan jadwal yang Anda inginkan. Anda dapat berpindah bulan atau tahun dengan mengklik tanda panah navigasi di bagian atas kalender.
                            </p>

                            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5 text-xs">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
                                    <span>Tanggal yang sedang Anda pilih saat ini</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                    <span className="w-3 h-3 rounded-full bg-slate-100 border border-blue-200 inline-block"></span>
                                    <span>Hari ini</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
