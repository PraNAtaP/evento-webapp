import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

/**
 * Komponen Template Layout Terpusat (DashboardLayout) - Tema Pastel Evento.
 * Menyediakan struktur aplikasi konsisten dengan Sidebar (dinamis berdasarkan Role)
 * dan Header di seluruh halaman protected aplikasi.
 */
export default function DashboardLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#FAF6F0] text-[#2F3931] flex">
            {/* Sidebar Dinamis Berdasarkan Role */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Area Konten Utama (Bergeser ke kanan di layar desktop untuk memberi ruang pada sidebar tetap w-60) */}
            <div className="flex-1 flex flex-col min-w-0 lg:pl-60 transition-all duration-300">
                {/* Header Teratas */}
                <Header
                    onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
                />

                {/* Konten Halaman */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    {children ? children : <Outlet />}
                </main>
            </div>
        </div>
    );
}
