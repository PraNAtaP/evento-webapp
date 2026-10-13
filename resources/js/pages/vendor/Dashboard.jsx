import React from "react";
import { useAuth } from "../../context/AuthContext";

export default function Dashboard() {
    const { user } = useAuth();

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E2D7] shadow-xs">
                <div>
                    <span className="text-[11px] font-bold text-[#34402A] bg-[#CFD8C4] px-3 py-0.5 rounded-full border border-[#B8C4AB] uppercase inline-block mb-1.5">
                        Modul Vendor
                    </span>
                    <h1 className="text-xl font-extrabold text-[#2F3931] tracking-tight">Dashboard Mitra Vendor</h1>
                    <p className="text-xs text-[#738075] mt-0.5">
                        Login sebagai Vendor: <span className="font-semibold text-[#2F3931]">{user?.name}</span>. Kelola paket layanan dan tawaran pesanan acara.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-[#E8E2D7] shadow-xs">
                    <h2 className="text-sm font-bold text-[#2F3931] mb-4">Tawaran Pesanan Masuk</h2>
                    <div className="p-8 text-center text-[#738075] border-2 border-dashed border-[#E8E2D7] rounded-xl text-xs bg-[#FAF6F0]/40">
                        Belum ada tawaran pesanan baru dari EO.
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-[#E8E2D7] shadow-xs">
                    <h2 className="text-sm font-bold text-[#2F3931] mb-4">Katalog Paket Layanan</h2>
                    <div className="p-8 text-center text-[#738075] border-2 border-dashed border-[#E8E2D7] rounded-xl text-xs bg-[#FAF6F0]/40">
                        Belum ada paket yang didaftarkan.
                    </div>
                </div>
            </div>
        </div>
    );
}
