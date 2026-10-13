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
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">
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
        </div>
    );
}
