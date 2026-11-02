import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Mapping rute ke judul halaman dan subjudul ramah pengguna
 */
const ROUTE_TITLES = {
    "/admin/orders": {
        title: "Pesanan Acara Masuk",
        subtitle: "Tinjau dan proses persetujuan atau penolakan booking baru dari klien",
    },
    "/admin/dashboard": {
        title: "Dashboard Analitik",
        subtitle: "Ringkasan pendapatan, margin, dan jumlah acara",
    },
    "/admin/kanban": {
        title: "Kanban Event Board",
        subtitle: "Geser kartu untuk mengubah status. Klik kartu untuk melihat detail.",
    },
    "/admin/payments": {
        title: "Verifikasi Pembayaran",
        subtitle: "Tinjau dan konfirmasi bukti transfer pembayaran DP dan pelunasan",
    },
    "/admin/vendors": {
        title: "Pendaftaran & Review Vendor",
        subtitle: "Tinjau, setujui, atau tolak permohonan pendaftaran mitra vendor baru",
    },
    "/admin/categories": {
        title: "Master Kategori Acara",
        subtitle: "Kelola daftar kategori acara, batas minimal pemesanan, dan status aktif",
    },
    "/admin/admins": {
        title: "Kelola Akun Admin",
        subtitle: "Daftar, buat akun baru, dan kelola kredensial tim admin EO",
    },
    "/vendor/dashboard": {
        title: "Kelola Paket Jasa",
        subtitle: "Kelola paket jasa, harga, foto, dan deskripsi yang ditawarkan",
    },
    "/vendor/job-offers": {
        title: "Tawaran Pekerjaan",
        subtitle: "Kelola tawaran dari EO dan pantau progres pekerjaan aktif",
    },
    "/vendor/packages/create": {
        title: "Tambah Paket Baru",
        subtitle: "Publikasikan paket penawaran baru beserta rincian harga dan foto",
    },
    "/vendors": {
        title: "Katalog Vendor",
        subtitle: "Jelajahi mitra vendor resmi dan paket layanan acara terbaik",
    },
    "/client/dashboard": {
        title: "Dashboard Klien",
        subtitle: "Pantau penawaran acara Anda dan akses cepat ke pengajuan acara baru",
    },
    "/client/booking": {
        title: "Pengajuan Acara Baru",
        subtitle: "Pilih tanggal acara di kalender pintar dan lengkapi detail rencana Anda",
    },
    "/client/booked-events": {
        title: "Acara yang Dibooking",
        subtitle: "Pantau progress tahapan persiapan dan rincian pembayaran untuk setiap acara Anda",
    },
    "/client/payments": {
        title: "Pelacakan Pembayaran & DP",
        subtitle: "Pantau tagihan DP 50%, pelunasan, dan unggah bukti transfer",
    },
    "/client/offers": {
        title: "Review Penawaran Vendor",
        subtitle: "Tinjau rincian biaya penawaran vendor dan ajukan revisi atau persetujuan",
    },
};

export default function Header({ onToggleSidebar }) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Menutup dropdown saat klik di luar area profil
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Tutup dropdown saat rute berubah
    useEffect(() => {
        setIsDropdownOpen(false);
    }, [location.pathname]);

    // Deteksi judul berdasarkan pathname
    const currentMeta =
        ROUTE_TITLES[location.pathname] ||
        (location.pathname.startsWith("/vendors/")
            ? {
                  title: "Detail Vendor",
                  subtitle: "Informasi profil dan daftar paket layanan yang disediakan",
              }
            : location.pathname.startsWith("/vendor/packages/") && location.pathname.endsWith("/edit")
            ? {
                  title: "Edit Paket Jasa",
                  subtitle: "Perbarui informasi nama paket, harga, atau foto",
              }
            : {
                  title: "EVENTO",
                  subtitle: "Sistem Manajemen Acara & Penawaran Vendor",
              });

    const roleBadges = {
        eo: { label: "EO Internal", color: "bg-[#99CDD8]/40 text-[#1F4B54] border-[#99CDD8]" },
        vendor: { label: "Vendor Mitra", color: "bg-[#CFD8C4] text-[#33422A] border-[#B6C2AA]" },
        client: { label: "Klien / Pemesan", color: "bg-[#FDE8D3] text-[#63482B] border-[#E8CEB2]" },
    };

    const currentBadge = roleBadges[user?.role] || roleBadges.client;

    return (
        <header className="sticky top-0 z-30 h-16 bg-[#FAF6F0]/90 backdrop-blur-xs border-b border-[#E8E2D7] px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            {/* Sisi Kiri: Hamburger & Judul Halaman */}
            <div className="flex items-center gap-3">
                {/* Tombol Hamburger Mobile */}
                <button
                    type="button"
                    onClick={onToggleSidebar}
                    className="lg:hidden p-2 text-[#657166] hover:text-[#424C43] hover:bg-white rounded-xl transition-colors cursor-pointer border border-[#E8E2D7]"
                    title="Buka menu navigasi"
                    aria-label="Buka menu navigasi"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                {/* Judul Halaman */}
                <div>
                    <h2 className="text-base font-extrabold text-[#2F3931] leading-tight">
                        {currentMeta.title}
                    </h2>
                    <p className="hidden md:block text-[11px] text-[#738075] mt-0.5">
                        {currentMeta.subtitle}
                    </p>
                </div>
            </div>

            {/* Sisi Kanan: Role Badge & Dropdown Profil Modern */}
            <div className="flex items-center gap-3">
                {/* Badge Role */}
                <span className={`hidden sm:inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold border ${currentBadge.color}`}>
                    {currentBadge.label}
                </span>

                {/* Dropdown Profil Pengguna (Area Interaktif dengan Chevron Down) */}
                <div className="relative pl-2 border-l border-[#E8E2D7]" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setIsDropdownOpen((prev) => !prev)}
                        className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-white border border-transparent hover:border-[#E8E2D7] transition-all cursor-pointer group"
                        aria-expanded={isDropdownOpen}
                        aria-label="Menu profil pengguna"
                    >
                        <div className="w-8 h-8 rounded-full bg-[#657166] text-[#FDE8D3] font-bold text-xs flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div className="hidden sm:block text-left">
                            <p className="text-xs font-bold text-[#2F3931] leading-none">
                                {user?.name || "Pengguna"}
                            </p>
                            <p className="text-[10px] text-[#738075] capitalize mt-0.5">
                                {user?.role || "user"}
                            </p>
                        </div>
                        <svg
                            className={`w-3.5 h-3.5 text-[#738075] group-hover:text-[#2F3931] transition-transform duration-200 ${
                                isDropdownOpen ? "rotate-180" : ""
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2.5"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Menu Dropdown Profil Modern */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#E8E2D7] py-2 z-50 animate-fadeIn text-xs">
                            {/* Header Info Akun */}
                            <div className="px-4 py-2.5 border-b border-[#E8E2D7]/70">
                                <p className="font-bold text-[#2F3931] truncate">
                                    {user?.name || "Pengguna"}
                                </p>
                                <p className="text-[11px] text-[#738075] truncate mt-0.5">
                                    {user?.email || "-"}
                                </p>
                                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#CFD8C4]/50 text-[#2D3A28] border border-[#B6C2AA]">
                                    Role: {user?.role || "user"}
                                </span>
                            </div>

                            {/* Opsi Menu Personalisasi */}
                            <div className="py-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                        alert(`Profil: ${user?.name}\nEmail: ${user?.email}\nRole: ${user?.role?.toUpperCase()}`);
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-[#FAF6F0] text-[#2F3931] font-semibold flex items-center gap-2.5 transition cursor-pointer"
                                >
                                    <svg className="w-4 h-4 text-[#738075]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span>Profil Saya</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                        alert("Pengaturan sistem & preferensi notifikasi.");
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-[#FAF6F0] text-[#2F3931] font-semibold flex items-center gap-2.5 transition cursor-pointer"
                                >
                                    <svg className="w-4 h-4 text-[#738075]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>Pengaturan</span>
                                </button>
                            </div>

                            {/* Baris Paling Bawah: Tombol Keluar (Logout) */}
                            <div className="pt-1 mt-1 border-t border-[#E8E2D7]/70">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                        logout();
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-700 font-bold flex items-center gap-2.5 transition cursor-pointer"
                                >
                                    <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    <span>Keluar</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
