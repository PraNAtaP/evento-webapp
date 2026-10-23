import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function VendorJobOffers() {
    const [jobOffers, setJobOffers] = useState([]);
    const [activeJobs, setActiveJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [rejectionReasons, setRejectionReasons] = useState({});
    const [progressNotes, setProgressNotes] = useState({});

    // Mengambil tawaran pekerjaan dan pekerjaan aktif.
    const fetchJobs = async () => {
        setLoading(true);
        setError("");

        try {
            const [offersResponse, activeResponse] = await Promise.all([
                api.get("/vendor/job-offers"),
                api.get("/vendor/active-jobs"),
            ]);

            setJobOffers(offersResponse.data.data || []);
            setActiveJobs(activeResponse.data.data || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Gagal mengambil data pekerjaan."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    // Menerima atau menolak tawaran pekerjaan.
    const handleResponse = async (assignmentId, status) => {
        const reason = rejectionReasons[assignmentId]?.trim() || "";

        if (status === "rejected" && !reason) {
            alert("Alasan penolakan wajib diisi.");
            return;
        }

        try {
            await api.patch(
                `/vendor/job-offers/${assignmentId}/response`,
                {
                    status,
                    ...(status === "rejected"
                        ? { rejection_reason: reason }
                        : {}),
                }
            );

            alert(
                status === "accepted"
                    ? "Tawaran berhasil diterima."
                    : "Tawaran berhasil ditolak."
            );

            fetchJobs();
        } catch (err) {
            alert(
                err.response?.data?.message ||
                "Gagal memproses tawaran."
            );
        }
    };

    // Menambahkan catatan progres pekerjaan aktif.
    const handleProgress = async (assignmentId) => {
        const note = progressNotes[assignmentId]?.trim() || "";

        if (!note) {
            alert("Catatan progres wajib diisi.");
            return;
        }

        try {
            await api.post(
                `/vendor/active-jobs/${assignmentId}/progress`,
                { note }
            );

            alert("Catatan progres berhasil ditambahkan.");

            setProgressNotes((prev) => ({
                ...prev,
                [assignmentId]: "",
            }));

            fetchJobs();
        } catch (err) {
            alert(
                err.response?.data?.message ||
                "Gagal menambahkan catatan progres."
            );
        }
    };

    if (loading) {
        return <div className="p-6">Memuat data pekerjaan...</div>;
    }

    return (
        <div className="space-y-8 p-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">
                    Tawaran Pekerjaan
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Kelola tawaran dari EO dan pantau pekerjaan yang sedang berjalan.
                </p>
            </div>

            {error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                    {error}
                    <button
                        onClick={fetchJobs}
                        className="ml-3 font-semibold underline"
                    >
                        Coba lagi
                    </button>
                </div>
            )}

            {/* Bagian 1: Tawaran dari EO */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">
                    Tawaran dari EO
                </h2>

                {jobOffers.length === 0 ? (
                    <p className="rounded-lg border border-gray-200 p-4 text-gray-500">
                        Belum ada tawaran pekerjaan.
                    </p>
                ) : (
                    jobOffers.map((job) => (
                        <div
                            key={job.id}
                            className="space-y-3 rounded-xl border border-gray-200 bg-white p-5"
                        >
                            <h3 className="font-semibold text-gray-800">
                                {job.event?.event_name || "Nama event tidak tersedia"}
                            </h3>

                            <p className="text-sm text-gray-600">
                                Paket: {job.package?.package_name || "Paket tidak tersedia"}
                            </p>

                            {job.package?.price != null && (
                                <p className="text-sm text-gray-600">
                                    Harga: Rp{" "}
                                    {Number(job.package.price).toLocaleString("id-ID")}
                                </p>
                            )}

                            <div>
                                <label className="mb-1 block text-sm text-gray-700">
                                    Alasan penolakan (wajib jika menolak)
                                </label>
                                <textarea
                                    value={rejectionReasons[job.id] || ""}
                                    onChange={(e) =>
                                        setRejectionReasons((prev) => ({
                                            ...prev,
                                            [job.id]: e.target.value,
                                        }))
                                    }
                                    rows={2}
                                    placeholder="Tulis alasan jika tidak dapat menerima tawaran..."
                                    className="w-full rounded-lg border border-gray-300 p-3 text-sm"
                                />
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() =>
                                        handleResponse(job.id, "accepted")
                                    }
                                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                                >
                                    Terima Tawaran
                                </button>

                                <button
                                    onClick={() =>
                                        handleResponse(job.id, "rejected")
                                    }
                                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                                >
                                    Tolak Tawaran
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </section>

            {/* Bagian 2: Pekerjaan aktif */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">
                    Pekerjaan Aktif
                </h2>

                {activeJobs.length === 0 ? (
                    <p className="rounded-lg border border-gray-200 p-4 text-gray-500">
                        Belum ada pekerjaan aktif.
                    </p>
                ) : (
                    activeJobs.map((job) => (
                        <div
                            key={job.id}
                            className="space-y-3 rounded-xl border border-gray-200 bg-white p-5"
                        >
                            <h3 className="font-semibold text-gray-800">
                                {job.event?.event_name || "Nama event tidak tersedia"}
                            </h3>

                            <p className="text-sm text-gray-600">
                                Paket: {job.package?.package_name || "Paket tidak tersedia"}
                            </p>

                            <div>
                                <h4 className="mb-2 text-sm font-semibold text-gray-700">
                                    Riwayat Progres
                                </h4>

                                {job.progress_logs?.length ? (
                                    <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600">
                                        {job.progress_logs.map((log) => (
                                            <li key={log.id}>
                                                {log.note}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-500">
                                        Belum ada catatan progres.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm text-gray-700">
                                    Tambah catatan progres
                                </label>
                                <textarea
                                    value={progressNotes[job.id] || ""}
                                    onChange={(e) =>
                                        setProgressNotes((prev) => ({
                                            ...prev,
                                            [job.id]: e.target.value,
                                        }))
                                    }
                                    rows={2}
                                    placeholder="Contoh: Persiapan perlengkapan sudah selesai..."
                                    className="w-full rounded-lg border border-gray-300 p-3 text-sm"
                                />
                            </div>

                            <button
                                onClick={() => handleProgress(job.id)}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            >
                                Simpan Progres
                            </button>
                        </div>
                    ))
                )}
            </section>
        </div>
    );
}