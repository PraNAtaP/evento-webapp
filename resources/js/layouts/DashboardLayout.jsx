import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

/**
 * Komponen Template Layout Terpusat (DashboardLayout).
 * Menyediakan struktur aplikasi konsisten dengan Sidebar (dinamis berdasarkan Role)
 * dan Header di seluruh halaman protected aplikasi.
 *
 * Mendukung penggunaan fleksibel:
 * 1. Sebagai Route Wrapper: <Route element={<DashboardLayout />}><Route ... /></Route>
 * 2. Sebagai Component Wrapper: <DashboardLayout><ChildComponent /></DashboardLayout>
 */
export default function DashboardLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex">
            {/* Sidebar Dinamis Berdasarkan Role */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Area Konten Utama (Bergeser ke kanan di layar desktop untuk memberi ruang pada sidebar tetap) */}
            <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all duration-300">
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
