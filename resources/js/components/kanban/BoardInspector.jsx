import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import { CATEGORY_LABELS } from "../../data/kanbanData";
import {
    buildMapsUrl,
    formatBool,
    formatDate,
    formatDateTime,
    formatNumber,
    formatRupiah,
    orDash,
} from "../../utils/formatters";
import InspectorField from "./InspectorField";
import InspectorSection from "./InspectorSection";
import InspectorVendorSection from "./InspectorVendorSection";
import RescheduleDatePicker from "./RescheduleDatePicker";

const TITLE_ID = "board-inspector-title";
const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function SkeletonBlock() {
    return (
        <div className="space-y-6 animate-pulse" aria-hidden="true">
            {[3, 1, 2, 3, 2].map((rows, index) => (
                <div key={index} className="space-y-3">
                    <div className="h-3 w-20 bg-slate-200 rounded" />
                    {Array.from({ length: rows }).map((_, row) => (
                        <div key={row} className="h-4 bg-[#FAF6F0] rounded w-full" />
                    ))}
                </div>
            ))}
        </div>
    );
}

function InspectorPanel({ eventId, onClose, onQuotationSent, onEventRescheduled, onEventCancelled }) {
    const queryClient = useQueryClient();
    const panelRef = useRef(null);
    const [status, setStatus] = useState("loading");
    const [event, setEvent] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [retryKey, setRetryKey] = useState(0);
    const [refreshError, setRefreshError] = useState("");
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [isSavingReschedule, setIsSavingReschedule] = useState(false);
    const [rescheduleError, setRescheduleError] = useState("");
    const [bookedDatesOther, setBookedDatesOther] = useState([]);

    // State untuk Modal Pembatalan Acara (Danger Zone)
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [cancellationReasonInput, setCancellationReasonInput] = useState("");
    const [cancellationError, setCancellationError] = useState("");

    // true selama pemilih vendor / dialog kirim penawaran / modal batal terbuka: Esc/Tab ditangani modal itu
    const pickerOpenRef = useRef(false);
    const isCancelModalOpenRef = useRef(false);
    isCancelModalOpenRef.current = isCancelModalOpen;
    const eventIdRef = useRef(eventId);
    eventIdRef.current = eventId;

    const cancelMutation = useMutation({
        mutationFn: async (reason) => {
            const response = await api.post(`/events/${eventId}/cancel`, { reason });
            return response.data;
        },
        onSuccess: (data) => {
            if (data?.data) {
                setEvent(data.data);
            }
            setIsCancelModalOpen(false);
            setCancellationReasonInput("");
            setCancellationError("");

            // Invalidate query-query sinkronisasi
            queryClient.invalidateQueries(["admin-kanban"]);
            queryClient.invalidateQueries(["admin-smart-calendar"]);
            queryClient.invalidateQueries(["admin-event-orders"]);
            queryClient.invalidateQueries(["booked-dates"]);
            queryClient.invalidateQueries(["client-events"]);

            if (onEventCancelled && data?.event) {
                onEventCancelled(data.event);
            }
        },
        onError: (err) => {
            const msg =
                err.response?.data?.errors?.reason?.[0] ||
                err.response?.data?.errors?.cancellation_reason?.[0] ||
                err.response?.data?.message ||
                "Gagal membatalkan acara.";
            setCancellationError(msg);
        },
    });

    const handlePickerToggle = useCallback((open) => {
        pickerOpenRef.current = open;
    }, []);

    // Ambil ulang data tanpa menampilkan skeleton (dipakai setelah tambah/hapus vendor)
    const refreshEvent = useCallback(async () => {
        try {
            const response = await api.get(`/events/${eventId}`);
            if (eventIdRef.current !== eventId) return false;

            setEvent(response.data.data);
            setRefreshError("");
            return true;
        } catch {
            if (eventIdRef.current === eventId) {
                setRefreshError("Perubahan tersimpan, tetapi data gagal dimuat ulang.");
            }
            return false;
        }
    }, [eventId]);

    // Simpan fokus sebelumnya, kembalikan saat panel ditutup
    useEffect(() => {
        const previouslyFocused = document.activeElement;
        return () => {
            if (previouslyFocused && typeof previouslyFocused.focus === "function") {
                previouslyFocused.focus();
            }
        };
    }, []);

    // Pindahkan fokus ke panel saat dibuka dan saat event berganti
    useEffect(() => {
        panelRef.current?.focus();
    }, [eventId]);

    // Ambil data; batalkan request lama bila eventId berganti
    useEffect(() => {
        const controller = new AbortController();
        setStatus("loading");
        setErrorMessage("");
        setRefreshError("");
        setIsRescheduling(false);
        setRescheduleError("");

        api.get(`/events/${eventId}`, { signal: controller.signal })
            .then((response) => {
                setEvent(response.data.data);
                setStatus("success");
            })
            .catch((err) => {
                if (controller.signal.aborted || err?.code === "ERR_CANCELED") return;

                setEvent(null);
                setErrorMessage(
                    err.response?.status === 404
                        ? "Acara tidak ditemukan."
                        : err.response?.data?.message || "Gagal memuat detail acara."
                );
                setStatus("error");
            });

        return () => controller.abort();
    }, [eventId, retryKey]);

    const handleOpenReschedule = async () => {
        setRescheduleError("");
        setIsRescheduling(true);
        try {
            const res = await api.get("/admin/smart-calendar");
            const eventsByDate = res.data?.events_by_date || {};
            // Kumpulkan tanggal terblokir selain acara ini sendiri
            const otherDates = Object.entries(eventsByDate)
                .filter(([, evtObj]) => Number(evtObj.id) !== Number(event.id))
                .map(([ymd]) => ymd);
            setBookedDatesOther(otherDates);
        } catch {
            setBookedDatesOther([]);
        }
    };

    const handleSaveReschedule = async (payload) => {
        setIsSavingReschedule(true);
        setRescheduleError("");
        try {
            const res = await api.patch(`/events/${event.id}/reschedule`, payload);
            if (res.data?.data) {
                setEvent(res.data.data);
            }
            if (onEventRescheduled && res.data?.event) {
                onEventRescheduled(res.data.event);
            }
            setIsRescheduling(false);
        } catch (err) {
            const msg =
                err.response?.data?.errors?.event_date?.[0] ||
                err.response?.data?.errors?.end_date?.[0] ||
                err.response?.data?.message ||
                "Gagal memperbarui jadwal acara.";
            setRescheduleError(msg);
        } finally {
            setIsSavingReschedule(false);
        }
    };

    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    // Esc menutup panel; Tab/Shift+Tab berputar di dalam panel (focus trap)
    const handleKeyDown = useCallback(
        (e) => {
            // Modal pemilih vendor atau modal pembatalan menangani Esc/Tab sendiri, atau event sudah ditangani
            if (pickerOpenRef.current || isCancelModalOpenRef.current || e.defaultPrevented) return;

            if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                onCloseRef.current?.();
                return;
            }

            if (e.key !== "Tab" || !panelRef.current) return;

            const focusable = Array.from(panelRef.current.querySelectorAll(FOCUSABLE_SELECTOR));
            if (focusable.length === 0) {
                e.preventDefault();
                panelRef.current.focus();
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const active = document.activeElement;

            if (e.shiftKey && (active === first || active === panelRef.current)) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && active === last) {
                e.preventDefault();
                first.focus();
            }
        },
        []
    );

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    const title = status === "success" && event?.event_name ? event.event_name : "Detail Acara";

    const renderContent = () => {
        if (status === "loading") return <SkeletonBlock />;

        if (status === "error") {
            return (
                <div className="py-12 text-center flex flex-col items-center gap-3">
                    <p className="text-sm text-[#738075] max-w-xs">{errorMessage}</p>
                    <button
                        type="button"
                        onClick={() => setRetryKey((key) => key + 1)}
                        className="px-4 py-2 bg-[#657166] hover:bg-[#556056] text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
                    >
                        Coba lagi
                    </button>
                </div>
            );
        }

        const isRange = Boolean(event.is_multi_day && event.end_date);
        const hasInvalidRange = isRange && event.end_date < event.event_date;
        const scheduleText = isRange
            ? `${formatDate(event.event_date)} - ${formatDate(event.end_date)}`
            : formatDate(event.event_date);
        const mapsUrl = buildMapsUrl(event.lat, event.lng);
        const categoryText = event.category
            ? CATEGORY_LABELS[event.category] || event.category
            : null;

        return (
            <div>
                {event.revision_note && (
                    <div className="mt-4 rounded-xl border border-[#E8E2D7] bg-white px-4 py-3 text-black">
                        <p className="text-[11px] font-bold uppercase tracking-wider">Catatan Revisi Klien</p>
                        <p className="text-xs mt-1 leading-relaxed whitespace-pre-line break-words">
                            {event.revision_note}
                        </p>
                        {event.revision_requested_at && (
                            <p className="text-[10px] mt-1.5 opacity-70">
                                Diminta pada {formatDateTime(event.revision_requested_at)}
                            </p>
                        )}
                    </div>
                )}

                <InspectorSection title="Umum">
                    <InspectorField label="ID">{orDash(event.id)}</InspectorField>
                    <InspectorField label="Nama Event">{orDash(event.event_name)}</InspectorField>
                    <InspectorField label="Kategori">{orDash(categoryText)}</InspectorField>
                    <InspectorField label="Tanggal Dibuat">{formatDateTime(event.created_at)}</InspectorField>
                    <InspectorField label="Terakhir Diupdate">{formatDateTime(event.updated_at)}</InspectorField>
                </InspectorSection>

                <InspectorSection title="Klien">
                    <InspectorField label="Nama Klien" fullWidth>
                        {orDash(event.client_name)}
                    </InspectorField>
                </InspectorSection>

                <InspectorSection title="Jadwal">
                    <InspectorField label="Tanggal Event" fullWidth>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <span>{scheduleText}</span>
                                {hasInvalidRange && (
                                    <span className="ml-2 inline-flex items-center align-middle text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200">
                                        Tanggal berakhir tidak valid
                                    </span>
                                )}
                            </div>

                            {event.can_reschedule && !isRescheduling && (
                                <button
                                    type="button"
                                    onClick={handleOpenReschedule}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#DAEBE3] hover:bg-[#c8e0d5] text-[#224436] text-xs font-bold border border-[#BCD4C9] transition cursor-pointer shadow-2xs"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>Reschedule Tanggal</span>
                                </button>
                            )}
                        </div>

                        {!event.can_reschedule && (
                            <p className="text-[11px] text-[#738075] font-normal mt-1">
                                Perubahan tanggal (Reschedule) hanya tersedia hingga tahap Menunggu DP.
                            </p>
                        )}

                        {isRescheduling && event.can_reschedule && (
                            <RescheduleDatePicker
                                initialStartDate={event.event_date}
                                initialEndDate={event.end_date}
                                initialMultiDay={event.is_multi_day}
                                blockedDates={bookedDatesOther}
                                onSave={handleSaveReschedule}
                                onCancel={() => {
                                    setIsRescheduling(false);
                                    setRescheduleError("");
                                }}
                                isSaving={isSavingReschedule}
                                errorMessage={rescheduleError}
                            />
                        )}
                    </InspectorField>
                </InspectorSection>

                <InspectorSection title="Lokasi">
                    <InspectorField label="Punya Venue">{formatBool(event.has_own_venue)}</InspectorField>
                    <InspectorField label="Nama Lokasi">{orDash(event.venue)}</InspectorField>
                    <InspectorField label="Link Peta" fullWidth>
                        {mapsUrl ? (
                            <a
                                href={mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#657166] hover:text-[#556056] hover:underline"
                            >
                                Buka di Maps
                            </a>
                        ) : (
                            "-"
                        )}
                    </InspectorField>
                </InspectorSection>

                <InspectorSection title="Tamu & Biaya">
                    <InspectorField label="Jumlah Tamu">{formatNumber(event.guest_count)}</InspectorField>
                    <InspectorField label="Estimasi Biaya">{formatRupiah(event.estimated_budget)}</InspectorField>
                </InspectorSection>

                {refreshError && (
                    <div
                        role="alert"
                        className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
                    >
                        <span>{refreshError}</span>
                        <button
                            type="button"
                            onClick={refreshEvent}
                            className="shrink-0 font-semibold text-amber-900 underline"
                        >
                            Muat ulang
                        </button>
                    </div>
                )}

                <InspectorVendorSection
                    key={event.id}
                    event={event}
                    onChanged={refreshEvent}
                    onPickerToggle={handlePickerToggle}
                    onQuotationSent={onQuotationSent}
                />

                {/* Danger Zone: Pembatalan Acara oleh EO */}
                {event.kanban_status === "cancelled" ? (
                    <div className="mt-8 mb-4 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 sm:p-5 text-rose-900">
                        <div className="flex items-start gap-3">
                            <span className="w-7 h-7 rounded-lg bg-rose-200 text-rose-800 flex items-center justify-center font-bold text-xs shrink-0">
                                ✕
                            </span>
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-900">
                                    Acara Ini Telah Dibatalkan
                                </h3>
                                <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                                    <span className="font-semibold">Alasan:</span> {event.cancellation_reason || "-"}
                                </p>
                                {event.cancelled_at && (
                                    <p className="text-[10px] text-rose-600 mt-1">
                                        Waktu pembatalan: {formatDateTime(event.cancelled_at)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ) : event.kanban_status !== "done" ? (
                    <div className="mt-8 mb-4 rounded-2xl border border-rose-200 bg-rose-50/40 p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-900">
                                    Pembatalan Acara (Danger Zone)
                                </h3>
                                <p className="text-xs text-[#738075] mt-0.5 max-w-md">
                                    Membatalkan acara akan mengosongkan kembali tanggal di kalender dan membebaskan seluruh penugasan vendor terkait.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setCancellationReasonInput("");
                                    setCancellationError("");
                                    setIsCancelModalOpen(true);
                                }}
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span>Batalkan Acara</span>
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
            {/* Backdrop: klik menutup panel (bukan tombol) */}
            <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden="true" />

            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={TITLE_ID}
                tabIndex={-1}
                className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl border border-[#E8E2D7] shadow-xl flex flex-col overflow-hidden focus:outline-none"
            >
                <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[#E8E2D7]">
                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#738075]">
                            Detail Acara
                        </p>
                        <h2 id={TITLE_ID} className="text-base font-bold text-[#2F3931] break-words">
                            {title}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Tutup"
                        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-[#738075] hover:text-[#2F3931] hover:bg-[#FAF6F0] transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto px-5 py-2">{renderContent()}</div>

                {/* Modal Dialog Konfirmasi Pembatalan Acara */}
                {isCancelModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                        <div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="cancel-event-dialog-title"
                            className="relative w-full max-w-md bg-white rounded-2xl border border-[#E8E2D7] shadow-2xl p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150"
                        >
                            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm shrink-0">
                                        !
                                    </div>
                                    <div>
                                        <h3 id="cancel-event-dialog-title" className="text-sm font-bold text-slate-900">
                                            Konfirmasi Pembatalan Acara
                                        </h3>
                                        <p className="text-[11px] text-[#738075]">
                                            Tindakan ini permanen dan akan membebaskan jadwal vendor.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    disabled={cancelMutation.isPending}
                                    onClick={() => setIsCancelModalOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1 rounded-lg"
                                >
                                    ✕
                                </button>
                            </div>

                            <div>
                                <label htmlFor="cancellation-reason" className="block text-xs font-bold text-slate-700 mb-1">
                                    Alasan Pembatalan <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    id="cancellation-reason"
                                    rows={3}
                                    value={cancellationReasonInput}
                                    onChange={(e) => {
                                        setCancellationReasonInput(e.target.value);
                                        if (cancellationError) setCancellationError("");
                                    }}
                                    placeholder="Tuliskan alasan pembatalan acara secara rinci..."
                                    className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition resize-none text-slate-800"
                                />
                                {cancellationError && (
                                    <p className="text-[11px] text-rose-600 font-medium mt-1">
                                        {cancellationError}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    disabled={cancelMutation.isPending}
                                    onClick={() => setIsCancelModalOpen(false)}
                                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    disabled={cancelMutation.isPending || !cancellationReasonInput.trim()}
                                    onClick={() => {
                                        if (!cancellationReasonInput.trim()) {
                                            setCancellationError("Alasan pembatalan wajib diisi.");
                                            return;
                                        }
                                        cancelMutation.mutate(cancellationReasonInput.trim());
                                    }}
                                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                                >
                                    {cancelMutation.isPending && (
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    )}
                                    <span>{cancelMutation.isPending ? "Membatalkan..." : "Ya, Batalkan Acara"}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function BoardInspector({ eventId, onClose, onQuotationSent, onEventRescheduled, onEventCancelled }) {
    if (eventId === null || eventId === undefined) return null;

    return (
        <InspectorPanel
            eventId={eventId}
            onClose={onClose}
            onQuotationSent={onQuotationSent}
            onEventRescheduled={onEventRescheduled}
            onEventCancelled={onEventCancelled}
        />
    );
}
