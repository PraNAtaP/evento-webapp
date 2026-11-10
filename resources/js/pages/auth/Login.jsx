import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
    const [searchParams] = useSearchParams();
    const verifiedParam = searchParams.get("verified");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login, isAuthenticated, user, getRoleDashboard } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated && user) {
            navigate(getRoleDashboard(user.role), { replace: true });
        }
    }, [isAuthenticated, user, navigate, getRoleDashboard]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            const loggedInUser = await login(email, password);
            navigate(getRoleDashboard(loggedInUser.role), { replace: true });
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else if (err.response && err.response.data && err.response.data.errors) {
                const firstError = Object.values(err.response.data.errors)[0];
                setError(Array.isArray(firstError) ? firstError[0] : firstError);
            } else {
                setError("Terjadi kesalahan saat login. Silakan coba lagi.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleQuickFill = (testEmail, testPassword) => {
        setEmail(testEmail);
        setPassword(testPassword);
        setError("");
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
                    <p className="text-xs text-[#738075] mt-1">
                        Platform Manajemen Kalender & Vendor Acara Terintegrasi
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D7] shadow-xs">
                    {verifiedParam === "1" && (
                        <div className="p-3.5 mb-4 bg-[#EBF3E8] border border-[#CFD8C4] text-[#2A4022] rounded-xl text-xs font-medium flex items-start gap-2">
                            <span className="text-base">🎉</span>
                            <div>
                                <p className="font-bold">Email Berhasil Diverifikasi!</p>
                                <p className="text-[11px] text-[#4F6B43] mt-0.5">
                                    Akun Anda telah aktif sepenuhnya. Silakan masuk menggunakan email dan kata sandi Anda.
                                </p>
                            </div>
                        </div>
                    )}

                    {verifiedParam === "already" && (
                        <div className="p-3.5 mb-4 bg-[#E8F1F5] border border-[#C5DCE4] text-[#1B434D] rounded-xl text-xs font-medium flex items-start gap-2">
                            <span className="text-base">ℹ️</span>
                            <div>
                                <p className="font-bold">Email Sudah Terverifikasi</p>
                                <p className="text-[11px] text-[#35616D] mt-0.5">
                                    Alamat email Anda sudah terverifikasi sebelumnya. Silakan masuk untuk melanjutkan.
                                </p>
                            </div>
                        </div>
                    )}

                    {verifiedParam === "invalid" && (
                        <div className="p-3.5 mb-4 bg-[#F3C3B2]/30 border border-[#F3C3B2] text-[#6B3222] rounded-xl text-xs font-medium flex items-start gap-2">
                            <span className="text-base">⚠️</span>
                            <div>
                                <p className="font-bold">Tautan Verifikasi Tidak Valid</p>
                                <p className="text-[11px] text-[#843F2E] mt-0.5">
                                    Tautan telah kedaluwarsa atau tidak valid. Silakan masuk atau daftar ulang.
                                </p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 mb-4 bg-[#F3C3B2]/30 border border-[#F3C3B2] text-[#6B3222] rounded-xl text-xs font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-[#2F3931] mb-1.5">
                                Email Pengguna
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="nama@email.com"
                                className="w-full border border-[#E8E2D7] bg-[#FAF6F0]/50 rounded-xl px-3.5 py-2.5 text-sm text-[#2F3931] placeholder-[#98A29A] focus:outline-none focus:ring-2 focus:ring-[#99CDD8] focus:border-[#99CDD8] transition"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-bold text-[#2F3931]">
                                    Kata Sandi
                                </label>
                                <Link
                                    to="/forgot-password"
                                    className="text-[11px] font-semibold text-[#657166] hover:underline"
                                >
                                    Lupa kata sandi?
                                </Link>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="w-full border border-[#E8E2D7] bg-[#FAF6F0]/50 rounded-xl px-3.5 py-2.5 text-sm text-[#2F3931] placeholder-[#98A29A] focus:outline-none focus:ring-2 focus:ring-[#99CDD8] focus:border-[#99CDD8] transition"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full mt-2 py-3 bg-[#657166] hover:bg-[#556056] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer border border-[#525C53] disabled:opacity-60"
                        >
                            {isSubmitting ? "Memproses Autentikasi..." : "Masuk ke Dashboard"}
                        </button>
                    </form>

                    {/* Quick Demo Fill Buttons */}
                    <div className="mt-6 pt-5 border-t border-[#E8E2D7]">
                        <p className="text-[11px] font-bold text-[#738075] uppercase tracking-wider mb-2.5 text-center">
                            Akun Demo Cepat (1-Klik Isi)
                        </p>
                        <div className="flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={() => handleQuickFill("client@evento.test", "password")}
                                className="w-full p-2.5 text-left text-xs bg-[#FDE8D3]/60 hover:bg-[#FDE8D3] border border-[#E8CEB2] text-[#5C3F22] rounded-xl transition cursor-pointer flex items-center justify-between"
                            >
                                <span className="font-bold flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-[#E5A872] inline-block"></span>
                                    Klien / Pelanggan
                                </span>
                                <span className="text-[11px] opacity-80 font-mono">client@evento.test</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleQuickFill("eo@evento.test", "password")}
                                className="w-full p-2.5 text-left text-xs bg-[#99CDD8]/30 hover:bg-[#99CDD8]/60 border border-[#85BAC5] text-[#1D4A54] rounded-xl transition cursor-pointer flex items-center justify-between"
                            >
                                <span className="font-bold flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-[#5BA0AF] inline-block"></span>
                                    EO / Event Organizer
                                </span>
                                <span className="text-[11px] opacity-80 font-mono">eo@evento.test</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleQuickFill("vendor@evento.test", "password")}
                                className="w-full p-2.5 text-left text-xs bg-[#CFD8C4]/60 hover:bg-[#CFD8C4] border border-[#BAC5AF] text-[#34402A] rounded-xl transition cursor-pointer flex items-center justify-between"
                            >
                                <span className="font-bold flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-[#7D9169] inline-block"></span>
                                    Vendor Jasa
                                </span>
                                <span className="text-[11px] opacity-80 font-mono">vendor@evento.test</span>
                            </button>
                        </div>
                    </div>

                    {/* Link ke Pendaftaran Customer & Vendor */}
                    <div className="mt-4 pt-4 border-t border-[#E8E2D7] text-center space-y-2">
                        <p className="text-xs text-[#738075]">
                            Belum punya akun Pelanggan?{" "}
                            <Link to="/register" className="font-bold text-[#657166] hover:underline">
                                Daftar Akun Customer Baru →
                            </Link>
                        </p>
                        <p className="text-[11px] text-[#8C998E]">
                            Penyedia jasa / perlengkapan acara?{" "}
                            <Link to="/register/vendor" className="font-bold text-[#657166] hover:underline">
                                Daftar Sebagai Mitra Vendor
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
