export const NO_CATEGORY_LABEL = "Tanpa kategori";

export const OFFER_STATUS_META = {
    pending: { label: "Menunggu vendor", className: "bg-amber-50 text-amber-700 border-amber-200" },
    accepted: { label: "Diterima vendor", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    rejected: { label: "Ditolak vendor", className: "bg-rose-50 text-rose-700 border-rose-200" },
};

/** Label kategori vendor; null/kosong -> "Tanpa kategori". */
export function formatVendorCategory(category) {
    if (typeof category !== "string") return NO_CATEGORY_LABEL;
    const trimmed = category.trim();
    return trimmed === "" ? NO_CATEGORY_LABEL : trimmed;
}

/** Label + kelas badge untuk status tawaran vendor; status tak dikenal -> null. */
export function getOfferStatusMeta(status) {
    return OFFER_STATUS_META[status] ?? null;
}

/** true bila harga untuk acara berbeda dari harga paket asli (hasil nego). */
export function isNegotiatedPrice(price, packagePrice) {
    if (price === null || price === undefined || packagePrice === null || packagePrice === undefined) {
        return false;
    }
    const a = Number(price);
    const b = Number(packagePrice);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return false;

    return Math.abs(a - b) >= 0.005;
}

/**
 * Parse input harga dari form.
 * "" -> { value: null } (server memakai harga paket); angka >= 0 -> { value }; selain itu { error }.
 */
export function parsePriceInput(raw) {
    const text = String(raw ?? "").trim();
    if (text === "") return { value: null };

    const number = Number(text);
    if (!Number.isFinite(number)) return { error: "Harga harus berupa angka." };
    if (number < 0) return { error: "Harga tidak boleh negatif." };

    return { value: number };
}

/** Inisial maksimal 2 huruf untuk avatar fallback; kosong -> "?". */
export function getInitials(name) {
    if (typeof name !== "string") return "?";
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return "?";

    return words
        .slice(0, 2)
        .map((word) => word[0].toUpperCase())
        .join("");
}

/** Ambil pesan error pertama per field dari respons 422 Laravel. */
export function extractFieldErrors(error) {
    const errors = error?.response?.data?.errors;
    if (!errors || typeof errors !== "object") return {};

    return Object.fromEntries(
        Object.entries(errors).map(([field, messages]) => [field, Array.isArray(messages) ? messages[0] : String(messages)])
    );
}
