import { describe, expect, it } from "vitest";
import {
    buildMapsUrl,
    formatBool,
    formatDate,
    formatDateTime,
    formatNumber,
    formatRupiah,
    orDash,
} from "./formatters";

describe("orDash", () => {
    it("mengubah null, undefined, dan string kosong menjadi '-'", () => {
        expect(orDash(null)).toBe("-");
        expect(orDash(undefined)).toBe("-");
        expect(orDash("")).toBe("-");
        expect(orDash("   ")).toBe("-");
    });

    it("mempertahankan angka 0 dan teks biasa", () => {
        expect(orDash(0)).toBe(0);
        expect(orDash("Hotel Savana")).toBe("Hotel Savana");
    });
});

describe("formatBool", () => {
    it("true -> Ya, false -> Tidak, null -> '-'", () => {
        expect(formatBool(true)).toBe("Ya");
        expect(formatBool(false)).toBe("Tidak");
        expect(formatBool(null)).toBe("-");
        expect(formatBool(undefined)).toBe("-");
    });
});

describe("formatDate", () => {
    it("memformat tanggal Indonesia", () => {
        expect(formatDate("2026-10-17")).toBe("17 Okt 2026");
        expect(formatDate("2027-02-13")).toBe("13 Feb 2027");
        expect(formatDate("2026-05-01")).toBe("1 Mei 2026");
        expect(formatDate("2026-08-09")).toBe("9 Agu 2026");
    });

    it("tidak bergeser sehari di batas tahun/bulan", () => {
        expect(formatDate("2026-01-01")).toBe("1 Jan 2026");
        expect(formatDate("2026-12-31")).toBe("31 Des 2026");
    });

    it("mengembalikan '-' untuk input kosong atau tidak valid", () => {
        expect(formatDate(null)).toBe("-");
        expect(formatDate("")).toBe("-");
        expect(formatDate("bukan-tanggal")).toBe("-");
        expect(formatDate("2026-13-01")).toBe("-");
    });
});

describe("formatDateTime", () => {
    it("mengonversi UTC ke WIB (UTC+7)", () => {
        expect(formatDateTime("2026-10-17T07:30:00Z")).toBe("17 Okt 2026, 14:30 WIB");
    });

    it("melewati pergantian hari saat konversi ke WIB", () => {
        expect(formatDateTime("2026-10-17T20:00:00Z")).toBe("18 Okt 2026, 03:00 WIB");
    });

    it("memakai titik dua, bukan titik, sebagai pemisah jam", () => {
        expect(formatDateTime("2026-10-13T03:40:01+00:00")).toBe("13 Okt 2026, 10:40 WIB");
    });

    it("mengembalikan '-' untuk input kosong atau tidak valid", () => {
        expect(formatDateTime(null)).toBe("-");
        expect(formatDateTime("")).toBe("-");
        expect(formatDateTime("xxx")).toBe("-");
    });
});

describe("formatRupiah", () => {
    it("memformat Rupiah tanpa desimal", () => {
        expect(formatRupiah(15000000)).toBe("Rp 15.000.000");
        expect(formatRupiah(248000000)).toBe("Rp 248.000.000");
    });

    it("angka 0 tetap ditampilkan sebagai Rp 0", () => {
        expect(formatRupiah(0)).toBe("Rp 0");
    });

    it("null -> '-'", () => {
        expect(formatRupiah(null)).toBe("-");
        expect(formatRupiah(undefined)).toBe("-");
    });
});

describe("formatNumber", () => {
    it("memakai pemisah ribuan titik", () => {
        expect(formatNumber(1500)).toBe("1.500");
        expect(formatNumber(100)).toBe("100");
    });

    it("angka 0 tetap '0' dan null -> '-'", () => {
        expect(formatNumber(0)).toBe("0");
        expect(formatNumber(null)).toBe("-");
    });
});

describe("buildMapsUrl", () => {
    it("membangun URL bila lat dan lng ada", () => {
        expect(buildMapsUrl(-7.9626238, 112.636413)).toBe(
            "https://www.google.com/maps?q=-7.9626238,112.636413"
        );
    });

    it("mengembalikan null bila salah satu atau keduanya null", () => {
        expect(buildMapsUrl(null, 112.6)).toBeNull();
        expect(buildMapsUrl(-7.9, null)).toBeNull();
        expect(buildMapsUrl(null, null)).toBeNull();
        expect(buildMapsUrl(undefined, undefined)).toBeNull();
    });

    it("koordinat 0 dianggap valid", () => {
        expect(buildMapsUrl(0, 0)).toBe("https://www.google.com/maps?q=0,0");
    });
});
