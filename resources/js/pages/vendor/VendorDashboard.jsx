import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

export default function VendorDashboard() {
    const { user, logout } = useAuth();

    // Menyimpan daftar paket dari database
    const [packages, setPackages] = useState([]);
    // Menyimpan daftar tawaran pekerjaan dari EO
    const [jobOffers, setJobOffers] = useState([]);
    // Menyimpan tawaran yang sedang dipilih untuk ditolak
    const [selectedOffer, setSelectedOffer] = useState(null);
    // Menyimpan alasan penolakan
    const [rejectionReason, setRejectionReason] = useState("");
    // Mengambil data paket
    const fetchPackages = async () => {
        try {
            const response = await api.get("/vendor/packages");
            setPackages(response.data.data);
        } catch (error) {
            console.error("Gagal mengambil data paket:", error);
        }
    };

    // Mengambil daftar tawaran pekerjaan dari EO
    const fetchJobOffers = async () => {
        try {
            const response = await api.get("/vendor/job-offers");
            setJobOffers(response.data.data);
        } catch (error) {
            console.error("Gagal mengambil tawaran pekerjaan:", error);
        }
    };

    // Menerima atau menolak tawaran pekerjaan
    const handleJobResponse = async (assignmentId, status, reason = null) => {
        try {
            await api.patch(`/vendor/job-offers/${assignmentId}/response`, {
                status,
                ...(status === "rejected"
                    ? { rejection_reason: reason }
                    : {}),
            });

            alert(
                status === "accepted"
                    ? "Tawaran pekerjaan berhasil diterima."
                    : "Tawaran pekerjaan berhasil ditolak."
            );

            setSelectedOffer(null);
            setRejectionReason("");

            // Perbarui daftar tawaran setelah direspons
            await fetchJobOffers();
        } catch (error) {
            console.error("Gagal merespons tawaran:", error);

            alert(
                error.response?.data?.message ||
                "Gagal menyimpan respons tawaran."
            );
        }
    };

    // Mengambil data saat halaman dibuka
    useEffect(() => {
        fetchPackages();
        fetchJobOffers();
    }, []);

    // Menghapus paket
    const handleDelete = async (id) => {
        if (!confirm("Yakin ingin menghapus paket ini?")) {
            return;
        }

        try {
            await api.delete(`/vendor/packages/${id}`);

            alert("Paket berhasil dihapus");

            // Ambil data terbaru setelah dihapus
            fetchPackages();
        } catch (error) {
            console.error("Gagal menghapus paket:", error);
            alert("Gagal menghapus paket");
        }
    };

    return (
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
            {/* Header Ringkasan & Tombol Aksi */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-[#E8E2D7] shadow-xs">
                <div>
                    <span className="inline-block text-[11px] font-bold text-[#33422A] bg-[#CFD8C4] px-3 py-0.5 rounded-full border border-[#B6C2AA] mb-1.5">
                        MODUL VENDOR
                    </span>
                    <h1 className="text-xl font-extrabold text-[#2F3931] tracking-tight">
                        Katalog Penawaran Vendor
                    </h1>
                    <p className="text-xs text-[#738075] mt-0.5">
                        Kelola katalog penawaran paket jasa yang dapat dipilih oleh klien dan EO.
                    </p>
                </div>

                <Link
                    to="/vendor/packages/create"
                    className="inline-flex items-center justify-center gap-2 bg-[#657166] hover:bg-[#556056] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer border border-[#525C53]"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Tambah Paket Baru</span>
                </Link>
            </div>

                {/* Daftar Tawaran Pekerjaan */}
                <div className="bg-white rounded-2xl border border-[#E8E2D7] shadow-xs overflow-hidden">
                    <div className="px-6 py-5 border-b border-[#E8E2D7]">
                        <h2 className="text-lg font-bold text-[#2F3931]">
                            Tawaran Pekerjaan dari EO
                        </h2>
                        <p className="text-sm text-[#738075] mt-0.5">
                            Daftar acara dan paket jasa yang ditawarkan kepada Anda.
                        </p>
                    </div>

                    {jobOffers.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-sm text-[#738075]">
                                Belum ada tawaran pekerjaan.
                            </p>
                        </div>
                    ) : (
                        <div className="p-6">
                            {jobOffers.map((offer) => (
                                <div
                                    key={offer.id}
                                    className="border-b border-[#F0ECE1] py-4"
                                >
                                    <h3 className="font-bold text-[#2F3931]">
                                        {offer.event?.event_name || "Nama acara belum tersedia"}
                                    </h3>
                                    <p className="text-sm text-[#738075] mt-1">
                                        Paket: {offer.package?.package_name || "Paket tidak tersedia"}
                                    </p>
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => handleJobResponse(offer.id, "accepted")}
                                            className="bg-[#657166] hover:bg-[#556056] text-white text-xs font-semibold px-3 py-2 rounded-lg"
                                        >
                                            Terima Job
                                        </button>

                                        <button
                                            onClick={() => {
                                                setSelectedOffer(offer.id);
                                                setRejectionReason("");
                                            }}
                                            className="bg-[#F3C3B2]/50 hover:bg-[#F3C3B2]/80 text-[#6B3222] text-xs font-semibold px-3 py-2 rounded-lg"
                                        >
                                            Tolak Job
                                        </button>
                                    </div>
                                    {selectedOffer === offer.id && (
                                    <div className="mt-3 space-y-2">
                                        <textarea
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Tuliskan alasan penolakan..."
                                            className="w-full border border-[#E8E2D7] rounded-lg p-3 text-sm"
                                            rows={3}
                                        />

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    if (!rejectionReason.trim()) {
                                                        alert("Alasan penolakan wajib diisi.");
                                                        return;
                                                    }

                                                    handleJobResponse(
                                                        offer.id,
                                                        "rejected",
                                                        rejectionReason.trim()
                                                    );
                                                }}
                                                className="bg-[#657166] hover:bg-[#556056] text-white text-xs font-semibold px-3 py-2 rounded-lg"
                                            >
                                                Kirim Penolakan
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setSelectedOffer(null);
                                                    setRejectionReason("");
                                                }}
                                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-2 rounded-lg"
                                            >
                                                Batal
                                            </button>
                                        </div>
                                    </div>
                                )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {/* Daftar Paket */}
                <div className="bg-white rounded-2xl border border-[#E8E2D7] shadow-xs overflow-hidden">
                    {/* Header Daftar */}
                    <div className="px-6 py-5 border-b border-[#E8E2D7]">
                        <h2 className="text-lg font-bold text-[#2F3931]">
                            Daftar Paket Jasa
                        </h2>

                        <p className="text-sm text-[#738075] mt-0.5">
                            Paket jasa yang sudah ditambahkan ke sistem Evento.
                        </p>
                    </div>

                    {packages.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-sm text-[#738075]">
                                Belum ada paket yang didaftarkan.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">

                                <thead>
                                    <tr className="bg-[#FAF6F0] border-b border-[#E8E2D7] text-left">
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
                                    {packages.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="border-b border-[#F0ECE1] hover:bg-[#FAF6F0]/60 transition"
                                        >
                                            {/* Nama Paket */}
                                            <td className="py-4 px-5 font-bold text-[#2F3931]">
                                                {item.package_name}
                                            </td>

                                            {/* Deskripsi */}
                                            <td className="py-4 px-5 text-xs text-[#738075] max-w-xs">
                                                {item.description}
                                            </td>

                                            {/* Harga */}
                                            <td className="py-4 px-5 text-[#2F3931] font-bold whitespace-nowrap">
                                                Rp{" "}
                                                {Number(
                                                    item.price
                                                ).toLocaleString("id-ID")}
                                            </td>

                                            {/* Foto Paket */}
                                            <td className="py-4 px-5">
                                                {item.image_url ||
                                                item.images?.length > 0 ? (
                                                    <div className="flex flex-wrap gap-2">

                                                        {/* Foto utama */}
                                                        {item.image_url && (
                                                            <img
                                                                src={
                                                                    item.image_url
                                                                }
                                                                alt={
                                                                    item.package_name
                                                                }
                                                                className="w-16 h-16 object-cover rounded-xl border border-[#E8E2D7] shadow-2xs"
                                                            />
                                                        )}

                                                        {/* Foto tambahan */}
                                                        {item.images?.map(
                                                            (image) => (
                                                                <img
                                                                    key={
                                                                        image.id
                                                                    }
                                                                    src={
                                                                        image.image_url
                                                                    }
                                                                    alt={
                                                                        item.package_name
                                                                    }
                                                                    className="w-16 h-16 object-cover rounded-xl border border-[#E8E2D7] shadow-2xs"
                                                                />
                                                            )
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-[#98A29A] text-xs italic">
                                                        Tidak ada foto
                                                    </span>
                                                )}
                                            </td>

                                            {/* Aksi */}
                                            <td className="py-4 px-5">
                                                <div className="flex gap-2">

                                                    {/* Tombol Edit */}
                                                    <button
                                                        onClick={() => {
                                                            window.location.href =
                                                                `/vendor/packages/${item.id}/edit`;
                                                        }}
                                                        className="bg-[#FDE8D3] hover:bg-[#FCD8B8] text-[#5C3F22] text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#E8CEB2] transition shadow-2xs cursor-pointer"
                                                    >
                                                        Edit
                                                    </button>

                                                    {/* Tombol Hapus */}
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                item.id
                                                            )
                                                        }
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
                    )}
                </div>
        </div>
    );
}