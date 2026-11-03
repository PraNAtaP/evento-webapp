
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

    // Menandai apakah foto utama lama dihapus
    const [removedMainImage, setRemovedMainImage] = useState(false);

    // Menyimpan foto yang sedang dilihat
    const [selectedImage, setSelectedImage] = useState(null);

    // Status saat paket sedang disimpan
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Memformat harga dengan pemisah ribuan berupa koma
    const formatPrice = (value) => {
        const number = value.toString().replace(/\D/g, "");
        return number.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

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
                    price: formatPrice(packageData.price || ""),
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
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: name === "price" ? formatPrice(value) : value,
        }));
    };

    // Memilih beberapa foto sekaligus
    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);

        if (isEdit) {
            // Saat edit, foto baru ditambahkan sebagai foto tambahan
            setForm((prev) => ({
                ...prev,
                images: [...prev.images, ...files],
            }));
        } else {
            // Saat tambah, foto pertama menjadi foto utama
            setForm((prev) => ({
                ...prev,
                image: files[0] || null,
                images: [
                    ...prev.images,
                    ...files.slice(1),
                ],
            }));
        }

        // Mengosongkan input agar file yang sama bisa dipilih kembali
        e.target.value = "";
    };

    // Menghapus foto lama satu per satu
    const handleRemoveExistingImage = (image) => {
        setExistingImages((prev) =>
            prev.filter((item) => item.id !== image.id)
        );

        // Jika foto utama dihapus, tandai untuk dikirim ke backend
        if (image.id === "main") {
            setRemovedMainImage(true);
        }
    };

    // Menghapus foto baru yang belum disimpan
    const handleRemoveNewImage = (index) => {
        if (!isEdit && index === 0) {
            // Hapus foto utama saat tambah paket
            setForm((prev) => ({
                ...prev,
                image: null,
            }));
            return;
        }

        const imageIndex = isEdit ? index : index - 1;

        setForm((prev) => ({
            ...prev,
            images: prev.images.filter(
                (_, i) => i !== imageIndex
            ),
        }));
    };

    // Menyimpan atau update paket
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Mencegah submit berulang
        if (isSubmitting) return;

        setIsSubmitting(true);

        try {
            // Membuat FormData agar bisa mengirim data + foto
            const formData = new FormData();

            formData.append("package_name", form.package_name);
            formData.append("description", form.description);

            // Mengirim harga tanpa pemisah ribuan
            formData.append("price", form.price.replace(/,/g, ""));

            // Foto utama saat tambah paket
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
                // Mengirim ID foto tambahan lama yang dipertahankan
                existingImages
                    .filter((image) => image.id !== "main")
                    .forEach((image) => {
                        formData.append("keep_images[]", image.id);
                    });

                // Memberi tahu backend jika foto utama dihapus
                if (removedMainImage) {
                    formData.append("remove_main_image", "1");
                }

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
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FAF6F0] py-8 px-4 text-[#2F3931]">
            <div className="max-w-4xl mx-auto">

                <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#E8E2D7] shadow-xs">

                    {/* Tombol Kembali */}
                    <div className="mb-6">
                        <button
                            type="button"
                            onClick={() => {
                                window.location.href = "/vendor/dashboard";
                            }}
                            className="inline-flex items-center gap-2 bg-[#FAF6F0] hover:bg-[#F2ECE3] text-[#2F3931] font-semibold px-4 py-2 rounded-xl text-xs border border-[#E8E2D7] transition shadow-2xs cursor-pointer"
                        >
                            {/* Icon Back */}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                className="w-4 h-4 text-[#657166]"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>

                            <span>Kembali ke Dashboard</span>
                        </button>
                    </div>

                    {/* Header Form */}
                    <div className="mb-6">
                        <span className="inline-block text-[11px] font-bold text-[#33422A] bg-[#CFD8C4] px-3 py-0.5 rounded-full border border-[#B6C2AA] mb-1.5">
                            Kelola Paket Jasa
                        </span>

                        <h1 className="text-xl font-extrabold text-[#2F3931] tracking-tight">
                            {isEdit
                                ? "Edit Paket Jasa"
                                : "Tambah Paket Jasa"}
                        </h1>

                        <p className="text-xs text-[#738075] mt-1">
                            Isi informasi paket jasa yang ingin
                            ditawarkan kepada klien dan EO.
                        </p>
                    </div>

                    {/* Form */}
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >

                        {/* Nama Paket */}
                        <div>
                            <label className="block text-xs font-bold text-[#2F3931] mb-1.5">
                                Nama Paket
                            </label>

                            <input
                                type="text"
                                name="package_name"
                                value={form.package_name}
                                onChange={handleChange}
                                required
                                className="w-full border border-[#E8E2D7] bg-[#FAF6F0]/40 rounded-xl px-3.5 py-2.5 text-sm text-[#2F3931] focus:outline-none focus:ring-2 focus:ring-[#99CDD8] focus:border-[#99CDD8] transition"
                                placeholder="Contoh: Paket Dekorasi Pernikahan"
                            />
                        </div>

                        {/* Deskripsi */}
                        <div>
                            <label className="block text-xs font-bold text-[#2F3931] mb-1.5">
                                Deskripsi
                            </label>

                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                required
                                rows="3"
                                className="w-full border border-[#E8E2D7] bg-[#FAF6F0]/40 rounded-xl px-3.5 py-2.5 text-sm text-[#2F3931] focus:outline-none focus:ring-2 focus:ring-[#99CDD8] focus:border-[#99CDD8] resize-none transition"
                                placeholder="Deskripsi paket jasa"
                            />
                        </div>

                        {/* Harga */}
                        <div>
                            <label className="block text-xs font-bold text-[#2F3931] mb-1.5">
                                Harga
                            </label>

                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#738075]">
                                    Rp
                                </span>

                                <input
                                    type="text"
                                    name="price"
                                    value={form.price}
                                    onChange={handleChange}
                                    required
                                    inputMode="numeric"
                                    className="w-full border border-[#E8E2D7] bg-[#FAF6F0]/40 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#2F3931] focus:outline-none focus:ring-2 focus:ring-[#99CDD8] focus:border-[#99CDD8] transition font-medium"
                                    placeholder="5,000,000"
                                />
                            </div>
                        </div>

                        {/* Foto Paket */}
                        <div>
                            <label className="block text-xs font-bold text-[#2F3931] mb-1.5">
                                Foto Paket
                            </label>

                            <div className="flex items-center gap-2">

                                {/* Nama file */}
                                <div className="flex-1 border border-[#E8E2D7] bg-[#FAF6F0]/40 rounded-xl px-3.5 py-2.5 text-xs text-[#738075] min-h-[42px] flex items-center">
                                    {form.image ||
                                    form.images.length > 0
                                        ? [
                                              form.image,
                                              ...form.images,
                                          ]
                                              .filter(Boolean)
                                              .map(
                                                  (file) => file.name
                                              )
                                              .join(", ")
                                        : "Belum ada foto dipilih"}
                                </div>

                                {/* Tombol pilih foto */}
                                <label className="border border-[#E8E2D7] bg-[#DAEBE3] hover:bg-[#cbe0d7] text-[#2F3931] rounded-xl px-4 py-2.5 text-xs font-bold cursor-pointer min-h-[42px] flex items-center transition shadow-2xs">
                                    Pilih Foto

                                    <input
                                        type="file"
                                        name="image"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            <p className="text-[11px] text-[#738075] mt-1">
                                Bisa memilih beberapa foto sekaligus.
                                Maksimal 2 MB per foto. Format gambar (JPG, PNG).
                            </p>

                            {/* Foto lama saat edit */}
                            {isEdit &&
                                existingImages.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-xs font-bold text-[#2F3931] mb-2">
                                            Foto Saat Ini
                                        </p>

                                        <div className="flex flex-wrap gap-3">
                                            {existingImages.map(
                                                (image) => (
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
                                                            className="w-20 h-20 object-cover rounded-xl border border-[#E8E2D7] cursor-pointer hover:opacity-85 transition shadow-2xs"
                                                        />

                                                        {/* Tombol hapus foto lama */}
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleRemoveExistingImage(image)
                                                            }
                                                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shadow cursor-pointer"
                                                            title="Hapus foto"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                )
                                            )}
                                        </div>

                                        <p className="text-[11px] text-[#738075] mt-2">
                                            Klik foto untuk melihat ukuran penuh.
                                            Klik tombol × untuk menghapus foto.
                                        </p>
                                    </div>
                                )}

                            {/* Foto baru yang dipilih */}
                            {(form.image || form.images.length > 0) && (
                                <div className="mt-4">
                                    <p className="text-xs font-bold text-[#2F3931] mb-2">
                                        Foto Baru yang Dipilih
                                    </p>

                                    <div className="flex flex-wrap gap-3">
                                        {[
                                            ...(form.image ? [form.image] : []),
                                            ...form.images,
                                        ].map((file, index) => (
                                            <div
                                                key={`${file.name}-${index}`}
                                                className="relative w-20 min-h-20 border border-[#E8E2D7] bg-[#FAF6F0] rounded-xl p-2 flex items-center justify-center"
                                            >
                                                <span className="text-[10px] text-center break-all">
                                                    {file.name}
                                                </span>

                                                {/* Tombol hapus foto baru */}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleRemoveNewImage(index)
                                                    }
                                                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shadow cursor-pointer"
                                                    title="Hapus foto"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Tombol Simpan */}
                        <div className="pt-3">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`bg-[#657166] text-white text-xs font-bold px-6 py-2.5 rounded-xl border border-[#525C53] transition shadow-xs ${
                                    isSubmitting
                                        ? "opacity-70 cursor-not-allowed"
                                        : "hover:bg-[#556056] cursor-pointer"
                                }`}
                            >
                                {isSubmitting
                                    ? "Menyimpan..."
                                    : isEdit
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
                                    type="button"
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