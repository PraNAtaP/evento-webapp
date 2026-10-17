const MONTHS_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("id-ID");

const jakartaPartsFormatter = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
});

/**
 * Mengembalikan "-" untuk null/undefined/string kosong; selain itu nilai apa adanya
 * (angka 0 dan boolean false tetap dikembalikan).
 */
export function orDash(value) {
    if (value === null || value === undefined) return "-";
    if (typeof value === "string" && value.trim() === "") return "-";
    return value;
}

/** true -> "Ya", false -> "Tidak", selain itu "-". */
export function formatBool(value) {
    if (value === true) return "Ya";
    if (value === false) return "Tidak";
    return "-";
}

/**
 * Format tanggal kalender "YYYY-MM-DD" ke "17 Okt 2026".
 * Di-parse manual (bukan new Date(string)) agar tidak bergeser sehari karena zona waktu.
 */
export function formatDate(value) {
    if (typeof value !== "string") return "-";
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
    if (!match) return "-";

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return "-";

    return `${day} ${MONTHS_ID[month - 1]} ${year}`;
}

/**
 * Format timestamp ISO (UTC/offset) ke "17 Okt 2026, 14:30 WIB".
 * Intl id-ID memakai titik pada jam dan tanpa "WIB", jadi string dirakit dari formatToParts.
 */
export function formatDateTime(value) {
    if (value === null || value === undefined || value === "") return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    const parts = Object.fromEntries(
        jakartaPartsFormatter.formatToParts(date).map((part) => [part.type, part.value])
    );

    return `${Number(parts.day)} ${MONTHS_ID[Number(parts.month) - 1]} ${parts.year}, ${parts.hour}:${parts.minute} WIB`;
}

/** Angka ke Rupiah, contoh "Rp 15.000.000"; null/invalid -> "-". */
export function formatRupiah(value) {
    if (value === null || value === undefined || value === "") return "-";
    const number = Number(value);
    if (!Number.isFinite(number)) return "-";

    return rupiahFormatter.format(number).replace(/\u00a0/g, " ");
}

/** Angka dengan pemisah ribuan, contoh "1.500"; null/invalid -> "-". */
export function formatNumber(value) {
    if (value === null || value === undefined || value === "") return "-";
    const number = Number(value);
    if (!Number.isFinite(number)) return "-";

    return numberFormatter.format(number);
}

/** URL Google Maps bila lat dan lng keduanya ada, selain itu null. */
export function buildMapsUrl(lat, lng) {
    const isMissing = (v) => v === null || v === undefined || v === "" || !Number.isFinite(Number(v));
    if (isMissing(lat) || isMissing(lng)) return null;

    return `https://www.google.com/maps?q=${Number(lat)},${Number(lng)}`;
}
