import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [notRegistered, setNotRegistered] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setNotRegistered(false);
        setIsSubmitting(true);

        try {
            await api.post("/forgot-password", { email });
            setSubmittedEmail(email);
            setIsSuccess(true);
        } catch (err) {
            setSubmittedEmail(email);
            if (err.response?.status === 404 || err.response?.data?.not_registered) {
                setNotRegistered(true);
            } else if (err.response?.data?.errors?.email) {
                setError(err.response.data.errors.email[0]);
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError("Terjadi kesalahan saat memproses permintaan. Silakan coba lagi.");
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
                        Lupa <span className="text-[#657166]">Kata Sandi?</span>
                    </h1>
                    <p className="text-xs text-[#738075] mt-1">
                        Masukkan email Anda untuk menerima instruksi pemulihan kata sandi yang aman
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D7] shadow-xs">
                    {notRegistered ? (
                        /* Notifikasi Akun Belum Terdaftar */
                        <div className="text-center py-2 space-y-4">
                            <div className="w-16 h-16 bg-[#FDE8D3] border border-[#E8CEB2] rounded-2xl flex items-center justify-center mx-auto text-3xl">
                                🔍
                            </div>

                            <div>
                                <h2 className="text-lg font-bold text-[#2F3931]">
                                    Akun Tidak Terdaftar
                                </h2>
                                <p className="text-xs text-[#556056] mt-1.5 leading-relaxed">
                                    Alamat email <strong className="font-mono text-[#2F3931]">{submittedEmail}</strong> belum terdaftar di sistem EVENTO.
                                </p>
                                <p className="text-xs text-[#738075] mt-1">
                                    Silakan lakukan pendaftaran akun baru terlebih dahulu atau kembali ke halaman login jika Anda ingin menggunakan email lain.
                                </p>
                            </div>

                            <div className="bg-[#FAF6F0] border border-[#E8E2D7] rounded-2xl p-4 text-xs text-[#556056] text-left space-y-1.5">
                                <p className="font-bold text-[#2F3931]">Pilihan Tindakan:</p>
                                <ul className="list-disc list-inside space-y-1 text-[11px] text-[#738075] pl-1">
                                    <li>Daftar akun customer baru jika Anda pengguna baru.</li>
                                    <li>Kembali ke halaman login jika Anda mengingat email akun Anda yang terdaftar.</li>
                                </ul>
                            </div>

                            <div className="pt-2 flex flex-col gap-2">
                                <Link
                                    to="/register"
                                    className="w-full py-3 px-4 bg-[#657166] hover:bg-[#556056] text-white text-xs font-bold rounded-xl transition shadow-xs text-center border border-[#525C53]"
                                >
                                    Daftar Akun Baru Sekarang →
                                </Link>

                                <Link
                                    to="/login"
                                    className="w-full py-2.5 px-4 bg-white hover:bg-[#FAF6F0] text-xs font-bold text-[#2F3931] border border-[#E8E2D7] rounded-xl transition text-center"
                                >
                                    ← Kembali ke Halaman Login
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setNotRegistered(false);
                                        setError("");
                                    }}
                                    className="text-xs text-[#738075] hover:text-[#2F3931] font-medium pt-1 cursor-pointer underline"
                                >
                                    Coba Masukkan Email Lain
                                </button>
                            </div>
                        </div>
                    ) : isSuccess ? (
                        /* Tampilan Sukses Pengiriman Link */
                        <div className="text-center py-2 space-y-4">
                            <div className="w-16 h-16 bg-[#EBF3E8] border border-[#CFD8C4] rounded-2xl flex items-center justify-center mx-auto text-3xl">
                                ✉️
                            </div>

                            <div>
                                <h2 className="text-lg font-bold text-[#2F3931]">
                                    Instruksi Pemulihan Dikirim
                                </h2>
                                <p className="text-xs text-[#556056] mt-1.5 leading-relaxed">
                                    Tautan untuk mengatur ulang kata sandi telah kami kirimkan ke email Anda:
                                </p>
                                <div className="mt-2 inline-block px-3 py-1.5 bg-[#FAF6F0] border border-[#E8E2D7] rounded-xl text-xs font-mono font-bold text-[#2F3931]">
                                    {submittedEmail}
                                </div>
                            </div>

                            <div className="bg-[#FAF6F0] border border-[#E8E2D7] rounded-2xl p-4 text-left text-xs text-[#556056] space-y-2">
                                <p className="font-bold text-[#2F3931] flex items-center gap-1.5">
                                    <span>👉</span> Langkah Selanjutnya:
                                </p>
                                <ol className="list-decimal list-inside space-y-1 text-[11px] text-[#738075] pl-1">
                                    <li>Buka email Anda dan cari pesan dari <strong>EVENTO</strong>.</li>
                                    <li>Periksa folder <strong>Spam / Junk</strong> jika tidak ada di kotak masuk utama.</li>
                                    <li>Klik tombol <strong>"Atur Ulang Kata Sandi Sekarang"</strong> sebelum tautan kedaluwarsa (60 menit).</li>
                                </ol>
                            </div>

                            <div className="pt-2 flex flex-col gap-2">
                                <Link
                                    to="/login"
                                    className="w-full py-3 px-4 bg-[#657166] hover:bg-[#556056] text-white text-xs font-bold rounded-xl transition shadow-xs text-center border border-[#525C53]"
                                >
                                    ← Kembali ke Halaman Masuk
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsSuccess(false);
                                        setEmail("");
                                    }}
                                    className="w-full py-2.5 px-4 bg-white hover:bg-[#FAF6F0] text-xs font-bold text-[#738075] rounded-xl transition cursor-pointer"
                                >
                                    Gunakan Email Lain
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Formulir Input Email Lupa Password */
                        <>
                            {error && (
                                <div className="p-3 mb-4 bg-[#F3C3B2]/30 border border-[#F3C3B2] text-[#6B3222] rounded-xl text-xs font-medium">
                                    {error}
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
                                    <p className="text-[11px] text-[#738075] mt-1.5">
                                        Pastikan email sesuai dengan yang Anda daftarkan saat membuat akun EVENTO.
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-3 bg-[#657166] hover:bg-[#556056] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer border border-[#525C53] disabled:opacity-60"
                                >
                                    {isSubmitting ? "Memeriksa Email..." : "Kirim Tautan Atur Ulang →"}
                                </button>
                            </form>

                            <div className="mt-5 pt-4 border-t border-[#E8E2D7] text-center space-y-2">
                                <p className="text-xs text-[#738075]">
                                    Ingat kata sandi Anda?{" "}
                                    <Link to="/login" className="font-bold text-[#657166] hover:underline">
                                        Masuk di Sini →
                                    </Link>
                                </p>
                                <p className="text-[11px] text-[#8C998E]">
                                    Belum memiliki akun?{" "}
                                    <Link to="/register" className="font-bold text-[#657166] hover:underline">
                                        Daftar Customer Baru
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
