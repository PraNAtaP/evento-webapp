import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { formatRupiah } from "../../data/kanbanData";

export default function AdminDashboard() {
    const { user, logout } = useAuth();

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
                                EO Management
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200">
                                {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
                            </div>
                            <div className="hidden sm:block text-left">
                                <p className="text-xs font-semibold text-slate-800 leading-none">
                                    {user?.name || "Admin EO"}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                    Role: Event Organizer
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={logout}
                            className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col gap-8">
                {/* Greeting */}
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        Selamat Datang, {user?.name || "Admin EO"}! 👋
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Pusat kendali operasional Event Organizer (EO) Evento.
                    </p>
                </div>

                {/* 4 Kartu Ringkasan Pendapatan & Proyek (Data dari Laravel via React Query) */}
                <section>
                    <h2 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3">
                        Ringkasan Kinerja & Pendapatan
                    </h2>

                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs animate-pulse space-y-3"
                                >
                                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                                    <div className="h-7 bg-slate-200 rounded w-3/4" />
                                    <div className="h-2.5 bg-slate-100 rounded w-full" />
                                </div>
                            ))}
                        </div>
                    ) : isError ? (
                        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-xs">
                            Gagal memuat ringkasan data dari server.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Kartu 1: Total Proyek */}
                            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                                <div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        Total Proyek
                                    </p>
                                    <p className="text-2xl font-black text-slate-900 mt-1">
                                        {summary?.total_proyek ?? 0}{" "}
                                        <span className="text-xs font-normal text-slate-500">
                                            Acara
                                        </span>
                                    </p>
                                </div>
                                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5 text-[10px]">
                                    <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium border border-amber-200">
                                        Req: {summary?.status_counts?.request ?? 0}
                                    </span>
                                    <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium border border-blue-200">
                                        DP: {summary?.status_counts?.dp_paid ?? 0}
                                    </span>
                                    <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-medium border border-purple-200">
                                        Prog: {summary?.status_counts?.on_progress ?? 0}
                                    </span>
                                    <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium border border-emerald-200">
                                        Done: {summary?.status_counts?.done ?? 0}
                                    </span>
                                </div>
                            </div>

                            {/* Kartu 2: Sedang Berjalan */}
                            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                                <div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        Sedang Berjalan
                                    </p>
                                    <p className="text-2xl font-black text-blue-600 mt-1">
                                        {summary?.sedang_berjalan ?? 0}{" "}
                                        <span className="text-xs font-normal text-slate-500">
                                            Aktif
                                        </span>
                                    </p>
                                </div>
                                <p className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                                    Tahap Request, DP, & On Progress
                                </p>
                            </div>

                            {/* Kartu 3: Total Nilai Kontrak */}
                            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                                <div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        Total Nilai Kontrak
                                    </p>
                                    <p className="text-xl font-black text-slate-900 mt-1 tracking-tight">
                                        {formatRupiah(summary?.total_nilai_kontrak ?? 0)}
                                    </p>
                                </div>
                                <p className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                                    Estimasi nilai dari 9 proyek
                                </p>
                            </div>

                            {/* Kartu 4: Total Telah Masuk */}
                            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                                <div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        Total Telah Masuk
                                    </p>
                                    <p className="text-xl font-black text-emerald-600 mt-1 tracking-tight">
                                        {formatRupiah(summary?.total_telah_masuk ?? 0)}
                                    </p>
                                </div>
                                <p className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                                    Dana DP & termin yang terverifikasi
                                </p>
                            </div>
                        </div>
                    )}
                </section>

                {/* Dashboard Grid Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Featured Card: Kanban Board */}
                    <Link
                        to="/admin/kanban"
                        className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
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
                                        d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                                    />
                                </svg>
                            </div>
                            <span className="text-xs uppercase font-bold tracking-wider text-blue-200">
                                Fitur Utama
                            </span>
                            <h2 className="text-xl font-bold mt-1 text-white">
                                Papan Kanban Acara
                            </h2>
                            <p className="text-xs text-blue-100 mt-2 leading-relaxed">
                                Pantau dan kelola seluruh siklus acara dalam 4 tahap: Request, DP Paid, On Progress, hingga Done.
                            </p>
                        </div>

                        <div className="mt-6 flex items-center gap-2 text-xs font-bold text-white group-hover:translate-x-1 transition-transform">
                            <span>Buka Papan Kanban</span>
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

                    {/* Stats Card: Akun Aktif */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
                        <div>
                            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                                Profil Pengguna
                            </span>
                            <h3 className="text-lg font-bold text-slate-800 mt-1">
                                Informasi Akun EO
                            </h3>
                            <div className="mt-4 space-y-2 text-xs text-slate-600">
                                <div className="flex justify-between py-1 border-b border-slate-100">
                                    <span className="text-slate-400">Email:</span>
                                    <span className="font-semibold text-slate-800">
                                        {user?.email || "eo@evento.test"}
                                    </span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-100">
                                    <span className="text-slate-400">Role Sistem:</span>
                                    <span className="font-semibold text-blue-600 uppercase">
                                        {user?.role || "eo"}
                                    </span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-slate-400">Status Akses:</span>
                                    <span className="font-semibold text-emerald-600">
                                        Aktif (Verified)
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <span className="text-[11px] text-slate-400 block">
                                Didukung oleh Evento Workspace v1.0
                            </span>
                        </div>
                    </div>

                    {/* Quick Guide Card */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
                        <div>
                            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                                Panduan Singkat
                            </span>
                            <h3 className="text-lg font-bold text-slate-800 mt-1">
                                Alur Kerja Kanban EO
                            </h3>
                            <ul className="mt-3 space-y-2 text-xs text-slate-600 list-disc list-inside">
                                <li>
                                    <strong>Request:</strong> Pengajuan acara baru dari klien.
                                </li>
                                <li>
                                    <strong>DP Paid:</strong> Down Payment diterima & tanggal terkunci.
                                </li>
                                <li>
                                    <strong>On Progress:</strong> Persiapan teknis & vendor.
                                </li>
                                <li>
                                    <strong>Done:</strong> Acara selesai dilaksanakan.
                                </li>
                            </ul>
                        </div>

                        <div className="mt-6">
                            <Link
                                to="/admin/kanban"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
                            >
                                <span>Lihat Papan Acara Sekarang &rarr;</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
