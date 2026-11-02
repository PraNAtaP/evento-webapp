import { useEffect, useRef, useState } from "react";
import api from "../../api/axios";
import { formatRupiah, orDash } from "../../utils/formatters";
import {
    extractFieldErrors,
    formatVendorCategory,
    getInitials,
    parsePriceInput,
} from "../../utils/vendorHelpers";

const TITLE_ID = "vendor-picker-title";
const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const STEP_TITLES = {
    vendors: "Pilih vendor",
    packages: "Pilih paket",
    form: "Harga & catatan",
};

function Avatar({ name, imageUrl }) {
    if (imageUrl) {
        return <img src={imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 bg-slate-100" />;
    }

    return (
        <span
            aria-hidden="true"
            className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center bg-indigo-50 text-indigo-700 text-xs font-bold"
        >
            {getInitials(name)}
        </span>
    );
}

function StatusMessage({ children, onRetry }) {
    return (
        <div className="py-10 text-center flex flex-col items-center gap-3">
            <p className="text-sm text-slate-500 max-w-xs">{children}</p>
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
                >
                    Coba lagi
                </button>
            )}
        </div>
    );
}

function VendorStep({ eventId, active, onSelect }) {
    const searchRef = useRef(null);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [category, setCategory] = useState("");
    const [retryKey, setRetryKey] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [state, setState] = useState({
        status: "loading",
        vendors: [],
        categories: [],
        page: 1,
        lastPage: 1,
        error: "",
    });

    useEffect(() => {
        if (active) searchRef.current?.focus();
    }, [active]);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        const controller = new AbortController();
        setState((current) => ({ ...current, status: "loading", error: "" }));

        api.get(`/events/${eventId}/vendor-catalog`, {
            params: { search: debouncedSearch || undefined, category: category || undefined },
            signal: controller.signal,
        })
            .then((response) => {
                setState({
                    status: "success",
                    vendors: response.data.data,
                    categories: response.data.categories ?? [],
                    page: response.data.meta?.current_page ?? 1,
                    lastPage: response.data.meta?.last_page ?? 1,
                    error: "",
                });
            })
            .catch((err) => {
                if (controller.signal.aborted || err?.code === "ERR_CANCELED") return;
                setState((current) => ({
                    ...current,
                    status: "error",
                    error: err.response?.data?.message || "Gagal memuat katalog vendor.",
                }));
            });

        return () => controller.abort();
    }, [eventId, debouncedSearch, category, retryKey]);

    const filterRef = useRef({ search: debouncedSearch, category });
    filterRef.current = { search: debouncedSearch, category };

    const loadMore = async () => {
        const targetSearch = debouncedSearch;
        const targetCategory = category;
        setLoadingMore(true);
        try {
            const response = await api.get(`/events/${eventId}/vendor-catalog`, {
                params: {
                    search: targetSearch || undefined,
                    category: targetCategory || undefined,
                    page: state.page + 1,
                },
            });
            // Abaikan jika filter sudah berubah saat request sedang berjalan
            const { search: currentSearch, category: currentCategory } = filterRef.current;
            if (currentSearch !== targetSearch || currentCategory !== targetCategory) {
                return;
            }
            setState((current) => ({
                ...current,
                vendors: [...current.vendors, ...response.data.data],
                page: response.data.meta?.current_page ?? current.page + 1,
                lastPage: response.data.meta?.last_page ?? current.lastPage,
            }));
        } catch (err) {
            const { search: currentSearch, category: currentCategory } = filterRef.current;
            if (currentSearch === targetSearch && currentCategory === targetCategory) {
                setState((current) => ({
                    ...current,
                    error: err.response?.data?.message || "Gagal memuat vendor berikutnya.",
                }));
            }
        } finally {
            setLoadingMore(false);
        }
    };

    const hasFilter = Boolean(debouncedSearch || category);

    return (
        <div hidden={!active}>
            <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex-1">
                    <span className="sr-only">Cari vendor</span>
                    <input
                        ref={searchRef}
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari nama vendor..."
                        maxLength={100}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                </label>
                <label>
                    <span className="sr-only">Filter kategori</span>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full sm:w-auto px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                        <option value="">Semua kategori</option>
                        {state.categories.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <div className="mt-3" aria-live="polite">
                {state.status === "loading" && <StatusMessage>Memuat vendor...</StatusMessage>}

                {state.status === "error" && (
                    <StatusMessage onRetry={() => setRetryKey((key) => key + 1)}>{state.error}</StatusMessage>
                )}

                {state.status === "success" && state.vendors.length === 0 && (
                    <StatusMessage>
                        {hasFilter ? "Tidak ada vendor yang cocok" : "Belum ada vendor di katalog"}
                    </StatusMessage>
                )}

                {state.status === "success" && state.vendors.length > 0 && (
                    <ul className="space-y-2">
                        {state.vendors.map((vendor) => {
                            const hasPackages = vendor.packages_count > 0;

                            return (
                                <li key={vendor.id}>
                                    <button
                                        type="button"
                                        disabled={!hasPackages}
                                        onClick={() => onSelect(vendor)}
                                        className="w-full flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-slate-200 disabled:hover:bg-white"
                                    >
                                        <Avatar name={vendor.business_name} imageUrl={vendor.image_url} />
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                                {formatVendorCategory(vendor.category)}
                                            </span>
                                            <span className="block text-sm font-bold text-slate-900 break-words">
                                                {orDash(vendor.business_name)}
                                            </span>
                                            <span className="block text-xs text-slate-500 break-words">
                                                {orDash(vendor.address)}
                                            </span>
                                            <span className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                                                <span className={hasPackages ? "text-slate-600" : "text-slate-400"}>
                                                    {hasPackages ? `${vendor.packages_count} paket` : "Belum ada paket"}
                                                </span>
                                                {vendor.is_attached && (
                                                    <span className="px-1.5 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold">
                                                        {vendor.attached_packages_count} sudah ditambahkan
                                                    </span>
                                                )}
                                            </span>
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}

                {state.status === "success" && state.error && (
                    <p role="alert" className="mt-2 text-xs text-rose-600">
                        {state.error}
                    </p>
                )}

                {state.status === "success" && state.page < state.lastPage && (
                    <div className="mt-3 text-center">
                        <button
                            type="button"
                            onClick={loadMore}
                            disabled={loadingMore}
                            className="px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors disabled:opacity-50"
                        >
                            {loadingMore ? "Memuat..." : "Muat lebih banyak"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function PackageStep({ eventId, vendor, active, onSelect, onBack }) {
    const [retryKey, setRetryKey] = useState(0);
    const [state, setState] = useState({ status: "loading", packages: [], error: "" });

    useEffect(() => {
        if (!vendor) return undefined;

        const controller = new AbortController();
        setState({ status: "loading", packages: [], error: "" });

        api.get(`/events/${eventId}/vendor-catalog/${vendor.id}/packages`, { signal: controller.signal })
            .then((response) => setState({ status: "success", packages: response.data.data, error: "" }))
            .catch((err) => {
                if (controller.signal.aborted || err?.code === "ERR_CANCELED") return;
                setState({
                    status: "error",
                    packages: [],
                    error: err.response?.data?.message || "Gagal memuat paket vendor.",
                });
            });

        return () => controller.abort();
    }, [eventId, vendor, retryKey]);

    return (
        <div hidden={!active}>
            {vendor && (
                <div className="mb-3 flex items-center gap-3">
                    <Avatar name={vendor.business_name} imageUrl={vendor.image_url} />
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 break-words">{vendor.business_name}</p>
                        <p className="text-xs text-slate-500">{formatVendorCategory(vendor.category)}</p>
                    </div>
                </div>
            )}

            <button
                type="button"
                onClick={onBack}
                className="mb-3 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
                &larr; Kembali ke daftar vendor
            </button>

            <div aria-live="polite">
                {state.status === "loading" && <StatusMessage>Memuat paket...</StatusMessage>}
                {state.status === "error" && (
                    <StatusMessage onRetry={() => setRetryKey((key) => key + 1)}>{state.error}</StatusMessage>
                )}
                {state.status === "success" && state.packages.length === 0 && (
                    <StatusMessage>Belum ada paket</StatusMessage>
                )}

                {state.status === "success" && state.packages.length > 0 && (
                    <ul className="space-y-2">
                        {state.packages.map((pkg) => (
                            <li key={pkg.id}>
                                <button
                                    type="button"
                                    disabled={pkg.is_attached}
                                    onClick={() => onSelect(pkg)}
                                    className="w-full flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-slate-200 disabled:hover:bg-white"
                                >
                                    {pkg.image_url && (
                                        <img
                                            src={pkg.image_url}
                                            alt=""
                                            className="w-14 h-14 rounded-lg object-cover shrink-0 bg-slate-100"
                                        />
                                    )}
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-bold text-slate-900 break-words">
                                            {orDash(pkg.package_name)}
                                        </span>
                                        <span className="block text-xs text-slate-500 break-words line-clamp-3">
                                            {orDash(pkg.description)}
                                        </span>
                                        <span className="mt-1 flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-semibold text-slate-900">
                                                {formatRupiah(pkg.price)}
                                            </span>
                                            {pkg.is_attached && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold">
                                                    Sudah ditambahkan
                                                </span>
                                            )}
                                        </span>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

function FormStep({ eventId, vendor, pkg, active, onBack, onAdded }) {
    const [price, setPrice] = useState("");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Isi ulang form dari harga paket tiap kali paket yang dipilih berganti
    useEffect(() => {
        setPrice(pkg ? String(pkg.price) : "");
        setNotes("");
        setErrors({});
    }, [pkg]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!pkg || submitting) return;

        const parsed = parsePriceInput(price);
        if (parsed.error || parsed.value === null) {
            setErrors({ price: parsed.error ?? "Harga wajib diisi." });
            return;
        }

        setSubmitting(true);
        setErrors({});

        try {
            await api.post(`/events/${eventId}/vendors`, {
                package_id: pkg.id,
                price: parsed.value,
                notes: notes.trim() === "" ? null : notes.trim(),
            });
            await onAdded();
        } catch (err) {
            const fieldErrors = extractFieldErrors(err);
            setErrors(
                Object.keys(fieldErrors).length > 0
                    ? fieldErrors
                    : { form: err.response?.data?.message || "Gagal menambahkan vendor." }
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div hidden={!active}>
            <button
                type="button"
                onClick={onBack}
                className="mb-3 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
                &larr; Kembali ke daftar paket
            </button>

            {pkg && vendor && (
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">{vendor.business_name}</p>
                        <p className="text-sm font-bold text-slate-900 break-words">{pkg.package_name}</p>
                        <p className="text-xs text-slate-500">Harga paket {formatRupiah(pkg.price)}</p>
                    </div>

                    <div>
                        <label htmlFor="vendor-price" className="block text-xs font-semibold text-slate-700">
                            Harga untuk acara ini (Rp)
                        </label>
                        <input
                            id="vendor-price"
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="any"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            aria-invalid={Boolean(errors.price)}
                            aria-describedby={errors.price ? "vendor-price-error" : undefined}
                            className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        {errors.price && (
                            <p id="vendor-price-error" role="alert" className="mt-1 text-xs text-rose-600">
                                {errors.price}
                            </p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="vendor-notes" className="block text-xs font-semibold text-slate-700">
                            Catatan (opsional)
                        </label>
                        <textarea
                            id="vendor-notes"
                            rows={3}
                            maxLength={500}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            aria-invalid={Boolean(errors.notes)}
                            aria-describedby={errors.notes ? "vendor-notes-error" : undefined}
                            className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        <div className="flex justify-between text-[11px] text-slate-400">
                            <span>{errors.notes ? "" : "Hanya terlihat oleh EO."}</span>
                            <span>{notes.length}/500</span>
                        </div>
                        {errors.notes && (
                            <p id="vendor-notes-error" role="alert" className="mt-1 text-xs text-rose-600">
                                {errors.notes}
                            </p>
                        )}
                    </div>

                    <p className="text-[11px] text-slate-400">
                        Vendor langsung menerima tawaran ini di dashboard-nya. Harga tidak dapat diubah setelah
                        ditambahkan; untuk mengubahnya, hapus lalu tambahkan ulang.
                    </p>

                    {(errors.package_id || errors.event || errors.form) && (
                        <p role="alert" className="text-xs text-rose-600">
                            {errors.package_id || errors.event || errors.form}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors disabled:opacity-60"
                    >
                        {submitting ? "Menyimpan..." : "Simpan"}
                    </button>
                </form>
            )}
        </div>
    );
}

/**
 * Pemilih katalog dua langkah (vendor -> paket) + form harga/catatan.
 * Dirender sebagai overlay seukuran panel inspector. Esc menutup modal ini saja.
 */
export default function VendorPickerModal({ eventId, onClose, onAdded }) {
    const dialogRef = useRef(null);
    const headingRef = useRef(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;
    const [step, setStep] = useState("vendors");
    const [vendor, setVendor] = useState(null);
    const [pkg, setPkg] = useState(null);

    // Esc menutup modal saja; Tab berputar di dalam modal (focus trap)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation?.();
                onCloseRef.current?.();
                return;
            }

            if (e.key !== "Tab" || !dialogRef.current) return;

            const focusable = Array.from(dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
                (element) => !element.closest("[hidden]")
            );
            if (focusable.length === 0) {
                e.preventDefault();
                headingRef.current?.focus();
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const active = document.activeElement;

            if (e.shiftKey && (active === first || active === dialogRef.current || active === headingRef.current)) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && active === last) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Pindahkan fokus ke judul langkah saat berpindah ke paket/form
    useEffect(() => {
        if (step !== "vendors") headingRef.current?.focus();
    }, [step]);

    return (
        <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={TITLE_ID}
            className="fixed inset-y-0 right-0 z-50 w-full md:w-[420px] bg-white shadow-xl flex flex-col"
        >
            <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-200">
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Tambah vendor
                    </p>
                    <h2
                        id={TITLE_ID}
                        ref={headingRef}
                        tabIndex={-1}
                        className="text-base font-bold text-slate-900 focus:outline-none"
                    >
                        {STEP_TITLES[step]}
                    </h2>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Tutup pemilih vendor"
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">
                <VendorStep
                    eventId={eventId}
                    active={step === "vendors"}
                    onSelect={(selected) => {
                        setVendor(selected);
                        setPkg(null);
                        setStep("packages");
                    }}
                />
                <PackageStep
                    eventId={eventId}
                    vendor={vendor}
                    active={step === "packages"}
                    onBack={() => setStep("vendors")}
                    onSelect={(selected) => {
                        setPkg(selected);
                        setStep("form");
                    }}
                />
                <FormStep
                    eventId={eventId}
                    vendor={vendor}
                    pkg={pkg}
                    active={step === "form"}
                    onBack={() => setStep("packages")}
                    onAdded={onAdded}
                />
            </div>
        </div>
    );
}
