import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Konfigurasi menu sidebar dinamis berdasarkan peran (role) pengguna:
 * - 'eo'     : Event Organizer (Admin)
 * - 'vendor' : Vendor Mitra
 * - 'client' : Pelanggan / Customer
 */
const ROLE_MENUS = {
    eo: [
        {
            title: "Pesanan masuk",
            path: "/admin/orders",
            badge: null,
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            ),
        },
        {
            title: "Kanban board",
            path: "/admin/kanban",
            badge: null,
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
            ),
        },
        {
            title: "Katalog vendor",
            path: "/vendor/dashboard",
            badge: null,
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            ),
        },
        {
            title: "Pendaftar vendor",
            path: "/admin/vendors",
            badge: null,
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
        },
        {
            title: "Pembayaran",
            path: "/admin/payments",
            badge: null,
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            ),
        },
        {
            title: "Kategori acara",
            path: "/admin/categories",
            badge: null,
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
            ),
        },
        {
            title: "Dashboard analitik",
            path: "/admin/dashboard",
            badge: null,
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
        },
        {
            title: "Kelola akun admin",
            path: "/admin/admins",
            badge: null,
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
        },
    ],
    vendor: [
        {
            title: "Kelola Paket Jasa",
            path: "/vendor/dashboard",
            badge: null,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m16.5 9.4-9-5.19" />
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <path d="m3.3 7 8.7 5 8.7-5" />
                    <path d="M12 22V12" />
                </svg>
            ),
        },
        
        {
            title: "Tawaran Pekerjaan",
            path: "/vendor/job-offers",
            badge: null,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="7" width="18" height="14" rx="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
            ),
        },
    ],
    client: [
        {
            title: "Kalender booking",
            path: "/client/dashboard",
            badge: null,
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
        },
        {
            title: "Penawaran vendor",
            path: "/client/offers",
            badge: null,
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            ),
        },
        {
            title: "Pembayaran & riwayat",
            path: "/client/payments",
            badge: null,
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            ),
        },
    ],
};

const ROLE_METADATA = {
    eo: {
        roleLabel: "EO",
        subLabel: "Masuk sebagai EO",
    },
    vendor: {
        roleLabel: "Vendor",
        subLabel: "Masuk sebagai Vendor",
    },
    client: {
        roleLabel: "Klien",
        subLabel: "Masuk sebagai Klien",
    },
};

export default function Sidebar({ isOpen, onClose }) {
    const { user, logout } = useAuth();
    const location = useLocation();

    const role = user?.role || "client";
    const menus = ROLE_MENUS[role] || ROLE_MENUS.client;
    const meta = ROLE_METADATA[role] || ROLE_METADATA.client;

    const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

    return (
        <>
            {/* Mobile Backdrop Overlay */}
            {isOpen && (
                <div
                    onClick={onClose}
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
                    aria-hidden="true"
                />
            )}

            {/* Sidebar Container: Tema Pastel Deep Slate Green #657166 */}
            <aside
                className={`fixed top-0 bottom-0 left-0 z-50 w-60 bg-[#657166] text-[#DAEBE3] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                {/* Header Brand */}
                <div className="h-16 px-5 flex items-center justify-between border-b border-white/10">
                    <Link
                        to="/"
                        onClick={onClose}
                        className="flex items-center gap-2.5 group"
                    >
                        {/* Lingkaran Logo Coral/Peach #F3C3B2 */}
                        <span className="w-7 h-7 rounded-full bg-[#F3C3B2] text-[#424C43] font-black text-sm flex items-center justify-center shadow-xs">
                            E
                        </span>
                        <span className="font-extrabold text-lg tracking-tight text-white block lowercase">
                            evento
                        </span>
                    </Link>

                    {/* Mobile Close Button */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="lg:hidden p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                        title="Tutup menu"
                        aria-label="Tutup menu"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Navigation Menus (Pill button seperti pada mockup) */}
                <div className="flex-1 overflow-y-auto py-5 px-3.5 space-y-1.5">
                    {menus.map((menu) => {
                        const isActive = location.pathname === menu.path;

                        return (
                            <Link
                                key={menu.title}
                                to={menu.path}
                                onClick={onClose}
                                className={`flex items-center justify-between px-4 py-2.5 rounded-full text-xs transition-all ${
                                    isActive
                                        ? "bg-[#FDE8D3] text-[#424C43] font-bold shadow-xs"
                                        : "text-[#DAEBE3] hover:text-white hover:bg-white/10 font-medium"
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <span className={isActive ? "text-[#424C43]" : "text-[#DAEBE3]/80"}>
                                        {menu.icon}
                                    </span>
                                    <span className="capitalize">{menu.title}</span>
                                </div>

                                {menu.badge && (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F3C3B2] text-[#424C43]">
                                        {menu.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Bottom Card: Masuk sebagai Klien / EO / Vendor (Seperti Mockup) */}
                <div className="p-3.5 border-t border-white/10">
                    <div className="bg-white rounded-2xl p-3 shadow-xs text-[#2F3931]">
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#E8E2D7]">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-7 h-7 rounded-full bg-[#F3C3B2] text-[#424C43] font-bold text-xs flex items-center justify-center shrink-0">
                                    {userInitial}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[11px] font-bold text-[#2F3931] truncate leading-tight">
                                        {user?.name || "Pengguna"}
                                    </p>
                                    <p className="text-[9px] text-[#738075] truncate">
                                        {meta.subLabel}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={logout}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-[11px] font-semibold text-[#424C43] bg-[#FDE8D3] hover:bg-[#F3C3B2] rounded-xl transition-colors cursor-pointer border border-[#E8CEB2]"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Keluar</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
