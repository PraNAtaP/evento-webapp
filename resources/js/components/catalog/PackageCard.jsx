import React, { useState } from "react";

export default function PackageCard({ pkg }) {
    const [imageError, setImageError] = useState(false);

    const formatPrice = (price) => {
        const num = Number(price) || 0;
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(num);
    };

    return (
        <div className="bg-white rounded-2xl border border-[#E8E2D7] overflow-hidden shadow-xs hover:shadow-md hover:border-[#B6C2AA] transition-all duration-200 flex flex-col justify-between group">
            {/* Bagian Gambar Utama */}
            <div className="relative aspect-video w-full bg-[#FAF6F0] overflow-hidden border-b border-[#E8E2D7]/70">
                {pkg.image && !imageError ? (
                    <img
                        src={pkg.image}
                        alt={pkg.name}
                        onError={() => setImageError(true)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-[#738075]/70 bg-gradient-to-br from-[#FAF6F0] to-[#E8E2D7]/40">
                        <span className="text-3xl">📦</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider">
                            Paket Layanan
                        </span>
                    </div>
                )}

                {/* Badge Status Ketersediaan */}
                <div className="absolute top-3 right-3">
                    {pkg.is_active ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs backdrop-blur-xs">
                            Tersedia
                        </span>
                    ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 shadow-2xs">
                            Tidak tersedia
                        </span>
                    )}
                </div>
            </div>

            {/* Konten Paket */}
            <div className="p-4 flex flex-col gap-2 flex-1 justify-between">
                <div>
                    <h4 className="text-sm font-bold text-[#2F3931] group-hover:text-[#657166] transition-colors leading-snug">
                        {pkg.name}
                    </h4>

                    {pkg.description && (
                        <p className="text-xs text-[#738075] mt-1.5 leading-relaxed line-clamp-3">
                            {pkg.description}
                        </p>
                    )}
                </div>

                {/* Harga Layanan */}
                <div className="pt-3 border-t border-[#E8E2D7]/70 flex items-baseline justify-between mt-2">
                    <span className="text-[10px] font-medium text-[#738075]">Biaya Paket:</span>
                    <span className="text-sm sm:text-base font-black text-[#2F3931]">
                        {pkg.price_formatted || formatPrice(pkg.price)}
                    </span>
                </div>
            </div>
        </div>
    );
}

