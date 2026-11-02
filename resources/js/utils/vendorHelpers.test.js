import { describe, expect, it } from "vitest";
import {
    extractFieldErrors,
    formatVendorCategory,
    getInitials,
    getOfferStatusMeta,
    isNegotiatedPrice,
    parsePriceInput,
} from "./vendorHelpers";

describe("formatVendorCategory", () => {
    it("mengembalikan 'Tanpa kategori' untuk null, undefined, dan string kosong", () => {
        expect(formatVendorCategory(null)).toBe("Tanpa kategori");
        expect(formatVendorCategory(undefined)).toBe("Tanpa kategori");
        expect(formatVendorCategory("")).toBe("Tanpa kategori");
        expect(formatVendorCategory("   ")).toBe("Tanpa kategori");
    });

    it("mengembalikan kategori yang sudah di-trim", () => {
        expect(formatVendorCategory("  Catering ")).toBe("Catering");
    });
});

describe("getOfferStatusMeta", () => {
    it("memetakan status dikenal ke label", () => {
        expect(getOfferStatusMeta("pending").label).toBe("Menunggu vendor");
        expect(getOfferStatusMeta("accepted").label).toBe("Diterima vendor");
        expect(getOfferStatusMeta("rejected").label).toBe("Ditolak vendor");
    });

    it("mengembalikan null untuk status tak dikenal", () => {
        expect(getOfferStatusMeta("lainnya")).toBeNull();
        expect(getOfferStatusMeta(undefined)).toBeNull();
    });
});

describe("isNegotiatedPrice", () => {
    it("true bila harga berbeda dari harga paket", () => {
        expect(isNegotiatedPrice(45000000, 50000000)).toBe(true);
    });

    it("false bila sama atau selisih di bawah setengah sen", () => {
        expect(isNegotiatedPrice(50000000, 50000000)).toBe(false);
        expect(isNegotiatedPrice(50000000.001, 50000000)).toBe(false);
    });

    it("false bila salah satu tidak ada atau tidak valid", () => {
        expect(isNegotiatedPrice(null, 100)).toBe(false);
        expect(isNegotiatedPrice(100, undefined)).toBe(false);
        expect(isNegotiatedPrice("abc", 100)).toBe(false);
    });

    it("harga 0 yang berbeda dari paket tetap dianggap nego", () => {
        expect(isNegotiatedPrice(0, 100)).toBe(true);
    });
});

describe("parsePriceInput", () => {
    it("string kosong berarti pakai harga paket (null)", () => {
        expect(parsePriceInput("")).toEqual({ value: null });
        expect(parsePriceInput("   ")).toEqual({ value: null });
        expect(parsePriceInput(null)).toEqual({ value: null });
    });

    it("menerima angka >= 0, termasuk 0", () => {
        expect(parsePriceInput("45000000")).toEqual({ value: 45000000 });
        expect(parsePriceInput("0")).toEqual({ value: 0 });
        expect(parsePriceInput(1500.5)).toEqual({ value: 1500.5 });
    });

    it("menolak negatif dan non-angka", () => {
        expect(parsePriceInput("-1").error).toBe("Harga tidak boleh negatif.");
        expect(parsePriceInput("abc").error).toBe("Harga harus berupa angka.");
    });
});

describe("getInitials", () => {
    it("mengambil huruf awal maksimal dua kata", () => {
        expect(getInitials("Dekorasi Impian Kita")).toBe("DI");
        expect(getInitials("katering")).toBe("K");
    });

    it("fallback '?' untuk nilai kosong", () => {
        expect(getInitials("")).toBe("?");
        expect(getInitials("   ")).toBe("?");
        expect(getInitials(null)).toBe("?");
    });
});

describe("extractFieldErrors", () => {
    it("mengambil pesan pertama per field", () => {
        const error = { response: { data: { errors: { price: ["Harga tidak boleh negatif.", "x"], event: ["Status salah"] } } } };

        expect(extractFieldErrors(error)).toEqual({ price: "Harga tidak boleh negatif.", event: "Status salah" });
    });

    it("mengembalikan objek kosong bila tidak ada errors", () => {
        expect(extractFieldErrors(new Error("x"))).toEqual({});
        expect(extractFieldErrors(undefined)).toEqual({});
    });
});
