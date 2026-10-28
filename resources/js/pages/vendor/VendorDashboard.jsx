import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

export default function VendorDashboard() {
    const { user } = useAuth();
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
        if (!confirm("Yakin ingin menghapus paket ini?")) {
            return;
        }

        try {
            await api.delete(`/vendor/packages/${id}`);
            alert("Paket berhasil dihapus");
            await fetchPackages();
        } catch (error) {
            console.error("Gagal menghapus paket:", error);
            alert("Gagal menghapus paket");
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
                <div className="bg-[#FDE8D3]/70 border border-[#E8CEB2] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#FDE8D3] border border-[#E8CEB2] text-[#63482B] flex items-center justify-center font-bold text-xl shrink-0">
                            ⏳
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FDE8D3] text-[#63482B] border border-[#E8CEB2]">
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
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold text-xl shrink-0">
                            ✕
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                                Status Akun: Belum Disetujui
                            </div>
                            <h3 className="text-sm font-bold text-red-900 mt-1">
                                Pendaftaran Vendor Belum Disetujui oleh EO
                            </h3>
                            <p className="text-xs text-red-700 mt-0.5">
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

                {/* Pencarian dan Filter */}
                <div className="p-6 flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder="Cari nama atau deskripsi paket..."
                        className="flex-1 border border-[#E8E2D7] bg-[#FAF6F0]/40 rounded-xl px-4 py-2.5 text-sm text-[#2F3931] focus:outline-none focus:ring-2 focus:ring-[#99CDD8]"
                    />

                    <select
                        value={priceFilter}
                        onChange={handlePriceFilterChange}
                        className="border border-[#E8E2D7] bg-white rounded-xl px-4 py-2.5 text-sm text-[#2F3931] focus:outline-none focus:ring-2 focus:ring-[#99CDD8]"
                    >
                        <option value="all">Semua Harga</option>
                        <option value="under500">Di bawah Rp500.000</option>
                        <option value="500to1m">Rp500.000–Rp1.000.000</option>
                        <option value="over1m">Di atas Rp1.000.000</option>
                    </select>
                </div>

                {filteredPackages.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-sm text-[#738075]">
                            {packages.length === 0
                                ? "Belum ada paket yang didaftarkan."
                                : "Tidak ada paket yang sesuai dengan pencarian atau filter."}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-[#FAF6F0] border-y border-[#E8E2D7] text-left">
                                        <th className="py-3.5 px-5 font-bold text-[#657166]">
                                            Nama Paket
                                        </th>
                                        <th className="py-3.5 px-5 font-bold text-[#657166]">
                                            Deskripsi
                                        </th>
                                        <th className="py-3.5 px-5 font-bold text-[#657166]">
                                            Harga
                                        </th>
                                        <th className="py-3.5 px-5 font-bold text-[#657166]">
                                            Foto
                                        </th>
                                        <th className="py-3.5 px-5 font-bold text-[#657166]">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {paginatedPackages.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="border-b border-[#F0ECE1] hover:bg-[#FAF6F0]/60 transition"
                                        >
                                            <td className="py-4 px-5 font-bold text-[#2F3931]">
                                                {item.package_name}
                                            </td>

                                            <td className="py-4 px-5 text-xs text-[#738075] max-w-xs">
                                                {item.description}
                                            </td>

                                            <td className="py-4 px-5 text-[#2F3931] font-bold whitespace-nowrap">
                                                Rp{" "}
                                                {Number(item.price).toLocaleString("id-ID")}
                                            </td>

                                            <td className="py-4 px-5">
                                                {item.image_url || item.images?.length > 0 ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {item.image_url && (
                                                            <img
                                                                src={item.image_url}
                                                                alt={item.package_name}
                                                                onClick={() => setSelectedImage(item.image_url)}
                                                                className="w-16 h-16 object-cover rounded-xl border border-[#E8E2D7] shadow-2xs cursor-pointer hover:opacity-80 transition"
                                                            />
                                                        )}

                                                        {item.images?.map((image) => (
                                                            <img
                                                                key={image.id}
                                                                src={image.image_url}
                                                                alt={item.package_name}
                                                                onClick={() => setSelectedImage(image.image_url)}
                                                                className="w-16 h-16 object-cover rounded-xl border border-[#E8E2D7] shadow-2xs cursor-pointer hover:opacity-80 transition"
                                                            />
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-[#98A29A] text-xs italic">
                                                        Tidak ada foto
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-4 px-5">
                                                <div className="flex gap-2">
                                                    <Link
                                                        to={`/vendor/packages/${item.id}/edit`}
                                                        className="bg-[#FDE8D3] hover:bg-[#FCD8B8] text-[#5C3F22] text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#E8CEB2] transition shadow-2xs cursor-pointer"
                                                    >
                                                        Edit
                                                    </Link>

                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="bg-[#F3C3B2]/50 hover:bg-[#F3C3B2]/80 text-[#6B3222] text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#E8CEB2] transition shadow-2xs cursor-pointer"
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
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4">
                            <p className="text-xs text-[#738075]">
                                Menampilkan{" "}
                                {(safeCurrentPage - 1) * itemsPerPage + 1}
                                {"–"}
                                {Math.min(
                                    safeCurrentPage * itemsPerPage,
                                    filteredPackages.length
                                )}{" "}
                                dari {filteredPackages.length} paket
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={safeCurrentPage === 1}
                                    onClick={() => setCurrentPage((page) => page - 1)}
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
                            className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-xl font-bold text-gray-700 shadow cursor-pointer"
                            aria-label="Tutup foto"
                        >
                            ×
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