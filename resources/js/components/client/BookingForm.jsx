import React, { useEffect, useState } from "react";
import api from "../../api/axios";

/**
 * Komponen Form Pemesanan Acara untuk Klien.
 * Memungkinkan klien menginput nama acara dan memesan tanggal yang telah dipilih pada kalender.
 *
 * @param {Object} props
 * @param {Date} props.selectedDate - Tanggal yang sedang dipilih dari kalender
 * @param {function():void} [props.onBookingSuccess] - Callback saat booking berhasil dibuat
 */
export default function BookingForm({ selectedDate, onBookingSuccess }) {
    const [eventName, setEventName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState("");

    // Flash message auto-dismiss setelah 5 detik
    useEffect(() => {
        if (!successMessage && !errorMessage) return;

        const timer = setTimeout(() => {
            setSuccessMessage("");
            setErrorMessage("");
        }, 5000);

        return () => clearTimeout(timer);
    }, [successMessage, errorMessage]);

    // Helper mengubah objek Date ke format YYYY-MM-DD lokal
    const formatDateToYMD = (date) => {
        if (!date) return "";
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const formatReadableDate = (date) => {
        if (!date) return "-";
        return new Intl.DateTimeFormat("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        }).format(date);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        setFieldErrors({});
        setSuccessMessage("");

        const formattedDate = formatDateToYMD(selectedDate);

        // Validasi sisi klien sederhana sebelum submit
        if (!eventName.trim()) {
            setFieldErrors({ event_name: ["Nama acara wajib diisi."] });
            return;
        }

        if (!formattedDate) {
            setErrorMessage("Silakan pilih tanggal acara terlebih dahulu pada kalender.");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await api.post("/bookings", {
                event_name: eventName.trim(),
                event_date: formattedDate,
            });

            setSuccessMessage(
                response.data?.message || "Booking acara berhasil dibuat."
            );
            setEventName("");

            if (onBookingSuccess) {
                onBookingSuccess(response.data?.event);
            }
        } catch (error) {
            if (error.response) {
                const { status, data } = error.response;
                if (status === 422) {
                    // Validasi backend gagal (misal: "Tanggal sudah terisi" atau tanggal lewat)
                    setErrorMessage(data.message || "Validasi gagal. Silakan periksa kembali data Anda.");
                    if (data.errors) {
                        setFieldErrors(data.errors);
                    }
                } else if (status === 403) {
                    setErrorMessage("Akses ditolak. Hanya akun klien yang dapat melakukan booking.");
                } else {
                    setErrorMessage(data.message || "Terjadi kesalahan saat memproses booking.");
                }
            } else {
                setErrorMessage("Gagal terhubung ke server. Pastikan koneksi internet stabil.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col gap-5">
            <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Formulir Pemesanan
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                    Buat Jadwal Acara Baru
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                    Lengkapi nama acara dan pastikan tanggal yang Anda pilih sudah sesuai.
                </p>
            </div>

            {/* Flash Message Error (Tanpa Emoticon) */}
            {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-start justify-between gap-3 transition-all animate-fadeIn">
                    <div className="flex-1">
                        <p className="font-semibold">{errorMessage}</p>
                        {fieldErrors.event_date && (
                            <p className="text-rose-600 mt-1 font-medium">
                                {fieldErrors.event_date.join(", ")}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => setErrorMessage("")}
                        className="text-rose-400 hover:text-rose-700 font-bold text-base leading-none cursor-pointer"
                        title="Tutup pesan"
                        aria-label="Tutup pesan"
                    >
                        &times;
                    </button>
                </div>
            )}

            {/* Flash Message Sukses (Tanpa Emoticon) */}
            {successMessage && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs flex items-start justify-between gap-3 transition-all animate-fadeIn">
                    <p className="font-semibold flex-1">{successMessage}</p>
                    <button
                        type="button"
                        onClick={() => setSuccessMessage("")}
                        className="text-emerald-500 hover:text-emerald-700 font-bold text-base leading-none cursor-pointer"
                        title="Tutup pesan"
                        aria-label="Tutup pesan"
                    >
                        &times;
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Field Tanggal Acara (Terpilih dari Kalender) */}
                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Tanggal Acara (dari Kalender)
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            readOnly
                            value={formatReadableDate(selectedDate)}
                            className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none cursor-default"
                        />
                        <span className="absolute right-3.5 top-3 text-slate-400 pointer-events-none">
                            <svg
                                width="14"
                                height="14"
                                className="w-3.5 h-3.5 text-slate-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                        Pilih tanggal langsung dengan mengklik tanggal di kalender sebelah kiri.
                    </p>
                </div>

                {/* Field Nama Acara */}
                <div>
                    <label
                        htmlFor="eventName"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                        Nama Acara <span className="text-rose-500">*</span>
                    </label>
                    <input
                        id="eventName"
                        type="text"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        placeholder="Contoh: Pernikahan Budi & Siti / Seminar Teknologi"
                        maxLength={150}
                        disabled={isSubmitting}
                        className={`w-full px-3.5 py-2.5 bg-white border ${
                            fieldErrors.event_name ? "border-rose-400 ring-1 ring-rose-200" : "border-slate-300"
                        } rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                    />
                    {fieldErrors.event_name && (
                        <p className="text-[11px] text-rose-600 mt-1">
                            {fieldErrors.event_name[0]}
                        </p>
                    )}
                </div>

                {/* Tombol Aksi */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-2 w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <>
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            <span>Memproses Booking...</span>
                        </>
                    ) : (
                        <span>Ajukan Booking Acara</span>
                    )}
                </button>
            </form>
        </div>
    );
}
