import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import ClientQuotationsSection from "../../components/client/ClientQuotationsSection";

export default function ClientDashboard() {
    const { user } = useAuth();

    const { data: events = [], isLoading } = useQuery({
        queryKey: ["client-events"],
        queryFn: async () => {
            const response = await api.get("/client/events");
            return response.data?.events || [];
        },
    });

    const pendingReviewEvents = events.filter((e) => e.kanban_status === "client_review");

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto">
            {/* Header / Greeting & Quick Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-[#E8E2D7] p-6 shadow-xs">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-[#2F3931] tracking-tight">
                        Selamat Datang, {user?.name || "Client"}!
                    </h1>
                    <p className="text-xs sm:text-sm text-[#738075] mt-1">
                        Berikut adalah penawaran acara dari Event Organizer yang sedang menunggu persetujuan Anda.
                    </p>
                </div>
                <Link
                    to="/client/booking"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#657166] hover:bg-[#556056] text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 border border-[#525C53]"
                >
                    <span>+ Buat Pengajuan Acara Baru</span>
                </Link>
            </div>

            {/* Konten Utama: Penawaran yang Butuh Ditinjau */}
            {isLoading ? (
                <div className="py-16 bg-white rounded-2xl border border-[#E8E2D7] text-center text-xs text-[#738075]">
                    Memuat daftar penawaran...
                </div>
            ) : pendingReviewEvents.length > 0 ? (
                <ClientQuotationsSection />
            ) : (
                <div className="bg-white rounded-2xl border border-[#E8E2D7] p-8 text-center shadow-xs flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#FAF6F0] text-[#657166] border border-[#E8E2D7] flex items-center justify-center font-bold text-xl">
                        📋
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#2F3931]">
                            Tidak Ada Penawaran yang Menunggu Review
                        </h3>
                        <p className="text-xs text-[#738075] mt-1 max-w-md">
                            Saat ini belum ada penawaran acara yang membutuhkan persetujuan Anda. Semua rencana acara yang telah diajukan sedang dalam penyusunan oleh tim Event Organizer.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                        <Link
                            to="/client/booking"
                            className="px-4 py-2.5 bg-[#657166] hover:bg-[#556056] text-white font-bold text-xs rounded-xl shadow-xs transition-colors border border-[#525C53]"
                        >
                            Ajukan Acara Baru
                        </Link>
                        <Link
                            to="/client/booked-events"
                            className="px-4 py-2.5 bg-white hover:bg-[#FAF6F0] text-[#738075] hover:text-[#2F3931] font-bold text-xs rounded-xl border border-[#E8E2D7] transition-colors"
                        >
                            Lihat Acara Saya
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
