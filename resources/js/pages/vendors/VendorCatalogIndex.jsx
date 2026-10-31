import React from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import api from "../../api/axios";
import VendorCard from "../../components/catalog/VendorCard";
import SearchInput from "../../components/catalog/SearchInput";
import Pagination from "../../components/catalog/Pagination";
import EmptyState from "../../components/catalog/EmptyState";

export default function VendorCatalogIndex() {
    const [searchParams, setSearchParams] = useSearchParams();

    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);

    // Fetch data vendor dari API dengan TanStack Query & keepPreviousData
    const { data, isLoading, isPlaceholderData } = useQuery({
        queryKey: ["vendor-catalog", { search, category, page }],
        queryFn: async () => {
            const params = { page };
            if (search) params.search = search;
            if (category && category !== "all") params.category = category;

            const res = await api.get("/vendors", { params });
            return res.data;
        },
        placeholderData: keepPreviousData,
    });

    const vendors = data?.data || [];
    const meta = data?.meta || {};
    const categories = data?.categories || [];

    // Update query params di URL
    const updateQuery = (newParams) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            Object.entries(newParams).forEach(([k, v]) => {
                if (v === null || v === "" || (k === "category" && v === "all") || (k === "page" && v === 1)) {
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

    const handleCategoryChange = (catVal) => {
        updateQuery({ category: catVal, page: 1 });
    };

    const handlePageChange = (newPage) => {
        updateQuery({ page: newPage });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">
            {/* Header Halaman */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#2F3931] tracking-tight">
                        Katalog Vendor
                    </h1>
                    <p className="text-xs text-[#738075] mt-1">
                        Jelajahi profil mitra vendor resmi terverifikasi dan temukan paket layanan terbaik untuk acara Anda.
                    </p>
                </div>
            </div>

            {/* Toolbar Filter & Pencarian */}
            <div className="bg-white rounded-2xl border border-[#E8E2D7] p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <SearchInput
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Cari nama vendor, bidang layanan, atau spesialisasi..."
                    className="w-full md:max-w-md"
                />

                {/* Filter Kategori */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                    <button
                        type="button"
                        onClick={() => handleCategoryChange("all")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                            category === "all"
                                ? "bg-[#657166] text-white border-[#525C53] shadow-2xs"
                                : "bg-[#FAF6F0] text-[#738075] hover:text-[#2F3931] border-[#E8E2D7]"
                        }`}
                    >
                        Semua Kategori
                    </button>

                    {categories.map((cat) => {
                        const isActive = category.toLowerCase() === cat.value.toLowerCase();
                        return (
                            <button
                                key={cat.value}
                                type="button"
                                onClick={() => handleCategoryChange(cat.value)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                                    isActive
                                        ? "bg-[#657166] text-white border-[#525C53] shadow-2xs"
                                        : "bg-[#FAF6F0] text-[#738075] hover:text-[#2F3931] border-[#E8E2D7]"
                                }`}
                            >
                                {cat.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Grid Konten Vendor */}
            {isLoading && !isPlaceholderData ? (
                /* Skeleton Loading */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div
                            key={i}
                            className="bg-white rounded-2xl border border-[#E8E2D7] p-5 h-48 flex flex-col justify-between"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-xl bg-slate-200"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-16 bg-slate-200 rounded"></div>
                                    <div className="h-4 w-32 bg-slate-200 rounded"></div>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <div className="h-3 w-full bg-slate-100 rounded"></div>
                                <div className="h-3 w-3/4 bg-slate-100 rounded"></div>
                            </div>
                            <div className="h-3 w-20 bg-slate-200 rounded"></div>
                        </div>
                    ))}
                </div>
            ) : vendors.length > 0 ? (
                <>
                    <div
                        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 transition-opacity ${
                            isPlaceholderData ? "opacity-60" : "opacity-100"
                        }`}
                    >
                        {vendors.map((vendor) => (
                            <VendorCard key={vendor.id} vendor={vendor} />
                        ))}
                    </div>

                    {/* Pagination */}
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
                    title="Vendor Tidak Ditemukan"
                    message={
                        search || category !== "all"
                            ? "Tidak ada vendor yang cocok dengan filter atau kata kunci pencarian Anda. Silakan coba kata kunci lain."
                            : "Saat ini belum ada data mitra vendor yang aktif di katalog."
                    }
                    actionText={search || category !== "all" ? "Reset Filter" : undefined}
                    onAction={() => updateQuery({ search: "", category: "all", page: 1 })}
                />
            )}
        </div>
    );
}

