import React from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import api from "../../api/axios";
import Breadcrumb from "../../components/catalog/Breadcrumb";
import PackageCard from "../../components/catalog/PackageCard";
import SearchInput from "../../components/catalog/SearchInput";
import Pagination from "../../components/catalog/Pagination";
import EmptyState from "../../components/catalog/EmptyState";

export default function VendorCatalogShow() {
    const { slug } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);

    // Fetch detail vendor dan paket layanannya
    const { data, isLoading, isError, error, isPlaceholderData } = useQuery({
        queryKey: ["vendor-detail", slug, { search, page }],
        queryFn: async () => {
            const params = { page };
            if (search) params.search = search;

            const res = await api.get(`/vendors/${slug}`, { params });
            return res.data;
        },
        placeholderData: keepPreviousData,
        retry: false,
    });

    const vendor = data?.vendor || null;
    const packages = data?.packages || [];
    const meta = data?.meta || {};

    const updateQuery = (newParams) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            Object.entries(newParams).forEach(([k, v]) => {
                if (v === null || v === "" || (k === "page" && v === 1)) {
                    next.delete(k);
                } else {
                    next.set(k, String(v));
                }
            });
            return next;
        });
    };

    const handleSearchChange = (val) => {
        updateQuery({ search: val, page: 1 });
    };

    const handlePageChange = (newPage) => {
        updateQuery({ page: newPage });
        window.scrollTo({ top: 300, behavior: "smooth" });
    };

    // Jika error 404
    if (isError) {
        return (
            <div className="flex flex-col gap-6 max-w-4xl mx-auto py-10">
                <Breadcrumb items={[{ label: "Vendor Tidak Ditemukan" }]} />
                <div className="bg-white rounded-2xl border border-[#E8E2D7] p-10 text-center shadow-xs flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold text-2xl">
                        ⚠️
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-[#2F3931]">
                            Profil Vendor Tidak Ditemukan
                        </h2>
                        <p className="text-xs text-[#738075] mt-1 max-w-md leading-relaxed">
                            {error?.response?.data?.message ||
                                "Vendor yang Anda cari tidak tersedia, belum terverifikasi oleh EO, atau tautan yang Anda tuju sudah kedaluwarsa."}
                        </p>
                    </div>
                    <Link
                        to="/vendors"
                        className="mt-2 px-4 py-2.5 bg-[#657166] hover:bg-[#556056] text-white font-bold text-xs rounded-xl shadow-xs transition-colors border border-[#525C53]"
                    >
                        Kembali ke Katalog Vendor
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">
            {/* Breadcrumb & Navigasi Kembali */}
            <Breadcrumb
                items={[{ label: vendor?.name || "Memuat..." }]}
                backUrl="/vendors"
            />

            {/* Kartu Profil Singkat Vendor */}
            {isLoading && !vendor ? (
                <div className="bg-white rounded-2xl border border-[#E8E2D7] p-6 shadow-xs animate-pulse flex flex-col md:flex-row gap-6">
                    <div className="w-24 h-24 rounded-2xl bg-slate-200 shrink-0"></div>
                    <div className="flex-1 space-y-3">
                        <div className="h-4 w-28 bg-slate-200 rounded"></div>
                        <div className="h-6 w-60 bg-slate-200 rounded"></div>
                        <div className="h-3 w-full bg-slate-100 rounded"></div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-[#E8E2D7] p-6 sm:p-7 shadow-xs flex flex-col md:flex-row items-start gap-6">
                    {/* Logo Vendor */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#FAF6F0] border border-[#E8E2D7] flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                        {vendor?.logo ? (
                            <img
                                src={vendor.logo}
                                alt={vendor.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-2xl font-black text-[#657166]">
                                {(vendor?.name || "V")
                                    .split(" ")
                                    .slice(0, 2)
                                    .map((w) => w[0])
                                    .join("")
                                    .toUpperCase()}
                            </span>
                        )}
                    </div>

                    {/* Informasi Utama */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#CFD8C4]/60 text-[#2D3A28] border border-[#B6C2AA]">
                                {vendor?.category || "Layanan Acara"}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Terverifikasi EO
                            </span>
                        </div>

                        <h1 className="text-xl sm:text-2xl font-black text-[#2F3931] tracking-tight">
                            {vendor?.name}
                        </h1>

                        {vendor?.description && (
                            <p className="text-xs text-[#738075] mt-2 leading-relaxed">
                                {vendor.description}
                            </p>
                        )}

                        {/* Kontak & Lokasi */}
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#738075] mt-4 pt-4 border-t border-[#E8E2D7]/70">
                            {vendor?.address && (
                                <div className="flex items-center gap-1.5">
                                    <span>📍</span>
                                    <span>{vendor.address}</span>
                                </div>
                            )}
                            {vendor?.phone && (
                                <div className="flex items-center gap-1.5">
                                    <span>📞</span>
                                    <span>{vendor.phone}</span>
                                </div>
                            )}
                            {vendor?.email && (
                                <div className="flex items-center gap-1.5">
                                    <span>✉️</span>
                                    <span>{vendor.email}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Seksi Daftar Paket Layanan */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-base font-bold text-[#2F3931]">
                            Paket Layanan yang Ditawarkan
                        </h2>
                        <p className="text-xs text-[#738075] mt-0.5">
                            Pilihan paket resmi yang disediakan oleh {vendor?.name || "vendor ini"}.
                        </p>
                    </div>

                    {/* Filter Pencarian Paket */}
                    <SearchInput
                        value={search}
                        onChange={handleSearchChange}
                        placeholder="Cari paket layanan..."
                        className="w-full sm:w-72"
                    />
                </div>

                {/* Grid Paket */}
                {isLoading && !isPlaceholderData ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div
                                key={i}
                                className="bg-white rounded-2xl border border-[#E8E2D7] h-64 overflow-hidden"
                            >
                                <div className="aspect-video bg-slate-200"></div>
                                <div className="p-4 space-y-2">
                                    <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
                                    <div className="h-3 w-full bg-slate-100 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : packages.length > 0 ? (
                    <>
                        <div
                            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 transition-opacity ${
                                isPlaceholderData ? "opacity-60" : "opacity-100"
                            }`}
                        >
                            {packages.map((pkg) => (
                                <PackageCard key={pkg.id} pkg={pkg} />
                            ))}
                        </div>

                        {/* Pagination Paket */}
                        <Pagination
                            currentPage={meta.current_page || page}
                            lastPage={meta.last_page || 1}
                            total={meta.total || 0}
                            from={meta.from || 0}
                            to={meta.to || 0}
                            onPageChange={handlePageChange}
                        />
                    </>
                ) : (
                    <EmptyState
                        title="Tidak Ada Paket Layanan"
                        message={
                            search
                                ? `Tidak ditemukan paket dengan kata kunci "${search}".`
                                : "Vendor ini belum memiliki paket layanan aktif."
                        }
                        actionText={search ? "Hapus Pencarian" : undefined}
                        onAction={() => handleSearchChange("")}
                    />
                )}
            </div>
        </div>
    );
}

