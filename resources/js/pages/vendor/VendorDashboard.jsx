import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

export default function VendorDashboard() {
    const { user, logout } = useAuth();

    // Menyimpan daftar paket dari database
    const [packages, setPackages] = useState([]);

    // Menyimpan isi form
    const [form, setForm] = useState({
        package_name: "",
        description: "",
        price: "",
        image: null,
        images: [],
    });

    // Menyimpan ID paket yang sedang diedit
    const [editingId, setEditingId] = useState(null);

    // Menyimpan foto yang sedang dilihat
    const [selectedImage, setSelectedImage] = useState(null);

    // Menyimpan foto lama saat edit
    const [existingImages, setExistingImages] = useState([]);

    // Mengambil data paket saat halaman dibuka
    const fetchPackages = async () => {
        try {
            const response = await api.get("/vendor/packages");
            setPackages(response.data.data);
        } catch (error) {
            console.error("Gagal mengambil data paket:", error);
        }
    };

    useEffect(() => {
        fetchPackages();
    }, []);

    // Mengubah isi form
    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    // Simpan atau update paket
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Membuat FormData agar bisa mengirim data + foto
            const formData = new FormData();

            formData.append("package_name", form.package_name);
            formData.append("description", form.description);
            formData.append("price", form.price);

            // Jika ada foto utama
            if (form.image) {
                formData.append("image", form.image);
            }

            // Jika ada beberapa foto tambahan
            if (form.images.length > 0) {
                form.images.forEach((image) => {
                    formData.append("images[]", image);
                });
            }

            if (editingId) {
                // Update paket
                await api.post(
                    `/vendor/packages/${editingId}?_method=PUT`,
                    formData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );

                alert("Paket berhasil diperbarui");
            } else {
                // Tambah paket baru
                await api.post("/vendor/packages", formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });

                alert("Paket berhasil ditambahkan");
            }

            // Kosongkan form
            setForm({
                package_name: "",
                description: "",
                price: "",
                image: null,
                images: [],
            });

            setEditingId(null);
            setExistingImages([]);

            // Ambil data terbaru
            fetchPackages();
        } catch (error) {
            console.error("Gagal menyimpan paket:", error);
            console.error(error.response?.data);

            const errors = error.response?.data?.errors;

            if (errors) {
                const messages = Object.values(errors).flat();
                alert(messages.join("\n"));
            } else if (error.response?.status === 500) {
                alert("Terjadi kesalahan pada server. Silakan coba lagi.");
            } else if (error.response?.data?.message) {
                alert(error.response.data.message);
            } else if (error.request) {
                alert(
                    "Koneksi bermasalah atau server tidak merespons. Silakan coba lagi."
                );
            } else {
                alert("Gagal menyimpan paket. Silakan coba lagi.");
            }
        }
    };

    // Mengisi form dengan data paket yang mau diedit
    const handleEdit = (item) => {
        setForm({
            package_name: item.package_name,
            description: item.description,
            price: item.price,
            image: null,
            images: [],
        });

        // Menyimpan foto lama agar bisa ditampilkan di form edit
        const oldImages = [];

        // Foto utama
        if (item.image_url) {
            oldImages.push({
                id: "main",
                image_url: item.image_url,
            });
        }

        // Foto tambahan
        if (item.images && item.images.length > 0) {
            item.images.forEach((image) => {
                oldImages.push({
                    id: image.id,
                    image_url: image.image_url,
                });
            });
        }

        setExistingImages(oldImages);
        setEditingId(item.id);
    };

    // Menghapus paket
    const handleDelete = async (id) => {
        if (!confirm("Yakin ingin menghapus paket ini?")) {
            return;
        }

        try {
            await api.delete(`/vendor/packages/${id}`);

            alert("Paket berhasil dihapus");

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

                {/* Form Tambah / Edit Paket */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-5">
                    <div className="mb-5">
                        <h2 className="text-lg font-bold text-gray-900">
                            {editingId
                                ? "Edit Paket Jasa"
                                : "Tambah Paket Jasa"}
                        </h2>

                        <p className="text-sm text-gray-500 mt-1">
                            Isi informasi paket jasa yang ingin ditawarkan.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Nama Paket */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Nama Paket
                            </label>

                            <input
                                type="text"
                                name="package_name"
                                value={form.package_name}
                                onChange={handleChange}
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="Contoh: Paket Dekorasi Pernikahan"
                            />
                        </div>

                        {/* Deskripsi */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Deskripsi
                            </label>

                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                required
                                rows="3"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                                placeholder="Deskripsi paket jasa"
                            />
                        </div>

                        {/* Harga */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Harga
                            </label>

                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                                    Rp
                                </span>

                                <input
                                    type="number"
                                    name="price"
                                    value={form.price}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="5000000"
                                />
                            </div>
                        </div>

                        {/* Foto Paket */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Foto Paket
                            </label>

                            <div className="flex items-center gap-2">

                                {/* Nama file yang dipilih */}
                                <div className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-500 min-h-[42px] flex items-center">
                                    {form.image || form.images.length > 0
                                        ? [form.image, ...form.images]
                                            .filter(Boolean)
                                            .map((file) => file.name)
                                            .join(", ")
                                        : "Belum ada foto dipilih"}
                                </div>

                                {/* Tombol pilih foto */}
                                <label className="border border-gray-300 bg-gray-100 hover:bg-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 cursor-pointer min-h-[42px] flex items-center">
                                    Pilih Foto

                                    <input
                                        type="file"
                                        name="image"
                                        accept="image/*"
                                        multiple
                                        onChange={(e) => {
                                            const files = Array.from(
                                                e.target.files
                                            );

                                            setForm({
                                                ...form,

                                                // Foto pertama menjadi foto utama
                                                image: files[0] || null,

                                                // Foto berikutnya menjadi foto tambahan
                                                images: files.slice(1),
                                            });
                                        }}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            <p className="text-xs text-gray-400 mt-1">
                                Maksimal 2 MB. Format gambar.
                            </p>

                            {/* Foto yang sudah tersimpan */}
                            {editingId && existingImages.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">
                                        Foto Saat Ini
                                    </p>

                                    <div className="flex flex-wrap gap-3">
                                        {existingImages.map((image) => (
                                            <div
                                                key={image.id}
                                                className="relative"
                                            >
                                                <img
                                                    src={image.image_url}
                                                    alt="Foto paket"
                                                    onClick={() =>
                                                        setSelectedImage(
                                                            image.image_url
                                                        )
                                                    }
                                                    className="w-24 h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition"
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <p className="text-xs text-gray-400 mt-2">
                                        Foto di atas adalah foto yang saat ini
                                        tersimpan.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Tombol */}
                        <div className="flex gap-2 pt-2">
                            <button
                                type="submit"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition"
                            >
                                {editingId
                                    ? "Update Paket"
                                    : "Tambah Paket"}
                            </button>

                            {editingId && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingId(null);
                                        setExistingImages([]);

                                        setForm({
                                            package_name: "",
                                            description: "",
                                            price: "",
                                            image: null,
                                            images: [],
                                        });
                                    }}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-5 py-2.5 rounded-lg transition"
                                >
                                    Batal
                                </button>
                            )}
                        </div>
                    </form>
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
                                            <td className="py-4 px-5 font-medium text-gray-900">
                                                {item.package_name}
                                            </td>

                                            <td className="py-4 px-5 text-gray-600">
                                                {item.description}
                                            </td>

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
                                                                onClick={() =>
                                                                    setSelectedImage(
                                                                        item.image_url
                                                                    )
                                                                }
                                                                className="w-20 h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition"
                                                            />
                                                        )}

                                                        {/* Foto tambahan */}
                                                        {item.images?.map(
                                                            (image) => (
                                                                <img
                                                                    key={image.id}
                                                                    src={
                                                                        image.image_url
                                                                    }
                                                                    alt={
                                                                        item.package_name
                                                                    }
                                                                    onClick={() =>
                                                                        setSelectedImage(
                                                                            image.image_url
                                                                        )
                                                                    }
                                                                    className="w-20 h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition"
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
                                                    <button
                                                        onClick={() =>
                                                            handleEdit(item)
                                                        }
                                                        className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 text-xs font-medium px-3 py-1.5 rounded-md transition"
                                                    >
                                                        Edit
                                                    </button>

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

                {/* Popup Foto */}
                {selectedImage && (
                    <div
                        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                        onClick={() => setSelectedImage(null)}
                    >
                        <div
                            className="relative bg-white rounded-xl p-4 max-w-2xl max-h-[90vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Tombol Close */}
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="absolute -top-3 -right-3 bg-white text-gray-600 hover:text-gray-900 w-8 h-8 rounded-full shadow flex items-center justify-center text-lg font-bold"
                            >
                                ×
                            </button>

                            {/* Foto */}
                            <img
                                src={selectedImage}
                                alt="Foto Paket"
                                className="max-w-full max-h-[80vh] object-contain rounded-lg"
                            />
                        </div>
                    </div>
                )}

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