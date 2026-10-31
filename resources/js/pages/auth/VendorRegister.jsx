import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

export default function VendorRegister() {
    const navigate = useNavigate();
    const { isAuthenticated, user, getRoleDashboard } = useAuth();

    // Jika sudah login, redirect ke dashboard perannya
    if (isAuthenticated && user) {
        navigate(getRoleDashboard(user.role), { replace: true });
    }

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        business_name: "",
        category: "Catering & Jamuan",
        contact_number: "",
        address: "",
        social_media: "",
        agreement: false,
        description: "",
    });

    const [showTermsModal, setShowTermsModal] = useState(false);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [registeredVendor, setRegisteredVendor] = useState(null);

    const categories = [
        "Catering & Jamuan",
        "Dekorasi & Florist",
        "Venue & Ballroom",
        "Dokumentasi & Sinematografi",
        "MUA & Busana",
        "Sound & Entertainment",
        "Lainnya",
    ];

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    const handleQuickFill = () => {
        const randomNum = Math.floor(Math.random() * 900) + 100;
        setFormData({
            name: `Mitra Vendor ${randomNum}`,
            email: `vendor${randomNum}@mitra.evento.id`,
            password: "password123",
            password_confirmation: "password123",
            business_name: `Studio Pesona Kreasi ${randomNum}`,
            category: "Dekorasi & Florist",
            contact_number: `081234567${randomNum}`,
            address: `Jl. Melati Indah No. ${randomNum}, Kebayoran Baru, Jakarta Selatan`,
            social_media: `@pesonakreasi${randomNum}`,
            agreement: true,
            description: "Spesialis tata panggung pelaminan minimalis, pergola kaca, dan dekorasi tematik pernikahan.",
        });
        setErrors({});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        if (formData.password !== formData.password_confirmation) {
            setErrors({ password_confirmation: ["Konfirmasi kata sandi tidak cocok."] });
            return;
        }

        if (!formData.agreement) {
            setErrors({ agreement: ["Anda wajib mencentang persetujuan Syarat & Ketentuan Kemitraan Vendor EVENTO."] });
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await api.post("/register/vendor", {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                business_name: formData.business_name,
                category: formData.category,
                contact_number: formData.contact_number,
                address: formData.address,
                social_media: formData.social_media,
                agreement: formData.agreement,
                description: formData.description,
            });

            // Simpan token otomatis jika API mengembalikan token
            if (response.data.token) {
                localStorage.setItem("auth_token", response.data.token);
            }

            setRegisteredVendor(response.data.user?.vendor || null);
            setRegistrationSuccess(true);
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else if (err.response?.data?.message) {
                setErrors({ general: err.response.data.message });
            } else {
                setErrors({ general: "Terjadi kesalahan saat pendaftaran. Silakan coba kembali." });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FAF6F0] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
            
            {/* Header Brand */}
            <div className="w-full max-w-2xl mb-6">
                <div className="flex items-center justify-between mb-4">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#738075] hover:text-[#2F3931] transition-colors"
                    >
                        <span>← Kembali ke Beranda</span>
                    </Link>
                    <button
                        type="button"
                        onClick={handleQuickFill}
                        className="text-[11px] font-semibold text-[#657166] hover:text-[#556056] bg-white px-2.5 py-1 rounded-lg border border-[#E8E2D7] shadow-2xs hover:bg-[#FAF6F0] transition-all"
                    >
                        ⚡ Isi Contoh Otomatis
                    </button>
                </div>

                <div className="text-center">
                    <Link to="/" className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#F3C3B2] border border-[#E8CEB2] shadow-xs mb-3 hover:scale-105 transition-transform">
                        <span className="text-[#55271C] font-black text-2xl tracking-tighter">E</span>
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2F3931] tracking-tight">
                        Pendaftaran Mitra Vendor <span className="text-[#657166]">EVENTO</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-[#738075] mt-1.5 max-w-lg mx-auto">
                        Bergabunglah dengan ekosistem acara profesional. Nikmati jaminan harga terkunci (*Locked Price*), kemudahan log pengerjaan, dan kepastian pembayaran.
                    </p>
                </div>
            </div>

            {/* Sukses Modal / Card View */}
            {registrationSuccess ? (
                <div className="w-full max-w-xl bg-white rounded-3xl p-8 border border-[#E8E2D7] shadow-sm text-center animate-fade-in">
                    <div className="w-16 h-16 rounded-full bg-[#DAEBE3] border border-[#B6C2AA] text-[#33422A] flex items-center justify-center mx-auto text-3xl mb-4">
                        ⏳
                    </div>
                    <span className="inline-block px-3 py-1 bg-[#DAEBE3] text-[#33422A] text-xs font-bold rounded-full mb-2">
                        Pendaftaran Berhasil Diajukan
                    </span>
                    <h2 className="text-xl font-extrabold text-[#2F3931]">
                        Profil Vendor Anda Sedang Ditinjau
                    </h2>
                    <p className="text-xs text-[#738075] mt-2 leading-relaxed max-w-md mx-auto">
                        Terima kasih telah mendaftar, <strong>{formData.name}</strong>! Tim Event Organizer (EO) EVENTO akan memverifikasi kelengkapan profil bisnis <strong>{formData.business_name}</strong> dalam waktu 1x24 jam kerja.
                    </p>

                    <div className="bg-[#FAF6F0] rounded-2xl p-4 border border-[#E8E2D7] text-left mt-6 space-y-2 text-xs">
                        <div className="flex justify-between border-b border-[#E8E2D7] pb-2">
                            <span className="text-[#738075]">Nama Usaha:</span>
                            <span className="font-bold text-[#2F3931]">{formData.business_name}</span>
                        </div>
                        <div className="flex justify-between border-b border-[#E8E2D7] pb-2">
                            <span className="text-[#738075]">Kategori:</span>
                            <span className="font-bold text-[#657166]">{formData.category}</span>
                        </div>
                        <div className="flex justify-between border-b border-[#E8E2D7] pb-2">
                            <span className="text-[#738075]">Email Login:</span>
                            <span className="font-bold text-[#2F3931]">{formData.email}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[#738075]">Status Awal:</span>
                            <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                                Menunggu Persetujuan EO
                            </span>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            type="button"
                            onClick={() => navigate("/vendor/dashboard")}
                            className="px-6 py-2.5 bg-[#657166] hover:bg-[#556056] text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                        >
                            Masuk ke Dashboard Vendor
                        </button>
                        <Link
                            to="/login"
                            className="px-6 py-2.5 bg-white border border-[#E8E2D7] hover:bg-[#FAF6F0] text-[#2F3931] rounded-xl text-xs font-bold transition-all"
                        >
                            Ke Halaman Login
                        </Link>
                    </div>
                </div>
            ) : (
                /* Registration Form Card */
                <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-10 border border-[#E8E2D7] shadow-sm">
                    {errors.general && (
                        <div className="p-3 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
                            {errors.general}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* SECTION 1: DATA AKUN */}
                        <div>
                            <div className="flex items-center gap-2 pb-2 border-b border-[#E8E2D7] mb-4">
                                <span className="w-6 h-6 rounded-full bg-[#99CDD8]/30 text-[#1F4B54] text-xs font-bold flex items-center justify-center">
                                    1
                                </span>
                                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#2F3931]">
                                    Informasi Akun Pengguna (Untuk Login)
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#2F3931] mb-1.5">
                                        Nama Penanggung Jawab <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="cth: Budi Pratama"
                                        className="w-full border border-[#E8E2D7] bg-[#FAF6F0]/50 rounded-xl px-3.5 py-2.5 text-xs text-[#2F3931] placeholder-[#98A29A] focus:outline-none focus:ring-2 focus:ring-[#99CDD8] focus:border-[#99CDD8] transition"
                                    />
                                    {errors.name && (
                                        <p className="text-[11px] text-red-600 mt-1">{errors.name[0]}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#2F3931] mb-1.5">
                                        Alamat Email Resmi <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        placeholder="nama@bisnisvendor.com"
                                        className="w-full border border-[#E8E2D7] bg-[#FAF6F0]/50 rounded-xl px-3.5 py-2.5 text-xs text-[#2F3931] placeholder-[#98A29A] focus:outline-none focus:ring-2 focus:ring-[#99CDD8] focus:border-[#99CDD8] transition"
                                    />
                                    {errors.email && (
                                        <p className="text-[11px] text-red-600 mt-1">{errors.email[0]}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#2F3931] mb-1.5">
                                        Kata Sandi <span className="text-red-500">* (Min. 8 Karakter)</span>
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        placeholder="••••••••"
                                        className="w-full border border-[#E8E2D7] bg-[#FAF6F0]/50 rounded-xl px-3.5 py-2.5 text-xs text-[#2F3931] placeholder-[#98A29A] focus:outline-none focus:ring-2 focus:ring-[#99CDD8] focus:border-[#99CDD8] transition"
                                    />
                                    {errors.password && (
                                        <p className="text-[11px] text-red-600 mt-1">{errors.password[0]}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#2F3931] mb-1.5">
                                        Konfirmasi Kata Sandi <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        name="password_confirmation"
                                        value={formData.password_confirmation}
                                        onChange={handleChange}
                                        required
                                        placeholder="••••••••"
                                        className="w-full border border-[#E8E2D7] bg-[#FAF6F0]/50 rounded-xl px-3.5 py-2.5 text-xs text-[#2F3931] placeholder-[#98A29A] focus:outline-none focus:ring-2 focus:ring-[#99CDD8] focus:border-[#99CDD8] transition"
                                    />
                                    {errors.password_confirmation && (
                                        <p className="text-[11px] text-red-600 mt-1">{errors.password_confirmation[0]}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: DATA USAHA VENDOR */}
                        <div className="pt-2">
                            <div className="flex items-center gap-2 pb-2 border-b border-[#E8E2D7] mb-4">
                                <span className="w-6 h-6 rounded-full bg-[#DAEBE3] text-[#33422A] text-xs font-bold flex items-center justify-center">
                                    2
                                </span>
                                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#2F3931]">
                                    Profil Bisnis / Usaha Vendor
                                </h3>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-[#2F3931] mb-1.5">
                                            Nama Bisnis / Brand Vendor <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="business_name"
                                            value={formData.business_name}
                                            onChange={handleChange}
                                            required
                                            placeholder="cth: CV Citra Flora Studio"
                                            className="w-full border border-[#E8E2D7] bg-[#FAF6F0]/50 rounded-xl px-3.5 py-2.5 text-xs text-[#2F3931] placeholder-[#98A29A] focus:outline-none focus:ring-2 focus:ring-[#99CDD8] focus:border-[#99CDD8] transition"
                                        />
                                        {errors.business_name && (
                                            <p className="text-[11px] text-red-600 mt-1">{errors.business_name[0]}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-[#2F3931] mb-1.5">
                                            Kategori Layanan Utama <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange}
                                            required
                                            className="w-full border border-[#E8E2D7] bg-[#FAF6F0]/50 rounded-xl px-3.5 py-2.5 text-xs text-[#2F3931] focus:outline-none focus:ring-2 focus:ring-[#99CDD8] focus:border-[#99CDD8] transition"
                                        >
                                            {categories.map((cat, i) => (
                                                <option key={i} value={cat}>
                                                    {cat}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.category && (
                                            <p className="text-[11px] text-red-600 mt-1">{errors.category[0]}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#2F3931] mb-1.5">
                                        Nomor Telepon / WhatsApp Bisnis <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        name="contact_number"
                                        value={formData.contact_number}
                                        onChange={handleChange}
                                        required
                                        placeholder="cth: 081234567890"
                                        className="w-full border border-[#E8E2D7] bg-[#FAF6F0]/50 rounded-xl px-3.5 py-2.5 text-xs text-[#2F3931] placeholder-[#98A29A] focus:outline-none focus:ring-2 focus:ring-[#99CDD8] focus:border-[#99CDD8] transition"
                                    />
                                    {errors.contact_number && (
                                        <p className="text-[11px] text-red-600 mt-1">{errors.contact_number[0]}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#2F3931] mb-1.5">
                                        Media Sosial Bisnis / Portofolio (Instagram / TikTok / Web) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-2.5 text-[#738075] text-xs">📸</span>
                                        <input
                                            type="text"
                                            name="social_media"
                                            value={formData.social_media}
                                            onChange={handleChange}
                                            required
                                            placeholder="cth: @pesonakreasi.decor atau instagram.com/pesonakreasi"
                                            className="w-full border border-[#E8E2D7] bg-[#FAF6F0]/50 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-[#2F3931] placeholder-[#98A29A] focus:outline-none focus:ring-2 focus:ring-[#99CDD8] focus:border-[#99CDD8] transition"
                                        />
                                    </div>
                                    <p className="text-[10px] text-[#738075] mt-1">
                                        Digunakan oleh tim kurator EO EVENTO untuk meninjau portofolio karya & kredibilitas usaha Anda.
                                    </p>
                                    {errors.social_media && (
                                        <p className="text-[11px] text-red-600 mt-1">{errors.social_media[0]}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#2F3931] mb-1.5">
                                        Alamat Lengkap Kantor / Studio <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="address"
                                        rows="2"
                                        value={formData.address}
                                        onChange={handleChange}
                                        required
                                        placeholder="cth: Jl. Antasari No. 25, Cilandak, Jakarta Selatan"
                                        className="w-full border border-[#E8E2D7] bg-[#FAF6F0]/50 rounded-xl px-3.5 py-2.5 text-xs text-[#2F3931] placeholder-[#98A29A] focus:outline-none focus:ring-2 focus:ring-[#99CDD8] focus:border-[#99CDD8] transition resize-none"
                                    ></textarea>
                                    {errors.address && (
                                        <p className="text-[11px] text-red-600 mt-1">{errors.address[0]}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#2F3931] mb-1.5">
                                        Deskripsi Singkat / Pengalaman Layanan (Opsional)
                                    </label>
                                    <textarea
                                        name="description"
                                        rows="3"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Jelaskan spesialisasi paket, portofolio acara, atau kapasitas pengerjaan usaha Anda..."
                                        className="w-full border border-[#E8E2D7] bg-[#FAF6F0]/50 rounded-xl px-3.5 py-2.5 text-xs text-[#2F3931] placeholder-[#98A29A] focus:outline-none focus:ring-2 focus:ring-[#99CDD8] focus:border-[#99CDD8] transition resize-none"
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Syarat & Ketentuan Kemitraan */}
                        <div className="p-4 bg-[#FAF6F0]/80 rounded-2xl border border-[#E8E2D7] space-y-2">
                            <div className="flex items-start gap-2.5">
                                <input
                                    type="checkbox"
                                    id="agreement"
                                    name="agreement"
                                    checked={formData.agreement}
                                    onChange={handleChange}
                                    required
                                    className="mt-0.5 w-4 h-4 text-[#657166] rounded border-[#BAC5AF] focus:ring-[#99CDD8] cursor-pointer"
                                />
                                <label htmlFor="agreement" className="text-xs text-[#2F3931] cursor-pointer leading-relaxed">
                                    Saya menyetujui seluruh{" "}
                                    <button
                                        type="button"
                                        onClick={() => setShowTermsModal(true)}
                                        className="font-bold text-[#657166] underline hover:text-[#2F3931] cursor-pointer"
                                    >
                                        Syarat & Ketentuan Kemitraan Vendor EVENTO
                                    </button>{" "}
                                    termasuk standar mutu layanan, kepatuhan jadwal acara, dan sistem pembayaran escrow. <span className="text-red-500">*</span>
                                </label>
                            </div>
                            {errors.agreement && (
                                <p className="text-[11px] text-red-600 pl-6">{errors.agreement[0]}</p>
                            )}
                        </div>

                        {/* Catatan Alur Verifikasi */}
                        <div className="p-3.5 bg-[#FAF6F0] rounded-2xl border border-[#E8E2D7] flex items-start gap-2.5 text-[11px] text-[#738075]">
                            <span className="text-base shrink-0">ℹ️</span>
                            <span>
                                Setelah formulir dikirim, tim Event Organizer (EO) EVENTO akan memverifikasi data usaha dan media sosial Anda. Notifikasi aktivasi akun akan dikirimkan ke email terdaftar via SMTP saat disetujui.
                            </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 bg-[#657166] hover:bg-[#556056] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                        <span>Memproses Pendaftaran...</span>
                                    </>
                                ) : (
                                    <span>Ajukan Pendaftaran Vendor</span>
                                )}
                            </button>

                            <div className="text-center mt-4">
                                <span className="text-xs text-[#738075]">
                                    Sudah memiliki akun terdaftar?{" "}
                                    <Link to="/login" className="font-bold text-[#657166] hover:underline">
                                        Masuk di sini
                                    </Link>
                                </span>
                            </div>
                        </div>

                    </form>
                </div>
            )}

            {/* Modal Syarat & Ketentuan */}
            {showTermsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-[#E8E2D7] shadow-xl max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D7]">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">📜</span>
                                <h3 className="text-sm font-extrabold text-[#2F3931]">
                                    Syarat & Ketentuan Kemitraan Vendor
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowTermsModal(false)}
                                className="w-7 h-7 rounded-full bg-[#FAF6F0] hover:bg-[#E8E2D7] text-[#738075] text-xs flex items-center justify-center cursor-pointer transition"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="overflow-y-auto py-4 space-y-3.5 text-xs text-[#556056] leading-relaxed pr-1">
                            <div>
                                <h4 className="font-bold text-[#2F3931] mb-1">1. Integritas & Standar Mutu Layanan</h4>
                                <p>Vendor wajib menyediakan perlengkapan, konsumsi, atau jasa profesional sesuai dengan spesifikasi dan foto yang ditampilkan pada paket penawaran yang disetujui klien dan EO.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-[#2F3931] mb-1">2. Kepatuhan Jadwal & Rundown Acara</h4>
                                <p>Vendor berkomitmen hadir dan menyelesaikan proses *loading* atau persiapan minimal 2 jam sebelum acara dimulai sesuai timeline yang diatur oleh Event Organizer (EO).</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-[#2F3931] mb-1">3. Transaksi & Rekening Bersama (Escrow)</h4>
                                <p>Demi keamanan kedua pihak, seluruh transaksi dilakukan melalui sistem pembayaran terproteksi EVENTO. Dana pembayaran akan diteruskan kepada vendor secara bertahap setelah penyelesaian pekerjaan diverifikasi oleh EO.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-[#2F3931] mb-1">4. Verifikasi & Kurasi Media Sosial</h4>
                                <p>Tim kurator EO berhak memeriksa portofolio akun media sosial vendor dan melakukan seleksi kualifikasi sebelum menyetujui akun vendor untuk aktif di platform EVENTO.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-[#2F3931] mb-1">5. Notifikasi & Komunikasi Resmi</h4>
                                <p>Pemberitahuan resmi terkait persetujuan akun, penugasan acara, dan pencairan pembayaran akan dikirimkan melalui sistem aplikasi serta email resmi yang terdaftar via SMTP EVENTO.</p>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-[#E8E2D7] flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setFormData((prev) => ({ ...prev, agreement: true }));
                                    setShowTermsModal(false);
                                }}
                                className="w-full py-2.5 bg-[#657166] hover:bg-[#556056] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                                Saya Mengerti & Setujui Ketentuan Ini
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
