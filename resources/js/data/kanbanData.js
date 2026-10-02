/**
 * Definisi 4 Kolom Kanban Manajemen Event Organizer (EO)
 */
export const KANBAN_COLUMNS = [
    {
        id: "request",
        title: "Request",
        subtitle: "Permintaan Masuk",
        badgeColor: "bg-amber-100 text-amber-800",
        dotColor: "bg-amber-500",
    },
    {
        id: "dp_paid",
        title: "DP Paid",
        subtitle: "DP Terverifikasi",
        badgeColor: "bg-blue-100 text-blue-800",
        dotColor: "bg-blue-500",
    },
    {
        id: "on_progress",
        title: "On Progress",
        subtitle: "Persiapan Teknis",
        badgeColor: "bg-purple-100 text-purple-800",
        dotColor: "bg-purple-500",
    },
    {
        id: "done",
        title: "Done",
        subtitle: "Selesai Diselenggarakan",
        badgeColor: "bg-emerald-100 text-emerald-800",
        dotColor: "bg-emerald-500",
    },
];

/**
 * Daftar Kategori Acara dalam Bahasa Indonesia
 */
export const EVENT_CATEGORIES = [
    "Semua",
    "Pernikahan",
    "Gathering Kantor",
    "Ulang Tahun",
    "Seminar",
];

/**
 * Helper untuk format mata uang Rupiah
 */
export const formatRupiah = (amount, isShort = false) => {
    if (typeof amount !== "number" || isNaN(amount)) return "Rp 0";

    if (isShort) {
        if (amount >= 1_000_000_000) {
            return `Rp ${(amount / 1_000_000_000).toFixed(1)} M`;
        }
        if (amount >= 1_000_000) {
            return `Rp ${(amount / 1_000_000).toFixed(0)} Jt`;
        }
    }

    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(amount);
};

/**
 * Menghitung badge status pembayaran berdasarkan persentase jumlahDibayar / nilaiKontrak
 * serta mendukung status khusus seperti 'menunggu_invoice' (warna netral).
 */
export const getPaymentStatus = (nilaiKontrak = 0, jumlahDibayar = 0, customStatus = null) => {
    // 1. Status khusus: Menunggu Invoice (Warna Netral)
    if (customStatus === "menunggu_invoice") {
        return {
            label: "Menunggu Invoice",
            percentage: 0,
            badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
            dotColor: "bg-slate-400",
        };
    }

    const safeKontrak = Number(nilaiKontrak) || 0;
    const safeDibayar = Number(jumlahDibayar) || 0;

    // 2. Belum ada pembayaran sama sekali
    if (safeDibayar <= 0) {
        return {
            label: "Belum Bayar (0%)",
            percentage: 0,
            badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
            dotColor: "bg-rose-500",
        };
    }

    // 3. Sudah lunas (>= 100%)
    if (safeDibayar >= safeKontrak && safeKontrak > 0) {
        return {
            label: "Lunas (100%)",
            percentage: 100,
            badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
            dotColor: "bg-emerald-500",
        };
    }

    // 4. Pembayaran sebagian (Persentase)
    const percentage = safeKontrak > 0 ? Math.round((safeDibayar / safeKontrak) * 100) : 0;

    if (percentage <= 50) {
        return {
            label: `DP Lunas (${percentage}%)`,
            percentage,
            badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
            dotColor: "bg-blue-500",
        };
    }

    return {
        label: `Termin (${percentage}%)`,
        percentage,
        badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
        dotColor: "bg-indigo-500",
    };
};

/**
 * Helper untuk menghitung statistik keseluruhan (Dashboard / Summary)
 */
export const calculateKanbanSummary = (events = []) => {
    return events.reduce(
        (acc, item) => {
            const kontrak = Number(item.nilaiKontrak ?? item.budget) || 0;
            const dibayar = Number(item.jumlahDibayar) || 0;

            acc.totalNilaiKontrak += kontrak;
            acc.totalDibayar += dibayar;
            acc.totalSisaPembayaran += Math.max(0, kontrak - dibayar);
            acc.totalAcara += 1;

            if (item.status === "done") {
                acc.acaraSelesai += 1;
            } else {
                acc.acaraAktif += 1;
            }

            return acc;
        },
        {
            totalNilaiKontrak: 0,
            totalDibayar: 0,
            totalSisaPembayaran: 0,
            totalAcara: 0,
            acaraAktif: 0,
            acaraSelesai: 0,
        }
    );
};

/**
 * Helper untuk menghitung statistik per kolom (Jumlah kartu, total kontrak, total dibayar)
 */
export const getColumnStats = (events = [], columnId = "") => {
    const columnCards = events.filter((card) => card.status === columnId);

    const totalNilaiKontrak = columnCards.reduce(
        (sum, card) => sum + (Number(card.nilaiKontrak ?? card.budget) || 0),
        0
    );

    const totalDibayar = columnCards.reduce(
        (sum, card) => sum + (Number(card.jumlahDibayar) || 0),
        0
    );

    return {
        cards: columnCards,
        jumlahKartu: columnCards.length,
        totalNilaiKontrak,
        totalDibayar,
        totalSisa: Math.max(0, totalNilaiKontrak - totalDibayar),
    };
};

/**
 * Data Dummy 9 Acara EO Lengkap (Angka Number pada nilaiKontrak & jumlahDibayar)
 */
export const DUMMY_KANBAN_EVENTS = [
    // 1. Kolom: Request
    {
        id: "evt-01",
        status: "request",
        namaEvent: "Pernikahan Rian & Natasha",
        namaKlien: "Rian Hidayat",
        kategori: "Pernikahan",
        tanggalEvent: "14 Nov 2026",
        lokasi: "Hotel Mulia Senayan, Jakarta",
        nilaiKontrak: 85000000,
        jumlahDibayar: 0,
        customStatus: null,
        hariTersisa: 45,
    },
    {
        id: "evt-02",
        status: "request",
        namaEvent: "Seminar AI & Digital Transformation",
        namaKlien: "PT Fintek Digital Nusantara",
        kategori: "Seminar",
        tanggalEvent: "28 Okt 2026",
        lokasi: "ICE BSD Hall 3, Tangerang",
        nilaiKontrak: 42000000,
        jumlahDibayar: 0,
        customStatus: "menunggu_invoice",
        hariTersisa: 28,
    },

    // 2. Kolom: DP Paid
    {
        id: "evt-03",
        status: "dp_paid",
        namaEvent: "Pernikahan Tradisional Dimas & Sarah",
        namaKlien: "Sarah Wijaya",
        kategori: "Pernikahan",
        tanggalEvent: "18 Okt 2026",
        lokasi: "The Dharmawangsa, Jakarta Selatan",
        nilaiKontrak: 125000000,
        jumlahDibayar: 37500000, // 30%
        customStatus: null,
        hariTersisa: 18,
    },
    {
        id: "evt-04",
        status: "dp_paid",
        namaEvent: "Ulang Tahun Sweet 17th Aurel",
        namaKlien: "Ibu Maya Kartika",
        kategori: "Ulang Tahun",
        tanggalEvent: "08 Nov 2026",
        lokasi: "Plataran Menteng, Jakarta",
        nilaiKontrak: 32000000,
        jumlahDibayar: 16000000, // 50%
        customStatus: null,
        hariTersisa: 39,
    },

    // 3. Kolom: On Progress
    {
        id: "evt-05",
        status: "on_progress",
        namaEvent: "Gathering Kantor Tahunan PT Nusantara",
        namaKlien: "PT Nusantara Prima Group",
        kategori: "Gathering Kantor",
        tanggalEvent: "05 Okt 2026",
        lokasi: "The Ritz-Carlton Pacific Place",
        nilaiKontrak: 160000000,
        jumlahDibayar: 112000000, // 70%
        customStatus: null,
        hariTersisa: 5,
    },
    {
        id: "evt-06",
        status: "on_progress",
        namaEvent: "Seminar Nasional Kesehatan 2026",
        namaKlien: "Asosiasi Medika Indonesia",
        kategori: "Seminar",
        tanggalEvent: "12 Okt 2026",
        lokasi: "Jakarta Convention Center (JCC)",
        nilaiKontrak: 65000000,
        jumlahDibayar: 32500000, // 50%
        customStatus: null,
        hariTersisa: 12,
    },
    {
        id: "evt-07",
        status: "on_progress",
        namaEvent: "Pesta Ulang Tahun Emas Ke-50 Bpk. Hendra",
        namaKlien: "Hendra Gunawan",
        kategori: "Ulang Tahun",
        tanggalEvent: "24 Okt 2026",
        lokasi: "Hotel Indonesia Kempinski, Jakarta",
        nilaiKontrak: 48000000,
        jumlahDibayar: 38400000, // 80%
        customStatus: null,
        hariTersisa: 24,
    },

    // 4. Kolom: Done
    {
        id: "evt-08",
        status: "done",
        namaEvent: "Gathering Akbar Family Day PT Auto Global",
        namaKlien: "PT Wahana Auto Global",
        kategori: "Gathering Kantor",
        tanggalEvent: "20 Sep 2026",
        lokasi: "Taman Mini Indonesia Indah (TMII)",
        nilaiKontrak: 210000000,
        jumlahDibayar: 210000000, // 100%
        customStatus: null,
        hariTersisa: 0,
    },
    {
        id: "evt-09",
        status: "done",
        namaEvent: "Resepsi Pernikahan Kevin & Vania",
        namaKlien: "Kevin Ardiansyah",
        kategori: "Pernikahan",
        tanggalEvent: "15 Sep 2026",
        lokasi: "Ayana Midplaza, Jakarta",
        nilaiKontrak: 115000000,
        jumlahDibayar: 115000000, // 100%
        customStatus: null,
        hariTersisa: 0,
    },
];
