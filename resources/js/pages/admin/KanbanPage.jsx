import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import KanbanBoard from "../../components/kanban/KanbanBoard";
import {
    DUMMY_KANBAN_EVENTS,
    EVENT_CATEGORIES,
} from "../../data/kanbanData";

export default function KanbanPage() {
    const { user, logout } = useAuth();
    const [events] = useState(DUMMY_KANBAN_EVENTS);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("Semua");

    // Filter kartu berdasarkan pencarian kata kunci dan kategori acara
    const filteredEvents = events.filter((evt) => {
        const categoryName = evt.kategori || evt.category || "";
        const matchesCategory =
            selectedCategory === "Semua" ||
            categoryName.toLowerCase() === selectedCategory.toLowerCase();

        const title = evt.namaEvent || evt.title || "";
        const client = evt.namaKlien || evt.clientName || "";
        const location = evt.lokasi || evt.location || "";

        const query = searchQuery.toLowerCase();
        const matchesSearch =
            title.toLowerCase().includes(query) ||
            client.toLowerCase().includes(query) ||
            location.toLowerCase().includes(query);

        return matchesCategory && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
            {/* Top Navigation Bar */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                    {/* Brand & Breadcrumb */}
                    <div className="flex items-center gap-4">
                        <Link
                            to="/admin/dashboard"
                            className="flex items-center gap-2 group"
                        >
                            <span className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-lg flex items-center justify-center shadow-xs group-hover:bg-blue-700 transition-colors">
                                E
                            </span>
                            <div>
                                <span className="font-extrabold text-base tracking-tight text-slate-900 block leading-tight">
                                    EVENTO
                                </span>
                                <span className="text-[10px] font-semibold tracking-wider text-blue-600 uppercase">
                                    Dashboard Internal EO
                                </span>
                            </div>
                        </Link>

                        <div className="hidden sm:block h-5 w-px bg-slate-200" />

                        <nav className="hidden sm:flex items-center text-xs text-slate-500 gap-1.5">
                            <Link
                                to="/admin/dashboard"
                                className="hover:text-slate-800 transition-colors"
                            >
                                Dashboard
                            </Link>
                            <span>/</span>
                            <span className="font-semibold text-slate-800">
                                Papan Kanban Acara
                            </span>
                        </nav>
                    </div>

                    {/* Right User Actions */}
                    <div className="flex items-center gap-3">
                        <Link
                            to="/admin/dashboard"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            <svg
                                width="14"
                                height="14"
                                style={{ minWidth: 14, minHeight: 14 }}
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                />
                            </svg>
                            <span>Dashboard Utama</span>
                        </Link>

                        <div className="h-6 w-px bg-slate-200" />

                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200">
                                {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
                            </div>
                            <div className="hidden md:block text-left">
                                <p className="text-xs font-semibold text-slate-800 leading-none">
                                    {user?.name || "Admin EO"}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                    Event Organizer
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={logout}
                            title="Keluar akun"
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        >
                            <svg
                                width="16"
                                height="16"
                                style={{ minWidth: 16, minHeight: 16 }}
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* Sub-header: Ringkasan & Filter */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
                {/* Header Title */}
                <div className="pb-2 border-b border-slate-200">
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        Papan Kanban Acara
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Pantau kemajuan seluruh proyek event organizer mulai dari permintaan masuk, pembayaran DP, persiapan teknis, hingga selesai.
                    </p>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[240px]">
                        <svg
                            width="16"
                            height="16"
                            style={{ minWidth: 16, minHeight: 16 }}
                            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama acara, nama klien, atau lokasi..."
                            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                        />
                    </div>

                    {/* Kategori Acara dalam Bahasa Indonesia */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                        {EVENT_CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                                    selectedCategory === cat
                                        ? "bg-blue-600 text-white shadow-xs"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Kanban Board Container */}
                <div className="flex-1">
                    <KanbanBoard cards={filteredEvents} />
                </div>
            </main>
        </div>
    );
}
