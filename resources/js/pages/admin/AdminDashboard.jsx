import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { formatRupiah } from "../../data/kanbanData";

export default function AdminDashboard() {
    const { user } = useAuth();

    // Default bulan berjalan (format: YYYY-MM)
    const currentMonthStr = useMemo(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        return `${year}-${month}`;
    }, []);

    const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

    // Opsi daftar bulan: 12 bulan ke belakang dan 3 bulan ke depan
    const monthOptions = useMemo(() => {
        const options = [];
        const now = new Date();
        for (let i = -12; i <= 3; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
            const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            const label = d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
            options.push({ value, label });
        }
        return options.sort((a, b) => b.value.localeCompare(a.value));
    }, []);

    // Mengambil data ringkasan acara & keuangan dari endpoint Laravel sesuai bulan terpilih
    const {
        data: summary,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["admin", "event-summary", selectedMonth],
        queryFn: async () => {
            const response = await api.get("/admin/event-summary", {
                params: { month: selectedMonth },
            });
            return response.data;
        },
    });

    const {
        data: actionData,
        isLoading: isActionLoading,
        isError: isActionError,
    } = useQuery({
        queryKey: ["admin", "action-items"],
        queryFn: async () => {
            const response = await api.get("/admin/action-items");
            return response.data;
        },
        refetchOnWindowFocus: true,
    });

    // Menghitung tinggi dan format nilai batang diagram pendapatan 6 bulan terakhir
    const chartData = useMemo(() => {
        if (!summary?.monthly_chart || summary.monthly_chart.length === 0) {
            return [];
        }
        const maxRevenue = Math.max(...summary.monthly_chart.map((d) => d.revenue), 1);
        return summary.monthly_chart.map((item) => {
            const hasRevenue = item.revenue > 0;
            const height = hasRevenue
                ? `${Math.max(12, Math.round((item.revenue / maxRevenue) * 100))}%`
                : "4px";
            return {
                ...item,
                height,
                formattedValue: formatRupiah(item.revenue, true),
            };
        });
    }, [summary?.monthly_chart]);

    return (
        <div className="flex flex-col gap-8 max-w-7xl mx-auto">
            {/* Header Dashboard & Filter Bulan */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        Dashboard
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Pusat kendali operasional Event Organizer (EO) Evento.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    {/* Pemilih Bulan Dinamis */}
                    <div className="relative">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            aria-label="Pilih Bulan"
                            className="appearance-none text-xs font-bold pl-3.5 pr-8 py-2 rounded-xl bg-white border border-[#CFD8C4] text-[#2F3931] shadow-2xs hover:border-[#657166] focus:outline-hidden focus:ring-2 focus:ring-[#657166]/20 transition-colors cursor-pointer"
                        >
                            {monthOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-[#738075]">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>

                    <Link
                        to="/admin/kanban"
                        className="text-xs font-bold px-4 py-2 rounded-xl bg-[#657166] hover:bg-[#556056] text-white shadow-xs transition-colors shrink-0"
                    >
                        Buka Papan Kanban
                    </Link>
                </div>
            </div>

            {/* Perlu Tindakan */}
            <section className="flex flex-col gap-3">
                {isActionError && (
                    <p className="text-xs text-[#6B3728] bg-[#F3C3B2]/40 rounded-xl px-4 py-3">
                        Gagal memuat daftar tindakan. Muat ulang halaman.
                    </p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {isActionLoading &&
                        Array.from({ length: 5 }).map((_, index) => (
                            <div
                                key={index}
                                className="h-24 rounded-2xl bg-[#E8E2D7]/60 animate-pulse"
                            />
                        ))}

                    {actionData?.items.map((item) => (
                        <Link
                            key={item.key}
                            to={item.path}
                            className={`rounded-2xl p-4 border shadow-xs transition-all duration-200 flex flex-col justify-between gap-2 hover:-translate-y-0.5 ${
                                item.count > 0
                                    ? "bg-white border-[#E8CEB2] hover:bg-[#FAF6F0]"
                                    : "bg-white border-[#E8E2D7] hover:bg-[#FAF6F0]"
                            }`}
                        >
                            <span
                                className={`text-3xl font-black ${
                                    item.count > 0
                                        ? "text-[#6B3728]"
                                        : "text-[#738075]"
                                }`}
                            >
                                {item.count}
                            </span>
                            <span className="text-xs font-semibold text-[#2F3931] leading-snug">
                                {item.label}
                            </span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* 3 Kartu Ringkasan Keuangan (Bulan Terpilih) */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Kartu 1: Pendapatan */}
                <div className="bg-white rounded-2xl p-5 border border-[#E8E2D7] shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold text-[#738075] uppercase tracking-wider">
                                Pendapatan
                            </p>
                            {summary?.financial ? (
                                <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        (summary.financial.revenue_growth_percentage ?? 0) >= 0
                                            ? "bg-[#DAEBE3] text-[#2F3931]"
                                            : "bg-[#F3C3B2] text-[#6B3728]"
                                    }`}
                                >
                                    {(summary.financial.revenue_growth_percentage ?? 0) >= 0 ? "+" : ""}
                                    {summary.financial.revenue_growth_percentage ?? 0}% vs bln lalu
                                </span>
                            ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DAEBE3] text-[#2F3931]">
                                    Selesai
                                </span>
                            )}
                        </div>
                        <p className="text-2xl font-black text-[#2F3931] mt-2">
                            {isLoading ? (
                                <span className="inline-block w-32 h-7 bg-[#E8E2D7]/60 rounded-lg animate-pulse" />
                            ) : (
                                formatRupiah(summary?.financial?.recognized_revenue ?? 0, true)
                            )}
                        </p>
                    </div>
                    <p className="mt-4 pt-3 border-t border-[#E8E2D7] text-[11px] text-[#738075]">
                        Dari acara selesai di bulan terpilih
                    </p>
                </div>

                {/* Kartu 2: Kas Masuk */}
                <div className="bg-white rounded-2xl p-5 border border-[#E8E2D7] shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold text-[#738075] uppercase tracking-wider">
                                Kas masuk
                            </p>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DAEBE3] text-[#2F3931]">
                                DP + Pelunasan
                            </span>
                        </div>
                        <p className="text-2xl font-black text-[#2F3931] mt-2">
                            {isLoading ? (
                                <span className="inline-block w-32 h-7 bg-[#E8E2D7]/60 rounded-lg animate-pulse" />
                            ) : (
                                formatRupiah(summary?.financial?.cash_in ?? 0, true)
                            )}
                        </p>
                    </div>
                    <p className="mt-4 pt-3 border-t border-[#E8E2D7] text-[11px] text-[#738075]">
                        Pembayaran terverifikasi di bulan terpilih
                    </p>
                </div>

                {/* Kartu 3: Margin Kotor */}
                <div className="bg-white rounded-2xl p-5 border border-[#E8E2D7] shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold text-[#738075] uppercase tracking-wider">
                                Margin kotor
                            </p>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FDE8D3] text-[#63482B]">
                                {summary?.financial?.gross_margin_percentage ?? 0}%
                            </span>
                        </div>
                        <p className="text-2xl font-black text-[#2F3931] mt-2">
                            {isLoading ? (
                                <span className="inline-block w-32 h-7 bg-[#E8E2D7]/60 rounded-lg animate-pulse" />
                            ) : (
                                formatRupiah(summary?.financial?.gross_margin ?? 0, true)
                            )}
                        </p>
                    </div>
                    <p className="mt-4 pt-3 border-t border-[#E8E2D7] text-[11px] text-[#738075]">
                        Pendapatan dikurangi biaya vendor aktif
                    </p>
                </div>
            </section>

            {/* Baris Kedua: 3 Kartu Operasional & Piutang */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Kartu 1: Uang Muka Diterima */}
                <div className="bg-white rounded-2xl p-5 border border-[#E8E2D7] shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold text-[#738075] uppercase tracking-wider">
                                Uang muka diterima
                            </p>
                        </div>
                        <p className="text-2xl font-black text-[#2F3931] mt-2">
                            {isLoading ? (
                                <span className="inline-block w-32 h-7 bg-[#E8E2D7]/60 rounded-lg animate-pulse" />
                            ) : (
                                formatRupiah(summary?.operational?.deferred_revenue ?? 0, true)
                            )}
                        </p>
                    </div>
                    <p className="mt-4 pt-3 border-t border-[#E8E2D7] text-[11px] text-[#738075] flex items-center justify-between">
                        <span>DP masuk bulan ini</span>
                        <span className="font-bold text-[#2F3931]">
                            {isLoading ? "..." : formatRupiah(summary?.operational?.dp_in_this_month ?? 0, true)}
                        </span>
                    </p>
                </div>

                {/* Kartu 2: Piutang / Sisa Tagihan */}
                <div className="bg-white rounded-2xl p-5 border border-[#E8E2D7] shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold text-[#738075] uppercase tracking-wider">
                                Piutang / sisa tagihan
                            </p>
                        </div>
                        <p className="text-2xl font-black text-[#2F3931] mt-2">
                            {isLoading ? (
                                <span className="inline-block w-32 h-7 bg-[#E8E2D7]/60 rounded-lg animate-pulse" />
                            ) : (
                                formatRupiah(summary?.operational?.total_receivables ?? 0, true)
                            )}
                        </p>
                    </div>
                    <p className="mt-4 pt-3 border-t border-[#E8E2D7] text-[11px] text-[#738075] flex items-center justify-between">
                        <span>Jatuh tempo bulan ini</span>
                        <span className="font-bold text-[#2F3931]">
                            {isLoading ? "..." : formatRupiah(summary?.operational?.due_this_month ?? 0, true)}
                        </span>
                    </p>
                </div>

                {/* Kartu 3: Acara Aktif */}
                <div className="bg-white rounded-2xl p-5 border border-[#E8E2D7] shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold text-[#738075] uppercase tracking-wider">
                                Acara aktif
                            </p>
                        </div>
                        <p className="text-2xl font-black text-[#2F3931] mt-2">
                            {isLoading ? (
                                <span className="inline-block w-20 h-7 bg-[#E8E2D7]/60 rounded-lg animate-pulse" />
                            ) : (
                                `${summary?.operational?.active_events_count ?? 0} Proyek`
                            )}
                        </p>
                    </div>
                    <p className="mt-4 pt-3 border-t border-[#E8E2D7] text-[11px] text-[#738075]">
                        Belum selesai dan tidak dibatalkan
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
                    </div>

                    {/* Bar Chart Visual Pastel */}
                    <div className="h-56 flex items-end justify-between gap-3 sm:gap-6 px-2 sm:px-6 pt-6 pb-2">
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, index) => (
                                <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                                    <div className="w-full max-w-[48px] h-24 bg-[#E8E2D7]/60 rounded-t-xl animate-pulse" />
                                    <span className="w-8 h-3 bg-[#E8E2D7]/60 rounded-sm animate-pulse mt-1" />
                                </div>
                            ))
                        ) : chartData.length > 0 ? (
                            chartData.map((item) => (
                                <div key={item.month_key} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                                    <span className="text-[10px] font-semibold text-[#738075] opacity-0 group-hover:opacity-100 transition-opacity">
                                        {item.formattedValue}
                                    </span>
                                    <div
                                        style={{ height: item.height }}
                                        className="w-full max-w-[48px] rounded-t-xl transition-all duration-300 bg-[#99CDD8] group-hover:bg-[#85BFCC] shadow-2xs"
                                    />
                                    <span className="text-xs font-semibold text-[#2F3931] mt-1">
                                        {item.month}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-[#738075]">
                                Belum ada data pendapatan
                            </div>
                        )}
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
                </div>
            </div>
        </div>
    );
}
