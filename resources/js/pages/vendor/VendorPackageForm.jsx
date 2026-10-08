import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";

export default function VendorPackageForm() {
    const { id } = useParams();

    // Jika ada id berarti mode edit
    const isEdit = Boolean(id);

    // Menyimpan isi form
    const [form, setForm] = useState({
        package_name: "",
        description: "",
        price: "",
        image: null,
        images: [],
    });

    // Menyimpan foto lama saat edit
    const [existingImages, setExistingImages] = useState([]);

    // Menyimpan foto yang sedang dilihat
    const [selectedImage, setSelectedImage] = useState(null);

    // Mengambil data paket berdasarkan id saat mode edit
    useEffect(() => {
        if (!isEdit) {
            return;
        }

        const fetchPackage = async () => {
            try {
                const response = await api.get("/vendor/packages");

                const packages = response.data.data;

                const packageData = packages.find(
                    (item) => item.id === Number(id)
                );

                if (!packageData) {
                    alert("Paket tidak ditemukan.");
                    return;
                }

                // Mengisi data paket ke form
                setForm({
                    package_name: packageData.package_name,
                    description: packageData.description,
                    price: packageData.price,
                    image: null,
                    images: [],
                });

                // Menyiapkan foto lama
                const oldImages = [];

                // Foto utama
                if (packageData.image_url) {
                    oldImages.push({
                        id: "main",
                        image_url: packageData.image_url,
                    });
                }

                // Foto tambahan
                if (
                    packageData.images &&
                    packageData.images.length > 0
                ) {
                    packageData.images.forEach((image) => {
                        oldImages.push({
                            id: image.id,
                            image_url: image.image_url,
                        });
                    });
                }

                setExistingImages(oldImages);
            } catch (error) {
                console.error(
                    "Gagal mengambil data paket:",
                    error
                );

                alert("Gagal mengambil data paket.");
            }
        };

        fetchPackage();
    }, [id, isEdit]);

    // Mengubah isi form
    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    // Menyimpan atau update paket
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Membuat FormData agar bisa mengirim data + foto
            const formData = new FormData();

            formData.append("package_name", form.package_name);
            formData.append("description", form.description);
            formData.append("price", form.price);

            // Foto utama
            if (form.image) {
                formData.append("image", form.image);
            }

            // Foto tambahan
            if (form.images.length > 0) {
                form.images.forEach((image) => {
                    formData.append("images[]", image);
                });
            }

            if (isEdit) {
                // Update paket
                await api.post(
                    `/vendor/packages/${id}?_method=PUT`,
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

            // Setelah berhasil, kembali ke Dashboard
            window.location.href = "/vendor/dashboard";
        } catch (error) {
            console.error(
                "Gagal menyimpan paket:",
                error
            );

            console.error(error.response?.data);

            const errors = error.response?.data?.errors;

            if (errors) {
                const messages = Object.values(errors).flat();
                alert(messages.join("\n"));
            } else if (error.response?.status === 500) {
                alert(
                    "Terjadi kesalahan pada server. Silakan coba lagi."
                );
            } else if (error.response?.data?.message) {
                alert(error.response.data.message);
            } else if (error.request) {
                alert(
                    "Koneksi bermasalah atau server tidak merespons. Silakan coba lagi."
                );
            } else {
                alert(
                    "Gagal menyimpan paket. Silakan coba lagi."
                );
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">

                    {/* Header Form */}
                    <div className="mb-5">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {isEdit
                                ? "Edit Paket Jasa"
                                : "Tambah Paket Jasa"}
                        </h1>

                        <p className="text-sm text-gray-500 mt-1">
                            Isi informasi paket jasa yang ingin
                            ditawarkan.
                        </p>
                    </div>

                    {/* Form */}
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-4"
                    >

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

                                {/* Nama file */}
                                <div className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-500 min-h-[42px] flex items-center">
                                    {form.image ||
                                    form.images.length > 0
                                        ? [
                                              form.image,
                                              ...form.images,
                                          ]
                                              .filter(Boolean)
                                              .map(
                                                  (file) =>
                                                      file.name
                                              )
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
                                            const files =
                                                Array.from(
                                                    e.target.files
                                                );

                                            setForm({
                                                ...form,

                                                // Foto pertama menjadi foto utama
                                                image:
                                                    files[0] ||
                                                    null,

                                                // Foto berikutnya menjadi foto tambahan
                                                images:
                                                    files.slice(
                                                        1
                                                    ),
                                            });
                                        }}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            <p className="text-xs text-gray-400 mt-1">
                                Maksimal 2 MB. Format gambar.
                            </p>

                            {/* Foto lama saat edit */}
                            {isEdit &&
                                existingImages.length >
                                    0 && (
                                    <div className="mt-4">
                                        <p className="text-sm font-medium text-gray-700 mb-2">
                                            Foto Saat Ini
                                        </p>

                                        <div className="flex flex-wrap gap-3">
                                            {existingImages.map(
                                                (image) => (
                                                    <div
                                                        key={
                                                            image.id
                                                        }
                                                        className="relative"
                                                    >
                                                        <img
                                                            src={
                                                                image.image_url
                                                            }
                                                            alt="Foto paket"
                                                            onClick={() =>
                                                                setSelectedImage(
                                                                    image.image_url
                                                                )
                                                            }
                                                            className="w-24 h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition"
                                                        />
                                                    </div>
                                                )
                                            )}
                                        </div>

                                        <p className="text-xs text-gray-400 mt-2">
                                            Foto di atas adalah
                                            foto yang saat ini
                                            tersimpan.
                                        </p>
                                    </div>
                                )}
                        </div>

                        {/* Tombol Simpan */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition"
                            >
                                {isEdit
                                    ? "Update Paket"
                                    : "Tambah Paket"}
                            </button>
                        </div>
                    </form>

                    {/* Popup Foto */}
                    {selectedImage && (
                        <div
                            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                            onClick={() =>
                                setSelectedImage(null)
                            }
                        >
                            <div
                                className="relative bg-white rounded-xl p-4 max-w-2xl max-h-[90vh]"
                                onClick={(e) =>
                                    e.stopPropagation()
                                }
                            >
                                {/* Tombol Close */}
                                <button
                                    onClick={() =>
                                        setSelectedImage(null)
                                    }
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
                </div>
            </div>
        </div>
    );
}