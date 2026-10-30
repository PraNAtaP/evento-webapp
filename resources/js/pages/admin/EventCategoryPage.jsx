import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";

export default function EventCategoryPage() {
    const queryClient = useQueryClient();

    // State pencarian & filter
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'active', 'inactive'
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // State Modal Tambah/Edit
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        min_booking_days: 14,
        description: "",
        is_active: true,
    });
    const [formErrors, setFormErrors] = useState({});

    // State Modal Konfirmasi Hapus
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [deleteErrorMessage, setDeleteErrorMessage] = useState("");

    // Feedback pesan aksi (sukses/gagal)
    const [toastMessage, setToastMessage] = useState(null);

    const showToast = (message, type = "success") => {
        setToastMessage({ message, type });
        setTimeout(() => setToastMessage(null), 4000);
    };

    // 1. Fetch seluruh data kategori untuk EO
    const {
        data: categories = [],
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["admin-categories"],
        queryFn: async () => {
            const res = await api.get("/admin/event-categories");
            return res.data?.data || [];
        },
    });

    // 2. Mutasi Tambah Kategori
    const createMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post("/admin/event-categories", payload);
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(["admin-categories"]);
            queryClient.invalidateQueries(["event-categories"]);
            setIsFormOpen(false);
            resetForm();
            showToast(data.message || "Kategori baru berhasil ditambahkan!");
        },
        onError: (err) => {
            const errors = err.response?.data?.errors;
            if (errors) {
                setFormErrors(errors);
            } else {
                showToast(
                    err.response?.data?.message || "Gagal menambahkan kategori.",
                    "error"
                );
            }
        },
    });

    // 3. Mutasi Perbarui Kategori
    const updateMutation = useMutation({
        mutationFn: async ({ id, payload }) => {
            const res = await api.put(`/admin/event-categories/${id}`, payload);
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(["admin-categories"]);
            queryClient.invalidateQueries(["event-categories"]);
            setIsFormOpen(false);
            resetForm();
            showToast(data.message || "Kategori berhasil diperbarui!");
        },
        onError: (err) => {
            const errors = err.response?.data?.errors;
            if (errors) {
                setFormErrors(errors);
            } else {
                showToast(
                    err.response?.data?.message || "Gagal memperbarui kategori.",
                    "error"
                );
            }
        },
    });

    // 4. Mutasi Hapus Kategori
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const res = await api.delete(`/admin/event-categories/${id}`);
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(["admin-categories"]);
            queryClient.invalidateQueries(["event-categories"]);
            setCategoryToDelete(null);
            setDeleteErrorMessage("");
            showToast(data.message || "Kategori berhasil dihapus.");
        },
        onError: (err) => {
            const msg =
                err.response?.data?.message ||
                "Terjadi kesalahan saat menghapus kategori.";
            setDeleteErrorMessage(msg);
        },
    });

    // Handler form helpers
    const resetForm = () => {
        setEditingCategory(null);
        setFormData({
            name: "",
            slug: "",
            min_booking_days: 14,
            description: "",
            is_active: true,
        });
        setFormErrors({});
    };

    const handleOpenCreate = () => {
        resetForm();
        setIsFormOpen(true);
    };

    const handleOpenEdit = (cat) => {
        setEditingCategory(cat);
        setFormData({
            name: cat.name || "",
            slug: cat.slug || "",
            min_booking_days: cat.min_booking_days ?? 14,
            description: cat.description || "",
            is_active: Boolean(cat.is_active),
        });
        setFormErrors({});
        setIsFormOpen(true);
    };

    const handleNameChange = (val) => {
        setFormData((prev) => {
            const autoSlug = editingCategory
                ? prev.slug
                : val
                      .toLowerCase()
                      .trim()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-+|-+$/g, "");
            return {
                ...prev,
                name: val,
                slug: autoSlug,
            };
        });
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        setFormErrors({});

        const payload = {
            name: formData.name.trim(),
            slug: formData.slug.trim(),
            min_booking_days: Number(formData.min_booking_days),
            description: formData.description?.trim() || null,
            is_active: formData.is_active,
        };

        if (editingCategory) {
            updateMutation.mutate({ id: editingCategory.id, payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    // Filter data kategori
    const filteredCategories = categories.filter((cat) => {
        const matchesSearch =
            cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cat.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (cat.description &&
                cat.description.toLowerCase().includes(searchTerm.toLowerCase()));

        if (filterStatus === "active") return matchesSearch && cat.is_active;
        if (filterStatus === "inactive") return matchesSearch && !cat.is_active;
        return matchesSearch;
    });

    // Pagination: Potong data jika melebihi itemsPerPage (10)
    const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
    const paginatedCategories = filteredCategories.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Statistik Cepat
    const totalCategories = categories.length;
    const activeCategoriesCount = categories.filter((c) => c.is_active).length;
    const avgMinDays =
        totalCategories > 0
            ? Math.round(
                  categories.reduce((acc, c) => acc + (c.min_booking_days || 0), 0) /
                      totalCategories
              )
            : 0;

    return (
        <div className="space-y-6">
            {/* Toast Notification */}
            {toastMessage && (
                <div
                    className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 transition-all transform translate-y-0 ${
                        toastMessage.type === "error"
                            ? "bg-rose-50 text-rose-800 border-rose-200"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200"
                    }`}
                >
                    <span className="text-sm font-medium">
                        {toastMessage.message}
                    </span>
                    <button
                        onClick={() => setToastMessage(null)}
                        className="text-xs opacity-60 hover:opacity-100"
                    >
                        &times;
                    </button>
                </div>
            )}

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E8E2D7] shadow-xs">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-[#657166]/15 text-[#435044] rounded-full">
                            Master Data
                        </span>
                        <h1 className="text-xl sm:text-2xl font-bold text-[#2F3931]">
                            Kategori Acara & Batas Hari
                        </h1>
                    </div>
                    <p className="text-xs sm:text-sm text-[#738075]">
                        Atur jenis acara (Wedding, Seminar, Birthday) beserta batas persiapan hari minimum (<code className="bg-[#FAF6F0] px-1 py-0.5 rounded text-[#2F3931] font-mono">min_booking_days</code>) sebelum pemesanan klien diterima.
                    </p>
                </div>

                <button
                    onClick={handleOpenCreate}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#657166] hover:bg-[#525d53] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Tambah Kategori
                </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-[#E8E2D7] shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs text-[#738075]">Total Kategori</p>
                        <p className="text-2xl font-bold text-[#2F3931] mt-0.5">
                            {totalCategories}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#657166]/10 flex items-center justify-center text-[#657166]">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#E8E2D7] shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs text-[#738075]">Kategori Aktif</p>
                        <p className="text-2xl font-bold text-emerald-700 mt-0.5">
                            {activeCategoriesCount}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#E8E2D7] shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs text-[#738075]">Rata-rata Batas Hari</p>
                        <p className="text-2xl font-bold text-[#2F3931] mt-0.5">
                            H-{avgMinDays}
                            <span className="text-xs font-normal text-[#738075] ml-1">hari</span>
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-[#E8E2D7] shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Cari nama, slug, atau deskripsi kategori..."
                        className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#FAF6F0] border border-[#E8E2D7] rounded-xl text-[#2F3931] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#657166] focus:bg-white transition-all"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-[#738075]">Status:</span>
                    <div className="flex bg-[#FAF6F0] p-1 rounded-xl border border-[#E8E2D7] text-xs">
                        <button
                            type="button"
                            onClick={() => setFilterStatus("all")}
                            className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                                filterStatus === "all"
                                    ? "bg-white text-[#2F3931] shadow-xs"
                                    : "text-[#738075] hover:text-[#2F3931]"
                            }`}
                        >
                            Semua
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterStatus("active")}
                            className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                                filterStatus === "active"
                                    ? "bg-white text-emerald-700 shadow-xs"
                                    : "text-[#738075] hover:text-[#2F3931]"
                            }`}
                        >
                            Aktif
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterStatus("inactive")}
                            className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                                filterStatus === "inactive"
                                    ? "bg-white text-rose-700 shadow-xs"
                                    : "text-[#738075] hover:text-[#2F3931]"
                            }`}
                        >
                            Nonaktif
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabel Data Kategori */}
            <div className="bg-white rounded-2xl border border-[#E8E2D7] shadow-xs overflow-hidden">
                {isLoading ? (
                    <div className="py-16 text-center">
                        <div className="w-8 h-8 border-3 border-[#657166] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-xs text-[#738075]">Memuat master data kategori...</p>
                    </div>
                ) : isError ? (
                    <div className="py-12 text-center text-rose-600 space-y-2">
                        <p className="text-sm font-semibold">Gagal memuat kategori acara.</p>
                        <button
                            onClick={() => refetch()}
                            className="px-3 py-1.5 text-xs bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg cursor-pointer"
                        >
                            Coba Lagi
                        </button>
                    </div>
                ) : filteredCategories.length === 0 ? (
                    <div className="py-14 text-center">
                        <div className="w-12 h-12 rounded-full bg-[#FAF6F0] flex items-center justify-center mx-auto mb-3 text-slate-400">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h4 className="text-sm font-semibold text-[#2F3931]">Tidak ada kategori ditemukan</h4>
                        <p className="text-xs text-[#738075] mt-1">
                            {searchTerm ? "Coba kata kunci pencarian yang berbeda." : "Silakan buat kategori pertama Anda dengan tombol Tambah Kategori."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-[#FAF6F0] text-[#738075] uppercase text-[10px] tracking-wider border-b border-[#E8E2D7]">
                                <tr>
                                    <th className="py-3 px-4 font-semibold">Nama Kategori</th>
                                    <th className="py-3 px-4 font-semibold">Slug Identifier</th>
                                    <th className="py-3 px-4 font-semibold">Batas Hari (H-min)</th>
                                    <th className="py-3 px-4 font-semibold">Deskripsi</th>
                                    <th className="py-3 px-4 font-semibold text-center">Acara Terkait</th>
                                    <th className="py-3 px-4 font-semibold text-center">Status</th>
                                    <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E8E2D7] text-[#2F3931]">
                                {paginatedCategories.map((cat) => (
                                    <tr key={cat.id} className="hover:bg-[#FAF6F0]/50 transition-colors">
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-[#657166]/15 text-[#435044] font-bold text-xs flex items-center justify-center shrink-0">
                                                    {cat.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-sm text-[#2F3931] block">
                                                        {cat.name}
                                                    </span>
                                                    <span className="text-[11px] text-[#738075]">
                                                        ID: #{cat.id}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                {cat.slug}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                H-{cat.min_booking_days} ({cat.min_booking_days} Hari)
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-[#738075] max-w-xs truncate" title={cat.description || "-"}>
                                            {cat.description || "-"}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
                                                {cat.events_count || 0} Acara
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            {cat.is_active ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                    Aktif
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                                    Nonaktif
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => handleOpenEdit(cat)}
                                                    className="p-1.5 rounded-lg text-slate-600 hover:text-[#435044] hover:bg-[#FAF6F0] border border-transparent hover:border-[#E8E2D7] transition-all cursor-pointer"
                                                    title="Edit Kategori"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setCategoryToDelete(cat);
                                                        setDeleteErrorMessage("");
                                                    }}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                                                    title="Hapus Kategori"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Kontrol Pagination (Hanya muncul jika total data > 10) */}
                {filteredCategories.length > itemsPerPage && (
                    <div className="p-4 border-t border-[#E8E2D7] bg-[#FAF6F0]/40 flex items-center justify-between text-xs text-[#738075]">
                        <span>
                            Menampilkan <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> - <strong>{Math.min(currentPage * itemsPerPage, filteredCategories.length)}</strong> dari <strong>{filteredCategories.length}</strong> kategori
                        </span>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                disabled={currentPage <= 1}
                                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                className="px-3 py-1.5 bg-white border border-[#E8E2D7] rounded-xl font-bold disabled:opacity-40 cursor-pointer hover:bg-[#FAF6F0] transition"
                            >
                                Sebelumnya
                            </button>

                            {Array.from({ length: totalPages }).map((_, idx) => {
                                const pageNumber = idx + 1;
                                return (
                                    <button
                                        key={pageNumber}
                                        type="button"
                                        onClick={() => setCurrentPage(pageNumber)}
                                        className={`w-7 h-7 rounded-lg font-bold text-xs transition cursor-pointer ${
                                            currentPage === pageNumber
                                                ? "bg-[#657166] text-white"
                                                : "bg-white border border-[#E8E2D7] text-[#2F3931] hover:bg-[#FAF6F0]"
                                        }`}
                                    >
                                        {pageNumber}
                                    </button>
                                );
                            })}

                            <button
                                type="button"
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                className="px-3 py-1.5 bg-white border border-[#E8E2D7] rounded-xl font-bold disabled:opacity-40 cursor-pointer hover:bg-[#FAF6F0] transition"
                            >
                                Selanjutnya
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Tambah / Edit Kategori */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white rounded-2xl max-w-lg w-full border border-[#E8E2D7] shadow-xl overflow-hidden animate-scale-up">
                        <div className="px-6 py-4 bg-[#FAF6F0] border-b border-[#E8E2D7] flex items-center justify-between">
                            <h3 className="text-base font-bold text-[#2F3931]">
                                {editingCategory ? "Edit Kategori Acara" : "Tambah Kategori Acara Baru"}
                            </h3>
                            <button
                                onClick={() => setIsFormOpen(false)}
                                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                            {/* Nama Kategori */}
                            <div>
                                <label className="block text-xs font-semibold text-[#2F3931] mb-1">
                                    Nama Kategori <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    placeholder="Contoh: Wedding, Ulang Tahun, Konser Musik"
                                    required
                                    className={`w-full px-3.5 py-2 text-xs bg-white border ${
                                        formErrors.name ? "border-rose-400 ring-1 ring-rose-200" : "border-slate-300"
                                    } rounded-xl text-[#2F3931] focus:outline-none focus:ring-2 focus:ring-[#657166]`}
                                />
                                {formErrors.name && (
                                    <p className="text-[11px] text-rose-600 mt-1">{formErrors.name[0]}</p>
                                )}
                            </div>

                            {/* Slug Kategori */}
                            <div>
                                <label className="block text-xs font-semibold text-[#2F3931] mb-1">
                                    Slug Identifier <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    placeholder="contoh: wedding, ulang-tahun"
                                    required
                                    className={`w-full px-3.5 py-2 text-xs font-mono bg-white border ${
                                        formErrors.slug ? "border-rose-400 ring-1 ring-rose-200" : "border-slate-300"
                                    } rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#657166]`}
                                />
                                <p className="text-[10px] text-[#738075] mt-1">
                                    Digunakan sebagai kunci pengenal teknis pada database & sistem validasi.
                                </p>
                                {formErrors.slug && (
                                    <p className="text-[11px] text-rose-600 mt-1">{formErrors.slug[0]}</p>
                                )}
                            </div>

                            {/* Batas Hari Minimum (min_booking_days) */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs font-semibold text-[#2F3931]">
                                        Batas Hari Minimum (min_booking_days) <span className="text-rose-500">*</span>
                                    </label>
                                    <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                        H-{formData.min_booking_days}
                                    </span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        max="365"
                                        value={formData.min_booking_days}
                                        onChange={(e) => setFormData({ ...formData, min_booking_days: e.target.value })}
                                        required
                                        className={`w-full px-3.5 py-2 text-xs bg-white border ${
                                            formErrors.min_booking_days ? "border-rose-400 ring-1 ring-rose-200" : "border-slate-300"
                                        } rounded-xl text-[#2F3931] focus:outline-none focus:ring-2 focus:ring-[#657166]`}
                                    />
                                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs text-[#738075]">
                                        Hari
                                    </span>
                                </div>
                                <p className="text-[11px] text-[#738075] mt-1">
                                    Klien hanya dapat memesan tanggal yang berjarak minimal sekian hari dari hari ini untuk persiapan EO & Vendor.
                                </p>
                                {formErrors.min_booking_days && (
                                    <p className="text-[11px] text-rose-600 mt-1">{formErrors.min_booking_days[0]}</p>
                                )}
                            </div>

                            {/* Deskripsi */}
                            <div>
                                <label className="block text-xs font-semibold text-[#2F3931] mb-1">
                                    Deskripsi Kategori (Opsional)
                                </label>
                                <textarea
                                    rows="2"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Contoh: Paket persiapan acara pernikahan mewah atau intim dengan koordinasi vendor lengkap."
                                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl text-[#2F3931] focus:outline-none focus:ring-2 focus:ring-[#657166]"
                                />
                                {formErrors.description && (
                                    <p className="text-[11px] text-rose-600 mt-1">{formErrors.description[0]}</p>
                                )}
                            </div>

                            {/* Toggle Aktif */}
                            <div className="flex items-center gap-3 pt-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#657166]"></div>
                                </label>
                                <span className="text-xs font-medium text-[#2F3931]">
                                    Aktifkan kategori ini agar muncul di pilihan booking klien
                                </span>
                            </div>

                            {/* Tombol Aksi */}
                            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E8E2D7]">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className="px-5 py-2 text-xs font-semibold text-white bg-[#657166] hover:bg-[#525d53] disabled:bg-slate-400 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
                                >
                                    {(createMutation.isPending || updateMutation.isPending) && (
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    )}
                                    {editingCategory ? "Simpan Perubahan" : "Simpan Kategori"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Hapus */}
            {categoryToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-md w-full border border-rose-200 shadow-xl overflow-hidden">
                        <div className="p-6">
                            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <h3 className="text-base font-bold text-center text-[#2F3931]">
                                Hapus Kategori &ldquo;{categoryToDelete.name}&rdquo;?
                            </h3>
                            <p className="text-xs text-[#738075] text-center mt-2">
                                Tindakan ini tidak dapat dibatalkan. Kategori tidak akan dapat dipilih lagi oleh klien.
                            </p>

                            {deleteErrorMessage && (
                                <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                                    {deleteErrorMessage}
                                </div>
                            )}

                            <div className="flex items-center justify-center gap-2.5 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCategoryToDelete(null);
                                        setDeleteErrorMessage("");
                                    }}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={() => deleteMutation.mutate(categoryToDelete.id)}
                                    disabled={deleteMutation.isPending}
                                    className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
                                >
                                    {deleteMutation.isPending && (
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    )}
                                    Ya, Hapus Kategori
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
