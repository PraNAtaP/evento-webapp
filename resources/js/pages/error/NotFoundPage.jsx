import { Link } from "react-router-dom";
import { Compass, Home, ArrowLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function NotFoundPage() {
    const { user, isAuthenticated, getRoleDashboard } = useAuth();

    const targetDashboard = isAuthenticated && user ? getRoleDashboard(user.role) : "/login";

    return (
        <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-center items-center px-4 py-12">
            <div className="w-full max-w-md bg-white rounded-3xl border border-[#E8E2D7] shadow-lg p-8 sm:p-10 text-center animate-fadeIn">
                {/* Visual Icon */}
                <div className="w-20 h-20 rounded-2xl bg-[#DAEBE3] text-[#224436] border border-[#BCD4C9] flex items-center justify-center mx-auto mb-6 shadow-xs group">
                    <Compass className="w-10 h-10 transition-transform duration-500 group-hover:rotate-45" />
                </div>

                <span className="inline-block px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-[#FDE8D3] text-[#63482B] border border-[#E8CEB2] mb-3">
                    Kode Error: 404
                </span>

                <h1 className="text-2xl sm:text-3xl font-black text-[#2F3931] mb-2 leading-tight">
                    Halaman Tidak Ditemukan
                </h1>

                <p className="text-xs sm:text-sm text-[#738075] mb-8 leading-relaxed">
                    Maaf, tautan atau halaman yang Anda cari tidak tersedia, telah dipindahkan, atau alamat URL yang Anda masukkan salah.
                </p>

                {/* Tombol Aksi */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        to={targetDashboard}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#657166] hover:bg-[#4E594F] text-[#FAF6F0] font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Home className="w-4 h-4" />
                        <span>Kembali ke {isAuthenticated ? "Dashboard" : "Halaman Masuk"}</span>
                    </Link>

                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-[#FAF6F0] border border-[#E8E2D7] text-[#2F3931] font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Halaman Sebelumnya</span>
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-[#E8E2D7]/70 text-[11px] text-[#A0AAA2]">
                    EVENTO &bull; Sistem Manajemen Acara & Penawaran Vendor
                </div>
            </div>
        </div>
    );
}
