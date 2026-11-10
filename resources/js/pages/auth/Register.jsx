import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

export default function Register() {
    const navigate = useNavigate();
    const { isAuthenticated, user, getRoleDashboard } = useAuth();

    // Jika sudah login, arahkan ke dashboard perannya
    if (isAuthenticated && user) {
        navigate(getRoleDashboard(user.role), { replace: true });
    }

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [registeredUser, setRegisteredUser] = useState(null);
    const [isResending, setIsResending] = useState(false);
    const [resendStatus, setResendStatus] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    const handleQuickFill = () => {
        const randomNum = Math.floor(Math.random() * 900) + 100;
        setFormData({
            name: `Pelanggan Evento ${randomNum}`,
            email: `customer${randomNum}@evento.test`,
            password: "password123",
            password_confirmation: "password123",
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

        setIsSubmitting(true);

        try {
            const response = await api.post("/register", {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                password_confirmation: formData.password_confirmation,
            });

            const { token, user: createdUser } = response.data;
            if (token) {
                localStorage.setItem("auth_token", token);
            }

            setRegisteredUser(createdUser);
            setRegistrationSuccess(true);
        } catch (err) {
            if (err.response && err.response.data && err.response.data.errors) {
                setErrors(err.response.data.errors);
            } else if (err.response && err.response.data && err.response.data.message) {
                setErrors({ general: err.response.data.message });
            } else {
                setErrors({ general: "Terjadi kesalahan saat mendaftar. Silakan coba lagi." });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResendVerification = async () => {
        if (!registeredUser?.email && !formData.email) return;

        setIsResending(true);
        setResendStatus(null);

        try {
            const emailToSend = registeredUser?.email || formData.email;
            const res = await api.post("/email/verification-notification", {
                email: emailToSend,
            });
            setResendStatus({
                type: "success",
                message: res.data.message || "Tautan verifikasi baru berhasil dikirim!",
            });
        } catch (err) {
            setResendStatus({
                type: "error",
                message: err.response?.data?.message || "Gagal mengirim ulang email verifikasi. Coba beberapa saat lagi.",
            });
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md">

                {/* Logo & Brand Header */}
                <div className="text-center mb-6">
                    <Link to="/" className="inline-block mb-3 hover:opacity-90 transition-opacity">
                        <img
                            src="/logo.png"
                            alt="EVENTO"
                            className="h-12 w-auto mx-auto object-contain"
                        />
                    </Link>
                    <h1 className="text-xl font-extrabold text-[#2F3931] tracking-tight">
                        Daftar Akun <span className="text-[#657166]">Customer</span>
                    </h1>
                    <p className="text-xs text-[#738075] mt-1">
                        Pesan acara impian, pilih vendor terkurasi, dan pantau persiapan dengan mudah
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D7] shadow-xs">
                    {registrationSuccess ? (
                        /* Tampilan Sukses Registrasi & Instruksi Verifikasi Email */
                        <div className="text-center py-2 space-y-4">
                            <div className="w-16 h-16 bg-[#EBF3E8] border border-[#CFD8C4] rounded-2xl flex items-center justify-center mx-auto text-3xl">
                                ✉️
                            </div>

                            <div>
                                <h2 className="text-lg font-bold text-[#2F3931]">
                                    Pendaftaran Akun Berhasil!
                                </h2>
                                <p className="text-xs text-[#556056] mt-1.5 leading-relaxed">
                                    Halo <strong>{registeredUser?.name}</strong>, kami telah mengirimkan tautan verifikasi ke email:
                                </p>
                                <div className="mt-2 inline-block px-3 py-1.5 bg-[#FAF6F0] border border-[#E8E2D7] rounded-xl text-xs font-mono font-bold text-[#2F3931]">
                                    {registeredUser?.email || formData.email}
                                </div>
                            </div>

                            <div className="bg-[#FAF6F0] border border-[#E8E2D7] rounded-2xl p-4 text-left text-xs text-[#556056] space-y-2">
                                <p className="font-bold text-[#2F3931] flex items-center gap-1.5">
                                    <span>👉</span> Langkah Selanjutnya:
                                </p>
                                <ol className="list-decimal list-inside space-y-1 text-[11px] text-[#738075] pl-1">
                                    <li>Buka aplikasi atau web email Anda.</li>
                                    <li>Cek pesan masuk dari <strong>EVENTO Platform</strong> (periksa juga folder Spam/Promosi jika tidak ada).</li>
                                    <li>Klik tombol <strong>"Verifikasi Alamat Email Saya"</strong> untuk mengaktifkan akun.</li>
                                </ol>
                            </div>

                            {resendStatus && (
                                <div
                                    className={`p-3 rounded-xl text-xs font-medium text-left ${
                                        resendStatus.type === "success"
                                            ? "bg-[#EBF3E8] border border-[#CFD8C4] text-[#2A4022]"
                                            : "bg-[#F3C3B2]/30 border border-[#F3C3B2] text-[#6B3222]"
                                    }`}
                                >
                                    {resendStatus.message}
                                </div>
                            )}

                            <div className="pt-2 flex flex-col gap-2">
                                <button
                                    type="button"
                                    onClick={handleResendVerification}
                                    disabled={isResending}
                                    className="w-full py-2.5 px-4 bg-white border border-[#E8E2D7] hover:bg-[#FAF6F0] text-xs font-bold text-[#2F3931] rounded-xl transition cursor-pointer disabled:opacity-50"
                                >
                                    {isResending ? "Mengirim Ulang..." : "↻ Kirim Ulang Email Verifikasi"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => navigate("/client/dashboard")}
                                    className="w-full py-3 px-4 bg-[#657166] hover:bg-[#556056] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer border border-[#525C53]"
                                >
                                    Lanjut ke Dashboard Customer →
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Formulir Pendaftaran Customer */
                        <>
                            {errors.general && (
                                <div className="p-3 mb-4 bg-[#F3C3B2]/30 border border-[#F3C3B2] text-[#6B3222] rounded-xl text-xs font-medium">
                                    {errors.general}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#2F3931] mb-1.5">
                                        Nama Lengkap <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="cth: Maya Pratama"
                                        className="w-full border border-[#E8E2D7] bg-[#FAF6F0]/50 rounded-xl px-3.5 py-2.5 text-sm text-[#2F3931] placeholder-[#98A29A] focus:outline-none focus:ring-2 focus:ring-[#99CDD8] focus:border-[#99CDD8] transition"
                                    />
                                    {errors.name && (
                                        <p className="text-[11px] text-red-600 mt-1 font-medium">{errors.name[0]}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#2F3931] mb-1.5">
                                        Alamat Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        placeholder="nama@email.com"
                                        className="w-full border border-[#E8E2D7] bg-[#FAF6F0]/50 rounded-xl px-3.5 py-2.5 text-sm text-[#2F3931] placeholder-[#98A29A] focus:outline-none focus:ring-2 focus:ring-[#99CDD8] focus:border-[#99CDD8] transition"
                                    />
                                    {errors.email && (
                                        <p className="text-[11px] text-red-600 mt-1 font-medium">{errors.email[0]}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#2F3931] mb-1.5">
                                        Kata Sandi <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        placeholder="Minimal 8 karakter"
                                        className="w-full border border-[#E8E2D7] bg-[#FAF6F0]/50 rounded-xl px-3.5 py-2.5 text-sm text-[#2F3931] placeholder-[#98A29A] focus:outline-none focus:ring-2 focus:ring-[#99CDD8] focus:border-[#99CDD8] transition"
                                    />
                                    {errors.password && (
                                        <p className="text-[11px] text-red-600 mt-1 font-medium">{errors.password[0]}</p>
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
                                        placeholder="Ulangi kata sandi"
                                        className="w-full border border-[#E8E2D7] bg-[#FAF6F0]/50 rounded-xl px-3.5 py-2.5 text-sm text-[#2F3931] placeholder-[#98A29A] focus:outline-none focus:ring-2 focus:ring-[#99CDD8] focus:border-[#99CDD8] transition"
                                    />
                                    {errors.password_confirmation && (
                                        <p className="text-[11px] text-red-600 mt-1 font-medium">{errors.password_confirmation[0]}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full mt-2 py-3 bg-[#657166] hover:bg-[#556056] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer border border-[#525C53] disabled:opacity-60"
                                >
                                    {isSubmitting ? "Mendaftarkan Akun..." : "Daftar Akun Customer Sekarang"}
                                </button>
                            </form>

                            {/* Tombol Isi Otomatis Cepat */}
                            <div className="mt-5 pt-4 border-t border-[#E8E2D7]">
                                <button
                                    type="button"
                                    onClick={handleQuickFill}
                                    className="w-full py-2 px-3 text-xs bg-[#FAF6F0] hover:bg-[#F3EFE8] text-[#556056] font-medium border border-[#E8E2D7] rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <span>⚡</span> Isi Form Otomatis (Demo Test)
                                </button>
                            </div>

                            {/* Link Navigasi Tambahan */}
                            <div className="mt-4 pt-4 border-t border-[#E8E2D7] text-center space-y-2">
                                <p className="text-xs text-[#738075]">
                                    Sudah punya akun?{" "}
                                    <Link to="/login" className="font-bold text-[#657166] hover:underline">
                                        Masuk di Sini →
                                    </Link>
                                </p>
                                <p className="text-[11px] text-[#8C998E]">
                                    Penyedia jasa / vendor acara?{" "}
                                    <Link to="/register/vendor" className="font-bold text-[#657166] hover:underline">
                                        Daftar Sebagai Mitra Vendor
                                    </Link>
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

