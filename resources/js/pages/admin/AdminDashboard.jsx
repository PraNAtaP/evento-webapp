import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    Activity,
    AlertTriangle,
    ArrowUpRight,
    Building2,
    Calendar,
    CalendarCheck2,
    CheckCircle2,
    ChevronRight,
    Clock,
    Coins,
    CreditCard,
    FileText,
    Layers,
    MapPin,
    MessageSquare,
    PieChart,
    Sparkles,
    Store,
    TrendingDown,
    TrendingUp,
    Wallet,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { formatRupiah } from "../../data/kanbanData";

// Konfigurasi visual untuk setiap tipe action item
const ACTION_CONFIG = {
    new_requests: {
        label: "Request Acara",
        sublabel: "Permohonan baru",
        icon: FileText,
        activeBg: "bg-amber-50",
        activeText: "text-amber-950",
        activeBorder: "border-amber-400",
        badgeBg: "bg-amber-600 text-white",
    },
    cancellation_requests: {
        label: "Permintaan Batal",
        sublabel: "Dari klien",
        icon: AlertTriangle,
        activeBg: "bg-rose-50",
        activeText: "text-rose-900",
        activeBorder: "border-rose-400",
        badgeBg: "bg-rose-600 text-white",
    },
    revision_requests: {
        label: "Revisi Penawaran",
        sublabel: "Catatan klien",
        icon: MessageSquare,
        activeBg: "bg-amber-50",
        activeText: "text-amber-950",
        activeBorder: "border-amber-400",
        badgeBg: "bg-amber-600 text-white",
    },
    payments_pending: {
        label: "Verifikasi Bayar",
        sublabel: "Struk transfer",
        icon: CreditCard,
        activeBg: "bg-amber-50",
        activeText: "text-amber-950",
        activeBorder: "border-amber-400",
        badgeBg: "bg-amber-600 text-white",
    },
    vendor_registrations: {
        label: "Pendaftar Vendor",
        sublabel: "Mitra baru",
        icon: Store,
        activeBg: "bg-amber-50",
        activeText: "text-amber-950",
        activeBorder: "border-amber-400",
        badgeBg: "bg-amber-600 text-white",
    },
    vendor_offers_unanswered: {
        label: "Tawaran Vendor",
        sublabel: "Menunggu respon",
        icon: Clock,
        activeBg: "bg-amber-50",
        activeText: "text-amber-950",
        activeBorder: "border-amber-300",
        badgeBg: "bg-amber-500 text-white",
    },
    vendor_payouts_pending: {
        label: "Pencairan Vendor",
        sublabel: "Honor belum cair",
        icon: Wallet,
        activeBg: "bg-amber-50",
        activeText: "text-amber-950",
        activeBorder: "border-amber-400",
        badgeBg: "bg-amber-600 text-white",
    },
};

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

    // Mengambil data ringkasan acara & keuangan dari endpoint Laravel
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
                ? `${Math.max(16, Math.round((item.revenue / maxRevenue) * 100))}%`
                : "6px";
            return {
                ...item,
                height,
                formattedValue: formatRupiah(item.revenue, true),
                fullFormattedValue: formatRupiah(item.revenue, false),
            };
        });
    }, [summary?.monthly_chart]);

    const totalActionCount = actionData?.total ?? 0;
    const actionItemsWithCount = actionData?.items?.filter((it) => it.count > 0) || [];

    // Persentase realisasi pembayaran dari seluruh kontrak
    const contractRealizationPct = useMemo(() => {
        const total = summary?.total_nilai_kontrak || 0;
        const paid = summary?.total_telah_masuk || 0;
        if (total <= 0) return 0;
        return Math.min(100, Math.round((paid / total) * 100));
    }, [summary?.total_nilai_kontrak, summary?.total_telah_masuk]);

    return (
        <div className="flex flex-col gap-7 max-w-7xl mx-auto pb-10">
            {/* 1. HEADER & GREETING BAR */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E2D7] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#224436] bg-[#DAEBE3] px-3 py-0.5 rounded-full border border-[#BCD4C9] uppercase tracking-wider">
                            <Sparkles className="w-3 h-3 text-[#224436]" />
                            Modul Operasional EO
                        </span>
                        <span className="text-xs text-[#738075] hidden sm:inline">
                            &bull; Periode: <strong className="text-[#2F3931]">{summary?.selected_month_label || "Bulan Ini"}</strong>
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2F3931] tracking-tight">
                        Selamat Datang, {user?.name || "Admin EO"} 👋
                    </h1>
                    <p className="text-xs sm:text-sm text-[#738075] mt-1 max-w-2xl">
                        Pusat komando terpadu untuk memantau performa keuangan, kelancaran arus kas, serta kesiapan vendor pada setiap acara.
                    </p>
                </div>

                <div className="flex items-center flex-wrap gap-2.5 shrink-0">
                    {/* Pemilih Bulan Dinamis */}
                    <div className="relative">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            aria-label="Pilih Bulan"
                            className="appearance-none text-xs font-bold pl-3.5 pr-8 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#E8E2D7] text-[#2F3931] shadow-2xs hover:border-[#657166] focus:outline-hidden focus:ring-2 focus:ring-[#657166]/20 transition cursor-pointer"
                        >
                            {monthOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-[#738075]">
                            <Calendar className="w-3.5 h-3.5" />
                        </div>
                    </div>

                    <Link
                        to="/admin/kanban"
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl bg-[#657166] hover:bg-[#525C53] text-white shadow-xs transition cursor-pointer"
                    >
                        <span>Papan Kanban</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>

            {/* 2. PUSAT TINDAKAN & ANTREAN OPERASIONAL (ACTION HUB) */}
            <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#657166]" />
                        <h2 className="text-sm font-extrabold text-[#2F3931] uppercase tracking-wider">
                            Pusat Tindakan & Antrean Operasional
                        </h2>
                    </div>

                    {totalActionCount > 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                            {totalActionCount} Tindakan Memerlukan Perhatian
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-[#DAEBE3] text-[#224436] border border-[#BCD4C9]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#224436]" />
                            Semua Operasional Terkendali
                        </span>
                    )}
                </div>

                {isActionError && (
                    <p className="text-xs text-[#6B3728] bg-[#F3C3B2]/40 rounded-2xl px-4 py-3 border border-[#F3C3B2]">
                        Gagal memuat daftar tindakan operasional. Silakan muat ulang halaman.
                    </p>
                )}

                {/* Grid 6 Kartu Tindakan yang Rapi, Proporsional, & Bersih */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {isActionLoading &&
                        Array.from({ length: 6 }).map((_, index) => (
                            <div
                                key={index}
                                className="h-28 rounded-2xl bg-white border border-[#E8E2D7] p-4 flex flex-col justify-between animate-pulse"
                            >
                                <div className="w-8 h-8 rounded-xl bg-[#FAF6F0]" />
                                <div className="w-16 h-3 bg-[#FAF6F0] rounded-sm" />
                            </div>
                        ))}

                    {!isActionLoading &&
                        actionData?.items?.map((item) => {
                            const config = ACTION_CONFIG[item.key] || {
                                label: item.label,
                                sublabel: "",
                                icon: Layers,
                                activeBg: "bg-white",
                                activeText: "text-[#2F3931]",
                                activeBorder: "border-[#E8E2D7]",
                                badgeBg: "bg-[#2F3931] text-white",
                            };
                            const IconComponent = config.icon;
                            const hasPending = item.count > 0;

                            return (
                                <Link
                                    key={item.key}
                                    to={item.path}
                                    className={`group rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between relative cursor-pointer ${
                                        hasPending
                                            ? `${config.activeBg} ${config.activeBorder} shadow-xs hover:-translate-y-0.5 hover:shadow-md`
                                            : "bg-white/80 border-[#E8E2D7] hover:border-[#CFD8C4] hover:bg-white"
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div
                                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                                                hasPending
                                                    ? "bg-white/80 shadow-2xs " + config.activeText
                                                    : "bg-[#FAF6F0] text-[#738075] group-hover:text-[#2F3931]"
                                            }`}
                                        >
                                            <IconComponent className="w-4 h-4" />
                                        </div>

                                        <span
                                            className={`text-xs px-2 py-0.5 rounded-full font-black ${
                                                hasPending
                                                    ? config.badgeBg
                                                    : "bg-[#FAF6F0] text-[#738075] border border-[#E8E2D7]"
                                            }`}
                                        >
                                            {item.count}
                                        </span>
                                    </div>

                                    <div>
                                        <p
                                            className={`text-xs font-bold leading-tight line-clamp-1 ${
                                                hasPending
                                                    ? config.activeText
                                                    : "text-[#2F3931] group-hover:text-black"
                                            }`}
                                        >
                                            {config.label}
                                        </p>
                                        <p className="text-[10px] text-[#738075] mt-0.5 truncate">
                                            {hasPending ? "Perlu ditinjau →" : config.sublabel || "Tidak ada antrean"}
                                        </p>
                                    </div>
                                </Link>
                            );
                        })}
                </div>
            </section>

            {/* 3. BENTO GRID: KEUANGAN, OPERASIONAL & RADAR ACARA */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* SISI KIRI (8 KOLOM): HERO KEUANGAN + 2 KARTU METRIK */}
                <div className="lg:col-span-8 flex flex-col gap-5">
                    {/* HERO CARD: Pastel Elegan Evento */}
                    <div className="relative overflow-hidden bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E2D7] shadow-xs">
                        <div className="relative z-10 flex flex-col gap-6">
                            {/* Baris Atas Hero */}
                            <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#E8E2D7]">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#506B59]"></span>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#738075]">
                                        Performa Keuangan & Arus Kas
                                    </span>
                                </div>
                                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#FAF6F0] text-[#556056] border border-[#E8E2D7]">
                                    {summary?.selected_month_label || "Bulan Ini"}
                                </span>
                            </div>

                            {/* 2 Metrik Utama Side-by-Side */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Kas Masuk */}
                                <div>
                                    <div className="flex items-center gap-2 text-xs text-[#738075]">
                                        <Wallet className="w-3.5 h-3.5 text-[#506B59]" />
                                        <span className="font-semibold">Kas Masuk Terverifikasi</span>
                                    </div>
                                    <div className="text-3xl sm:text-4xl font-black text-[#2F3931] mt-1.5 tracking-tight">
                                        {isLoading ? (
                                            <span className="inline-block w-40 h-9 bg-[#FAF6F0] rounded-lg animate-pulse" />
                                        ) : (
                                            formatRupiah(summary?.financial?.cash_in ?? 0, true)
                                        )}
                                    </div>
                                    <p className="text-[11px] text-[#738075] mt-1">
                                        Dana muka (DP) + pelunasan diverifikasi
                                    </p>
                                </div>

                                {/* Pendapatan Diakui */}
                                <div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs text-[#738075]">
                                            <TrendingUp className="w-3.5 h-3.5 text-[#1D4A54]" />
                                            <span className="font-semibold">Pendapatan Selesai Diakui</span>
                                        </div>
                                        {summary?.financial && (
                                            <span
                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                    (summary.financial.revenue_growth_percentage ?? 0) >= 0
                                                        ? "bg-[#DAEBE3] text-[#224436]"
                                                        : "bg-[#F3C3B2] text-[#6B3728]"
                                                }`}
                                            >
                                                {(summary.financial.revenue_growth_percentage ?? 0) >= 0 ? "+" : ""}
                                                {summary.financial.revenue_growth_percentage ?? 0}% vs bln lalu
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-3xl sm:text-4xl font-black text-[#1D4A54] mt-1.5 tracking-tight">
                                        {isLoading ? (
                                            <span className="inline-block w-40 h-9 bg-[#FAF6F0] rounded-lg animate-pulse" />
                                        ) : (
                                            formatRupiah(summary?.financial?.recognized_revenue ?? 0, true)
                                        )}
                                    </div>
                                    <p className="text-[11px] text-[#738075] mt-1">
                                        Akumulasi acara berstatus selesai di bulan ini
                                    </p>
                                </div>
                            </div>

                            {/* Baris Bawah: Chip Ringkas */}
                            <div className="pt-4 border-t border-[#E8E2D7] flex flex-wrap items-center justify-between gap-3 text-xs text-[#556056]">
                                <div className="flex items-center gap-4">
                                    <div>
                                        <span className="text-[#738075] text-[10px] block">DP Masuk Bulan Ini</span>
                                        <span className="font-bold text-[#2F3931]">
                                            {isLoading ? "..." : formatRupiah(summary?.operational?.dp_in_this_month ?? 0, true)}
                                        </span>
                                    </div>
                                    <div className="w-px h-6 bg-[#E8E2D7]" />
                                    <div>
                                        <span className="text-[#738075] text-[10px] block">Dana Muka Tersimpan</span>
                                        <span className="font-bold text-[#2F3931]">
                                            {isLoading ? "..." : formatRupiah(summary?.operational?.deferred_revenue ?? 0, true)}
                                        </span>
                                    </div>
                                </div>

                                <Link
                                    to="/admin/payments"
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1D4A54] hover:text-[#2F3931] hover:underline transition"
                                >
                                    <span>Tinjau Rekap Pembayaran</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* DUA KARTU OPERASIONAL BAWAH: Margin Kotor & Piutang Klien */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* KARTU 1: Margin Kotor */}
                        <div className="bg-white rounded-3xl p-5 border border-[#E8E2D7] shadow-xs flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-9 h-9 rounded-xl bg-[#FAF6F0] flex items-center justify-center text-[#2F3931] border border-[#E8E2D7]">
                                        <PieChart className="w-4 h-4 text-[#657166]" />
                                    </div>
                                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FDE8D3] text-[#63482B] border border-[#E8CEB2]">
                                        Margin {summary?.financial?.gross_margin_percentage ?? 0}%
                                    </span>
                                </div>

                                <span className="text-[11px] font-bold text-[#738075] uppercase tracking-wider block">
                                    Estimasi Margin Kotor
                                </span>
                                <div className="text-2xl font-black text-[#2F3931] mt-1">
                                    {isLoading ? (
                                        <span className="inline-block w-28 h-7 bg-[#E8E2D7]/60 rounded-lg animate-pulse" />
                                    ) : (
                                        formatRupiah(summary?.financial?.gross_margin ?? 0, true)
                                    )}
                                </div>

                                {/* Bar Indikator Margin */}
                                <div className="mt-3 w-full bg-[#FAF6F0] rounded-full h-2 overflow-hidden border border-[#E8E2D7]">
                                    <div
                                        style={{ width: `${Math.min(100, Math.max(0, summary?.financial?.gross_margin_percentage ?? 0))}%` }}
                                        className="h-full bg-[#657166] rounded-full transition-all duration-500"
                                    />
                                </div>
                            </div>

                            <p className="mt-4 pt-3 border-t border-[#E8E2D7] text-[11px] text-[#738075]">
                                Nilai pendapatan dikurangi komitmen biaya vendor acara.
                            </p>
                        </div>

                        {/* KARTU 2: Piutang / Sisa Tagihan */}
                        <div className="bg-white rounded-3xl p-5 border border-[#E8E2D7] shadow-xs flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-9 h-9 rounded-xl bg-[#FAF6F0] flex items-center justify-center text-[#2F3931] border border-[#E8E2D7]">
                                        <Coins className="w-4 h-4 text-[#657166]" />
                                    </div>
                                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FAF6F0] text-[#556056] border border-[#E8E2D7]">
                                        {summary?.operational?.active_events_count ?? 0} Proyek Aktif
                                    </span>
                                </div>

                                <span className="text-[11px] font-bold text-[#738075] uppercase tracking-wider block">
                                    Total Piutang / Sisa Tagihan
                                </span>
                                <div className="text-2xl font-black text-[#2F3931] mt-1">
                                    {isLoading ? (
                                        <span className="inline-block w-28 h-7 bg-[#E8E2D7]/60 rounded-lg animate-pulse" />
                                    ) : (
                                        formatRupiah(summary?.operational?.total_receivables ?? 0, true)
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-[#E8E2D7] text-[11px] text-[#738075] flex items-center justify-between">
                                <span>Jatuh tempo bulan ini:</span>
                                <strong className="text-[#2F3931] font-bold">
                                    {isLoading ? "..." : formatRupiah(summary?.operational?.due_this_month ?? 0, true)}
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SISI KANAN (4 KOLOM): RADAR ACARA TERDEKAT + STATUS PIPELINE */}
                <div className="lg:col-span-4 flex flex-col gap-5">
                    {/* WIDGET 1: RADAR ACARA TERDEKAT */}
                    <div className="bg-[#DAEBE3] rounded-3xl p-6 border border-[#BCD4C9] shadow-xs text-[#2F3931] flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#224436]">
                                        Radar Acara Terdekat
                                    </span>
                                </div>
                                {summary?.upcoming_event && (
                                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FAF6F0] text-[#224436] border border-[#BCD4C9] shadow-2xs">
                                        {summary.upcoming_event.badge}
                                    </span>
                                )}
                            </div>

                            {summary?.upcoming_event ? (
                                <div className="space-y-3 mt-2">
                                    <h3 className="text-base font-extrabold text-[#2F3931] leading-snug line-clamp-2">
                                        {summary.upcoming_event.name || "Acara Tanpa Nama"}
                                    </h3>

                                    <div className="space-y-1.5 text-xs text-[#424C43]">
                                        <div className="flex items-center gap-2">
                                            <CalendarCheck2 className="w-4 h-4 text-[#224436] shrink-0" />
                                            <span>
                                                {new Date(summary.upcoming_event.event_date).toLocaleDateString("id-ID", {
                                                    weekday: "long",
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric",
                                                })}
                                            </span>
                                        </div>

                                        {summary.upcoming_event.venue && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-[#224436] shrink-0" />
                                                <span className="truncate">{summary.upcoming_event.venue}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-2 flex items-center justify-between">
                                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/80 font-bold text-[#224436] border border-[#BCD4C9] capitalize">
                                            Status: {summary.upcoming_event.status.replace("_", " ")}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-6 text-center text-xs text-[#556056]">
                                    <Calendar className="w-8 h-8 mx-auto text-[#738075] mb-2 opacity-60" />
                                    <p className="font-semibold">Belum Ada Jadwal Terdekat</p>
                                    <p className="text-[11px] text-[#738075] mt-0.5">Semua acara terisi sudah selesai atau belum dijadwalkan.</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-5 pt-3.5 border-t border-[#BCD4C9]">
                            <Link
                                to="/admin/kanban"
                                className="w-full flex items-center justify-center gap-1.5 text-xs font-bold py-2 px-3 rounded-xl bg-white hover:bg-[#FAF6F0] text-[#2F3931] border border-[#BCD4C9] shadow-2xs transition"
                            >
                                <span>Buka Papan Kanban</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>

                    {/* WIDGET 2: PIPELINE STATUS PROYEK */}
                    <div className="bg-white rounded-3xl p-6 border border-[#E8E2D7] shadow-xs flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-[#657166]" />
                                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#738075]">
                                        Pipeline Acara
                                    </span>
                                </div>
                                <span className="text-xs font-black text-[#2F3931]">
                                    {summary?.operational?.active_events_count ?? 0} Proyek
                                </span>
                            </div>

                            <div className="space-y-2.5 text-xs">
                                <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAF6F0] border border-[#E8E2D7]">
                                    <span className="text-[#556056] font-medium">Permohonan Masuk</span>
                                    <span className="font-extrabold text-[#2F3931]">{summary?.status_counts?.request ?? 0}</span>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAF6F0] border border-[#E8E2D7]">
                                    <span className="text-[#556056] font-medium">Menunggu DP Klien</span>
                                    <span className="font-extrabold text-[#2F3931]">{summary?.status_counts?.dp_paid ?? 0}</span>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-xl bg-[#DAEBE3]/50 border border-[#BCD4C9]">
                                    <span className="text-[#224436] font-medium">Sedang Dikerjakan</span>
                                    <span className="font-extrabold text-[#224436]">{summary?.status_counts?.on_progress ?? 0}</span>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAF6F0] border border-[#E8E2D7]">
                                    <span className="text-[#556056] font-medium">Selesai (Arsip)</span>
                                    <span className="font-extrabold text-[#738075]">{summary?.status_counts?.done ?? 0}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#E8E2D7]">
                            <Link
                                to="/admin/orders"
                                className="text-xs font-bold text-[#657166] hover:text-[#2F3931] flex items-center justify-between transition"
                            >
                                <span>Lihat Semua Pesanan Acara</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. TREN PENDAPATAN BULANAN (6 BULAN) & PORTOFOLIO KONTRAK */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Diagram Pendapatan Bulanan (8 Kolom) */}
                <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E2D7] shadow-xs flex flex-col justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-[#E8E2D7]">
                        <div>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-[#657166]" />
                                <h3 className="text-base font-extrabold text-[#2F3931]">
                                    Tren Pendapatan Bulanan
                                </h3>
                            </div>
                            <p className="text-xs text-[#738075] mt-0.5">
                                Histori pertumbuhan omset dari acara selesai selama 6 bulan terakhir.
                            </p>
                        </div>
                        <span className="text-[11px] font-bold text-[#657166] bg-[#FAF6F0] px-3 py-1 rounded-full border border-[#E8E2D7] self-start sm:self-auto">
                            6 Bulan Terakhir
                        </span>
                    </div>

                    {/* Bar Chart Visual Pastel */}
                    <div className="h-60 flex items-end justify-between gap-3 sm:gap-6 px-2 sm:px-6 pt-6 pb-2">
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, index) => (
                                <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                                    <div className="w-full max-w-[48px] h-28 bg-[#FAF6F0] rounded-t-xl animate-pulse" />
                                    <span className="w-8 h-3 bg-[#FAF6F0] rounded-sm animate-pulse mt-1" />
                                </div>
                            ))
                        ) : chartData.length > 0 ? (
                            chartData.map((item) => (
                                <div key={item.month_key} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                                    <span className="text-[10px] font-bold text-[#2F3931] bg-[#FAF6F0] px-2 py-0.5 rounded-md border border-[#E8E2D7] shadow-2xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        {item.fullFormattedValue}
                                    </span>
                                    <div
                                        style={{ height: item.height }}
                                        className={`w-full max-w-[48px] rounded-t-xl transition-all duration-300 shadow-2xs cursor-pointer ${
                                            item.is_selected
                                                ? "bg-[#657166] group-hover:bg-[#2F3931] ring-2 ring-[#657166]/20"
                                                : "bg-[#99CDD8] group-hover:bg-[#7FB7C2]"
                                        }`}
                                        title={`${item.month_full}: ${item.fullFormattedValue}`}
                                    />
                                    <span className={`text-xs font-bold mt-1 ${item.is_selected ? "text-[#2F3931] underline underline-offset-4" : "text-[#738075]"}`}>
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

                {/* Ringkasan Portofolio Nilai Kontrak (4 Kolom) */}
                <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E2D7] shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Building2 className="w-4 h-4 text-[#657166]" />
                            <h3 className="text-base font-extrabold text-[#2F3931]">
                                Portofolio Kontrak EO
                            </h3>
                        </div>
                        <p className="text-xs text-[#738075] mb-5">
                            Gambaran kumulatif komitmen kontrak seluruh acara terdaftar di platform EVENTO.
                        </p>

                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#E8E2D7]">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#738075] block">
                                    Total Nilai Kontrak Acara
                                </span>
                                <span className="text-xl font-black text-[#2F3931] mt-0.5 block">
                                    {isLoading ? "..." : formatRupiah(summary?.total_nilai_kontrak ?? 0, true)}
                                </span>
                                <span className="text-[10px] text-[#738075]">
                                    Dari {summary?.total_proyek ?? 0} total acara yang diajukan
                                </span>
                            </div>

                            <div className="p-4 rounded-2xl bg-[#DAEBE3] border border-[#BCD4C9]">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#224436] block">
                                    Total Kas Telah Masuk
                                </span>
                                <span className="text-xl font-black text-[#224436] mt-0.5 block">
                                    {isLoading ? "..." : formatRupiah(summary?.total_telah_masuk ?? 0, true)}
                                </span>
                                <span className="text-[10px] text-[#424C43]">
                                    Tingkat realisasi: <strong>{contractRealizationPct}%</strong>
                                </span>
                            </div>

                            {/* Progress bar realisasi */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-[11px] font-semibold text-[#738075]">
                                    <span>Tingkat Pelunasan Kontrak</span>
                                    <span>{contractRealizationPct}%</span>
                                </div>
                                <div className="w-full bg-[#FAF6F0] rounded-full h-2 overflow-hidden border border-[#E8E2D7]">
                                    <div
                                        style={{ width: `${contractRealizationPct}%` }}
                                        className="h-full bg-[#506B59] rounded-full transition-all duration-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-[#E8E2D7]">
                        <Link
                            to="/admin/smart-calendar"
                            className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 px-4 rounded-xl bg-[#FAF6F0] hover:bg-[#E8E2D7] text-[#2F3931] border border-[#E8E2D7] shadow-2xs transition"
                        >
                            <Calendar className="w-3.5 h-3.5 text-[#657166]" />
                            <span>Buka Smart Calendar EO</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
