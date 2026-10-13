/**
 * Definisi 6 Kolom Tahapan Alur Kerja Kanban Manajemen Event Organizer (EO)
 */
export const KANBAN_COLUMNS = [
    {
        id: "request",
        title: "Request",
        subtitle: "Permintaan Masuk",
        color: "#99cdd8",
        headerBg: "#99cdd8",
        headerText: "#184048",
        counterColor: "#1d4c55",
        columnBg: "rgba(153, 205, 216, 0.16)",
        columnBorder: "#88bcc7",
        badgeColor: "bg-[#99cdd8]/30 text-[#184048]",
        dotColor: "bg-[#99cdd8]",
    },
    {
        id: "drafting_quotation",
        title: "Penyusunan Penawaran",
        subtitle: "Penawaran EO",
        color: "#DAEbe3",
        headerBg: "#DAEbe3",
        headerText: "#224436",
        counterColor: "#295342",
        columnBg: "rgba(218, 235, 227, 0.28)",
        columnBorder: "#b8d9cc",
        badgeColor: "bg-[#DAEbe3]/50 text-[#224436]",
        dotColor: "bg-[#DAEbe3]",
    },
    {
        id: "client_review",
        title: "Review Klien",
        subtitle: "Menunggu Review",
        color: "#fde8d3",
        headerBg: "#fde8d3",
        headerText: "#5a3a1d",
        counterColor: "#6c4522",
        columnBg: "rgba(253, 232, 211, 0.32)",
        columnBorder: "#ebd1b7",
        badgeColor: "bg-[#fde8d3]/60 text-[#5a3a1d]",
        dotColor: "bg-[#fde8d3]",
    },
    {
        id: "awaiting_dp",
        title: "Menunggu DP",
        subtitle: "Pembayaran DP",
        color: "#f3c3b2",
        headerBg: "#f3c3b2",
        headerText: "#552316",
        counterColor: "#6a2d1d",
        columnBg: "rgba(243, 195, 178, 0.24)",
        columnBorder: "#e4ad9b",
        badgeColor: "bg-[#f3c3b2]/50 text-[#552316]",
        dotColor: "bg-[#f3c3b2]",
    },
    {
        id: "on_progress",
        title: "Persiapan",
        subtitle: "Persiapan Teknis",
        color: "#cfd8c4",
        headerBg: "#cfd8c4",
        headerText: "#2d3a28",
        counterColor: "#394932",
        columnBg: "rgba(207, 216, 196, 0.28)",
        columnBorder: "#b9c4ad",
        badgeColor: "bg-[#cfd8c4]/50 text-[#2d3a28]",
        dotColor: "bg-[#cfd8c4]",
    },
    {
        id: "done",
        title: "Done",
        subtitle: "Selesai Diselenggarakan",
        color: "#657166",
        headerBg: "#657166",
        headerText: "#ffffff",
        counterColor: "#4a544b",
        columnBg: "rgba(101, 113, 102, 0.12)",
        columnBorder: "#788579",
        badgeColor: "bg-[#657166]/20 text-[#657166]",
        dotColor: "bg-[#657166]",
    },
];

/**
 * Mapping Kategori Acara dari Enum Database ('wedding', 'seminar', 'birthday')
 */
export const CATEGORY_LABELS = {
    wedding: "Pernikahan",
    seminar: "Seminar",
    birthday: "Ulang Tahun",
};

/**
 * Filter Kategori Acara untuk UI Tab Filter
 */
export const EVENT_CATEGORIES = [
    { value: "all", label: "Semua" },
    { value: "wedding", label: "Pernikahan" },
    { value: "seminar", label: "Seminar" },
    { value: "birthday", label: "Ulang Tahun" },
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
 * Helper untuk format tanggal dari format database YYYY-MM-DD ke format lokal Indonesia
 */
export const formatEventDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        }).format(date);
    } catch {
        return dateStr;
    }
};

/**
 * Menghitung badge status pembayaran berdasarkan persentase paid_amount / agreed_price
 */
export const getPaymentStatus = (agreedPrice = 0, paidAmount = 0) => {
    const safeAgreed = Number(agreedPrice) || 0;
    const safePaid = Number(paidAmount) || 0;

    if (safePaid <= 0) {
        return {
            label: "Belum Bayar (0%)",
            percentage: 0,
            badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
            dotColor: "bg-rose-500",
        };
    }

    if (safePaid >= safeAgreed && safeAgreed > 0) {
        return {
            label: "Lunas (100%)",
            percentage: 100,
            badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
            dotColor: "bg-emerald-500",
        };
    }

    const percentage = safeAgreed > 0 ? Math.round((safePaid / safeAgreed) * 100) : 0;

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
 * Helper untuk menghitung statistik keseluruhan
 */
export const calculateKanbanSummary = (events = []) => {
    return events.reduce(
        (acc, item) => {
            const contract = Number(item.agreed_price ?? item.estimated_budget ?? item.budget) || 0;
            const paid = Number(item.paid_amount ?? item.jumlahDibayar) || 0;

            acc.totalNilaiKontrak += contract;
            acc.totalDibayar += paid;
            acc.totalSisaPembayaran += Math.max(0, contract - paid);
            acc.totalAcara += 1;

            const status = item.kanban_status ?? item.status;
            if (status === "done") {
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
 * Helper untuk menghitung statistik per kolom
 */
export const getColumnStats = (events = [], columnId = "") => {
    const columnCards = events.filter(
        (card) => (card.kanban_status ?? card.status) === columnId
    );

    const totalNilaiKontrak = columnCards.reduce(
        (sum, card) => sum + (Number(card.agreed_price ?? card.estimated_budget ?? card.budget) || 0),
        0
    );

    const totalDibayar = columnCards.reduce(
        (sum, card) => sum + (Number(card.paid_amount ?? card.jumlahDibayar) || 0),
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
 * Data Dummy Acara EO untuk DEV / Offline Preview
 */
export const DUMMY_KANBAN_EVENTS = [
    // 1. Kolom: Request
    {
        id: 1,
        client_id: 1,
        client: { id: 1, name: "Rian Hidayat", email: "rian@example.com" },
        event_name: "Pernikahan Rian & Natasha",
        category: "wedding",
        guest_count: 500,
        estimated_budget: 85000000,
        agreed_price: null,
        quotation_total: 0,
        dp_percentage: 30,
        has_own_venue: true,
        venue: "Hotel Mulia Senayan, Jakarta",
        event_date: "2026-11-14",
        is_multi_day: false,
        end_date: null,
        kanban_status: "request",
        paid_amount: 0,
    },

    // 2. Kolom: Drafting Quotation
    {
        id: 2,
        client_id: 2,
        client: { id: 2, name: "PT Fintek Nusantara", email: "fintek@example.com" },
        event_name: "Seminar AI & Digital Transformation",
        category: "seminar",
        guest_count: 250,
        estimated_budget: 45000000,
        agreed_price: null,
        quotation_total: 42000000,
        dp_percentage: 30,
        has_own_venue: true,
        venue: "ICE BSD Hall 3, Tangerang",
        event_date: "2026-10-28",
        is_multi_day: false,
        end_date: null,
        kanban_status: "drafting_quotation",
        paid_amount: 0,
    },

    // 3. Kolom: Client Review
    {
        id: 3,
        client_id: 3,
        client: { id: 3, name: "Sarah Wijaya", email: "sarah@example.com" },
        event_name: "Pernikahan Tradisional Dimas & Sarah",
        category: "wedding",
        guest_count: 700,
        estimated_budget: 125000000,
        agreed_price: null,
        quotation_total: 125000000,
        dp_percentage: 35,
        has_own_venue: true,
        venue: "The Dharmawangsa, Jakarta Selatan",
        event_date: "2026-10-18",
        is_multi_day: true,
        end_date: "2026-10-19",
        kanban_status: "client_review",
        paid_amount: 0,
    },

    // 4. Kolom: Awaiting DP
    {
        id: 4,
        client_id: 4,
        client: { id: 4, name: "Ibu Maya Kartika", email: "maya@example.com" },
        event_name: "Sweet 17th Birthday Party Aurel",
        category: "birthday",
        guest_count: 120,
        estimated_budget: 35000000,
        agreed_price: 35000000,
        quotation_total: 35000000,
        dp_percentage: 30,
        has_own_venue: false,
        venue: "Plataran Menteng, Jakarta Pusat",
        event_date: "2026-11-08",
        is_multi_day: false,
        end_date: null,
        kanban_status: "awaiting_dp",
        paid_amount: 0, // Unpaid
    },

    // 5. Kolom: On Progress
    {
        id: 5,
        client_id: 5,
        client: { id: 5, name: "PT Nusantara Prima Group", email: "nusantara@example.com" },
        event_name: "Seminar Akbar Strategi Bisnis 2027",
        category: "seminar",
        guest_count: 400,
        estimated_budget: 60000000,
        agreed_price: 60000000,
        quotation_total: 60000000,
        dp_percentage: 30,
        has_own_venue: true,
        venue: "The Ritz-Carlton Pacific Place, Jakarta",
        event_date: "2026-10-25",
        is_multi_day: false,
        end_date: null,
        kanban_status: "on_progress",
        paid_amount: 18000000, // DP Lunas 30%
    },

    // 6. Kolom: Done
    {
        id: 6,
        client_id: 6,
        client: { id: 6, name: "Kevin Ardiansyah", email: "kevin@example.com" },
        event_name: "Resepsi Pernikahan Kevin & Vania",
        category: "wedding",
        guest_count: 600,
        estimated_budget: 115000000,
        agreed_price: 115000000,
        quotation_total: 115000000,
        dp_percentage: 30,
        has_own_venue: true,
        venue: "Ayana Midplaza, Jakarta",
        event_date: "2026-09-15",
        is_multi_day: false,
        end_date: null,
        kanban_status: "done",
        paid_amount: 115000000, // Lunas 100%
    },
];
