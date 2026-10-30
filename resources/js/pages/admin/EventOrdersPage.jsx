import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import { CATEGORY_LABELS } from "../../data/kanbanData";
import { formatRupiah, formatNumber } from "../../utils/formatters";

export default function EventOrdersPage() {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState("request");
    const [page, setPage] = useState(1);
    const [rejectModalData, setRejectModalData] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [toast, setToast] = useState(null);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // 1. Fetch data pesanan acara
    const {
        data: ordersData,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["admin-event-orders", statusFilter, page],
        queryFn: async () => {
            const res = await api.get(`/admin/orders?status=${statusFilter}&page=${page}`);
            return res.data;
        },
    });

    const orders = ordersData?.data || [];
    const pagination = ordersData || {};

    // 2. Mutasi Terima Pesanan
    const acceptMutation = useMutation({
        mutationFn: async (eventId) => {
            const res = await api.patch(`/admin/orders/${eventId}/accept`);
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(["admin-event-orders"]);
            queryClient.invalidateQueries(["admin-kanban"]);
            showToast(data.message || "Pesanan acara berhasil diterima!");
        },
        onError: (err) => {
            showToast(err.response?.data?.message || "Gagal menerima pesanan.", "error");
        },
    });

    // 3. Mutasi Tolak Pesanan
    const rejectMutation = useMutation({
        mutationFn: async ({ eventId, reason }) => {
            const res = await api.patch(`/admin/orders/${eventId}/reject`, { reason });
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(["admin-event-orders"]);
            queryClient.invalidateQueries(["admin-kanban"]);
            setRejectModalData(null);
            setRejectionReason("");
            showToast(data.message || "Pesanan acara berhasil ditolak.");
        },
        onError: (err) => {
            showToast(err.response?.data?.message || "Gagal menolak pesanan.", "error");
        },
    });

    const handleAccept = (order) => {
        if (confirm(`Yakin ingin menerima pesanan acara "${order.event_name}" dari ${order.client?.name || "Klien"}?`)) {
            acceptMutation.mutate(order.id);
        }
    };

    const handleOpenRejectModal = (order) => {
        setRejectModalData(order);
        setRejectionReason("");
    };

    const handleConfirmReject = (e) => {
        e.preventDefault();
        if (!rejectModalData) return;
        rejectMutation.mutate({
            eventId: rejectModalData.id,
            reason: rejectionReason,
        });
    };

    const formatDateRange = (order) => {
        if (!order?.event_date) return "-";
        const start = new Date(order.event_date).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
        if (order.is_multi_day && order.end_date) {
            const end = new Date(order.end_date).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
            });
            return `${start} - ${end}`;
        }
        return start;
    };

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">
            {/* Toast Notifikasi */}
            {toast && (
                <div
                    className={`fixed top-20 right-6 z-50 p-4 rounded-2xl text-xs font-bold border shadow-lg transition-all animate-fadeIn ${
                        toast.type === "success"
                            ? "bg-[#DAEBE3] text-[#224436] border-[#BCD4C9]"
                            : "bg-[#F3C3B2]/50 text-[#6B3222] border-[#E8CEB2]"
                    }`}
                >
                    {toast.message}
                </div>
            )}

            {/* Header Konten & Tab Filter Status */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-extrabold text-[#2F3931]">
                        Pesanan Acara Masuk
                    </h1>
                    <p className="text-xs text-[#738075] mt-0.5">
                        Tinjau permohonan booking acara dari klien, tentukan untuk menerima atau menolak pesanan.
                    </p>
                </div>

                <div className="flex items-center gap-1.5 p-1 bg-white border border-[#E8E2D7] rounded-xl self-start sm:self-auto shadow-2xs">
                    <button
                        type="button"
                        onClick={() => {
                            setStatusFilter("request");
                            setPage(1);
                        }}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            statusFilter === "request"
                                ? "bg-[#99CDD8]/40 text-[#1D4A54] border border-[#86BAC5]"
                                : "text-[#738075] hover:text-[#2F3931]"
                        }`}
                    >
                        Perlu Ditinjau
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setStatusFilter("drafting_quotation");
                            setPage(1);
                        }}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            statusFilter === "drafting_quotation"
                                ? "bg-[#DAEBE3] text-[#224436] border border-[#BCD4C9]"
                                : "text-[#738075] hover:text-[#2F3931]"
                        }`}
                    >
                        Sudah Diterima
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setStatusFilter("rejected");
                            setPage(1);
                        }}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            statusFilter === "rejected"
                                ? "bg-[#F3C3B2]/40 text-[#6B3222] border border-[#E8CEB2]"
                                : "text-[#738075] hover:text-[#2F3931]"
                        }`}
                    >
                        Ditolak
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setStatusFilter("all");
                            setPage(1);
                        }}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            statusFilter === "all"
                                ? "bg-[#CFD8C4] text-[#2D3A28] border border-[#B6C2AA]"
                                : "text-[#738075] hover:text-[#2F3931]"
                        }`}
                    >
                        Semua
                    </button>
                </div>
            </div>

            {/* Tabel Daftar Pesanan */}
            <div className="bg-white rounded-2xl border border-[#E8E2D7] shadow-xs overflow-hidden">
                {isLoading ? (
                    <div className="py-16 text-center">
                        <div className="w-8 h-8 border-3 border-[#657166] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-xs text-[#738075]">Memuat daftar pesanan acara...</p>
                    </div>
                ) : isError ? (
                    <div className="py-12 text-center text-xs text-rose-600">
                        <p>Gagal memuat data pesanan acara.</p>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="mt-2 px-3 py-1 bg-[#FAF6F0] border border-[#E8E2D7] rounded-lg font-bold"
                        >
                            Coba Lagi
                        </button>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="py-16 text-center text-xs text-[#738075]">
                        <div className="w-12 h-12 rounded-full bg-[#FAF6F0] flex items-center justify-center mx-auto mb-2 border border-[#E8E2D7]">
                            <svg className="w-6 h-6 text-[#738075]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <p className="font-bold text-[#2F3931]">Tidak ada pesanan acara pada status ini</p>
                        <p className="text-[11px] mt-0.5">Semua permohonan baru dari klien akan muncul di sini.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#E8E2D7] bg-[#FAF6F0]/70 text-[11px] font-bold uppercase tracking-wider text-[#738075]">
                                    <th className="py-3 px-4">Nama Acara & Kategori</th>
                                    <th className="py-3 px-4">Klien Pemesan</th>
                                    <th className="py-3 px-4">Tanggal Pelaksanaan</th>
                                    <th className="py-3 px-4">Estimasi Tamu & Budget</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-center">Aksi Keputusan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E8E2D7] text-xs">
                                {orders.map((order) => {
                                    const catLabel = CATEGORY_LABELS[order.category] || order.category || "Wedding";
                                    const isPending = order.kanban_status === "request";

                                    return (
                                        <tr key={order.id} className="hover:bg-[#FAF6F0]/40 transition-colors">
                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-[#2F3931]">{order.event_name}</div>
                                                <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#CFD8C4]/50 text-[#2D3A28] border border-[#B6C2AA]">
                                                    {catLabel}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <div className="font-semibold text-[#2F3931]">
                                                    {order.client?.name || "-"}
                                                </div>
                                                <div className="text-[11px] text-[#738075]">
                                                    {order.client?.email || "-"}
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4 text-[#2F3931] font-medium">
                                                {formatDateRange(order)}
                                                {order.venue && (
                                                    <div className="text-[11px] text-[#738075] truncate max-w-xs mt-0.5">
                                                        📍 {order.venue}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <div className="text-[#2F3931] font-medium">
                                                    {formatNumber(order.guest_count)} tamu
                                                </div>
                                                <div className="text-[11px] font-bold text-[#1D4A54]">
                                                    {formatRupiah(order.estimated_budget ?? order.budget)}
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                {order.kanban_status === "request" && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#99CDD8]/30 text-[#1D4A54] border border-[#86BAC5]">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#1D4A54]"></span>
                                                        Menunggu Review
                                                    </span>
                                                )}
                                                {order.kanban_status === "rejected" && (
                                                    <div>
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                                            Ditolak
                                                        </span>
                                                        {order.rejection_reason && (
                                                            <p className="text-[10px] text-rose-600 mt-1 italic max-w-xs">
                                                                &ldquo;{order.rejection_reason}&rdquo;
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                                {order.kanban_status !== "request" && order.kanban_status !== "rejected" && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#DAEBE3] text-[#224436] border border-[#BCD4C9]">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#224436]"></span>
                                                        Diterima ({order.kanban_status})
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-4 text-center">
                                                {isPending ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        {/* Tombol Terima */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAccept(order)}
                                                            disabled={acceptMutation.isPending || rejectMutation.isPending}
                                                            className="px-3 py-1.5 bg-[#DAEBE3] hover:bg-[#c6dfd4] text-[#224436] font-bold rounded-xl border border-[#BCD4C9] transition shadow-2xs cursor-pointer text-xs flex items-center gap-1 disabled:opacity-50"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            <span>Terima</span>
                                                        </button>

                                                        {/* Tombol Tolak */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenRejectModal(order)}
                                                            disabled={acceptMutation.isPending || rejectMutation.isPending}
                                                            className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 font-bold rounded-xl border border-rose-200 transition shadow-2xs cursor-pointer text-xs flex items-center gap-1 disabled:opacity-50"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                            <span>Tolak</span>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] text-[#738075] italic">
                                                        Sudah diproses
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls */}
                {pagination.last_page > 1 && (
                    <div className="p-4 border-t border-[#E8E2D7] bg-[#FAF6F0]/40 flex items-center justify-between text-xs text-[#738075]">
                        <span>
                            Menampilkan halaman <strong>{pagination.current_page}</strong> dari <strong>{pagination.last_page}</strong> (Total {pagination.total} pesanan)
                        </span>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={pagination.current_page <= 1}
                                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                className="px-3 py-1.5 bg-white border border-[#E8E2D7] rounded-xl font-bold disabled:opacity-40 cursor-pointer hover:bg-[#FAF6F0] transition"
                            >
                                Sebelumnya
                            </button>
                            <button
                                type="button"
                                disabled={pagination.current_page >= pagination.last_page}
                                onClick={() => setPage((prev) => prev + 1)}
                                className="px-3 py-1.5 bg-white border border-[#E8E2D7] rounded-xl font-bold disabled:opacity-40 cursor-pointer hover:bg-[#FAF6F0] transition"
                            >
                                Selanjutnya
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Alasan Penolakan Pesanan */}
            {rejectModalData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E8E2D7] shadow-xl">
                        <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D7]">
                            <h3 className="text-sm font-extrabold text-[#2F3931]">
                                Tolak Pesanan Acara
                            </h3>
                            <button
                                type="button"
                                onClick={() => setRejectModalData(null)}
                                className="text-[#738075] hover:text-[#2F3931] font-bold text-base"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleConfirmReject} className="mt-4 flex flex-col gap-3">
                            <p className="text-xs text-[#556056] leading-relaxed">
                                Anda akan menolak pesanan acara <strong className="text-[#2F3931]">{rejectModalData.event_name}</strong> dari klien <strong className="text-[#2F3931]">{rejectModalData.client?.name}</strong>.
                            </p>

                            <div>
                                <label className="block text-xs font-bold text-[#2F3931] mb-1.5">
                                    Alasan Penolakan (Opsional)
                                </label>
                                <textarea
                                    rows="3"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Contoh: Tanggal bertabrakan dengan maintenance vendor internal, atau kapasitas sudah penuh..."
                                    className="w-full border border-[#E8E2D7] bg-[#FAF6F0]/50 rounded-xl p-3 text-xs text-[#2F3931] placeholder-[#738075] focus:outline-none focus:ring-2 focus:ring-[#99CDD8]"
                                />
                            </div>

                            <div className="pt-3 border-t border-[#E8E2D7] flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setRejectModalData(null)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold border border-[#E8E2D7] text-[#738075] hover:bg-[#FAF6F0]"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={rejectMutation.isPending}
                                    className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition disabled:opacity-50"
                                >
                                    {rejectMutation.isPending ? "Memproses..." : "Konfirmasi Tolak"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

