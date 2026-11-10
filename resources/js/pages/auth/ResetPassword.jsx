import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/axios";

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const tokenFromUrl = searchParams.get("token") || "";
    const emailFromUrl = searchParams.get("email") || "";

    const [email, setEmail] = useState(emailFromUrl);
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errors, setErrors] = useState({});

    const isTokenMissing = !tokenFromUrl;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        if (password !== passwordConfirmation) {
            setErrors({ password_confirmation: ["Konfirmasi kata sandi baru tidak cocok."] });
            return;
        }

        setIsSubmitting(true);

        try {
            await api.post("/reset-password", {
                token: tokenFromUrl,
                email,
                password,
                password_confirmation: passwordConfirmation,
            });

            setIsSuccess(true);
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else if (err.response?.data?.message) {
                setErrors({ general: err.response.data.message });
            } else {
                setErrors({ general: "Gagal memperbarui kata sandi. Pastikan tautan belum kedaluwarsa." });
            }
        } finally {
            setIsSubmitting(false);
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
                    <h1 className="text-2xl font-extrabold text-[#2F3931] tracking-tight">
                        Atur Ulang <span className="text-[#657166]">Kata Sandi</span>
                    </h1>
                    <p className="text-xs text-[#738075] mt-1">
                        Buat kata sandi baru yang kuat untuk mengamankan akun EVENTO Anda
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D7] shadow-xs">
                    {isTokenMissing ? (
                        <div className="text-center py-4 space-y-4">
                            <div className="w-16 h-16 bg-[#F3C3B2]/30 border border-[#F3C3B2] rounded-2xl flex items-center justify-center mx-auto text-3xl">
                                ⚠️
                            </div>

                            <div>
                                <h2 className="text-lg font-bold text-[#2F3931]">
                                    Tautan Tidak Lengkap / Tidak Valid
                                </h2>
                                <p className="text-xs text-[#556056] mt-1.5 leading-relaxed">
                                    Token pengaturan ulang kata sandi tidak ditemukan pada tautan ini. Silakan ajukan permohonan lupa kata sandi baru.
                                </p>
                            </div>

                            <div className="pt-2">
                                <Link
                                    to="/forgot-password"
                                    className="inline-block w-full py-3 px-4 bg-[#657166] hover:bg-[#556056] text-white text-xs font-bold rounded-xl transition shadow-xs text-center border border-[#525C53]"
                                >
                                    Ajukan Reset Kata Sandi Baru →
                                </Link>
                            </div>
                        </div>
                    ) : isSuccess ? (
                        <div className="text-center py-4 space-y-4">
                            <div className="w-16 h-16 bg-[#EBF3E8] border border-[#CFD8C4] rounded-2xl flex items-center justify-center mx-auto text-3xl">
                                🎉
                            </div>

                            <div>
                                <h2 className="text-lg font-bold text-[#2F3931]">
                                    Kata Sandi Berhasil Diperbarui!
                                </h2>
                                <p className="text-xs text-[#556056] mt-1.5 leading-relaxed">
                                    Kata sandi Anda telah berhasil diubah. Seluruh sesi lama telah diamankan. Silakan masuk ke akun Anda dengan kata sandi baru.
                                </p>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={() => navigate("/login")}
                                    className="w-full py-3 px-4 bg-[#657166] hover:bg-[#556056] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer border border-[#525C53]"
                                >
                                    Masuk ke Akun Sekarang →
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {errors.general && (
                                <div className="p-3 mb-4 bg-[#F3C3B2]/30 border border-[#F3C3B2] text-[#6B3222] rounded-xl text-xs font-medium">
                                    {errors.general}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#2F3931] mb-1.5">
                                        Alamat Email Akun
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
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
                                        Kata Sandi Baru
                                    </label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
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
                                        Konfirmasi Kata Sandi Baru
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordConfirmation}
                                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                                        required
                                        placeholder="Ulangi kata sandi baru"
                                        className="w-full border border-[#E8E2D7] bg-[#FAF6F0]/50 rounded-xl px-3.5 py-2.5 text-sm text-[#2F3931] placeholder-[#98A29A] focus:outline-none focus:ring-2 focus:ring-[#99CDD8] focus:border-[#99CDD8] transition"
                                    />
                                    {errors.password_confirmation && (
                                        <p className="text-[11px] text-red-600 mt-1 font-medium">{errors.password_confirmation[0]}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-3 bg-[#657166] hover:bg-[#556056] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer border border-[#525C53] disabled:opacity-60"
                                >
                                    {isSubmitting ? "Menyimpan Kata Sandi..." : "Simpan Kata Sandi Baru"}
                                </button>
                            </form>

                            <div className="mt-5 pt-4 border-t border-[#E8E2D7] text-center">
                                <Link to="/login" className="text-xs text-[#738075] hover:text-[#2F3931]">
                                    ← Batal & Kembali ke Halaman Masuk
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

