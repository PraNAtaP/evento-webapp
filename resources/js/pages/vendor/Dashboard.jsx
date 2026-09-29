import React from "react";
import { useAuth } from "../../context/AuthContext";

export default function Dashboard() {
    const { user } = useAuth();

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm mb-6">
                <div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase">
                        Modul Vendor
                    </span>
                    <h1 className="text-2xl font-bold text-gray-900 mt-2">Dashboard Mitra Vendor</h1>
                    <p className="text-sm text-gray-500">
                        Login sebagai Vendor: <span className="font-semibold">{user?.name}</span>. Kelola paket layanan dan tawaran pesanan acara.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h2 className="text-base font-bold text-gray-900 mb-4">Tawaran Pesanan Masuk</h2>
                    <div className="p-8 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl text-sm">
                        Belum ada tawaran pesanan baru dari EO.
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h2 className="text-base font-bold text-gray-900 mb-4">Katalog Paket Layanan</h2>
                    <div className="p-8 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl text-sm">
                        Belum ada paket yang didaftarkan.
                    </div>
                </div>
            </div>
        </div>
    );
}
