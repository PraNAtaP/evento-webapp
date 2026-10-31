import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

/**
 * Halaman Manajemen Akun Admin EO (Event Organizer)
 * Memungkinkan EO untuk melihat daftar admin, mencari admin,
 * mendaftarkan akun admin baru, mengedit data & kata sandi,
 * serta menghapus akun dengan proteksi diri & admin terakhir.
 */
export default function AdminAccountPage() {
    const { user: currentUser } = useAuth();
    const queryClient = useQueryClient();

    // State pencarian
    const [searchTerm, setSearchTerm] = useState("");

    // State Modal Form Tambah/Edit
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
    });
    const [formErrors, setFormErrors] = useState({});

    // State Modal Konfirmasi Hapus
    const [adminToDelete, setAdminToDelete] = useState(null);
    const [deleteErrorMessage, setDeleteErrorMessage] = useState("");

    // State Notifikasi Toast
    const [toastMessage, setToastMessage] = useState(null);

    const showToast = (message, type = "success") => {
        setToastMessage({ message, type });
        setTimeout(() => setToastMessage(null), 4000);
    };

    // 1. Fetch seluruh data akun admin EO
    const {
        data: adminsData,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["admin-accounts"],
        queryFn: async () => {
            const res = await api.get("/admin/admins");
            return res.data?.data || [];
        },
    });

    const admins = adminsData || [];

    // 2. Mutasi Tambah Admin Baru
    const createMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post("/admin/admins", payload);
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
            showToast(data.message || "Akun admin baru berhasil dibuat!");
            closeFormModal();
        },
        onError: (err) => {
            if (err.response?.status === 422 && err.response?.data?.errors) {
                setFormErrors(err.response.data.errors);
            } else {
                showToast(
                    err.response?.data?.message || "Gagal membuat akun admin baru.",
                    "error"
                );
            }
        },
    });

    // 3. Mutasi Perbarui Data Admin
    const updateMutation = useMutation({
        mutationFn: async ({ id, payload }) => {
            const res = await api.put(`/admin/admins/${id}`, payload);
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
            showToast(data.message || "Akun admin berhasil diperbarui!");
            closeFormModal();
        },
        onError: (err) => {
            if (err.response?.status === 422 && err.response?.data?.errors) {
                setFormErrors(err.response.data.errors);
            } else {
                showToast(
                    err.response?.data?.message || "Gagal memperbarui data admin.",
                    "error"
                );
            }
        },
    });

    // 4. Mutasi Hapus Akun Admin
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const res = await api.delete(`/admin/admins/${id}`);
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
            showToast(data.message || "Akun admin berhasil dihapus!");
            setAdminToDelete(null);
            setDeleteErrorMessage("");
        },
        onError: (err) => {
            const msg =
                err.response?.data?.message || "Gagal menghapus akun admin.";
            setDeleteErrorMessage(msg);
            showToast(msg, "error");
        },
    });

    // Handler Buka Modal Tambah
    const handleOpenCreateModal = () => {
        setEditingAdmin(null);
        setFormData({
            name: "",
            email: "",
            password: "",
            password_confirmation: "",
        });
        setFormErrors({});
        setShowPassword(false);
        setIsFormOpen(true);
    };

    // Handler Buka Modal Edit
    const handleOpenEditModal = (admin) => {
        setEditingAdmin(admin);
        setFormData({
            name: admin.name,
            email: admin.email,
            password: "",
            password_confirmation: "",
        });
        setFormErrors({});
        setShowPassword(false);
        setIsFormOpen(true);
    };

    // Handler Tutup Modal Form
    const closeFormModal = () => {
        setIsFormOpen(false);
        setEditingAdmin(null);
        setFormData({
            name: "",
            email: "",
            password: "",
            password_confirmation: "",
        });
        setFormErrors({});
        setShowPassword(false);
    };

    // Handler Submit Form Tambah / Edit
    const handleSubmitForm = (e) => {
        e.preventDefault();
        setFormErrors({});

        // Validasi frontend awal
        const errors = {};
        if (!formData.name.trim()) errors.name = ["Nama lengkap wajib diisi."];
        if (!formData.email.trim()) errors.email = ["Alamat email wajib diisi."];

        if (!editingAdmin) {
            if (!formData.password) {
                errors.password = ["Kata sandi wajib diisi."];
            } else if (formData.password.length < 8) {
                errors.password = ["Kata sandi minimal harus 8 karakter."];
            }
            if (formData.password !== formData.password_confirmation) {
                errors.password_confirmation = ["Konfirmasi kata sandi tidak cocok."];
            }
        } else {
            if (formData.password) {
                if (formData.password.length < 8) {
                    errors.password = ["Kata sandi minimal harus 8 karakter."];
                }
                if (formData.password !== formData.password_confirmation) {
                    errors.password_confirmation = [
                        "Konfirmasi kata sandi tidak cocok.",
                    ];
                }
            }
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        const payload = {
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
        };

        if (formData.password) {
            payload.password = formData.password;
            payload.password_confirmation = formData.password_confirmation;
        }

        if (editingAdmin) {
            updateMutation.mutate({ id: editingAdmin.id, payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    // Filter daftar admin berdasarkan search term
    const filteredAdmins = admins.filter((admin) => {
        const query = searchTerm.toLowerCase();
        return (
            admin.name.toLowerCase().includes(query) ||
            admin.email.toLowerCase().includes(query)
        );
    });

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">
            {/* Toast Feedback */}
            {toastMessage && (
                <div
                    className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-lg border text-xs font-semibold flex items-center gap-3 transition-all animate-fadeIn ${
                        toastMessage.type === "error"
                            ? "bg-rose-50 border-rose-200 text-rose-800"
                            : "bg-[#DAEBE3] border-[#CFD8C4] text-[#2F3931]"
                    }`}
                >
                    <span>
                        {toastMessage.type === "error" ? "⚠️" : "✅"}
                    </span>
                    <span>{toastMessage.message}</span>
                    <button
                        type="button"
                        onClick={() => setToastMessage(null)}
                        className="ml-2 text-slate-400 hover:text-slate-600 text-sm font-bold"
                    >
                        &times;
                    </button>
                </div>
            )}

            {/* Header Bagian Atas */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-[#2F3931] tracking-tight">
                        Kelola Akun Admin EO
                    </h1>
                    <p className="text-xs text-[#738075] mt-1">
                        Daftarkan rekan tim admin baru, perbarui data akun, dan kelola kredensial akses dashboard Event Organizer.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="px-4 py-2.5 bg-[#657166] hover:bg-[#556056] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Tambah Admin Baru</span>
                </button>
            </div>

            {/* Kartu Ringkasan Metrik (Quick Metrics) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Total Admin EO */}
                <div className="bg-white p-4 rounded-2xl border border-[#E8E2D7] shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs text-[#738075] font-medium">Total Akun Admin</p>
                        <p className="text-2xl font-black text-[#2F3931] mt-0.5">
                            {admins.length}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#657166]/10 flex items-center justify-center text-[#657166]">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                </div>

                {/* Akun Anda */}
                <div className="bg-white p-4 rounded-2xl border border-[#E8E2D7] shadow-xs flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                        <p className="text-xs text-[#738075] font-medium">Sesi Anda Saat Ini</p>
                        <p className="text-sm font-bold text-[#2F3931] mt-0.5 truncate">
                            {currentUser?.name || "Admin EO"}
                        </p>
                        <span className="inline-block text-[10px] text-[#424C43] bg-[#DAEBE3] px-2 py-0.5 rounded-full font-semibold mt-1">
                            Sedang Masuk
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#FDE8D3] text-[#63482B] border border-[#E8CEB2] flex items-center justify-center font-bold text-xs shrink-0">
                        {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "A"}
                    </div>
                </div>

                {/* Status Keamanan */}
                <div className="bg-white p-4 rounded-2xl border border-[#E8E2D7] shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs text-[#738075] font-medium">Tingkat Hak Akses</p>
                        <p className="text-sm font-bold text-[#2F3931] mt-0.5">
                            Full Administrator
                        </p>
                        <p className="text-[10px] text-[#738075] mt-1">
                            Akses penuh manajemen acara & vendor
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#99CDD8]/20 text-[#1F4B54] border border-[#99CDD8] flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-[#E8E2D7] shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#738075]">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Cari berdasarkan nama atau alamat email admin..."
                        className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF6F0] rounded-xl border border-[#E8E2D7] focus:outline-hidden focus:border-[#657166] text-[#2F3931] placeholder-[#738075]/70"
                    />
                </div>

                <div className="text-[11px] text-[#738075] font-medium self-end sm:self-center px-1">
                    Menampilkan <span className="font-bold text-[#2F3931]">{filteredAdmins.length}</span> dari {admins.length} akun
                </div>
            </div>

            {/* Tabel Daftar Admin */}
            <div className="bg-white rounded-2xl border border-[#E8E2D7] shadow-xs overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center">
                        <div className="w-8 h-8 border-3 border-[#657166] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-xs text-[#738075]">Memuat data akun admin EO...</p>
                    </div>
                ) : isError ? (
                    <div className="p-12 text-center text-rose-600">
                        <p className="text-sm font-bold">Gagal memuat daftar admin.</p>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="mt-3 text-xs font-semibold text-[#657166] hover:underline cursor-pointer"
                        >
                            Coba lagi
                        </button>
                    </div>
                ) : filteredAdmins.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-sm font-bold text-[#2F3931]">
                            {searchTerm
                                ? "Tidak ada akun admin yang sesuai dengan pencarian Anda."
                                : "Belum ada akun admin lain."}
                        </p>
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm("")}
                                className="mt-2 text-xs text-[#657166] hover:underline font-semibold cursor-pointer"
                            >
                                Reset pencarian
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#E8E2D7] bg-[#FAF6F0]/60 text-[11px] font-bold text-[#738075] uppercase tracking-wider">
                                    <th className="py-3.5 px-4 sm:px-6">Admin</th>
                                    <th className="py-3.5 px-4 sm:px-6">Alamat Email</th>
                                    <th className="py-3.5 px-4 sm:px-6">Peran Akun</th>
                                    <th className="py-3.5 px-4 sm:px-6">Terdaftar Sejak</th>
                                    <th className="py-3.5 px-4 sm:px-6 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E8E2D7] text-xs">
                                {filteredAdmins.map((admin) => {
                                    const isSelf = currentUser?.id === admin.id;
                                    const isLastAdmin = admins.length <= 1;

                                    return (
                                        <tr
                                            key={admin.id}
                                            className="hover:bg-[#FAF6F0]/50 transition-colors"
                                        >
                                            {/* Nama & Avatar */}
                                            <td className="py-4 px-4 sm:px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-[#F3C3B2] text-[#424C43] font-bold text-xs flex items-center justify-center shrink-0 border border-[#E8CEB2]">
                                                        {admin.name
                                                            ? admin.name.charAt(0).toUpperCase()
                                                            : "A"}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-[#2F3931]">
                                                                {admin.name}
                                                            </span>
                                                            {isSelf && (
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FDE8D3] text-[#63482B] border border-[#E8CEB2]">
                                                                    Akun Anda
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[11px] text-[#738075] md:hidden block mt-0.5">
                                                            {admin.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Email */}
                                            <td className="py-4 px-4 sm:px-6 text-[#2F3931] font-medium font-mono text-[11px]">
                                                {admin.email}
                                            </td>

                                            {/* Role */}
                                            <td className="py-4 px-4 sm:px-6">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#99CDD8]/30 text-[#1F4B54] border border-[#99CDD8]">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#1F4B54]"></span>
                                                    EO Internal
                                                </span>
                                            </td>

                                            {/* Tanggal Terdaftar */}
                                            <td className="py-4 px-4 sm:px-6 text-[#738075]">
                                                {admin.created_at
                                                    ? new Date(admin.created_at).toLocaleDateString("id-ID", {
                                                          day: "numeric",
                                                          month: "short",
                                                          year: "numeric",
                                                      })
                                                    : "-"}
                                            </td>

                                            {/* Aksi */}
                                            <td className="py-4 px-4 sm:px-6 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* Tombol Edit */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenEditModal(admin)}
                                                        className="p-1.5 text-[#657166] hover:text-[#2F3931] hover:bg-[#FAF6F0] rounded-lg transition-colors cursor-pointer border border-transparent hover:border-[#E8E2D7]"
                                                        title="Edit data admin"
                                                        aria-label="Edit data admin"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>

                                                    {/* Tombol Hapus */}
                                                    <button
                                                        type="button"
                                                        disabled={isSelf || isLastAdmin}
                                                        onClick={() => {
                                                            setDeleteErrorMessage("");
                                                            setAdminToDelete(admin);
                                                        }}
                                                        className={`p-1.5 rounded-lg transition-colors border ${
                                                            isSelf || isLastAdmin
                                                                ? "text-slate-300 border-transparent cursor-not-allowed"
                                                                : "text-rose-500 hover:text-rose-700 hover:bg-rose-50 border-transparent hover:border-rose-200 cursor-pointer"
                                                        }`}
                                                        title={
                                                            isSelf
                                                                ? "Anda tidak dapat menghapus akun Anda sendiri"
                                                                : isLastAdmin
                                                                ? "Minimal harus ada satu akun admin EO"
                                                                : "Hapus akun admin"
                                                        }
                                                        aria-label="Hapus akun admin"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Tambah / Edit Admin */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl border border-[#E8E2D7] shadow-xl w-full max-w-md overflow-hidden animate-scaleUp">
                        {/* Header Modal */}
                        <div className="px-6 py-5 border-b border-[#E8E2D7] flex items-center justify-between bg-[#FAF6F0]/60">
                            <div>
                                <h3 className="text-base font-extrabold text-[#2F3931]">
                                    {editingAdmin
                                        ? "Edit Akun Admin"
                                        : "Tambah Admin Baru"}
                                </h3>
                                <p className="text-[11px] text-[#738075] mt-0.5">
                                    {editingAdmin
                                        ? "Perbarui informasi nama, email, atau kata sandi admin."
                                        : "Lengkapi data untuk mendaftarkan rekan tim admin EO baru."}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeFormModal}
                                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 rounded-lg"
                                title="Tutup"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
                            {/* Input Nama Lengkap */}
                            <div>
                                <label className="block text-xs font-bold text-[#2F3931] mb-1">
                                    Nama Lengkap <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            name: e.target.value,
                                        }))
                                    }
                                    placeholder="Contoh: Budi Pratama"
                                    className={`w-full px-3.5 py-2.5 text-xs bg-[#FAF6F0] rounded-xl border ${
                                        formErrors.name
                                            ? "border-rose-400 focus:border-rose-500"
                                            : "border-[#E8E2D7] focus:border-[#657166]"
                                    } text-[#2F3931] focus:outline-hidden`}
                                />
                                {formErrors.name && (
                                    <p className="text-[11px] text-rose-500 mt-1 font-medium">
                                        {formErrors.name[0]}
                                    </p>
                                )}
                            </div>

                            {/* Input Email */}
                            <div>
                                <label className="block text-xs font-bold text-[#2F3931] mb-1">
                                    Alamat Email <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            email: e.target.value,
                                        }))
                                    }
                                    placeholder="admin@evento.id"
                                    className={`w-full px-3.5 py-2.5 text-xs bg-[#FAF6F0] rounded-xl border ${
                                        formErrors.email
                                            ? "border-rose-400 focus:border-rose-500"
                                            : "border-[#E8E2D7] focus:border-[#657166]"
                                    } text-[#2F3931] focus:outline-hidden`}
                                />
                                {formErrors.email && (
                                    <p className="text-[11px] text-rose-500 mt-1 font-medium">
                                        {formErrors.email[0]}
                                    </p>
                                )}
                            </div>

                            {/* Input Password */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-bold text-[#2F3931]">
                                        Kata Sandi {editingAdmin ? "(Opsional)" : <span className="text-rose-500">*</span>}
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className="text-[11px] text-[#657166] hover:underline font-semibold"
                                    >
                                        {showPassword ? "Sembunyikan" : "Tampilkan"}
                                    </button>
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            password: e.target.value,
                                        }))
                                    }
                                    placeholder={
                                        editingAdmin
                                            ? "Kosongkan jika tidak ingin mengubah kata sandi"
                                            : "Minimal 8 karakter"
                                    }
                                    className={`w-full px-3.5 py-2.5 text-xs bg-[#FAF6F0] rounded-xl border ${
                                        formErrors.password
                                            ? "border-rose-400 focus:border-rose-500"
                                            : "border-[#E8E2D7] focus:border-[#657166]"
                                    } text-[#2F3931] focus:outline-hidden`}
                                />
                                {formErrors.password && (
                                    <p className="text-[11px] text-rose-500 mt-1 font-medium">
                                        {formErrors.password[0]}
                                    </p>
                                )}
                            </div>

                            {/* Input Konfirmasi Password */}
                            {(formData.password || !editingAdmin) && (
                                <div>
                                    <label className="block text-xs font-bold text-[#2F3931] mb-1">
                                        Konfirmasi Kata Sandi <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password_confirmation}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                password_confirmation: e.target.value,
                                            }))
                                        }
                                        placeholder="Ketik ulang kata sandi yang sama"
                                        className={`w-full px-3.5 py-2.5 text-xs bg-[#FAF6F0] rounded-xl border ${
                                            formErrors.password_confirmation
                                                ? "border-rose-400 focus:border-rose-500"
                                                : "border-[#E8E2D7] focus:border-[#657166]"
                                        } text-[#2F3931] focus:outline-hidden`}
                                    />
                                    {formErrors.password_confirmation && (
                                        <p className="text-[11px] text-rose-500 mt-1 font-medium">
                                            {formErrors.password_confirmation[0]}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Footer Tombol Aksi */}
                            <div className="pt-3 border-t border-[#E8E2D7] flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={closeFormModal}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-xs font-semibold text-[#738075] hover:text-[#2F3931] hover:bg-[#FAF6F0] rounded-xl transition-colors cursor-pointer border border-transparent"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-xs font-bold text-white bg-[#657166] hover:bg-[#556056] disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                                >
                                    {isSubmitting && (
                                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    )}
                                    <span>
                                        {editingAdmin
                                            ? "Simpan Perubahan"
                                            : "Buat Akun Admin"}
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Hapus */}
            {adminToDelete && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl border border-[#E8E2D7] shadow-xl w-full max-w-sm overflow-hidden p-6 text-center animate-scaleUp">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3 border border-rose-100">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>

                        <h3 className="text-base font-bold text-[#2F3931]">
                            Hapus Akun Admin?
                        </h3>
                        <p className="text-xs text-[#738075] mt-1.5 leading-relaxed">
                            Apakah Anda yakin ingin menghapus akun{" "}
                            <span className="font-bold text-[#2F3931]">
                                {adminToDelete.name}
                            </span>{" "}
                            ({adminToDelete.email})? Tindakan ini tidak dapat dibatalkan.
                        </p>

                        {deleteErrorMessage && (
                            <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] rounded-xl font-medium">
                                {deleteErrorMessage}
                            </div>
                        )}

                        <div className="mt-6 flex items-center justify-center gap-2.5">
                            <button
                                type="button"
                                disabled={deleteMutation.isPending}
                                onClick={() => {
                                    setAdminToDelete(null);
                                    setDeleteErrorMessage("");
                                }}
                                className="w-1/2 py-2 px-3 text-xs font-semibold text-[#738075] hover:text-[#2F3931] hover:bg-[#FAF6F0] rounded-xl border border-[#E8E2D7] transition-colors cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={deleteMutation.isPending}
                                onClick={() => deleteMutation.mutate(adminToDelete.id)}
                                className="w-1/2 py-2 px-3 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                {deleteMutation.isPending && (
                                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                )}
                                <span>Ya, Hapus</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
