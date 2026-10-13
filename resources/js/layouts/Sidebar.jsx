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
            title: "Ringkasan Event",
            path: "/admin/dashboard",
            badge: "Overview",
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
        },
        {
            title: "Kanban Workflow",
            path: "/admin/kanban",
            badge: null,
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
            ),
        },
        {
            title: "Verifikasi Pembayaran",
            path: "/admin/payments",
            badge: null,
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
    ],
    vendor: [
        {
            title: "Daftar Paket Jasa",
            path: "/vendor/dashboard",
            badge: null,
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            ),
        },
        {
            title: "Tambah Paket Baru",
            path: "/vendor/packages/create",
            badge: "Baru",
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
    ],
    client: [
        {
            title: "Jadwal & Booking",
            path: "/client/dashboard",
            badge: null,
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
        },
        {
            title: "Tracking Pembayaran",
            path: "/client/payments",
            badge: null,
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            ),
        },
    ],
};

const ROLE_METADATA = {
    eo: {
        roleLabel: "Event Organizer",
        badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
        activeItemClass: "bg-blue-50 text-blue-700 font-semibold border-r-4 border-blue-600",
        avatarBg: "bg-blue-600 text-white",
    },
    vendor: {
        roleLabel: "Vendor Partner",
        badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
        activeItemClass: "bg-emerald-50 text-emerald-700 font-semibold border-r-4 border-emerald-600",
        avatarBg: "bg-emerald-600 text-white",
    },
    client: {
        roleLabel: "Customer / Klien",
        badgeColor: "bg-sky-100 text-sky-700 border-sky-200",
        activeItemClass: "bg-sky-50 text-sky-700 font-semibold border-r-4 border-sky-600",
        avatarBg: "bg-sky-600 text-white",
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

            {/* Sidebar Container */}
            <aside
                className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                {/* Header Brand */}
                <div className="h-16 border-b border-slate-100 px-5 flex items-center justify-between">
                    <Link
                        to="/"
                        onClick={onClose}
                        className="flex items-center gap-3 group"
                    >
                        <span className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-lg flex items-center justify-center shadow-xs group-hover:bg-blue-700 transition-colors">
                            E
                        </span>
                        <div>
                            <span className="font-extrabold text-base tracking-tight text-slate-900 block leading-tight">
                                EVENTO
                            </span>
                            <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                                Management Platform
                            </span>
                        </div>
                    </Link>

                    {/* Mobile Close Button */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Tutup menu"
                        aria-label="Tutup menu"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Role Badge Indicator */}
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-slate-500">Peran Akun:</span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${meta.badgeColor}`}>
                            {meta.roleLabel}
                        </span>
                    </div>
                </div>

                {/* Navigation Menus */}
                <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Menu Navigasi
                    </p>

                    {menus.map((menu) => {
                        const isActive = location.pathname === menu.path;

                        return (
                            <Link
                                key={menu.path}
                                to={menu.path}
                                onClick={onClose}
                                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all ${
                                    isActive
                                        ? meta.activeItemClass
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={isActive ? "text-current" : "text-slate-400"}>
                                        {menu.icon}
                                    </span>
                                    <span>{menu.title}</span>
                                </div>

                                {menu.badge && (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">
                                        {menu.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* User Profile Footer & Logout */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`w-9 h-9 rounded-full ${meta.avatarBg} font-bold text-xs flex items-center justify-center shadow-xs flex-shrink-0`}>
                            {userInitial}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                                {user?.name || "Pengguna"}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                                {user?.email || "user@evento.test"}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Keluar (Logout)</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
