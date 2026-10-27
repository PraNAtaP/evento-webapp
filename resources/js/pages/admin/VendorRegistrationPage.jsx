import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";

export default function VendorRegistrationPage() {
    const queryClient = useQueryClient();

    // Filter & Search state
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'pending', 'approved', 'rejected'

    // Modal States
    const [selectedVendorForDetail, setSelectedVendorForDetail] = useState(null);
    const [vendorToApprove, setVendorToApprove] = useState(null);
    const [vendorToReject, setVendorToReject] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [rejectError, setRejectError] = useState("");

    // Toast Feedback
    const [toastMessage, setToastMessage] = useState(null);

    const showToast = (message, type = "success") => {
        setToastMessage({ message, type });
        setTimeout(() => setToastMessage(null), 4000);
    };

    // 1. Fetch Vendor list & summary
    const {
        data: responseData,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["admin-vendors", filterStatus, searchTerm],
        queryFn: async () => {
            const params = {};
            if (filterStatus !== "all") params.status = filterStatus;
            if (searchTerm.trim()) params.search = searchTerm.trim();

            const res = await api.get("/admin/vendors", { params });
            return res.data;
        },
    });

    const vendors = responseData?.data || [];
    const summary = responseData?.summary || { total: 0, pending: 0, approved: 0, rejected: 0 };

    // 2. Mutation: Approve Vendor
    const approveMutation = useMutation({
        mutationFn: async (vendorId) => {
            const res = await api.patch(`/admin/vendors/${vendorId}/approve`);
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(["admin-vendors"]);
            setVendorToApprove(null);
            const toastType = data.email_sent === false ? "error" : "success";
            showToast(data.message || "Vendor berhasil disetujui!", toastType);
        },
        onError: (err) => {
            showToast(err.response?.data?.message || "Gagal menyetujui vendor.", "error");
        },
    });

    // 3. Mutation: Reject Vendor
    const rejectMutation = useMutation({
        mutationFn: async ({ vendorId, reason }) => {
            const res = await api.patch(`/admin/vendors/${vendorId}/reject`, {
                rejection_reason: reason,
            });
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(["admin-vendors"]);
            setVendorToReject(null);
            setRejectionReason("");
            setRejectError("");
            showToast(data.message || "Pendaftaran vendor telah ditolak.", "info");
        },
        onError: (err) => {
            const errMsg = err.response?.data?.errors?.rejection_reason?.[0] || err.response?.data?.message || "Gagal menolak vendor.";
            setRejectError(errMsg);
        },
    });

    const handleConfirmApprove = () => {
        if (!vendorToApprove) return;
        approveMutation.mutate(vendorToApprove.id);
    };

    const handleConfirmReject = (e) => {
        e.preventDefault();
        if (!rejectionReason.trim()) {
            setRejectError("Alasan penolakan wajib diisi.");
            return;
        }
        if (!vendorToReject) return;
        rejectMutation.mutate({ vendorId: vendorToReject.id, reason: rejectionReason });
    };

    const getSocialMediaUrl = (handle) => {
        if (!handle) return null;
        const clean = handle.trim();
        if (clean.startsWith("http://") || clean.startsWith("https://")) {
            return clean;
        }
        const username = clean.replace(/^@/, "");
        return `https://instagram.com/${username}`;
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "approved":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#DAEBE3] text-[#33422A] border border-[#B6C2AA]/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#657166]"></span>
                        Disetujui
                    </span>
                );
            case "rejected":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#F3C3B2]/40 text-[#6B3222] border border-[#F3C3B2]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C25841]"></span>
                        Ditolak
                    </span>
                );
            case "pending":
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FDE8D3] text-[#63482B] border border-[#E8CEB2]">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        Menunggu Review
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6">
            
            {/* Toast Notification */}
            {toastMessage && (
                <div
                    className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-lg border text-xs font-bold flex items-center gap-2 animate-bounce-short ${
                        toastMessage.type === "success"
                            ? "bg-[#DAEBE3] border-[#B6C2AA] text-[#33422A]"
                            : toastMessage.type === "error"
                            ? "bg-red-50 border-red-200 text-red-700"
                            : "bg-[#FDE8D3] border-[#E8CEB2] text-[#63482B]"
                    }`}
                >
                    <span>{toastMessage.type === "success" ? "✓" : "ℹ"}</span>
                    <span>{toastMessage.message}</span>
                </div>
            )}

            {/* Header Title & Breadcrumb */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-extrabold text-[#2F3931] tracking-tight">
                        Pendaftaran & Review Vendor
                    </h1>
                    <p className="text-xs sm:text-sm text-[#738075] mt-1">
                        Verifikasi profil bisnis mitra vendor baru untuk memastikan kualitas layanan di platform EVENTO.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => refetch()}
                        className="p-2.5 bg-white border border-[#E8E2D7] rounded-xl text-xs font-bold text-[#556056] hover:bg-[#FAF6F0] transition shadow-2xs"
                        title="Segarkan data"
                    >
                        🔄 Segarkan
                    </button>
                </div>
            </div>

            {/* Metric Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                    onClick={() => setFilterStatus("all")}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                        filterStatus === "all"
                            ? "bg-white border-[#657166] ring-2 ring-[#657166]/15 shadow-xs"
                            : "bg-white/80 border-[#E8E2D7] hover:border-[#CFD8C4]"
                    }`}
                >
                    <div className="text-[11px] font-bold text-[#738075] uppercase tracking-wider">Total Pendaftar</div>
                    <div className="text-2xl sm:text-3xl font-black text-[#2F3931] mt-1">{summary.total}</div>
                    <div className="text-[10px] text-[#738075] mt-0.5">Semua mitra terdaftar</div>
                </div>

                <div
                    onClick={() => setFilterStatus("pending")}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                        filterStatus === "pending"
                            ? "bg-[#FDE8D3]/40 border-amber-500 ring-2 ring-amber-500/20 shadow-xs"
                            : "bg-white/80 border-[#E8E2D7] hover:border-[#CFD8C4]"
                    }`}
                >
                    <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        Menunggu Review
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-amber-900 mt-1">{summary.pending}</div>
                    <div className="text-[10px] text-amber-700 mt-0.5">Perlu tindakan verifikasi EO</div>
                </div>

                <div
                    onClick={() => setFilterStatus("approved")}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                        filterStatus === "approved"
                            ? "bg-[#DAEBE3]/40 border-[#657166] ring-2 ring-[#657166]/20 shadow-xs"
                            : "bg-white/80 border-[#E8E2D7] hover:border-[#CFD8C4]"
                    }`}
                >
                    <div className="text-[11px] font-bold text-[#33422A] uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#657166]"></span>
                        Disetujui (Aktif)
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-[#2F3931] mt-1">{summary.approved}</div>
                    <div className="text-[10px] text-[#738075] mt-0.5">Dapat menerima pesanan</div>
                </div>

                <div
                    onClick={() => setFilterStatus("rejected")}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                        filterStatus === "rejected"
                            ? "bg-[#F3C3B2]/30 border-[#C25841] ring-2 ring-[#C25841]/20 shadow-xs"
                            : "bg-white/80 border-[#E8E2D7] hover:border-[#CFD8C4]"
                    }`}
                >
                    <div className="text-[11px] font-bold text-[#6B3222] uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#C25841]"></span>
                        Ditolak
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-[#6B3222] mt-1">{summary.rejected}</div>
                    <div className="text-[10px] text-[#738075] mt-0.5">Belum memenuhi syarat</div>
                </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-[#E8E2D7] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                
                {/* Status Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
                    {[
                        { id: "all", label: `Semua (${summary.total})` },
                        { id: "pending", label: `Menunggu (${summary.pending})` },
                        { id: "approved", label: `Disetujui (${summary.approved})` },
                        { id: "rejected", label: `Ditolak (${summary.rejected})` },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setFilterStatus(tab.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                                filterStatus === tab.id
                                    ? "bg-[#657166] text-white shadow-2xs"
                                    : "text-[#738075] hover:bg-[#FAF6F0] hover:text-[#2F3931]"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search Input */}
                <div className="w-full md:w-72">
                    <div className="relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Cari bisnis, nama, kategori..."
                            className="w-full pl-8 pr-3 py-2 text-xs border border-[#E8E2D7] bg-[#FAF6F0]/60 rounded-xl text-[#2F3931] placeholder-[#98A29A] focus:outline-none focus:ring-2 focus:ring-[#99CDD8] focus:border-[#99CDD8] transition"
                        />
                        <span className="absolute left-2.5 top-2.5 text-[#738075] text-xs">🔍</span>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm("")}
                                className="absolute right-2.5 top-2 text-[#738075] text-xs hover:text-[#2F3931]"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

            </div>

            {/* Vendor Table List */}
            <div className="bg-white rounded-2xl border border-[#E8E2D7] shadow-xs overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center">
                        <div className="w-8 h-8 border-3 border-[#657166] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-xs text-[#738075]">Memuat data pendaftar vendor...</p>
                    </div>
                ) : isError ? (
                    <div className="p-12 text-center text-red-600">
                        <p className="text-xs font-bold">Terjadi kesalahan saat mengambil data vendor.</p>
                        <button onClick={() => refetch()} className="mt-2 text-xs underline text-[#657166]">Coba lagi</button>
                    </div>
                ) : vendors.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="text-4xl mb-3">📋</div>
                        <h3 className="text-sm font-bold text-[#2F3931]">Tidak ada data vendor ditemukan</h3>
                        <p className="text-xs text-[#738075] mt-1 max-w-sm mx-auto">
                            {searchTerm || filterStatus !== "all"
                                ? "Coba ubah kata kunci pencarian atau ganti filter status di atas."
                                : "Belum ada pendaftaran vendor baru yang masuk ke sistem."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-[#FAF6F0]/80 text-[#738075] font-extrabold uppercase tracking-wider text-[10px] border-b border-[#E8E2D7]">
                                <tr>
                                    <th className="py-3.5 px-4">Nama Usaha & Kategori</th>
                                    <th className="py-3.5 px-4">Penanggung Jawab</th>
                                    <th className="py-3.5 px-4">Kontak / Lokasi</th>
                                    <th className="py-3.5 px-4">Tgl Daftar</th>
                                    <th className="py-3.5 px-4">Status</th>
                                    <th className="py-3.5 px-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E8E2D7]/60">
                                {vendors.map((vendor) => (
                                    <tr key={vendor.id} className="hover:bg-[#FAF6F0]/40 transition-colors">
                                        
                                        {/* Business Name & Category */}
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-[#99CDD8]/20 border border-[#99CDD8]/40 flex items-center justify-center font-bold text-[#1F4B54] text-xs shrink-0">
                                                    {vendor.business_name?.charAt(0) || "V"}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-[#2F3931]">{vendor.business_name}</div>
                                                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAF6F0] text-[#657166] border border-[#E8E2D7] font-semibold inline-block mt-0.5">
                                                        {vendor.category}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Owner User */}
                                        <td className="py-3.5 px-4">
                                            <div className="font-semibold text-[#2F3931]">{vendor.user?.name || "-"}</div>
                                            <div className="text-[11px] text-[#738075] mt-0.5">{vendor.user?.email || "-"}</div>
                                        </td>

                                        {/* Contact & Address */}
                                        <td className="py-3.5 px-4 max-w-xs">
                                            <div className="flex items-center gap-1.5 font-bold text-[#2F3931]">
                                                <span>📞</span>
                                                <a
                                                    href={`https://wa.me/${vendor.contact_number?.replace(/\D/g, "")}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="hover:underline text-[#657166]"
                                                    title="Hubungi via WhatsApp"
                                                >
                                                    {vendor.contact_number}
                                                </a>
                                            </div>
                                            {vendor.social_media && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <a
                                                        href={getSocialMediaUrl(vendor.social_media)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[11px] font-semibold text-[#1F4B54] bg-[#99CDD8]/25 hover:bg-[#99CDD8]/50 px-2 py-0.5 rounded-md border border-[#85BAC5] transition inline-flex items-center gap-1 truncate max-w-[190px]"
                                                        title="Buka Media Sosial / Portofolio Vendor untuk Verifikasi"
                                                    >
                                                        <span>📸 {vendor.social_media}</span>
                                                        <span className="text-[10px]">↗</span>
                                                    </a>
                                                </div>
                                            )}
                                            <p className="text-[11px] text-[#738075] truncate mt-1" title={vendor.address}>
                                                📍 {vendor.address}
                                            </p>
                                        </td>

                                        {/* Date */}
                                        <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-[#738075]">
                                            {new Date(vendor.created_at).toLocaleDateString("id-ID", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </td>

                                        {/* Status */}
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            {getStatusBadge(vendor.status)}
                                            {vendor.status === "rejected" && vendor.rejection_reason && (
                                                <div className="text-[10px] text-red-600 mt-1 max-w-xs truncate" title={vendor.rejection_reason}>
                                                    Alasan: {vendor.rejection_reason}
                                                </div>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                            <div className="inline-flex items-center gap-1.5">
                                                
                                                {/* Button Detail */}
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedVendorForDetail(vendor)}
                                                    className="px-2.5 py-1.5 bg-[#FAF6F0] hover:bg-white text-[#2F3931] border border-[#E8E2D7] rounded-lg text-xs font-bold transition shadow-2xs"
                                                >
                                                    Detail
                                                </button>

                                                {/* Approve Button */}
                                                {vendor.status !== "approved" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setVendorToApprove(vendor)}
                                                        className="px-2.5 py-1.5 bg-[#657166] hover:bg-[#556056] text-white rounded-lg text-xs font-bold transition shadow-2xs"
                                                    >
                                                        ✓ Setujui
                                                    </button>
                                                )}

                                                {/* Reject Button */}
                                                {vendor.status !== "rejected" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setVendorToReject(vendor);
                                                            setRejectionReason("");
                                                            setRejectError("");
                                                        }}
                                                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition shadow-2xs"
                                                    >
                                                        ✕ Tolak
                                                    </button>
                                                )}

                                            </div>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ========================================================= */}
            {/* MODAL 1: DETAIL VENDOR LENGKAP */}
            {/* ========================================================= */}
            {selectedVendorForDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-[#E8E2D7] shadow-xl relative max-h-[90vh] overflow-y-auto">
                        
                        <div className="flex items-start justify-between pb-4 border-b border-[#E8E2D7]">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-[#99CDD8]/20 border border-[#99CDD8]/40 flex items-center justify-center font-black text-lg text-[#1F4B54]">
                                    {selectedVendorForDetail.business_name?.charAt(0) || "V"}
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-[#2F3931]">
                                        {selectedVendorForDetail.business_name}
                                    </h3>
                                    <span className="text-[11px] font-semibold text-[#657166]">
                                        {selectedVendorForDetail.category}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedVendorForDetail(null)}
                                className="w-8 h-8 rounded-full bg-[#FAF6F0] flex items-center justify-center text-[#738075] hover:text-[#2F3931] border border-[#E8E2D7]"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Detail Content */}
                        <div className="space-y-4 py-4 text-xs">
                            <div className="flex items-center justify-between p-3 bg-[#FAF6F0] rounded-xl border border-[#E8E2D7]">
                                <span className="text-[#738075]">Status Pendaftaran:</span>
                                <div>{getStatusBadge(selectedVendorForDetail.status)}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-[#FAF6F0]/60 rounded-xl border border-[#E8E2D7]">
                                    <span className="text-[#738075] text-[10px] uppercase font-bold">Penanggung Jawab</span>
                                    <div className="font-bold text-[#2F3931] mt-0.5">{selectedVendorForDetail.user?.name || "-"}</div>
                                </div>
                                <div className="p-3 bg-[#FAF6F0]/60 rounded-xl border border-[#E8E2D7]">
                                    <span className="text-[#738075] text-[10px] uppercase font-bold">Email Bisnis</span>
                                    <div className="font-bold text-[#2F3931] mt-0.5 truncate">{selectedVendorForDetail.user?.email || "-"}</div>
                                </div>
                            </div>

                            <div className="p-3 bg-[#FAF6F0]/60 rounded-xl border border-[#E8E2D7]">
                                <span className="text-[#738075] text-[10px] uppercase font-bold">Kontak / WhatsApp</span>
                                <div className="font-bold text-[#2F3931] mt-0.5 flex items-center gap-2">
                                    <span>{selectedVendorForDetail.contact_number}</span>
                                    <a
                                        href={`https://wa.me/${selectedVendorForDetail.contact_number?.replace(/\D/g, "")}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold hover:underline"
                                    >
                                        Buka WhatsApp ↗
                                    </a>
                                </div>
                            </div>

                            <div className="p-3 bg-[#FAF6F0]/60 rounded-xl border border-[#E8E2D7]">
                                <span className="text-[#738075] text-[10px] uppercase font-bold">Media Sosial / Portofolio Usaha</span>
                                <div className="mt-1 flex items-center justify-between">
                                    <span className="font-bold text-[#2F3931] text-xs">
                                        {selectedVendorForDetail.social_media || "Belum dicantumkan"}
                                    </span>
                                    {selectedVendorForDetail.social_media && (
                                        <a
                                            href={getSocialMediaUrl(selectedVendorForDetail.social_media)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs bg-[#1F4B54] hover:bg-[#15343A] text-white px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 shadow-2xs"
                                        >
                                            <span>Buka Profil Portofolio</span>
                                            <span>↗</span>
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="p-3 bg-[#FAF6F0]/60 rounded-xl border border-[#E8E2D7]">
                                <span className="text-[#738075] text-[10px] uppercase font-bold">Alamat Kantor / Studio</span>
                                <div className="font-medium text-[#2F3931] mt-0.5 leading-relaxed">
                                    {selectedVendorForDetail.address}
                                </div>
                            </div>

                            {/* Status Persetujuan Syarat & Ketentuan */}
                            <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/80 flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-emerald-800">Syarat & Ketentuan Kemitraan</span>
                                    <div className="text-xs font-bold text-emerald-900 mt-0.5 flex items-center gap-1.5">
                                        <span>✓ Disetujui saat pendaftaran</span>
                                    </div>
                                </div>
                                {selectedVendorForDetail.agreement_accepted_at && (
                                    <span className="text-[10px] text-emerald-700 font-mono">
                                        {new Date(selectedVendorForDetail.agreement_accepted_at).toLocaleDateString("id-ID")}
                                    </span>
                                )}
                            </div>

                            {selectedVendorForDetail.description && (
                                <div className="p-3 bg-[#FAF6F0]/60 rounded-xl border border-[#E8E2D7]">
                                    <span className="text-[#738075] text-[10px] uppercase font-bold">Deskripsi / Portofolio Usaha</span>
                                    <div className="font-medium text-[#2F3931] mt-0.5 leading-relaxed whitespace-pre-line">
                                        {selectedVendorForDetail.description}
                                    </div>
                                </div>
                            )}

                            {selectedVendorForDetail.status === "rejected" && selectedVendorForDetail.rejection_reason && (
                                <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                                    <span className="text-red-700 text-[10px] uppercase font-bold">Alasan Penolakan:</span>
                                    <div className="font-bold text-red-800 mt-0.5 leading-relaxed">
                                        {selectedVendorForDetail.rejection_reason}
                                    </div>
                                </div>
                            )}

                            {selectedVendorForDetail.approved_at && (
                                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 flex justify-between">
                                    <span>Disetujui pada:</span>
                                    <strong className="font-bold">
                                        {new Date(selectedVendorForDetail.approved_at).toLocaleString("id-ID")}
                                    </strong>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer Actions */}
                        <div className="pt-4 border-t border-[#E8E2D7] flex items-center justify-end gap-2">
                            <button
                                onClick={() => setSelectedVendorForDetail(null)}
                                className="px-4 py-2 bg-[#FAF6F0] hover:bg-white border border-[#E8E2D7] rounded-xl text-xs font-bold text-[#2F3931]"
                            >
                                Tutup
                            </button>
                            {selectedVendorForDetail.status !== "approved" && (
                                <button
                                    onClick={() => {
                                        setVendorToApprove(selectedVendorForDetail);
                                        setSelectedVendorForDetail(null);
                                    }}
                                    className="px-4 py-2 bg-[#657166] hover:bg-[#556056] text-white rounded-xl text-xs font-bold"
                                >
                                    ✓ Setujui Vendor
                                </button>
                            )}
                        </div>

                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL 2: KONFIRMASI APPROVAL */}
            {/* ========================================================= */}
            {vendorToApprove && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E8E2D7] shadow-xl text-center">
                        <div className="w-14 h-14 rounded-2xl bg-[#DAEBE3] border border-[#B6C2AA] text-[#33422A] flex items-center justify-center mx-auto text-2xl mb-4">
                            ✓
                        </div>
                        <h3 className="text-base font-extrabold text-[#2F3931]">
                            Setujui Pendaftaran Vendor?
                        </h3>
                        <p className="text-xs text-[#738075] mt-2 leading-relaxed">
                            Apakah Anda yakin ingin menyetujui <strong>{vendorToApprove.business_name}</strong>? Vendor ini akan langsung dapat mempublikasikan paket penawaran dan menerima penugasan acara dari EO.
                        </p>

                        <div className="mt-3 p-3 bg-[#FAF6F0] rounded-xl border border-[#E8E2D7] text-left text-xs text-[#556056] space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-[#2F3931]">
                                <span>📧</span>
                                <span>Notifikasi Email Otomatis (SMTP)</span>
                            </div>
                            <p className="text-[11px] leading-relaxed">
                                Sistem akan otomatis mengirimkan email persetujuan resmi ke akun vendor di <strong>{vendorToApprove.user?.email}</strong>.
                            </p>
                        </div>

                        <div className="mt-6 flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => setVendorToApprove(null)}
                                className="px-4 py-2.5 bg-[#FAF6F0] hover:bg-white border border-[#E8E2D7] rounded-xl text-xs font-bold text-[#2F3931]"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={approveMutation.isPending}
                                onClick={handleConfirmApprove}
                                className="px-5 py-2.5 bg-[#657166] hover:bg-[#556056] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 disabled:opacity-50"
                            >
                                {approveMutation.isPending ? "Menyetujui..." : "Ya, Setujui Sekarang"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL 3: PENOLAKAN DENGAN ALASAN */}
            {/* ========================================================= */}
            {vendorToReject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E8E2D7] shadow-xl">
                        <div className="flex items-center gap-3 pb-3 border-b border-[#E8E2D7] mb-4">
                            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-black">
                                ✕
                            </div>
                            <div>
                                <h3 className="text-sm font-extrabold text-[#2F3931]">Tolak Pendaftaran Vendor</h3>
                                <p className="text-xs text-[#738075]">{vendorToReject.business_name}</p>
                            </div>
                        </div>

                        <form onSubmit={handleConfirmReject} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[#2F3931] mb-1.5">
                                    Alasan Penolakan <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    rows="3"
                                    value={rejectionReason}
                                    onChange={(e) => {
                                        setRejectionReason(e.target.value);
                                        setRejectError("");
                                    }}
                                    placeholder="Jelaskan alasan penolakan agar vendor dapat memperbaiki data (cth: nomor kontak tidak aktif, profil belum lengkap)..."
                                    className="w-full border border-[#E8E2D7] bg-[#FAF6F0]/60 rounded-xl p-3 text-xs text-[#2F3931] placeholder-[#98A29A] focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 resize-none transition"
                                ></textarea>
                                {rejectError && (
                                    <p className="text-[11px] text-red-600 mt-1">{rejectError}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E2D7]">
                                <button
                                    type="button"
                                    onClick={() => setVendorToReject(null)}
                                    className="px-4 py-2 bg-[#FAF6F0] hover:bg-white border border-[#E8E2D7] rounded-xl text-xs font-bold text-[#2F3931]"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={rejectMutation.isPending}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 disabled:opacity-50"
                                >
                                    {rejectMutation.isPending ? "Menolak..." : "Konfirmasi Tolak"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
