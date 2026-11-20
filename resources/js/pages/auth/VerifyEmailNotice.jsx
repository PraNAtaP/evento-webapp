import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, RefreshCw, LogOut, CheckCircle2, AlertTriangle, ShieldAlert, Sparkles } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

export default function VerifyEmailNotice() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, isAuthenticated, logout, refreshUser } = useAuth();

    const [isResending, setIsResending] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [resendStatus, setResendStatus] = useState(null);

    const isJustRegistered = searchParams.get("registered") === "1";
    const displayEmail = user?.email || searchParams.get("email") || "";

    const getDashboardPath = useCallback((role) => {
        return role === "vendor" ? "/vendor/dashboard?verified=1" : "/client/dashboard?verified=1";
    }, []);

    // Fungsi untuk memeriksa apakah akun sudah diverifikasi
    const checkVerificationStatus = useCallback(async () => {
        try {
            // 1. Cek via endpoint status verifikasi khusus (bisa dicek meski belum login di tab ini)
            if (displayEmail) {
                const res = await api.get(`/email/verification-status?email=${encodeURIComponent(displayEmail)}`);
                if (res.data?.verified === true) {
                    if (res.data?.token) {
                        localStorage.setItem("auth_token", res.data.token);
                    }
                    localStorage.setItem("email_verified", "true");
                    window.location.href = getDashboardPath(res.data?.role || user?.role);
                    return true;
                }
            }

            // 2. Jika user sedang login di tab ini, refresh data user
            if (isAuthenticated) {
                const freshUser = await refreshUser();
                if (freshUser && (freshUser.email_verified_at || freshUser.is_email_verified === true)) {
                    localStorage.setItem("email_verified", "true");
                    window.location.href = getDashboardPath(freshUser.role);
                    return true;
                }
            }
        } catch {
            // Ignore polling errors
        }
        return false;
    }, [displayEmail, isAuthenticated, refreshUser, getDashboardPath, user?.role]);

    // Auto-polling & Event Listeners (Tab Focus / Cross-tab Storage)
    useEffect(() => {
        // Cek langsung saat komponen pertama kali dimuat
        checkVerificationStatus();

        // 1. Background Polling setiap 2.5 detik
        const intervalId = setInterval(() => {
            checkVerificationStatus();
        }, 2500);

        // 2. Cek seketika saat user kembali membuka / fokus ke tab ini
        const handleFocus = () => {
            checkVerificationStatus();
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                checkVerificationStatus();
            }
        };

        window.addEventListener("focus", handleFocus);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        // 3. Deteksi jika verifikasi berhasil di tab browser lain
        const handleStorageChange = (e) => {
            if (e.key === "email_verified" && e.newValue === "true") {
                window.location.href = getDashboardPath(user?.role);
            }
        };
        window.addEventListener("storage", handleStorageChange);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener("focus", handleFocus);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("storage", handleStorageChange);
        };
    }, [checkVerificationStatus, getDashboardPath, user?.role]);

    // Kirim ulang email verifikasi
    const handleResend = async () => {
        setIsResending(true);
        setResendStatus(null);

        try {
            const payload = {};
            if (displayEmail) {
                payload.email = displayEmail;
            }

            const res = await api.post("/email/verification-notification", payload);
            setResendStatus({
                type: "success",
                message: res.data.message || "Tautan verifikasi baru berhasil dikirimkan!",
            });
        } catch (err) {
            setResendStatus({
                type: "error",
                message:
                    err.response?.data?.message ||
                    "Gagal mengirim ulang email verifikasi. Periksa kembali konfigurasi SMTP Anda.",
            });
        } finally {
            setIsResending(false);
        }
    };

    // Tombol manual untuk cek verifikasi
    const handleManualCheck = async () => {
        setIsChecking(true);
        const verified = await checkVerificationStatus();
        if (!verified) {
            setResendStatus({
                type: "info",
                message: "Email belum terverifikasi. Silakan buka email Anda dan klik tautan aktivasi terlebih dahulu.",
            });
            setIsChecking(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md">

                {/* Logo & Header */}
                <div className="text-center mb-6">
                    <Link to="/" className="inline-block mb-3 hover:opacity-90 transition-opacity">
                        <img
                            src="/logo.png"
                            alt="EVENTO"
                            className="h-12 w-auto mx-auto object-contain"
                        />
                    </Link>
                    <h1 className="text-xl font-extrabold text-[#2F3931] tracking-tight">
                        Verifikasi Alamat <span className="text-[#657166]">Email</span>
                    </h1>
                    <p className="text-xs text-[#738075] mt-1">
                        Satu langkah lagi untuk mengaktifkan akun {user?.role === "vendor" ? "Mitra Vendor" : "Customer"} Anda
                    </p>
                </div>

                {/* Main Notice Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D7] shadow-xs space-y-4">
                    
                    {/* Banner Sukses Pendaftaran (Jika Baru Mendaftar) */}
                    {isJustRegistered && (
                        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-2xl text-xs flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                            <p className="font-bold">Pendaftaran Akun Berhasil!</p>
                        </div>
                    )}

                    {/* Icon Status & Email */}
                    <div className="text-center">
                        <div className="w-16 h-16 bg-amber-100 border border-amber-300 text-amber-800 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
                            <Mail className="w-8 h-8 text-amber-700" />
                        </div>
                        <h2 className="text-lg font-black text-[#2F3931] mt-3">
                            Akun Menunggu Verifikasi
                        </h2>
                        <p className="text-xs text-[#556056] mt-1 leading-relaxed">
                            Kami telah mengirimkan tautan aktivasi akun ke alamat email:
                        </p>
                        {displayEmail ? (
                            <div className="mt-2 inline-block px-3.5 py-1.5 bg-[#FAF6F0] border border-[#E8E2D7] rounded-xl text-xs font-mono font-bold text-[#2F3931] max-w-full truncate">
                                {displayEmail}
                            </div>
                        ) : null}
                    </div>

                    {/* Indikator Real-time Auto-detection */}
                    <div className="flex items-center justify-center gap-2 text-[11px] text-[#556056] bg-[#FAF6F0] py-2 px-3.5 rounded-xl border border-[#E8E2D7] font-medium text-center">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                        <span>Menunggu verifikasi... Halaman ini akan <strong>otomatis membuka dashboard</strong> begitu email diverifikasi.</span>
                    </div>

                    {/* Security Notice Box */}
                    <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-left text-xs text-amber-950 space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-amber-900">
                            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                            <span>Akses Dashboard Dibatasi</span>
                        </div>
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                            Sesuai standar operasional EVENTO, Anda belum dapat mengakses fitur Dashboard maupun layanan sebelum alamat email diverifikasi.
                        </p>
                    </div>

                    {/* Step-by-Step Instructions */}
                    <div className="bg-[#FAF6F0] border border-[#E8E2D7] rounded-2xl p-4 text-left text-xs text-[#556056] space-y-2">
                        <p className="font-bold text-[#2F3931]">
                            Langkah Verifikasi:
                        </p>
                        <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-[#738075] pl-1">
                            <li>Buka aplikasi email atau webmail Anda.</li>
                            <li>Periksa pesan dari <strong>EVENTO Platform</strong> (cek juga folder <em>Spam / Promosi</em> jika belum muncul).</li>
                            <li>Klik tombol <strong>"Verifikasi Alamat Email Saya"</strong>.</li>
                        </ol>
                    </div>

                    {/* Feedback Toast / Status Resend */}
                    {resendStatus && (
                        <div
                            className={`p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2 ${
                                resendStatus.type === "success"
                                    ? "bg-emerald-100 text-emerald-950 border border-emerald-300"
                                    : resendStatus.type === "error"
                                    ? "bg-rose-100 text-rose-950 border border-rose-300"
                                    : "bg-amber-100 text-amber-950 border border-amber-300"
                            }`}
                        >
                            {resendStatus.type === "success" ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                            ) : (
                                <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                            )}
                            <div>
                                <p>{resendStatus.message}</p>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-2 flex flex-col gap-2.5">
                        <button
                            type="button"
                            onClick={handleManualCheck}
                            disabled={isChecking}
                            className="w-full py-3 px-4 bg-[#657166] hover:bg-[#556056] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer border border-[#525C53] flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? "animate-spin" : ""}`} />
                            <span>{isChecking ? "Memeriksa Status..." : "Saya Sudah Klik Verifikasi → Buka Dashboard"}</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={isResending}
                            className="w-full py-2.5 px-4 bg-white border border-[#E8E2D7] hover:bg-[#FAF6F0] text-xs font-bold text-[#2F3931] rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isResending ? "animate-spin" : ""}`} />
                            <span>{isResending ? "Mengirim Ulang..." : "Kirim Ulang Email Verifikasi"}</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full py-2.5 px-4 bg-transparent hover:bg-rose-50 text-rose-700 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 border border-transparent hover:border-rose-200"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Keluar / Masuk dengan Akun Lain</span>
                        </button>
                    </div>

                </div>

            </div>
        </div>
    );
}
