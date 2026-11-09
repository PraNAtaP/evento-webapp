import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import ClientQuotationsSection from "../../components/client/ClientQuotationsSection";

export default function ClientDashboard() {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const verifiedParam = searchParams.get("verified");

    const [isResending, setIsResending] = useState(false);
    const [resendStatus, setResendStatus] = useState(null);

    const isUnverified = user && !user.email_verified_at && user.is_email_verified !== true;

    const handleResend = async () => {
        setIsResending(true);
        setResendStatus(null);
        try {
            const res = await api.post("/email/verification-notification");
            setResendStatus({
                type: "success",
                message: res.data.message || "Tautan verifikasi baru berhasil dikirim ke email Anda!",
            });
        } catch (err) {
            setResendStatus({
                type: "error",
                message: err.response?.data?.message || "Gagal mengirim email verifikasi.",
            });
        } finally {
            setIsResending(false);
        }
    };

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
            {/* Banner Sukses Verifikasi dari Link Email */}
            {verifiedParam === "1" && (
                <div className="p-4 bg-[#EBF3E8] border border-[#CFD8C4] text-[#2A4022] rounded-2xl text-xs font-medium flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2.5">
                        <span className="text-xl">🎉</span>
                        <div>
                            <p className="font-bold text-sm">Alamat Email Berhasil Diverifikasi!</p>
                            <p className="text-[11px] text-[#4F6B43] mt-0.5">
                                Akun Anda kini aktif penuh untuk memesan acara dan berkoordinasi dengan EO.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Banner Pengingat Belum Verifikasi Email */}
            {isUnverified && (
                <div className="p-4 bg-[#FDE8D3]/70 border border-[#E8CEB2] text-[#5C3F22] rounded-2xl text-xs font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-start gap-2.5">
                        <span className="text-xl">✉️</span>
                        <div>
                            <p className="font-bold text-sm">Verifikasi Alamat Email Anda</p>
                            <p className="text-[11px] text-[#7A5432] mt-0.5">
                                Kami telah mengirimkan email verifikasi ke <strong>{user.email}</strong>. Harap verifikasi untuk keamanan akun dan menerima notifikasi penawaran acara.
                            </p>
                            {resendStatus && (
                                <p
                                    className={`mt-1.5 font-bold ${
                                        resendStatus.type === "success" ? "text-green-800" : "text-red-700"
                                    }`}
                                >
                                    {resendStatus.message}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={isResending}
                        className="px-3.5 py-2 bg-white hover:bg-[#FAF6F0] text-[#5C3F22] border border-[#E8CEB2] font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                    >
                        {isResending ? "Mengirim..." : "Kirim Ulang Verifikasi"}
                    </button>
                </div>
            )}

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
