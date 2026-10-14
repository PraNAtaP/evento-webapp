import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { formatRupiah } from "../../data/kanbanData";

export default function AdminDashboard() {
    const { user } = useAuth();

    // Mengambil data ringkasan acara & keuangan dari endpoint Laravel
    const {
        data: summary,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["admin", "event-summary"],
        queryFn: async () => {
            const response = await api.get("/admin/event-summary");
            return response.data;
        },
    });

    // Data simulasi diagram batang pendapatan bulanan (sesuai Mockup 4)
    const monthlyRevenue = [
        { month: "Mei", height: "45%", value: "Rp 54 Jt" },
        { month: "Jun", height: "65%", value: "Rp 68 Jt" },
        { month: "Jul", height: "55%", value: "Rp 60 Jt" },
        { month: "Agu", height: "85%", value: "Rp 82 Jt" },
        { month: "Sep", height: "70%", value: "Rp 74 Jt" },
        { month: "Okt", height: "95%", value: "Rp 86,4 Jt", current: true },
    ];

    const vendorPerformance = [
        { name: "Vendor katering A", rating: "4,8", category: "Katering" },
        { name: "Vendor dekor B", rating: "4,6", category: "Dekorasi" },
        { name: "Vendor sound C", rating: "4,4", category: "Sound System" },
    ];

    return (
        <div className="flex flex-col gap-8 max-w-7xl mx-auto">
            {/* Greeting */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        Selamat Datang, {user?.name || "Admin EO"}! 👋
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Pusat kendali operasional Event Organizer (EO) Evento.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#DAEBE3] text-[#2F3931] border border-[#CFD8C4]">
                        Oktober 2026
                    </span>
                    <Link
                        to="/admin/kanban"
                        className="text-xs font-bold px-4 py-2 rounded-xl bg-[#657166] hover:bg-[#556056] text-white shadow-xs transition-colors"
                    >
                        Buka Papan Kanban
                    </Link>
                </div>
            </div>

            {/* 3 Kartu Metrik Utama (Sesuai Mockup 4) */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Kartu 1: Pendapatan Bulan Ini */}
                <div className="bg-white rounded-2xl p-5 border border-[#E8E2D7] shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold text-[#738075] uppercase tracking-wider">
                                Pendapatan bulan ini
                            </p>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DAEBE3] text-[#2F3931]">
                                +12%
                            </span>
                        </div>
                        <p className="text-2xl font-black text-[#2F3931] mt-2">
                            {summary?.total_telah_masuk ? formatRupiah(summary.total_telah_masuk, true) : "Rp 86,4 Jt"}
                        </p>
                    </div>
                    <p className="mt-4 pt-3 border-t border-[#E8E2D7] text-[11px] text-[#738075]">
                        Naik dari bulan lalu (Terverifikasi)
                    </p>
                </div>

                {/* Kartu 2: Margin Rata-rata */}
                <div className="bg-white rounded-2xl p-5 border border-[#E8E2D7] shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold text-[#738075] uppercase tracking-wider">
                                Margin rata-rata
                            </p>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FDE8D3] text-[#63482B]">
                                Target 25%
                            </span>
                        </div>
                        <p className="text-2xl font-black text-[#657166] mt-2">
                            27%
                        </p>
                    </div>
                    <p className="mt-4 pt-3 border-t border-[#E8E2D7] text-[11px] text-[#738075]">
                        Semua acara aktif bulan ini
                    </p>
                </div>

                {/* Kartu 3: Acara Aktif */}
                <div className="bg-white rounded-2xl p-5 border border-[#E8E2D7] shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold text-[#738075] uppercase tracking-wider">
                                Acara aktif
                            </p>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F3C3B2] text-[#6B3728]">
                                3 butuh tindakan
                            </span>
                        </div>
                        <p className="text-2xl font-black text-[#2F3931] mt-2">
                            {summary?.sedang_berjalan ?? 9}{" "}
                            <span className="text-xs font-normal text-[#738075]">Proyek</span>
                        </p>
                    </div>
                    <p className="mt-4 pt-3 border-t border-[#E8E2D7] text-[11px] text-[#738075]">
                        Termasuk request baru dan DP
                    </p>
                </div>
            </section>

            {/* Bagian Tengah: Diagram Pendapatan Bulanan & Widget BMKG + Vendor (Sesuai Mockup 4) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Kolom Kiri: Diagram Pendapatan Bulanan */}
                <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-[#E8E2D7] shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#E8E2D7]">
                        <div>
                            <h3 className="text-base font-bold text-[#2F3931]">
                                Pendapatan bulanan
                            </h3>
                            <p className="text-xs text-[#738075] mt-0.5">
                                Tren pertumbuhan omset 6 bulan terakhir
                            </p>
                        </div>
                        <span className="text-[11px] font-semibold text-[#657166] bg-[#DAEBE3] px-3 py-1 rounded-full border border-[#CFD8C4]">
                            Tahun 2026
                        </span>
                    </div>

                    {/* Bar Chart Visual Pastel */}
                    <div className="h-56 flex items-end justify-between gap-3 sm:gap-6 px-2 sm:px-6 pt-6 pb-2 border-b border-[#E8E2D7]">
                        {monthlyRevenue.map((item) => (
                            <div key={item.month} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                                <span className="text-[10px] font-semibold text-[#738075] opacity-0 group-hover:opacity-100 transition-opacity">
                                    {item.value}
                                </span>
                                <div
                                    style={{ height: item.height }}
                                    className={`w-full max-w-[48px] rounded-t-xl transition-all duration-300 ${
                                        item.current
                                            ? "bg-[#99CDD8] shadow-xs group-hover:bg-[#85BFCC]"
                                            : "bg-[#CFD8C4] group-hover:bg-[#BAC6AE]"
                                    }`}
                                />
                                <span className="text-xs font-semibold text-[#2F3931] mt-1">
                                    {item.month}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs text-[#738075]">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-md bg-[#CFD8C4] inline-block" />
                                <span>Bulan Lalu</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-md bg-[#99CDD8] inline-block" />
                                <span>Bulan Berjalan (Okt)</span>
                            </div>
                        </div>
                        <span className="font-semibold text-[#2F3931]">Total Semester: Rp 424,4 Jt</span>
                    </div>
                </div>

                {/* Kolom Kanan: Cuaca BMKG & Performa Vendor (Sesuai Mockup 4) */}
                <div className="lg:col-span-4 flex flex-col gap-5">
                    {/* Widget Cuaca BMKG Pastel Mint */}
                    <div className="bg-[#DAEBE3] rounded-2xl p-5 border border-[#CFD8C4] shadow-xs text-[#2F3931]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#424C43]">
                                Cuaca BMKG
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#2F3931]">
                                H-3 Acara
                            </span>
                        </div>
                        <h4 className="text-sm font-bold text-[#2F3931]">
                            Ulang Tahun Dimas
                        </h4>
                        <p className="text-xs text-[#556056] mt-1">
                            Malang: hujan ringan, 21 sampai 27 derajat C.
                        </p>
                        <p className="text-[11px] text-[#424C43] font-medium mt-2 pt-2 border-t border-[#CFD8C4]/60">
                            Disarankan menyiapkan tenda cadangan untuk area outdoor.
                        </p>
                    </div>
{/* Kartu Verifikasi Pembayaran */}
<Link
    to="/admin/payments"
    className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
>
    <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

    <div>
        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center mb-4">
            <svg
                width="24"
                height="24"
                style={{ minWidth: 24, minHeight: 24 }}
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
        </div>
        <span className="text-xs uppercase font-bold tracking-wider text-emerald-200">
            Pembayaran
        </span>
        <h2 className="text-xl font-bold mt-1 text-white">
            Verifikasi Pembayaran
        </h2>
        <p className="text-xs text-emerald-100 mt-2 leading-relaxed">
            Periksa bukti transfer dari klien dan tandai status Lunas atau Tolak untuk setiap tagihan DP & pelunasan.
        </p>
    </div>

    <div className="mt-6 flex items-center gap-2 text-xs font-bold text-white group-hover:translate-x-1 transition-transform">
        <span>Buka Verifikasi</span>
        <svg
            width="16"
            height="16"
            style={{ minWidth: 16, minHeight: 16 }}
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
        </svg>
    </div>
</Link>
                    {/* Tabel Performa Vendor */}
                    <div className="bg-white rounded-2xl p-5 border border-[#E8E2D7] shadow-xs">
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E8E2D7]">
                            <h4 className="text-xs font-bold text-[#2F3931] uppercase tracking-wider">
                                Performa vendor
                            </h4>
                            <span className="text-[10px] text-[#738075]">Rating 1-5</span>
                        </div>

                        <div className="space-y-2.5">
                            {vendorPerformance.map((vendor) => (
                                <div
                                    key={vendor.name}
                                    className="flex items-center justify-between text-xs py-1.5 px-2 rounded-xl hover:bg-[#FAF6F0] transition-colors"
                                >
                                    <div>
                                        <p className="font-bold text-[#2F3931] leading-tight">
                                            {vendor.name}
                                        </p>
                                        <p className="text-[10px] text-[#738075]">
                                            {vendor.category}
                                        </p>
                                    </div>
                                    <span className="font-bold text-[#2F3931] bg-[#FDE8D3] px-2.5 py-0.5 rounded-full border border-[#E8CEB2]">
                                        ★ {vendor.rating}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
