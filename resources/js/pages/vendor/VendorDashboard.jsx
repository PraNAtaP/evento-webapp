import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

export default function VendorDashboard() {
    const { user, logout } = useAuth();

    // Menyimpan daftar paket dari database
    const [packages, setPackages] = useState([]);

    // Mengambil data paket
    const fetchPackages = async () => {
        try {
            const response = await api.get("/vendor/packages");
            setPackages(response.data.data);
        } catch (error) {
            console.error("Gagal mengambil data paket:", error);
        }
    };

    // Mengambil data saat halaman dibuka
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

            // Ambil data terbaru setelah dihapus
            fetchPackages();
        } catch (error) {
            console.error("Gagal menghapus paket:", error);
            alert("Gagal menghapus paket");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">

                {/* Header Dashboard */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-5">
                    <span className="inline-block text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full mb-2">
                        MODUL VENDOR
                    </span>

                    <h1 className="text-2xl font-bold text-gray-900">
                        Dashboard Vendor
                    </h1>

                    <p className="text-sm text-gray-500 mt-1">
                        Halo,{" "}
                        <span className="font-semibold text-gray-700">
                            {user?.name}
                        </span>
                    </p>
                </div>

                {/* Tombol Tambah Paket */}
                <div className="flex justify-end mb-5">
                    <button
                        onClick={() => {
                            window.location.href =
                                "/vendor/packages/create";
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
                    >
                        + Tambah Paket
                    </button>
                </div>

                {/* Daftar Paket */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

                    {/* Header Daftar */}
                    <div className="px-6 py-5 border-b border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900">
                            Daftar Paket Jasa
                        </h2>

                        <p className="text-sm text-gray-500 mt-1">
                            Paket jasa yang sudah ditambahkan.
                        </p>
                    </div>

                    {packages.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-sm text-gray-400">
                                Belum ada paket yang didaftarkan.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">

                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200 text-left">
                                        <th className="py-3 px-5 font-semibold text-gray-600">
                                            Nama Paket
                                        </th>

                                        <th className="py-3 px-5 font-semibold text-gray-600">
                                            Deskripsi
                                        </th>

                                        <th className="py-3 px-5 font-semibold text-gray-600">
                                            Harga
                                        </th>

                                        <th className="py-3 px-5 font-semibold text-gray-600">
                                            Foto
                                        </th>

                                        <th className="py-3 px-5 font-semibold text-gray-600">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {packages.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="border-b border-gray-100 hover:bg-gray-50"
                                        >
                                            {/* Nama Paket */}
                                            <td className="py-4 px-5 font-medium text-gray-900">
                                                {item.package_name}
                                            </td>

                                            {/* Deskripsi */}
                                            <td className="py-4 px-5 text-gray-600">
                                                {item.description}
                                            </td>

                                            {/* Harga */}
                                            <td className="py-4 px-5 text-gray-700 whitespace-nowrap">
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
                                                                className="w-20 h-20 object-cover rounded-lg border border-gray-200"
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
                                                                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                                                />
                                                            )
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">
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
                                                        className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 text-xs font-medium px-3 py-1.5 rounded-md transition"
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
                                                        className="bg-red-100 hover:bg-red-200 text-red-600 text-xs font-medium px-3 py-1.5 rounded-md transition"
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

                {/* Logout */}
                <button
                    onClick={logout}
                    className="mt-6 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg"
                >
                    Logout
                </button>

            </div>
        </div>
    );
}