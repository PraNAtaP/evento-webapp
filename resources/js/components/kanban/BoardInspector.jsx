import { useCallback, useEffect, useRef, useState } from "react";
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
                        <div key={row} className="h-4 bg-slate-100 rounded w-full" />
                    ))}
                </div>
            ))}
        </div>
    );
}

function InspectorPanel({ eventId, onClose }) {
    const panelRef = useRef(null);
    const [status, setStatus] = useState("loading");
    const [event, setEvent] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [retryKey, setRetryKey] = useState(0);

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

    // Esc menutup panel; Tab/Shift+Tab berputar di dalam panel (focus trap)
    const handleKeyDown = useCallback(
        (e) => {
            if (e.key === "Escape") {
                e.stopPropagation();
                onClose?.();
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
        [onClose]
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
                    <p className="text-sm text-slate-600 max-w-xs">{errorMessage}</p>
                    <button
                        type="button"
                        onClick={() => setRetryKey((key) => key + 1)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
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
                    <div className="mt-4 rounded-xl border border-[#ebd1b7] bg-[#fde8d3] px-4 py-3 text-[#5a3a1d]">
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
                        <span>{scheduleText}</span>
                        {hasInvalidRange && (
                            <span className="ml-2 inline-flex items-center align-middle text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200">
                                Tanggal berakhir tidak valid
                            </span>
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
                                className="text-blue-600 hover:text-blue-700 hover:underline"
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
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-40">
            {/* Backdrop: klik menutup panel (bukan tombol) */}
            <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden="true" />

            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={TITLE_ID}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 w-full md:w-[420px] bg-white shadow-xl flex flex-col focus:outline-none"
            >
                <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-200">
                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Detail Acara
                        </p>
                        <h2 id={TITLE_ID} className="text-base font-bold text-slate-900 break-words">
                            {title}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Tutup"
                        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto px-5 py-2">{renderContent()}</div>
            </div>
        </div>
    );
}

export default function BoardInspector({ eventId, onClose }) {
    if (eventId === null || eventId === undefined) return null;

    return <InspectorPanel eventId={eventId} onClose={onClose} />;
}
