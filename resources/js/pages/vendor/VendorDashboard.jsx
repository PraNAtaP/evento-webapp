import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Briefcase,
    Clock,
    CheckCircle2,
    Package,
    Wallet,
    CreditCard,
    ArrowRight,
    Plus,
    AlertCircle,
    Calendar,
    ChevronRight,
    Sparkles,
    FileText,
    Building2,
    Phone,
    MapPin,
    AlertTriangle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { formatRupiah, formatDate } from "../../utils/formatters";

export default function VendorDashboard() {
    const { user } = useAuth();
    const [jobOffers, setJobOffers] = useState([]);
    const [activeJobs, setActiveJobs] = useState([]);
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);

    const vendor = user?.vendor;

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const [offersRes, activeRes, packagesRes] = await Promise.all([
                    api.get("/vendor/job-offers").catch(() => ({ data: { data: [] } })),
                    api.get("/vendor/active-jobs").catch(() => ({ data: { data: [] } })),
                    api.get("/vendor/packages").catch(() => ({ data: { data: [] } })),
                ]);

                setJobOffers(offersRes.data?.data || []);
                setActiveJobs(activeRes.data?.data || []);
                setPackages(packagesRes.data?.data || []);
            } catch (err) {
                console.error("Gagal memuat data dashboard vendor:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Perhitungan Statistik
    const pendingOffersCount = jobOffers.length;
    const activeJobsCount = activeJobs.length;
    const paidJobs = activeJobs.filter((job) => job.payout_status === "paid");
    const totalPaidOut = paidJobs.reduce(
        (sum, job) => sum + (Number(job.payout_nominal || job.agreed_price) || 0),
        0
    );
    const packagesCount = packages.length;

    const hasBankAccount = Boolean(
        vendor?.bank_name && vendor?.bank_account_number && vendor?.bank_account_holder
    );

    return (
        <div className="max-w-6xl mx-auto flex flex-col gap-6 pb-10">
            {/* 1. Status Pendaftaran Akun Banner (Pending / Rejected) */}
            {vendor?.status === "pending" && (
                <div className="bg-[#FDE8D3]/80 border border-[#E8CEB2] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-[#FDE8D3] border border-[#E8CEB2] text-[#63482B] flex items-center justify-center font-bold shrink-0">
                            <Clock className="w-5 h-5 text-[#63482B]" />
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#FDE8D3] text-[#63482B] border border-[#E8CEB2]">
                                Status Akun: Menunggu Verifikasi EO
                            </div>
                            <h3 className="text-sm font-bold text-[#2F3931] mt-1">
                                Profil Bisnis Vendor Anda Sedang Ditinjau Tim EO
                            </h3>
                            <p className="text-xs text-[#738075] mt-0.5 leading-relaxed">
                                Tim Event Organizer sedang memverifikasi legalitas dan profil layanan Anda. Setelah disetujui, paket jasa Anda akan langsung dapat ditugaskan pada berbagai acara klien.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {vendor?.status === "rejected" && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold shrink-0">
                            <AlertCircle className="w-5 h-5 text-red-700" />
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                                Status Akun: Belum Disetujui
                            </div>
                            <h3 className="text-sm font-bold text-red-900 mt-1">
                                Pendaftaran Profil Vendor Belum Disetujui
                            </h3>
                            <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
                                <strong>Catatan Tim EO:</strong>{" "}
                                {vendor?.rejection_reason || "Mohon lengkapi informasi profil usaha Anda dan hubungi tim EVENTO."}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Banner Pengingat Rekening Belum Diisi */}
            {!hasBankAccount && vendor?.status === "approved" && (
                <div className="bg-[#FAF6F0] border border-[#E8E2D7] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-[#EFE9DF] text-[#556056] flex items-center justify-center font-bold shrink-0">
                            <CreditCard className="w-5 h-5 text-[#556056]" />
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#EFE9DF] text-[#556056]">
                                Informasi Keuangan
                            </div>
                            <h3 className="text-sm font-bold text-[#2F3931] mt-1">
                                Rekening Pencairan Honor Belum Didaftarkan
                            </h3>
                            <p className="text-xs text-[#738075] mt-0.5">
                                Daftarkan nomor rekening bank Anda agar bendahara EO dapat langsung mentransfer honorarium pekerjaan Anda.
                            </p>
                        </div>
                    </div>
                    <Link
                        to="/vendor/job-offers"
                        className="px-4 py-2 bg-[#657166] hover:bg-[#556056] text-white text-xs font-bold rounded-xl transition shadow-xs shrink-0"
                    >
                        Atur Rekening Sekarang →
                    </Link>
                </div>
            )}

            {/* 3. Hero Header Greeting */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E8E2D7] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-[11px] font-bold text-[#33422A] bg-[#CFD8C4] px-3 py-0.5 rounded-full border border-[#B6C2AA]">
                            MODUL VENDOR
                        </span>
                        {vendor?.category && (
                            <span className="text-[11px] font-semibold text-[#556056] bg-[#FAF6F0] px-2.5 py-0.5 rounded-full border border-[#E8E2D7]">
                                Kategori: {vendor.category}
                            </span>
                        )}
                        {vendor?.status === "approved" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Mitra Terverifikasi
                            </span>
                        )}
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-black text-[#2F3931] tracking-tight">
                        Selamat Datang, {vendor?.vendor_name || user?.name}!
                    </h1>
                    <p className="text-xs sm:text-sm text-[#738075] mt-1 max-w-2xl leading-relaxed">
                        Pantau ringkasan performa usaha, respon tawaran pekerjaan dari EO, dan laporkan progres kesiapan acara Anda dalam satu dashboard terpadu.
                    </p>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
                    <Link
                        to="/vendor/packages/create"
                        className="inline-flex items-center justify-center gap-2 bg-[#657166] hover:bg-[#556056] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs border border-[#525C53]"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Paket</span>
                    </Link>
                    <Link
                        to="/vendor/job-offers"
                        className="inline-flex items-center justify-center gap-2 bg-[#FAF6F0] hover:bg-[#F2ECE3] text-[#2F3931] text-xs font-bold px-4 py-2.5 rounded-xl transition border border-[#E8E2D7] shadow-2xs"
                    >
                        <Briefcase className="w-4 h-4 text-[#657166]" />
                        <span>Tawaran Job ({pendingOffersCount})</span>
                    </Link>
                </div>
            </div>

            {/* 4. Statistik Ringkasan (4 Metrics Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Metric 1: Tawaran Masuk */}
                <Link
                    to="/vendor/job-offers"
                    className="bg-white rounded-2xl p-5 border border-[#E8E2D7] shadow-xs hover:border-[#657166]/40 transition group"
                >
                    <div className="flex items-center justify-between">
                        <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                            <Briefcase className="w-5 h-5 text-amber-600" />
                        </div>
                        {pendingOffersCount > 0 ? (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse">
                                Perlu Respon
                            </span>
                        ) : (
                            <span className="text-[10px] text-[#738075]">Up-to-date</span>
                        )}
                    </div>
                    <div className="mt-4">
                        <div className="text-2xl font-black text-[#2F3931]">
                            {loading ? "..." : pendingOffersCount}
                        </div>
                        <div className="text-xs font-bold text-[#556056] mt-0.5">
                            Tawaran Job Baru
                        </div>
                        <p className="text-[11px] text-[#738075] mt-0.5">
                            Menunggu konfirmasi Anda
                        </p>
                    </div>
                </Link>

                {/* Metric 2: Pekerjaan Aktif Berjalan */}
                <Link
                    to="/vendor/job-offers"
                    className="bg-white rounded-2xl p-5 border border-[#E8E2D7] shadow-xs hover:border-[#657166]/40 transition group"
                >
                    <div className="flex items-center justify-between">
                        <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-sky-600" />
                        </div>
                        <span className="text-[10px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full">
                            On-Progress
                        </span>
                    </div>
                    <div className="mt-4">
                        <div className="text-2xl font-black text-[#2F3931]">
                            {loading ? "..." : activeJobsCount}
                        </div>
                        <div className="text-xs font-bold text-[#556056] mt-0.5">
                            Pekerjaan Aktif
                        </div>
                        <p className="text-[11px] text-[#738075] mt-0.5">
                            Acara sedang berlangsung
                        </p>
                    </div>
                </Link>

                {/* Metric 3: Total Honor Lunas */}
                <div className="bg-white rounded-2xl p-5 border border-[#E8E2D7] shadow-xs">
                    <div className="flex items-center justify-between">
                        <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Lunas Dicairkan
                        </span>
                    </div>
                    <div className="mt-4">
                        <div className="text-xl font-black text-[#2F3931] truncate">
                            {loading ? "..." : formatRupiah(totalPaidOut)}
                        </div>
                        <div className="text-xs font-bold text-[#556056] mt-0.5">
                            Honor Lunas
                        </div>
                        <p className="text-[11px] text-[#738075] mt-0.5">
                            {paidJobs.length} penugasan telah ditransfer
                        </p>
                    </div>
                </div>

                {/* Metric 4: Paket Jasa Terdaftar */}
                <Link
                    to="/vendor/packages"
                    className="bg-white rounded-2xl p-5 border border-[#E8E2D7] shadow-xs hover:border-[#657166]/40 transition group"
                >
                    <div className="flex items-center justify-between">
                        <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center">
                            <Package className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full">
                            Etalase
                        </span>
                    </div>
                    <div className="mt-4">
                        <div className="text-2xl font-black text-[#2F3931]">
                            {loading ? "..." : packagesCount}
                        </div>
                        <div className="text-xs font-bold text-[#556056] mt-0.5">
                            Paket Jasa Aktif
                        </div>
                        <p className="text-[11px] text-[#738075] mt-0.5">
                            Siap dipesan EO & klien
                        </p>
                    </div>
                </Link>
            </div>

            {/* 5. Konten Utama: 2 Kolom (Kiri: Tawaran & Pekerjaan, Kanan: Rekening & Paket) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Kolom Kiri: Tawaran Job & Pekerjaan Berjalan (8 Kolom) */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                    {/* Kartu Antrean Tawaran Job Terbaru */}
                    <div className="bg-white rounded-2xl border border-[#E8E2D7] shadow-xs overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#E8E2D7] flex items-center justify-between bg-[#FAF6F0]/40">
                            <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-amber-600" />
                                <h2 className="text-sm font-bold text-[#2F3931]">
                                    Tawaran Job Menunggu Respon
                                </h2>
                                {pendingOffersCount > 0 && (
                                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                        {pendingOffersCount} Baru
                                    </span>
                                )}
                            </div>
                            <Link
                                to="/vendor/job-offers"
                                className="text-xs font-bold text-[#657166] hover:underline flex items-center gap-1"
                            >
                                Lihat Semua
                                <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        <div className="p-5">
                            {jobOffers.length === 0 ? (
                                <div className="text-center py-8 px-4">
                                    <div className="w-12 h-12 rounded-full bg-[#FAF6F0] flex items-center justify-center mx-auto mb-2 text-[#738075]">
                                        <Briefcase className="w-5 h-5 text-[#8C998E]" />
                                    </div>
                                    <p className="text-xs font-bold text-[#2F3931]">
                                        Tidak Ada Tawaran Job Baru
                                    </p>
                                    <p className="text-[11px] text-[#738075] mt-0.5 max-w-sm mx-auto">
                                        Saat tim Event Organizer mencocokkan acara dengan paket jasa Anda, tawarannya akan langsung tampil di sini.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {jobOffers.slice(0, 3).map((job) => (
                                        <div
                                            key={job.id}
                                            className="p-4 rounded-xl border border-[#E8E2D7] bg-[#FAF6F0]/30 hover:bg-[#FAF6F0] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#CFD8C4] text-[#33422A]">
                                                        {job.package?.package_name || "Paket Jasa"}
                                                    </span>
                                                    <span className="text-[11px] text-[#738075] flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {formatDate(job.event?.event_date || job.event?.date)}
                                                    </span>
                                                </div>
                                                <h3 className="text-sm font-bold text-[#2F3931] mt-1 truncate">
                                                    {job.event?.name || "Acara Klien"}
                                                </h3>
                                                <p className="text-xs font-semibold text-[#657166] mt-0.5">
                                                    Nilai Honor: {formatRupiah(job.agreed_price)}
                                                </p>
                                            </div>

                                            <Link
                                                to="/vendor/job-offers"
                                                className="px-3.5 py-1.5 bg-[#657166] hover:bg-[#556056] text-white text-xs font-bold rounded-xl transition text-center shrink-0"
                                            >
                                                Tinjau & Respon
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Kartu Pekerjaan Aktif & Progres */}
                    <div className="bg-white rounded-2xl border border-[#E8E2D7] shadow-xs overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#E8E2D7] flex items-center justify-between bg-[#FAF6F0]/40">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-sky-600" />
                                <h2 className="text-sm font-bold text-[#2F3931]">
                                    Pekerjaan Acara Sedang Berjalan
                                </h2>
                                {activeJobsCount > 0 && (
                                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-sky-100 text-sky-800">
                                        {activeJobsCount} Acara
                                    </span>
                                )}
                            </div>
                            <Link
                                to="/vendor/job-offers"
                                className="text-xs font-bold text-[#657166] hover:underline flex items-center gap-1"
                            >
                                Kelola Pekerjaan
                                <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        <div className="p-5">
                            {activeJobs.length === 0 ? (
                                <div className="text-center py-8 px-4">
                                    <div className="w-12 h-12 rounded-full bg-[#FAF6F0] flex items-center justify-center mx-auto mb-2 text-[#738075]">
                                        <Clock className="w-5 h-5 text-[#8C998E]" />
                                    </div>
                                    <p className="text-xs font-bold text-[#2F3931]">
                                        Belum Ada Pekerjaan Aktif
                                    </p>
                                    <p className="text-[11px] text-[#738075] mt-0.5 max-w-sm mx-auto">
                                        Pekerjaan yang Anda terima akan masuk ke daftar ini untuk pelaporan foto progres dan pencairan honorarium.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {activeJobs.slice(0, 3).map((job) => {
                                        const isPaid = job.payout_status === "paid";
                                        const progressCount = job.progress_logs?.length || 0;

                                        return (
                                            <div
                                                key={job.id}
                                                className="p-4 rounded-xl border border-[#E8E2D7] bg-white hover:bg-[#FAF6F0]/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                            >
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span
                                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                                                isPaid
                                                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                                                    : "bg-amber-50 text-amber-800 border-amber-200"
                                                            }`}
                                                        >
                                                            {isPaid ? "Honor Lunas Ditransfer" : "Menunggu Pencairan EO"}
                                                        </span>
                                                        <span className="text-[11px] text-[#738075] flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {formatDate(job.event?.event_date || job.event?.date)}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-sm font-bold text-[#2F3931] mt-1.5 truncate">
                                                        {job.event?.name}
                                                    </h3>
                                                    <p className="text-xs text-[#738075] mt-0.5">
                                                        Paket: <strong>{job.package?.package_name}</strong> • Honor:{" "}
                                                        <strong>{formatRupiah(job.agreed_price)}</strong>
                                                    </p>
                                                    <p className="text-[11px] text-[#556056] mt-1 flex items-center gap-1">
                                                        <span>📸 {progressCount} Laporan Kesiapan Lapangan</span>
                                                    </p>
                                                </div>

                                                <Link
                                                    to="/vendor/job-offers"
                                                    className="px-3.5 py-1.5 bg-[#FAF6F0] hover:bg-[#F2ECE3] text-[#2F3931] border border-[#E8E2D7] text-xs font-bold rounded-xl transition text-center shrink-0"
                                                >
                                                    Lapor Progres →
                                                </Link>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Kolom Kanan: Rekening Bank & Paket Terdaftar (5 Kolom) */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    {/* Kartu Informasi Rekening Bank */}
                    <div className="bg-white rounded-2xl border border-[#E8E2D7] shadow-xs p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-[#FAF6F0] border border-[#E8E2D7] flex items-center justify-center text-[#556056]">
                                    <CreditCard className="w-4 h-4 text-[#556056]" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-[#2F3931]">
                                        Rekening Pencairan Honor
                                    </h2>
                                    <p className="text-[11px] text-[#738075]">
                                        Tujuan transfer honorarium dari tim EO
                                    </p>
                                </div>
                            </div>
                        </div>

                        {hasBankAccount ? (
                            <div className="p-4 rounded-xl bg-[#FAF6F0]/60 border border-[#E8E2D7] space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] text-[#738075]">Nama Bank:</span>
                                    <span className="text-xs font-bold text-[#2F3931] uppercase">
                                        {vendor.bank_name}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] text-[#738075]">Nomor Rekening:</span>
                                    <span className="text-xs font-mono font-bold text-[#2F3931]">
                                        {vendor.bank_account_number}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] text-[#738075]">Atas Nama:</span>
                                    <span className="text-xs font-bold text-[#2F3931]">
                                        {vendor.bank_account_holder}
                                    </span>
                                </div>
                                <div className="pt-2 border-t border-[#E8E2D7]/60 flex justify-end">
                                    <Link
                                        to="/vendor/job-offers"
                                        className="text-[11px] font-bold text-[#657166] hover:underline"
                                    >
                                        Ubah Informasi Rekening →
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-center space-y-2">
                                <p className="text-xs text-amber-900 font-bold">
                                    Rekening Belum Didaftarkan
                                </p>
                                <p className="text-[11px] text-amber-800 leading-relaxed">
                                    Segera daftarkan nomor rekening agar bendahara EO dapat mentransfer honor saat pekerjaan telah disepakati.
                                </p>
                                <Link
                                    to="/vendor/job-offers"
                                    className="inline-block mt-1 text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition"
                                >
                                    Daftarkan Rekening Sekarang
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Kartu Ringkasan Paket Terdaftar */}
                    <div className="bg-white rounded-2xl border border-[#E8E2D7] shadow-xs p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-sm font-bold text-[#2F3931]">
                                    Paket Jasa Anda
                                </h2>
                                <p className="text-[11px] text-[#738075]">
                                    {packages.length} paket aktif di etalase
                                </p>
                            </div>
                            <Link
                                to="/vendor/packages"
                                className="text-xs font-bold text-[#657166] hover:underline"
                            >
                                Kelola Semua →
                            </Link>
                        </div>

                        {packages.length === 0 ? (
                            <div className="text-center py-6 px-3 border border-dashed border-[#E8E2D7] rounded-xl">
                                <Package className="w-6 h-6 text-[#8C998E] mx-auto mb-1.5" />
                                <p className="text-xs text-[#738075]">
                                    Anda belum memiliki paket jasa.
                                </p>
                                <Link
                                    to="/vendor/packages/create"
                                    className="inline-block mt-2.5 text-xs font-bold text-white bg-[#657166] hover:bg-[#556056] px-3.5 py-1.5 rounded-lg transition"
                                >
                                    + Tambah Paket
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {packages.slice(0, 3).map((pkg) => (
                                    <div
                                        key={pkg.id}
                                        className="flex items-center gap-3 p-2.5 rounded-xl border border-[#E8E2D7] hover:bg-[#FAF6F0]/40 transition"
                                    >
                                        {pkg.image_url ? (
                                            <img
                                                src={pkg.image_url}
                                                alt={pkg.package_name}
                                                className="w-10 h-10 rounded-lg object-cover border border-[#E8E2D7] shrink-0"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg bg-[#FAF6F0] border border-[#E8E2D7] flex items-center justify-center text-[#8C998E] shrink-0">
                                                <Package className="w-5 h-5 text-[#8C998E]" />
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-xs font-bold text-[#2F3931] truncate">
                                                {pkg.package_name}
                                            </h4>
                                            <p className="text-[11px] text-[#657166] font-semibold">
                                                {formatRupiah(pkg.price)}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                <Link
                                    to="/vendor/packages/create"
                                    className="w-full mt-2 py-2 border border-dashed border-[#657166]/40 text-[#657166] hover:bg-[#657166]/5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Tambah Paket Baru</span>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Panduan Ringkas Operasional Vendor */}
                    <div className="bg-[#FAF6F0]/50 rounded-2xl border border-[#E8E2D7] p-5">
                        <div className="flex items-center gap-2 mb-2.5">
                            <Sparkles className="w-4 h-4 text-[#657166]" />
                            <h3 className="text-xs font-bold text-[#2F3931] uppercase tracking-wider">
                                Tips Sukses Mitra EVENTO
                            </h3>
                        </div>
                        <ul className="text-xs text-[#738075] space-y-2 leading-relaxed">
                            <li className="flex items-start gap-2">
                                <span className="text-[#657166] font-bold">•</span>
                                <span>
                                    <strong>Respon Cepat:</strong> Segera terima atau tolak tawaran pekerjaan agar tim EO dapat memastikan jadwal klien.
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#657166] font-bold">•</span>
                                <span>
                                    <strong>Update Progres:</strong> Unggah foto dokumentasi kesiapan di hari-H acara agar EO dapat mereview dan membagikan progres ke klien.
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#657166] font-bold">•</span>
                                <span>
                                    <strong>Voucher & Invoice:</strong> Periksa dokumen Voucher Kas Keluar setelah EO mencairkan honor pekerjaan Anda.
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
