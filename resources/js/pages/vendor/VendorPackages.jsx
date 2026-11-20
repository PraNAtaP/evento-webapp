import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useDialog } from "../../context/DialogContext";
import api from "../../api/axios";

export default function VendorPackages() {
    const { user } = useAuth();
    const { showConfirm, showAlert, showToast } = useDialog();
    const [selectedImage, setSelectedImage] = useState(null);
    const [packages, setPackages] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [priceFilter, setPriceFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 5;

    // Mengambil daftar paket dari database
    const fetchPackages = async () => {
        try {
            const response = await api.get("/vendor/packages");
            setPackages(response.data.data ?? []);
        } catch (error) {
            console.error("Gagal mengambil data paket:", error);
        }
    };

    useEffect(() => {
        fetchPackages();
    }, []);

    // Menghapus paket
    const handleDelete = async (id) => {
        const confirmed = await showConfirm({
            title: "Hapus Paket Jasa?",
            message: "Yakin ingin menghapus paket ini? Tindakan ini tidak dapat dibatalkan.",
            isDanger: true,
            confirmText: "Ya, Hapus",
            cancelText: "Batal",
        });

        if (!confirmed) {
            return;
        }

        try {
            await api.delete(`/vendor/packages/${id}`);
            showToast("Paket berhasil dihapus", "success");
            await fetchPackages();
        } catch (error) {
            console.error("Gagal menghapus paket:", error);
            showAlert({
                title: "Gagal Menghapus",
                message: error.response?.data?.message || "Gagal menghapus paket.",
                type: "danger",
            });
        }
    };

    // Pencarian langsung dan filter harga
    const filteredPackages = packages.filter((item) => {
        const keyword = searchTerm.trim().toLowerCase();

        const packageName = (item.package_name ?? "").toLowerCase();
        const description = (item.description ?? "").toLowerCase();

        const matchesSearch =
            packageName.includes(keyword) ||
            description.includes(keyword);

        const price = Number(item.price) || 0;

        let matchesPrice = true;

        if (priceFilter === "under500") {
            matchesPrice = price < 500000;
        } else if (priceFilter === "500to1m") {
            matchesPrice = price >= 500000 && price <= 1000000;
        } else if (priceFilter === "over1m") {
            matchesPrice = price > 1000000;
        }

        return matchesSearch && matchesPrice;
    });

    // Pagination
    const totalPages = Math.ceil(filteredPackages.length / itemsPerPage);
    const safeCurrentPage = Math.min(
        currentPage,
        Math.max(totalPages, 1)
    );

    const paginatedPackages = filteredPackages.slice(
        (safeCurrentPage - 1) * itemsPerPage,
        safeCurrentPage * itemsPerPage
    );

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handlePriceFilterChange = (e) => {
        setPriceFilter(e.target.value);
        setCurrentPage(1);
    };

    return (
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
            {/* Status Pendaftaran Banner jika belum Disetujui */}
            {user?.vendor?.status === "pending" && (
                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center font-bold shrink-0">
                            <Clock className="w-5 h-5 text-amber-700" />
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-950 border border-amber-300">
                                Status Akun: Menunggu Verifikasi EO
                            </div>
                            <h3 className="text-sm font-bold text-[#2F3931] mt-1">
                                Profil Bisnis Vendor Anda Sedang Ditinjau
                            </h3>
                            <p className="text-xs text-[#738075] mt-0.5">
                                Tim Event Organizer sedang memverifikasi profil dan kontak usaha Anda. Setelah disetujui, paket Anda akan langsung tampil di sistem matchmaking EO dan klien.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {user?.vendor?.status === "rejected" && (
                <div className="bg-rose-50 border border-rose-300 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 border border-rose-300 flex items-center justify-center font-bold shrink-0">
                            <X className="w-5 h-5 text-rose-700 stroke-[2.5]" />
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                                Status Akun: Belum Disetujui
                            </div>
                            <h3 className="text-sm font-bold text-rose-950 mt-1">
                                Pendaftaran Vendor Belum Disetujui oleh EO
                            </h3>
                            <p className="text-xs text-rose-850 mt-0.5">
                                <strong>Catatan Tim EO:</strong> {user?.vendor?.rejection_reason || "Mohon perbarui informasi profil usaha Anda dan hubungi tim EVENTO."}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Ringkasan & Tombol Aksi */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-[#E8E2D7] shadow-xs">
                <div>
                    <span className="inline-block text-[11px] font-bold text-[#33422A] bg-[#CFD8C4] px-3 py-0.5 rounded-full border border-[#B6C2AA] mb-1.5">
                        MODUL VENDOR
                    </span>

                    <h1 className="text-xl font-extrabold text-[#2F3931] tracking-tight">
                        Daftar Paket Jasa
                    </h1>

                    <p className="text-xs text-[#738075] mt-0.5">
                        Kelola paket jasa yang ditawarkan kepada klien dan EO.
                    </p>
                </div>

                <Link
                    to="/vendor/packages/create"
                    className="inline-flex items-center justify-center gap-2 bg-[#657166] hover:bg-[#556056] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer border border-[#525C53]"
                >
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                    <span>Tambah Paket Baru</span>
                </Link>
            </div>

            {/* Daftar Paket */}
            <div className="bg-white rounded-2xl border border-[#E8E2D7] shadow-xs overflow-hidden">
                <div className="px-6 py-5 border-b border-[#E8E2D7]">
                    <h2 className="text-lg font-bold text-[#2F3931]">
                        Paket Jasa Anda
                    </h2>

                    <p className="text-sm text-[#738075] mt-0.5">
                        Cari, filter, dan kelola paket jasa yang sudah didaftarkan.
                    </p>
                </div>

                {/* Search & Filter */}
                <div className="p-6 border-b border-[#E8E2D7] bg-[#FAF6F0]/40">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2">
                            <input
                                type="text"
                                placeholder="Cari nama atau deskripsi paket..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="w-full px-4 py-2.5 text-xs bg-white border border-[#E8E2D7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#657166]/20 focus:border-[#657166] text-[#2F3931] placeholder-[#738075]/60 transition"
                            />
                        </div>

                        <div>
                            <select
                                value={priceFilter}
                                onChange={handlePriceFilterChange}
                                className="w-full px-4 py-2.5 text-xs bg-white border border-[#E8E2D7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#657166]/20 focus:border-[#657166] text-[#2F3931] transition"
                            >
                                <option value="all">Semua Harga</option>
                                <option value="under500">Di bawah Rp 500.000</option>
                                <option value="500to1m">Rp 500.000 - Rp 1.000.000</option>
                                <option value="over1m">Di atas Rp 1.000.000</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tabel Paket */}
                {packages.length === 0 ? (
                    <div className="py-16 px-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-[#FAF6F0] flex items-center justify-center mx-auto mb-3 text-[#738075]">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-bold text-[#2F3931]">Belum Ada Paket</h3>
                        <p className="text-xs text-[#738075] mt-1 max-w-sm mx-auto">
                            Anda belum menambahkan paket jasa. Buat paket pertama Anda agar dapat ditawarkan kepada klien.
                        </p>
                        <Link
                            to="/vendor/packages/create"
                            className="inline-flex items-center gap-1.5 mt-4 text-xs font-bold text-white bg-[#657166] hover:bg-[#556056] px-4 py-2 rounded-xl transition"
                        >
                            + Tambah Paket Pertama
                        </Link>
                    </div>
                ) : filteredPackages.length === 0 ? (
                    <div className="py-12 px-6 text-center">
                        <p className="text-xs text-[#738075]">
                            Tidak ada paket yang cocok dengan filter atau kata kunci "{searchTerm}".
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setSearchTerm("");
                                setPriceFilter("all");
                            }}
                            className="mt-3 text-xs text-[#657166] hover:underline font-bold"
                        >
                            Reset Filter
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-[#2F3931]">
                                <thead className="bg-[#FAF6F0]/60 border-b border-[#E8E2D7] text-[#738075] uppercase text-[10px] tracking-wider">
                                    <tr>
                                        <th scope="col" className="px-6 py-3.5 font-bold">Nama Paket</th>
                                        <th scope="col" className="px-6 py-3.5 font-bold">Deskripsi</th>
                                        <th scope="col" className="px-6 py-3.5 font-bold">Harga</th>
                                        <th scope="col" className="px-6 py-3.5 font-bold">Foto</th>
                                        <th scope="col" className="px-6 py-3.5 font-bold text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E8E2D7]">
                                    {paginatedPackages.map((item) => (
                                        <tr key={item.id} className="hover:bg-[#FAF6F0]/30 transition-colors">
                                            <td className="px-6 py-4 font-bold text-[#2F3931] whitespace-nowrap">
                                                {item.package_name}
                                            </td>
                                            <td className="px-6 py-4 text-[#738075] max-w-xs truncate">
                                                {item.description || "-"}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-[#2F3931] whitespace-nowrap">
                                                Rp {Number(item.price || 0).toLocaleString("id-ID")}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {item.image_url ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedImage(item.image_url)}
                                                        className="group relative cursor-pointer block"
                                                        title="Klik untuk memperbesar foto"
                                                    >
                                                        <img
                                                            src={item.image_url}
                                                            alt={item.package_name}
                                                            className="w-12 h-12 rounded-xl object-cover border border-[#E8E2D7] group-hover:opacity-85 transition"
                                                        />
                                                    </button>
                                                ) : (
                                                    <span className="text-[11px] text-[#738075] italic">
                                                        Tidak ada foto
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Link
                                                        to={`/vendor/packages/${item.id}/edit`}
                                                        className="px-3 py-1.5 rounded-lg bg-[#FAF6F0] hover:bg-[#F2ECE3] text-[#2F3931] border border-[#E8E2D7] font-semibold text-[11px] transition"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(item.id)}
                                                        className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold text-[11px] transition cursor-pointer"
                                                    >
                                                        Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="p-4 border-t border-[#E8E2D7] bg-[#FAF6F0]/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <span className="text-xs text-[#738075]">
                                Menampilkan {(safeCurrentPage - 1) * itemsPerPage + 1} -{" "}
                                {Math.min(safeCurrentPage * itemsPerPage, filteredPackages.length)} dari{" "}
                                {filteredPackages.length} paket
                            </span>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={safeCurrentPage <= 1}
                                    onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                                    className="px-3 py-2 rounded-lg border border-[#E8E2D7] text-xs font-semibold text-[#2F3931] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FAF6F0]"
                                >
                                    Sebelumnya
                                </button>

                                <span className="text-xs text-[#738075]">
                                    Halaman {safeCurrentPage} dari {Math.max(totalPages, 1)}
                                </span>

                                <button
                                    type="button"
                                    disabled={safeCurrentPage >= totalPages}
                                    onClick={() => setCurrentPage((page) => page + 1)}
                                    className="px-3 py-2 rounded-lg border border-[#E8E2D7] text-xs font-semibold text-[#2F3931] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FAF6F0]"
                                >
                                    Berikutnya
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Pop-up Foto Paket */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div
                        className="relative max-w-4xl max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-xl font-bold text-[#2F3931] hover:text-black border border-[#E8E2D7] shadow cursor-pointer"
                            aria-label="Tutup foto"
                        >
                            &times;
                        </button>

                        <img
                            src={selectedImage}
                            alt="Foto paket jasa"
                            className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-xl"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
