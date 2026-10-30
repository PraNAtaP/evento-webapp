import { useLocation } from "react-router-dom";
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
    "/client/dashboard": {
        title: "Smart Calendar Booking",
        subtitle: "Pilih tanggal acara. Tanggal yang sudah terisi otomatis nonaktif.",
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

    // Deteksi judul berdasarkan pathname
    const currentMeta =
        ROUTE_TITLES[location.pathname] ||
        (location.pathname.startsWith("/vendor/packages/") && location.pathname.endsWith("/edit")
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

            {/* Sisi Kanan: Role Badge & Avatar */}
            <div className="flex items-center gap-3">
                {/* Badge Role */}
                <span className={`hidden sm:inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold border ${currentBadge.color}`}>
                    {currentBadge.label}
                </span>

                {/* Info Akun Pengguna */}
                <div className="flex items-center gap-2.5 pl-2 border-l border-[#E8E2D7]">
                    <div className="w-8 h-8 rounded-full bg-[#657166] text-[#FDE8D3] font-bold text-xs flex items-center justify-center shadow-xs">
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
                </div>

                {/* Tombol Logout Cepat Header */}
                <button
                    type="button"
                    onClick={logout}
                    className="p-2 text-[#738075] hover:text-[#424C43] hover:bg-[#FDE8D3] rounded-xl transition-colors cursor-pointer border border-transparent hover:border-[#E8CEB2]"
                    title="Keluar dari akun"
                    aria-label="Logout"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </div>
        </header>
    );
}
