import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function VendorCard({ vendor }) {
    const [imageError, setImageError] = useState(false);

    // Dapatkan inisial nama vendor
    const getInitials = (name = "") => {
        return name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((word) => word[0].toUpperCase())
            .join("") || "V";
    };

    return (
        <Link
            to={`/vendors/${vendor.slug}`}
            className="group bg-white rounded-2xl border border-[#E8E2D7] p-5 shadow-xs hover:shadow-md hover:border-[#B6C2AA] transition-all duration-200 flex flex-col justify-between gap-4 cursor-pointer"
        >
            <div className="flex items-start gap-3.5">
                {/* Logo atau Inisial Avatar */}
                <div className="w-13 h-13 rounded-2xl bg-[#FAF6F0] border border-[#E8E2D7] flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                    {vendor.logo && !imageError ? (
                        <img
                            src={vendor.logo}
                            alt={vendor.name}
                            onError={() => setImageError(true)}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-base font-black text-[#657166]">
                            {getInitials(vendor.name)}
                        </span>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#CFD8C4]/50 text-[#2D3A28] border border-[#B6C2AA]">
                            {vendor.category || "Mitra EO"}
                        </span>
                    </div>

                    <h3 className="text-sm font-bold text-[#2F3931] group-hover:text-[#657166] transition-colors truncate">
                        {vendor.name}
                    </h3>

                    {vendor.address && (
                        <p className="text-[11px] text-[#738075] truncate mt-0.5 flex items-center gap-1">
                            <span>📍</span>
                            <span>{vendor.address}</span>
                        </p>
                    )}
                </div>
            </div>

            {/* Deskripsi Singkat */}
            {vendor.description && (
                <p className="text-xs text-[#738075] line-clamp-2 leading-relaxed">
                    {vendor.description}
                </p>
            )}

            {/* Footer Kartu: Jumlah Paket & Tombol Lihat */}
            <div className="pt-3 border-t border-[#E8E2D7]/70 flex items-center justify-between text-xs">
                <span className="font-semibold text-[#657166] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#657166]"></span>
                    <span>{vendor.packages_count || 0} Paket Layanan</span>
                </span>

                <span className="text-[11px] font-bold text-[#738075] group-hover:text-[#2F3931] flex items-center gap-1 transition-colors">
                    <span>Lihat Paket</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                </span>
            </div>
        </Link>
    );
}

