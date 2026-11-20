import { useEffect, useState } from "react";
import {
    Briefcase,
    Clock,
    Check,
    X,
    RefreshCw,
    Send,
    AlertTriangle,
    Image as ImageIcon,
    Trash2,
    Calendar,
    FileText,
    CreditCard,
} from "lucide-react";
import api from "../../api/axios";
import { useDialog } from "../../context/DialogContext";
import { formatRupiah } from "../../utils/formatters";
import VendorPayoutModal from "../../components/invoice/VendorPayoutModal";

export default function VendorJobOffers() {
    const { showAlert, showConfirm, showToast } = useDialog();
    const [jobOffers, setJobOffers] = useState([]);
    const [activeJobs, setActiveJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [rejectionReasons, setRejectionReasons] = useState({});
    const [progressNotes, setProgressNotes] = useState({});
    const [progressPhotos, setProgressPhotos] = useState({});
    const [activeTab, setActiveTab] = useState("all"); // 'all' | 'offers' | 'active'

    // Payout & Invoice Modal
    const [selectedPayoutJob, setSelectedPayoutJob] = useState(null);

    // Rekening Pencairan Bank Vendor
    const [bankName, setBankName] = useState("");
    const [bankAccountNumber, setBankAccountNumber] = useState("");
    const [bankAccountHolder, setBankAccountHolder] = useState("");
    const [savingBank, setSavingBank] = useState(false);
    const [isBankEditing, setIsBankEditing] = useState(false);

    // Mengambil profil vendor untuk rekening bank
    const fetchVendorProfile = async () => {
        try {
            const res = await api.get("/user");
            const v = res.data?.user?.vendor;
            if (v) {
                setBankName(v.bank_name || "");
                setBankAccountNumber(v.bank_account_number || "");
                setBankAccountHolder(v.bank_account_holder || "");
                if (!v.bank_account_number) {
                    setIsBankEditing(true);
                }
            }
        } catch (e) {
            console.error("Gagal memuat profil rekening vendor:", e);
        }
    };

    const handleSaveBank = async (e) => {
        e.preventDefault();
        if (!bankName || !bankAccountNumber || !bankAccountHolder) {
            showToast("Semua informasi rekening bank wajib diisi.", "error");
            return;
        }

        setSavingBank(true);
        try {
            await api.put("/vendor/bank-account", {
                bank_name: bankName,
                bank_account_number: bankAccountNumber,
                bank_account_holder: bankAccountHolder,
            });
            showToast("Informasi rekening pencairan honor berhasil disimpan!", "success");
            setIsBankEditing(false);
        } catch (err) {
            showAlert({
                title: "Gagal Menyimpan Rekening",
                message: err.response?.data?.message || "Terjadi kesalahan saat menyimpan rekening.",
                type: "danger",
            });
        } finally {
            setSavingBank(false);
        }
    };

    // Mengambil tawaran pekerjaan dan pekerjaan aktif.
    const fetchJobs = async () => {
        setLoading(true);
        setError("");

        try {
            const [offersResponse, activeResponse] = await Promise.all([
                api.get("/vendor/job-offers"),
                api.get("/vendor/active-jobs"),
            ]);

            setJobOffers(offersResponse.data.data || []);
            setActiveJobs(activeResponse.data.data || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Gagal mengambil data pekerjaan."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
        fetchVendorProfile();
    }, []);

    // Menerima atau menolak tawaran pekerjaan.
    const handleResponse = async (assignmentId, status) => {
        const reason = rejectionReasons[assignmentId]?.trim() || "";

        if (status === "rejected" && !reason) {
            await showAlert({
                title: "Alasan Diperlukan",
                message: "Alasan penolakan wajib diisi untuk memberi tahu tim EO.",
                type: "warning",
            });
            return;
        }

        const confirmed = await showConfirm({
            title: status === "accepted" ? "Terima Pekerjaan?" : "Tolak Tawaran Pekerjaan?",
            message: status === "accepted"
                ? "Apakah Anda yakin ingin menerima tawaran pekerjaan ini? Pekerjaan akan masuk ke daftar aktif Anda."
                : "Apakah Anda yakin ingin menolak tawaran pekerjaan ini? Alasan akan dikirimkan ke tim EO.",
            confirmText: status === "accepted" ? "Ya, Terima" : "Ya, Tolak",
            cancelText: "Batal",
            isDanger: status === "rejected",
        });

        if (!confirmed) {
            return;
        }

        try {
            await api.patch(
                `/vendor/job-offers/${assignmentId}/response`,
                {
                    status,
                    ...(status === "rejected"
                        ? { rejection_reason: reason }
                        : {}),
                }
            );

            showToast(
                status === "accepted"
                    ? "Tawaran pekerjaan berhasil diterima!"
                    : "Tawaran pekerjaan berhasil ditolak.",
                "success"
            );

            fetchJobs();
        } catch (err) {
            await showAlert({
                title: "Gagal Memproses",
                message: err.response?.data?.message || "Gagal memproses tawaran pekerjaan.",
                type: "danger",
            });
        }
    };

    // Menambahkan catatan progres dan foto pekerjaan aktif.
    const handleProgress = async (assignmentId) => {
        const note = progressNotes[assignmentId]?.trim() || "";
        const photo = progressPhotos[assignmentId];

        if (!note) {
            await showAlert({
                title: "Catatan Kosong",
                message: "Catatan progres wajib diisi sebelum menyimpan update.",
                type: "warning",
            });
            return;
        }

        try {
            const formData = new FormData();
            formData.append("note", note);

            if (photo) {
                formData.append("photo", photo);
            }

            await api.post(
                `/vendor/active-jobs/${assignmentId}/progress`,
                formData
            );

            showToast("Catatan progres berhasil disimpan dan dikirim ke EO.", "success");

            setProgressNotes((prev) => ({
                ...prev,
                [assignmentId]: "",
            }));

            setProgressPhotos((prev) => ({
                ...prev,
                [assignmentId]: null,
            }));

            fetchJobs();
        } catch (err) {
            await showAlert({
                title: "Gagal Menyimpan Progres",
                message: err.response?.data?.message || "Gagal menambahkan catatan progres.",
                type: "danger",
            });
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header Title & Breadcrumb */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <span className="inline-block text-[11px] font-bold text-[#33422A] bg-[#CFD8C4] px-3 py-0.5 rounded-full border border-[#B6C2AA] mb-1.5 uppercase">
                        MODUL MITRA VENDOR
                    </span>
                    <h1 className="text-xl sm:text-2xl font-black text-[#2F3931] tracking-tight">
                        Tawaran Pekerjaan & Progres Acara
                    </h1>
                    <p className="text-xs sm:text-sm text-[#738075] mt-1">
                        Respon tawaran penugasan dari tim EO dan perbarui catatan pengerjaan acara aktif Anda.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={fetchJobs}
                        disabled={loading}
                        className="px-3.5 py-2.5 bg-white border border-[#E8E2D7] rounded-xl text-xs font-bold text-[#556056] hover:bg-[#FAF6F0] transition shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Segarkan data"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                        <span>{loading ? "Memuat..." : "Segarkan"}</span>
                    </button>
                </div>
            </div>

            {/* Metric Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                    onClick={() => setActiveTab(activeTab === "offers" ? "all" : "offers")}
                    className={`bg-white rounded-2xl p-5 border shadow-xs transition-all cursor-pointer flex items-center justify-between ${
                        activeTab === "offers" ? "border-[#657166] ring-2 ring-[#657166]/20" : "border-[#E8E2D7] hover:border-[#CFD8C4]"
                    }`}
                >
                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#738075]">
                            Tawaran Menunggu Respon
                        </span>
                        <p className="text-2xl font-black text-amber-800 mt-1">
                            {jobOffers.length}
                        </p>
                        <p className="text-[11px] text-[#738075] mt-0.5">
                            Segera terima atau tolak tawaran dari EO
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-950 border border-amber-300 flex items-center justify-center font-bold">
                        <Clock className="w-6 h-6 text-amber-800" />
                    </div>
                </div>

                <div
                    onClick={() => setActiveTab(activeTab === "active" ? "all" : "active")}
                    className={`bg-white rounded-2xl p-5 border shadow-xs transition-all cursor-pointer flex items-center justify-between ${
                        activeTab === "active" ? "border-[#657166] ring-2 ring-[#657166]/20" : "border-[#E8E2D7] hover:border-[#CFD8C4]"
                    }`}
                >
                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#738075]">
                            Pekerjaan Aktif Berjalan
                        </span>
                        <p className="text-2xl font-black text-emerald-800 mt-1">
                            {activeJobs.length}
                        </p>
                        <p className="text-[11px] text-[#738075] mt-0.5">
                            Acara sedang dipersiapkan dan butuh update log
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-950 border border-emerald-300 flex items-center justify-center font-bold">
                        <Briefcase className="w-6 h-6 text-emerald-800" />
                    </div>
                </div>
            </div>

            {/* Kartu Informasi Rekening Pencairan Honor Vendor */}
            <div className="bg-white rounded-2xl border border-[#E8E2D7] p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E2D7]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#FAF6F0] text-[#1D4A54] border border-[#E8E2D7] flex items-center justify-center font-bold shrink-0">
                            <CreditCard className="w-5 h-5 text-[#1D4A54]" />
                        </div>
                        <div>
                            <h3 className="text-sm font-extrabold text-[#2F3931]">
                                Rekening Pencairan Honor Vendor
                            </h3>
                            <p className="text-[11px] text-[#738075]">
                                Rekening resmi yang digunakan tim EO EVENTO untuk mentransfer pelunasan honor pekerjaan jasa Anda.
                            </p>
                        </div>
                    </div>

                    {!isBankEditing && (
                        <button
                            type="button"
                            onClick={() => setIsBankEditing(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#BCD4C9] bg-white hover:bg-[#FAF6F0] text-xs font-bold text-[#1D4A54] transition cursor-pointer self-start sm:self-auto"
                        >
                            Ubah Rekening
                        </button>
                    )}
                </div>

                {isBankEditing ? (
                    <form onSubmit={handleSaveBank} className="mt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-[11px] font-bold text-[#2F3931] mb-1">
                                    Nama Bank <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Misal: BCA, Mandiri, BRI, BNI"
                                    value={bankName}
                                    onChange={(e) => setBankName(e.target.value)}
                                    className="w-full text-xs rounded-xl border border-[#E8E2D7] p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#99CDD8]"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-[#2F3931] mb-1">
                                    Nomor Rekening <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Nomor rekening bank"
                                    value={bankAccountNumber}
                                    onChange={(e) => setBankAccountNumber(e.target.value)}
                                    className="w-full text-xs rounded-xl border border-[#E8E2D7] p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#99CDD8]"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-[#2F3931] mb-1">
                                    Nama Pemilik Rekening <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Atas nama sesuai buku tabungan"
                                    value={bankAccountHolder}
                                    onChange={(e) => setBankAccountHolder(e.target.value)}
                                    className="w-full text-xs rounded-xl border border-[#E8E2D7] p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#99CDD8]"
                                    required
                                />
                            </div>
                        </div>

                        <div className="mt-3.5 flex items-center justify-end gap-2">
                            {bankAccountNumber && (
                                <button
                                    type="button"
                                    onClick={() => setIsBankEditing(false)}
                                    className="px-3.5 py-1.5 rounded-xl border border-[#E8E2D7] bg-white text-xs font-bold text-[#738075] hover:bg-[#FAF6F0] transition cursor-pointer"
                                >
                                    Batal
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={savingBank}
                                className="px-4 py-1.5 rounded-xl bg-[#1D4A54] hover:bg-[#15343A] text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
                            >
                                {savingBank ? "Menyimpan..." : "Simpan Rekening"}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="mt-3.5 flex flex-wrap items-center gap-x-8 gap-y-2 text-xs">
                        {bankAccountNumber ? (
                            <>
                                <div>
                                    <span className="text-[10px] text-[#738075] block font-semibold">Bank:</span>
                                    <strong className="text-sm font-bold text-[#2F3931]">{bankName}</strong>
                                </div>
                                <div>
                                    <span className="text-[10px] text-[#738075] block font-semibold">Nomor Rekening:</span>
                                    <strong className="text-sm font-bold text-[#2F3931] font-mono tracking-wider">{bankAccountNumber}</strong>
                                </div>
                                <div>
                                    <span className="text-[10px] text-[#738075] block font-semibold">Atas Nama:</span>
                                    <strong className="text-sm font-bold text-[#2F3931]">{bankAccountHolder}</strong>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 text-amber-800 text-xs">
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>Rekening bank belum diatur. Klik "Ubah Rekening" untuk mengisi rekening bank agar honor pengerjaan acara dapat dicairkan oleh EO.</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{error}</span>
                    </div>
                    <button
                        type="button"
                        onClick={fetchJobs}
                        className="underline font-bold text-rose-900 cursor-pointer"
                    >
                        Coba lagi
                    </button>
                </div>
            )}

            {/* Loading Skeleton */}
            {loading ? (
                <div className="space-y-4">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <div
                            key={i}
                            className="bg-white rounded-2xl border border-[#E8E2D7] p-6 space-y-4 animate-pulse shadow-xs"
                        >
                            <div className="h-5 w-48 bg-[#E8E2D7] rounded-md" />
                            <div className="h-4 w-32 bg-[#E8E2D7]/60 rounded-md" />
                            <div className="h-16 bg-[#FAF6F0] rounded-xl" />
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    {/* Bagian 1: Tawaran dari EO */}
                    {(activeTab === "all" || activeTab === "offers") && (
                        <section className="space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D7]">
                                <h2 className="text-base font-extrabold text-[#2F3931] flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-amber-700" />
                                    <span>Tawaran Pekerjaan dari EO</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300 font-bold">
                                        {jobOffers.length}
                                    </span>
                                </h2>
                            </div>

                            {jobOffers.length === 0 ? (
                                <div className="bg-white rounded-2xl border-2 border-dashed border-[#E8E2D7] p-8 text-center text-[#738075] shadow-xs">
                                    <div className="w-12 h-12 rounded-2xl bg-[#FAF6F0] text-[#657166] border border-[#E8E2D7] flex items-center justify-center mx-auto mb-2">
                                        <Briefcase className="w-6 h-6 text-[#738075]" />
                                    </div>
                                    <p className="text-xs font-bold text-[#2F3931]">Belum ada tawaran pekerjaan baru</p>
                                    <p className="text-[11px] text-[#738075] mt-0.5">
                                        Ketika tim Event Organizer memilih paket Anda untuk penugasan acara, tawaran akan muncul di sini.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {jobOffers.map((job) => (
                                        <div
                                            key={job.id}
                                            className="bg-white rounded-2xl border border-[#E8E2D7] p-5 shadow-xs space-y-4 hover:shadow-md transition-all"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-[#E8E2D7]">
                                                <div>
                                                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#CFD8C4]/60 text-[#2D3A28] border border-[#B6C2AA] mb-1">
                                                        Tawaran Baru
                                                    </span>
                                                    <h3 className="font-black text-base text-[#2F3931] tracking-tight">
                                                        {job.event?.event_name || "Nama acara tidak tersedia"}
                                                    </h3>
                                                    {job.event?.event_date && (
                                                        <p className="text-[11px] text-[#738075] mt-0.5 flex items-center gap-1">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            <span>
                                                                Pelaksanaan: {new Date(job.event.event_date).toLocaleDateString("id-ID", {
                                                                    day: "numeric",
                                                                    month: "long",
                                                                    year: "numeric",
                                                                })}
                                                            </span>
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="sm:text-right bg-[#FAF6F0] p-2.5 rounded-xl border border-[#E8E2D7] shrink-0">
                                                    <span className="text-[10px] text-[#738075] font-semibold block">Paket Ditugaskan:</span>
                                                    <p className="text-xs font-bold text-[#2F3931]">
                                                        {job.package?.package_name || "Paket Khusus"}
                                                    </p>
                                                    {job.package?.price != null && (
                                                        <span className="text-xs font-black text-[#1D4A54] block mt-0.5">
                                                            {formatRupiah(job.package.price)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Input Alasan Penolakan */}
                                            <div>
                                                <label className="mb-1.5 block text-xs font-bold text-[#2F3931]">
                                                    Alasan Penolakan (Hanya wajib diisi jika Anda menolak tawaran)
                                                </label>
                                                <textarea
                                                    value={rejectionReasons[job.id] || ""}
                                                    onChange={(e) =>
                                                        setRejectionReasons((prev) => ({
                                                            ...prev,
                                                            [job.id]: e.target.value,
                                                        }))
                                                    }
                                                    rows={2}
                                                    placeholder="Contoh: Jadwal bertabrakan dengan penugasan lain, kapasitas penuh..."
                                                    className="w-full rounded-xl border border-[#E8E2D7] bg-[#FAF6F0]/60 p-3 text-xs text-[#2F3931] placeholder-[#98A29A] focus:outline-none focus:ring-2 focus:ring-[#99CDD8] focus:border-[#99CDD8] transition"
                                                />
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-[#E8E2D7]/70">
                                                <button
                                                    type="button"
                                                    onClick={() => handleResponse(job.id, "accepted")}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#657166] hover:bg-[#556056] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer border border-[#525C53]"
                                                >
                                                    <Check className="w-3.5 h-3.5" />
                                                    <span>Terima Tawaran</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleResponse(job.id, "rejected")}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 text-xs font-bold border border-rose-300 shadow-2xs transition-colors cursor-pointer"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                    <span>Tolak Tawaran</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    {/* Bagian 2: Pekerjaan Aktif */}
                    {(activeTab === "all" || activeTab === "active") && (
                        <section className="space-y-4 pt-2">
                            <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D7]">
                                <h2 className="text-base font-extrabold text-[#2F3931] flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-[#224436]" />
                                    <span>Pekerjaan Aktif Berjalan</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#DAEBE3] text-[#224436] border border-[#BCD4C9]">
                                        {activeJobs.length}
                                    </span>
                                </h2>
                            </div>

                            {activeJobs.length === 0 ? (
                                <div className="bg-white rounded-2xl border-2 border-dashed border-[#E8E2D7] p-8 text-center text-[#738075] shadow-xs">
                                    <div className="w-12 h-12 rounded-2xl bg-[#FAF6F0] text-[#657166] border border-[#E8E2D7] flex items-center justify-center mx-auto mb-2">
                                        <FileText className="w-6 h-6 text-[#738075]" />
                                    </div>
                                    <p className="text-xs font-bold text-[#2F3931]">Belum ada pekerjaan aktif</p>
                                    <p className="text-[11px] text-[#738075] mt-0.5">
                                        Pekerjaan yang Anda terima akan ditampilkan di sini untuk pengelolaan update progres kerja.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {activeJobs.map((job) => (
                                        <div
                                            key={job.id}
                                            className="bg-white rounded-2xl border border-[#E8E2D7] p-5 shadow-xs space-y-5 hover:shadow-md transition-all"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-[#E8E2D7]">
                                                <div>
                                                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#DAEBE3] text-[#224436] border border-[#BCD4C9] mb-1">
                                                        Pekerjaan Aktif
                                                    </span>
                                                    <h3 className="font-black text-base text-[#2F3931] tracking-tight">
                                                        {job.event?.event_name || "Nama acara tidak tersedia"}
                                                    </h3>
                                                    <p className="text-xs text-[#738075] mt-0.5">
                                                        Paket: <strong className="text-[#2F3931]">{job.package?.package_name || "Paket Khusus"}</strong>
                                                    </p>
                                                </div>

                                                {job.event?.event_date && (
                                                    <div className="text-left sm:text-right bg-[#FAF6F0] p-2.5 rounded-xl border border-[#E8E2D7] text-xs">
                                                        <span className="text-[10px] text-[#738075] font-semibold block">Tanggal Pelaksanaan:</span>
                                                        <span className="font-bold text-[#2F3931]">
                                                            {new Date(job.event.event_date).toLocaleDateString("id-ID", {
                                                                day: "numeric",
                                                                month: "long",
                                                                year: "numeric",
                                                            })}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Bar Status Honorarium & Dokumen Invoice/Voucher */}
                                            <div className="bg-[#FAF6F0] p-4 rounded-xl border border-[#E8E2D7] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div>
                                                    <span className="text-[10px] text-[#738075] font-bold uppercase tracking-wider block">
                                                        Status Pencairan Honor Tim EO:
                                                    </span>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                                        {job.payout_status === "paid" ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-950 border border-emerald-300">
                                                                <Check className="w-3.5 h-3.5" />
                                                                <span>Honor Lunas Dicairkan ({formatRupiah(job.payout_nominal || job.package_price || 0)})</span>
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-950 border border-amber-300">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                <span>Honor Menunggu Pencairan ({formatRupiah(job.package_price || job.locked_price || 0)})</span>
                                                            </span>
                                                        )}
                                                        {job.payout_receipt_number && (
                                                            <span className="text-[11px] text-[#738075] font-mono font-medium">
                                                                • Ref: {job.payout_receipt_number}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedPayoutJob(job)}
                                                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF6F0] text-[#1D4A54] border border-[#BCD4C9] text-xs font-bold shadow-2xs transition cursor-pointer shrink-0"
                                                >
                                                    <FileText className="w-3.5 h-3.5" />
                                                    <span>{job.payout_status === "paid" ? "Lihat Voucher & Bukti Transfer" : "Lihat Invoice Vendor ke EO"}</span>
                                                </button>
                                            </div>

                                            {/* Riwayat Progres yang Pernah Diunggah */}
                                            <div>
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-[#738075] mb-2.5">
                                                    Riwayat Catatan Progres ({job.progress_logs?.length || 0})
                                                </h4>

                                                {job.progress_logs?.length ? (
                                                    <div className="space-y-3">
                                                        {job.progress_logs.map((log) => (
                                                            <div
                                                                key={log.id}
                                                                className="bg-[#FAF6F0]/70 rounded-xl p-3.5 border border-[#E8E2D7]/80 text-xs flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                                                            >
                                                                <div className="space-y-1.5 flex-1 min-w-0">
                                                                    <p className="text-[#2F3931] font-medium leading-relaxed whitespace-pre-line">
                                                                        {log.note}
                                                                    </p>
                                                                    <span className="text-[10px] text-[#738075] block">
                                                                        {new Date(log.created_at).toLocaleString("id-ID")}
                                                                    </span>
                                                                </div>

                                                                {log.photo_url && (
                                                                    <div className="shrink-0">
                                                                        <img
                                                                            src={log.photo_url}
                                                                            alt="Dokumentasi progres"
                                                                            className="h-24 w-32 rounded-lg object-cover border border-[#E8E2D7]"
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-[#738075] italic bg-[#FAF6F0]/40 p-3 rounded-xl border border-dashed border-[#E8E2D7]">
                                                        Belum ada catatan progres yang disimpan untuk pekerjaan ini.
                                                    </p>
                                                )}
                                            </div>

                                            {/* Form Tambah Catatan Progres Baru */}
                                            <div className="bg-[#FAF6F0]/50 rounded-2xl p-4 border border-[#E8E2D7] space-y-3">
                                                <h4 className="text-xs font-bold text-[#2F3931]">
                                                    Tambah Update Progres Pekerjaan
                                                </h4>

                                                <div>
                                                    <label className="mb-1 block text-xs font-semibold text-[#556056]">
                                                        Catatan Progres <span className="text-rose-500">*</span>
                                                    </label>
                                                    <textarea
                                                        value={progressNotes[job.id] || ""}
                                                        onChange={(e) =>
                                                            setProgressNotes((prev) => ({
                                                                ...prev,
                                                                [job.id]: e.target.value,
                                                            }))
                                                        }
                                                        rows={2}
                                                        placeholder="Contoh: Persiapan bahan dan dekorasi sudah mencapai 70%..."
                                                        className="w-full rounded-xl border border-[#E8E2D7] bg-white p-3 text-xs text-[#2F3931] placeholder-[#98A29A] focus:outline-none focus:ring-2 focus:ring-[#99CDD8] focus:border-[#99CDD8] transition"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="mb-1 block text-xs font-semibold text-[#556056]">
                                                        Foto Dokumentasi (Opsional)
                                                    </label>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) =>
                                                            setProgressPhotos((prev) => ({
                                                                ...prev,
                                                                [job.id]: e.target.files?.[0] || null,
                                                            }))
                                                        }
                                                        className="w-full text-xs text-[#738075] file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#DAEBE3] file:text-[#224436] hover:file:bg-[#CFD8C4] cursor-pointer"
                                                    />

                                                    {progressPhotos[job.id] && (
                                                        <div className="mt-2.5 flex items-start gap-3 bg-white p-2.5 rounded-xl border border-[#E8E2D7]">
                                                            <img
                                                                src={URL.createObjectURL(progressPhotos[job.id])}
                                                                alt="Preview foto progres"
                                                                className="h-20 w-28 rounded-lg object-cover border border-[#E8E2D7]"
                                                            />
                                                            <div>
                                                                <p className="text-xs font-bold text-[#2F3931] truncate max-w-xs">
                                                                    {progressPhotos[job.id].name}
                                                                </p>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setProgressPhotos((prev) => ({
                                                                            ...prev,
                                                                            [job.id]: null,
                                                                        }))
                                                                    }
                                                                    className="mt-1 text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                    <span>Hapus foto</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="pt-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleProgress(job.id)}
                                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1D4A54] hover:bg-[#15343A] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                                                    >
                                                        <Send className="w-3.5 h-3.5" />
                                                        <span>Simpan Progres & Beritahu EO</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}
                </>
            )}

            {/* Modal Payout & Invoice Vendor */}
            {selectedPayoutJob && (
                <VendorPayoutModal
                    assignmentId={selectedPayoutJob.id}
                    isEo={false}
                    onClose={() => setSelectedPayoutJob(null)}
                />
            )}
        </div>
    );
}