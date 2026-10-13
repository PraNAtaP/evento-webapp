import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Mapping rute ke judul halaman dan subjudul ramah pengguna
 */
const ROUTE_TITLES = {
    "/admin/dashboard": {
        title: "Ringkasan Event & Keuangan",
        subtitle: "Pantau performa event, total pendapatan, dan status operasional",
    },
    "/admin/kanban": {
        title: "Kanban Workflow",
        subtitle: "Manajemen tahapan alur kerja dan penugasan vendor acara",
    },
    "/admin/payments": {
        title: "Verifikasi Pembayaran",
        subtitle: "Tinjau dan konfirmasi bukti transfer pembayaran DP dan pelunasan",
    },
    "/vendor/dashboard": {
        title: "Katalog Paket Jasa",
        subtitle: "Kelola paket penawaran jasa dan portofolio vendor Anda",
    },
    "/vendor/packages/create": {
        title: "Tambah Paket Jasa",
        subtitle: "Publikasikan paket penawaran baru beserta rincian harga dan foto",
    },
    "/client/dashboard": {
        title: "Jadwal & Reservasi Acara",
        subtitle: "Pilih tanggal acara yang tersedia dan ajukan reservasi baru",
    },
    "/client/payments": {
        title: "Pelacakan Pembayaran",
        subtitle: "Pantau tagihan DP, pelunasan, dan unggah bukti transfer",
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
                  title: "Dashboard EVENTO",
                  subtitle: "Sistem Manajemen Event Organizer & Vendor",
              });

    const roleBadges = {
        eo: { label: "EO Internal", color: "bg-blue-50 text-blue-700 border-blue-200" },
        vendor: { label: "Vendor Partner", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
        client: { label: "Klien / Pemesan", color: "bg-sky-50 text-sky-700 border-sky-200" },
    };

    const currentBadge = roleBadges[user?.role] || roleBadges.client;

    return (
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            {/* Sisi Kiri: Hamburger & Judul Halaman */}
            <div className="flex items-center gap-3">
                {/* Tombol Hamburger Mobile */}
                <button
                    type="button"
                    onClick={onToggleSidebar}
                    className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    title="Buka menu navigasi"
                    aria-label="Buka menu navigasi"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                {/* Judul Halaman */}
                <div>
                    <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                        {currentMeta.title}
                    </h2>
                    <p className="hidden md:block text-[11px] text-slate-500 mt-0.5">
                        {currentMeta.subtitle}
                    </p>
                </div>
            </div>

            {/* Sisi Kanan: Role Badge, Avatar & Aksi Cepat */}
            <div className="flex items-center gap-3">
                {/* Badge Role */}
                <span className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${currentBadge.color}`}>
                    {currentBadge.label}
                </span>

                {/* Info Akun Pengguna */}
                <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                        {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="hidden sm:block text-left">
                        <p className="text-xs font-bold text-slate-800 leading-none">
                            {user?.name || "Pengguna"}
                        </p>
                        <p className="text-[10px] text-slate-400 capitalize mt-0.5">
                            {user?.role || "user"}
                        </p>
                    </div>
                </div>

                {/* Tombol Logout Cepat Header */}
                <button
                    type="button"
                    onClick={logout}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
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
