import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";

const formatDate = (date) => {
    if (!date) return "-";

    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date(date));
};

const formatDateTime = (date) => {
    if (!date) return "-";

    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(date.replace(" ", "T")));
};

const getErrorMessage = (error) =>
    error?.response?.data?.message || "Terjadi kesalahan. Silakan coba lagi.";

export default function AdminClientPage() {
    const queryClient = useQueryClient();

    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("active");
    const [selectedClient, setSelectedClient] = useState(null);
    const [editingClient, setEditingClient] = useState(null);
    const [deletingClient, setDeletingClient] = useState(null);
    const [notification, setNotification] = useState(null);

    const [form, setForm] = useState({
        name: "",
        email: "",
    });

    // Daftar Client Aktif
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["client-accounts"],
        queryFn: async () => {
            const response = await api.get("/admin/clients");
            return response.data;
        },
    });

    // Daftar Client Terhapus
    const {
        data: deletedData,
        isLoading: isDeletedLoading,
        isError: isDeletedError,
        error: deletedError,
    } = useQuery({
        queryKey: ["deleted-client-accounts"],
        queryFn: async () => {
            const response = await api.get("/admin/clients/deleted");
            return response.data;
        },
        enabled: activeTab === "deleted",
    });

    const clients = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
            ? data
            : [];

    const deletedClients = Array.isArray(deletedData?.data)
        ? deletedData.data
        : Array.isArray(deletedData)
            ? deletedData
            : [];

    // Filter Client Aktif
    const filteredClients = useMemo(() => {
        const keyword = search.toLowerCase().trim();

        if (!keyword) return clients;

        return clients.filter((client) =>
            `${client.name || ""} ${client.email || ""}`
                .toLowerCase()
                .includes(keyword)
        );
    }, [clients, search]);

    // Filter Client Terhapus
    const filteredDeletedClients = useMemo(() => {
        const keyword = search.toLowerCase().trim();

        if (!keyword) return deletedClients;

        return deletedClients.filter((client) =>
            `${client.name || ""} ${client.email || ""}`
                .toLowerCase()
                .includes(keyword)
        );
    }, [deletedClients, search]);

    const showNotification = (message, type = "success") => {
        setNotification({ message, type });

        setTimeout(() => {
            setNotification(null);
        }, 3000);
    };

    // Update Client
    const updateMutation = useMutation({
        mutationFn: async ({ id, payload }) => {
            return api.put(`/admin/clients/${id}`, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["client-accounts"],
            });

            setEditingClient(null);
            setForm({ name: "", email: "" });
            showNotification("Data Client berhasil diperbarui.");
        },
        onError: (error) => {
            showNotification(getErrorMessage(error), "error");
        },
    });

    // Nonaktifkan Client
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            return api.delete(`/admin/clients/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["client-accounts"],
            });

            queryClient.invalidateQueries({
                queryKey: ["deleted-client-accounts"],
            });

            setDeletingClient(null);
            setSelectedClient(null);
            showNotification("Akun Client berhasil dinonaktifkan.");
        },
        onError: (error) => {
            showNotification(getErrorMessage(error), "error");
        },
    });

    // Pulihkan Client
    const restoreMutation = useMutation({
        mutationFn: async (id) => {
            return api.post(`/admin/clients/${id}/restore`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["client-accounts"],
            });

            queryClient.invalidateQueries({
                queryKey: ["deleted-client-accounts"],
            });

            showNotification("Akun Client berhasil dipulihkan.");
        },
        onError: (error) => {
            showNotification(getErrorMessage(error), "error");
        },
    });

    const openEditModal = (client) => {
        setEditingClient(client);
        setForm({
            name: client.name || "",
            email: client.email || "",
        });
    };

    const handleUpdate = (e) => {
        e.preventDefault();

        if (!editingClient) return;

        updateMutation.mutate({
            id: editingClient.id,
            payload: {
                name: form.name.trim(),
                email: form.email.trim(),
            },
        });
    };

    const handleDelete = () => {
        if (!deletingClient) return;

        deleteMutation.mutate(deletingClient.id);
    };

    const handleRestore = (client) => {
        if (!client.can_restore) return;

        const confirmed = window.confirm(
            `Pulihkan akun Client ${client.name}? Akun ini akan dapat digunakan untuk login kembali.`
        );

        if (!confirmed) return;

        restoreMutation.mutate(client.id);
    };

    return (
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
            {/* Header */}
            <div>
                <h1 className="text-xl sm:text-2xl font-black text-[#2F3931] tracking-tight">
                    Kelola Akun Client
                </h1>
                <p className="text-xs text-[#738075] mt-1">
                    Lihat, cari, perbarui, dan kelola akun Client yang terdaftar di EVENTO.
                </p>
            </div>

            {/* Main Section */}
            <section className="bg-white border border-[#E8E2D7] rounded-2xl p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col gap-4 mb-6">
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-[#2F3931]">
                            Kelola Akun Client EVENTO
                        </h2>
                        <p className="text-xs text-[#738075] mt-1">
                            Pantau data akun Client, perbarui informasi, dan kelola status akun yang terdaftar.
                        </p>
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-[#FAF6F0] border border-[#E8E2D7] rounded-xl p-4">
                            <p className="text-xs font-semibold text-[#738075]">
                                Total Akun Client Aktif
                            </p>
                            <p className="text-2xl font-black text-[#2F3931] mt-2">
                                {isLoading ? "..." : clients.length}
                            </p>
                            <p className="text-[11px] text-[#738075] mt-1">
                                Client yang terdaftar dan aktif
                            </p>
                        </div>

                        <div className="bg-[#DAEBE3]/50 border border-[#DAEBE3] rounded-xl p-4">
                            <p className="text-xs font-semibold text-[#657166]">
                                Pengelolaan Akun
                            </p>
                            <p className="text-lg font-bold text-[#2F3931] mt-2">
                                Data Client
                            </p>
                            <p className="text-[11px] text-[#657166] mt-1">
                                Informasi nama dan alamat email dapat diperbarui.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-5 border-b border-[#E8E2D7]">
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab("active");
                            setSearch("");
                        }}
                        className={`px-4 py-3 text-sm font-semibold border-b-2 transition ${
                            activeTab === "active"
                                ? "border-[#506B59] text-[#506B59]"
                                : "border-transparent text-[#8A958B] hover:text-[#2F3931]"
                        }`}
                    >
                        Client Aktif ({clients.length})
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab("deleted");
                            setSearch("");
                        }}
                        className={`px-4 py-3 text-sm font-semibold border-b-2 transition ${
                            activeTab === "deleted"
                                ? "border-[#506B59] text-[#506B59]"
                                : "border-transparent text-[#8A958B] hover:text-[#2F3931]"
                        }`}
                    >
                        Client Terhapus ({deletedClients.length})
                    </button>
                </div>

                {/* Search */}
                <div className="mb-4">
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A958B]">
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <circle cx="11" cy="11" r="7" strokeWidth="2" />
                                <path d="m16 16 4 4" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </span>

                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari berdasarkan nama atau alamat email Client ..."
                            className="w-full pl-11 pr-4 py-3 text-sm border border-[#E8E2D7] rounded-xl outline-none focus:border-[#9BAE9F] focus:ring-2 focus:ring-[#DAEBE3]/50 text-[#2F3931] placeholder:text-[#A3AAA3]"
                        />
                    </div>
                </div>

                {/* Tabel Client Aktif */}
                {activeTab === "active" && (
                    <div className="border border-[#E8E2D7] rounded-xl overflow-hidden">
                        <div className="px-4 py-3 bg-[#FAF6F0] border-b border-[#E8E2D7] flex justify-between items-center">
                            <p className="text-xs font-semibold text-[#657166]">
                                Daftar Akun Client Aktif
                            </p>
                            <p className="text-[11px] text-[#738075]">
                                Menampilkan {filteredClients.length} dari {clients.length} akun
                            </p>
                        </div>

                        {isLoading ? (
                            <div className="py-12 text-center text-sm text-[#738075]">
                                Memuat data Client...
                            </div>
                        ) : isError ? (
                            <div className="py-12 px-4 text-center">
                                <p className="text-sm font-semibold text-red-600">
                                    Gagal memuat data Client.
                                </p>
                                <p className="text-xs text-[#738075] mt-1">
                                    {getErrorMessage(error)}
                                </p>
                            </div>
                        ) : filteredClients.length === 0 ? (
                            <div className="py-12 px-4 text-center">
                                <p className="text-sm font-semibold text-[#657166]">
                                    {search
                                        ? "Client tidak ditemukan."
                                        : "Belum ada akun Client yang terdaftar."}
                                </p>
                                <p className="text-xs text-[#9AA39A] mt-1">
                                    {search
                                        ? "Coba gunakan kata kunci pencarian lainnya."
                                        : "Data Client yang mendaftar akan ditampilkan di sini."}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[760px] text-left">
                                    <thead className="bg-[#FDFBF8] border-b border-[#E8E2D7]">
                                        <tr>
                                            <th className="px-5 py-4 text-[10px] font-bold tracking-wider text-[#738075]">
                                                CLIENT
                                            </th>
                                            <th className="px-5 py-4 text-[10px] font-bold tracking-wider text-[#738075]">
                                                ALAMAT EMAIL
                                            </th>
                                            <th className="px-5 py-4 text-[10px] font-bold tracking-wider text-[#738075]">
                                                STATUS AKUN
                                            </th>
                                            <th className="px-5 py-4 text-[10px] font-bold tracking-wider text-[#738075]">
                                                TERDAFTAR SEJAK
                                            </th>
                                            <th className="px-5 py-4 text-[10px] font-bold tracking-wider text-[#738075] text-center">
                                                AKSI
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-[#F0ECE5]">
                                        {filteredClients.map((client, index) => (
                                            <tr
                                                key={client.id}
                                                className="hover:bg-[#FDFBF8] transition-colors"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-[#DAEBE3] text-[#506B59] flex items-center justify-center text-sm font-bold shrink-0">
                                                            {(client.name || "C")
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-[#2F3931]">
                                                                {client.name}
                                                            </p>
                                                            <p className="text-[10px] text-[#9AA39A]">
                                                                Client #{index + 1}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4 text-sm text-[#657166]">
                                                    {client.email}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#DAEBE3] text-[#506B59] text-[10px] font-bold">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#6D9677]" />
                                                        Aktif
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4 text-sm text-[#657166]">
                                                    {formatDate(client.created_at)}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex justify-center items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedClient(client)}
                                                            title="Lihat detail"
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E8E2D7] text-[#657166] hover:bg-[#FAF6F0] transition"
                                                        >
                                                            <svg
                                                                className="w-4 h-4"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
                                                                    strokeWidth="1.8"
                                                                />
                                                                <circle
                                                                    cx="12"
                                                                    cy="12"
                                                                    r="3"
                                                                    strokeWidth="1.8"
                                                                />
                                                            </svg>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => openEditModal(client)}
                                                            title="Edit Client"
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#DAEBE3] text-[#506B59] hover:bg-[#DAEBE3]/50 transition"
                                                        >
                                                            <svg
                                                                className="w-4 h-4"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    d="m15 5 4 4M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z"
                                                                    strokeWidth="1.8"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                />
                                                            </svg>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => setDeletingClient(client)}
                                                            title="Nonaktifkan Client"
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition"
                                                        >
                                                            <svg
                                                                className="w-4 h-4"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    d="M4 7h16M10 11v6m4-6v6M5 7l1 13h12l1-13M9 7V4h6v3"
                                                                    strokeWidth="1.8"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                />
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
                    </div>
                )}

                {/* Tabel Client Terhapus */}
                {activeTab === "deleted" && (
                    <div className="border border-[#E8E2D7] rounded-xl overflow-hidden">
                        <div className="px-4 py-3 bg-[#FAF6F0] border-b border-[#E8E2D7] flex justify-between items-center">
                            <p className="text-xs font-semibold text-[#657166]">
                                Daftar Akun Client Terhapus
                            </p>
                            <p className="text-[11px] text-[#738075]">
                                Menampilkan {filteredDeletedClients.length} dari {deletedClients.length} akun
                            </p>
                        </div>

                        <div className="px-4 py-3 bg-[#FFF9ED] border-b border-[#F0E4C8]">
                            <p className="text-xs text-[#8A7040]">
                                Akun Client yang dinonaktifkan dapat dipulihkan dalam waktu 14 hari sejak tanggal penghapusan.
                            </p>
                        </div>

                        {isDeletedLoading ? (
                            <div className="py-12 text-center text-sm text-[#738075]">
                                Memuat data Client terhapus...
                            </div>
                        ) : isDeletedError ? (
                            <div className="py-12 px-4 text-center">
                                <p className="text-sm font-semibold text-red-600">
                                    Gagal memuat data Client terhapus.
                                </p>
                                <p className="text-xs text-[#738075] mt-1">
                                    {getErrorMessage(deletedError)}
                                </p>
                            </div>
                        ) : filteredDeletedClients.length === 0 ? (
                            <div className="py-12 px-4 text-center">
                                <p className="text-sm font-semibold text-[#657166]">
                                    {search
                                        ? "Client tidak ditemukan."
                                        : "Tidak ada akun Client yang dinonaktifkan."}
                                </p>
                                <p className="text-xs text-[#9AA39A] mt-1">
                                    {search
                                        ? "Coba gunakan kata kunci pencarian lainnya."
                                        : "Akun Client yang dinonaktifkan akan muncul di sini."}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[950px] text-left">
                                    <thead className="bg-[#FDFBF8] border-b border-[#E8E2D7]">
                                        <tr>
                                            <th className="px-5 py-4 text-[10px] font-bold tracking-wider text-[#738075]">
                                                CLIENT
                                            </th>
                                            <th className="px-5 py-4 text-[10px] font-bold tracking-wider text-[#738075]">
                                                ALAMAT EMAIL
                                            </th>
                                            <th className="px-5 py-4 text-[10px] font-bold tracking-wider text-[#738075]">
                                                TANGGAL DINONAKTIFKAN
                                            </th>
                                            <th className="px-5 py-4 text-[10px] font-bold tracking-wider text-[#738075]">
                                                BATAS PEMULIHAN
                                            </th>
                                            <th className="px-5 py-4 text-[10px] font-bold tracking-wider text-[#738075]">
                                                STATUS
                                            </th>
                                            <th className="px-5 py-4 text-[10px] font-bold tracking-wider text-[#738075] text-center">
                                                AKSI
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-[#F0ECE5]">
                                        {filteredDeletedClients.map((client) => (
                                            <tr
                                                key={client.id}
                                                className="hover:bg-[#FDFBF8] transition-colors"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-[#F3E9D8] text-[#927343] flex items-center justify-center text-sm font-bold shrink-0">
                                                            {(client.name || "C")
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-[#2F3931]">
                                                                {client.name}
                                                            </p>
                                                            <p className="text-[10px] text-[#9AA39A]">
                                                                Client #{client.id}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4 text-sm text-[#657166]">
                                                    {client.email}
                                                </td>

                                                <td className="px-5 py-4 text-sm text-[#657166]">
                                                    {formatDateTime(client.deleted_at)}
                                                </td>

                                                <td className="px-5 py-4 text-sm text-[#657166]">
                                                    {formatDateTime(client.restore_expires_at)}
                                                </td>

                                                <td className="px-5 py-4">
                                                    {client.can_restore ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFF2D8] text-[#927343] text-[10px] font-bold">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-[#C69B4D]" />
                                                            Menunggu Pemulihan
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-bold">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                                            Masa Pemulihan Habis
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex justify-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRestore(client)}
                                                            disabled={
                                                                !client.can_restore ||
                                                                restoreMutation.isPending
                                                            }
                                                            title={
                                                                client.can_restore
                                                                    ? "Pulihkan akun Client"
                                                                    : "Masa pemulihan 14 hari telah habis"
                                                            }
                                                            className="px-3 py-2 rounded-lg bg-[#506B59] text-white text-xs font-semibold hover:bg-[#3F5747] disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition"
                                                        >
                                                            {restoreMutation.isPending
                                                                ? "Memproses..."
                                                                : "Pulihkan"}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* Detail Modal */}
            {selectedClient && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-start mb-5">
                            <div>
                                <h3 className="text-lg font-bold text-[#2F3931]">
                                    Detail Akun Client
                                </h3>
                                <p className="text-xs text-[#738075] mt-1">
                                    Informasi akun Client yang terdaftar.
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedClient(null)}
                                className="text-[#738075] hover:text-[#2F3931] text-xl"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="flex items-center gap-3 mb-5 p-4 bg-[#FAF6F0] rounded-xl">
                            <div className="w-11 h-11 rounded-full bg-[#DAEBE3] text-[#506B59] flex items-center justify-center font-bold">
                                {(selectedClient.name || "C").charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-bold text-sm text-[#2F3931]">
                                    {selectedClient.name}
                                </p>
                                <p className="text-xs text-[#738075]">
                                    Client EVENTO
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-[#9AA39A] mb-1">Nama Client</p>
                                <p className="text-sm font-semibold text-[#2F3931]">
                                    {selectedClient.name}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-[#9AA39A] mb-1">Alamat Email</p>
                                <p className="text-sm font-semibold text-[#2F3931] break-all">
                                    {selectedClient.email}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-[#9AA39A] mb-1">Terdaftar Sejak</p>
                                <p className="text-sm font-semibold text-[#2F3931]">
                                    {formatDate(selectedClient.created_at)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-[#9AA39A] mb-1">Status Akun</p>
                                <span className="inline-flex px-3 py-1 rounded-full bg-[#DAEBE3] text-[#506B59] text-xs font-bold">
                                    Aktif
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedClient(null)}
                            className="w-full mt-6 py-2.5 rounded-xl bg-[#2F3931] text-white text-sm font-semibold hover:bg-[#465449] transition"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingClient && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <form
                        onSubmit={handleUpdate}
                        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
                    >
                        <h3 className="text-lg font-bold text-[#2F3931]">
                            Edit Akun Client
                        </h3>
                        <p className="text-xs text-[#738075] mt-1 mb-5">
                            Perbarui nama dan alamat email akun Client.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-[#657166] mb-2">
                                    Nama Client
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm({ ...form, name: e.target.value })
                                    }
                                    className="w-full px-4 py-3 text-sm border border-[#E8E2D7] rounded-xl outline-none focus:border-[#9BAE9F]"
                                    placeholder="Masukkan nama Client"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#657166] mb-2">
                                    Alamat Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={form.email}
                                    onChange={(e) =>
                                        setForm({ ...form, email: e.target.value })
                                    }
                                    className="w-full px-4 py-3 text-sm border border-[#E8E2D7] rounded-xl outline-none focus:border-[#9BAE9F]"
                                    placeholder="Masukkan alamat email"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setEditingClient(null)}
                                className="flex-1 py-2.5 rounded-xl border border-[#E8E2D7] text-[#657166] text-sm font-semibold hover:bg-[#FAF6F0]"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={updateMutation.isPending}
                                className="flex-1 py-2.5 rounded-xl bg-[#2F3931] text-white text-sm font-semibold hover:bg-[#465449] disabled:opacity-50"
                            >
                                {updateMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingClient && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <div className="w-11 h-11 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    d="M12 8v4m0 4h.01M5.5 19h13a1.5 1.5 0 0 0 1.3-2.25l-6.5-11.5a1.5 1.5 0 0 0-2.6 0l-6.5 11.5A1.5 1.5 0 0 0 5.5 19Z"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>

                        <h3 className="text-lg font-bold text-[#2F3931]">
                            Nonaktifkan Akun Client?
                        </h3>
                        <p className="text-sm text-[#738075] mt-2 leading-relaxed">
                            Akun <strong>{deletingClient.name}</strong> akan dinonaktifkan
                            dan tidak dapat digunakan untuk login. Data akun tetap
                            tersimpan di sistem.
                        </p>

                        <div className="flex gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setDeletingClient(null)}
                                className="flex-1 py-2.5 rounded-xl border border-[#E8E2D7] text-[#657166] text-sm font-semibold hover:bg-[#FAF6F0]"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleteMutation.isPending}
                                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50"
                            >
                                {deleteMutation.isPending ? "Memproses..." : "Ya, Nonaktifkan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notification */}
            {notification && (
                <div
                    className={`fixed bottom-5 right-5 z-[60] px-5 py-3 rounded-xl shadow-lg text-sm font-semibold text-white ${
                        notification.type === "error"
                            ? "bg-red-500"
                            : "bg-[#506B59]"
                    }`}
                >
                    {notification.message}
                </div>
            )}
        </div>
    );
}