import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, X, ClipboardList, CheckCircle2, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';
import { getProgressLogs, toggleVisibility } from '../../api/progressApi';
import ProgressCard from '../../components/progress/ProgressCard';

export default function ProgressApprovalPage() {
    const { user } = useAuth();
    const { showAlert, showToast } = useDialog();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter & Search
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'visible' | 'hidden'
    const [searchTerm, setSearchTerm] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getProgressLogs();
            setLogs(data ?? []);
        } catch (e) {
            setError(e?.response?.data?.message || 'Gagal memuat catatan progress.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const handleToggle = async (id, isVisible) => {
        try {
            const data = await toggleVisibility(id, isVisible);
            setLogs((prev) =>
                prev.map((l) => (l.id === id ? { ...l, ...data.log } : l))
            );
            showToast(
                isVisible
                    ? 'Progress berhasil dibagikan ke Klien.'
                    : 'Progress berhasil disembunyikan dari Klien.',
                'success'
            );
        } catch (e) {
            await showAlert({
                title: 'Gagal Mengubah Status',
                message: e?.response?.data?.message || 'Gagal mengubah status visibilitas progres.',
                type: 'danger',
            });
        }
    };

    // Filter data
    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            const matchesTab =
                activeTab === 'all'
                    ? true
                    : activeTab === 'visible'
                    ? Boolean(log.is_visible_to_client)
                    : !Boolean(log.is_visible_to_client);

            if (!matchesTab) return false;

            if (!searchTerm.trim()) return true;

            const term = searchTerm.toLowerCase();
            const eventName = (log.assignment?.event?.event_name || '').toLowerCase();
            const vendorName = (log.assignment?.vendor?.business_name || '').toLowerCase();
            const note = (log.note || '').toLowerCase();

            return eventName.includes(term) || vendorName.includes(term) || note.includes(term);
        });
    }, [logs, activeTab, searchTerm]);

    const counts = useMemo(() => {
        const total = logs.length;
        const visible = logs.filter((l) => Boolean(l.is_visible_to_client)).length;
        const hidden = total - visible;
        return { total, visible, hidden };
    }, [logs]);

    if (user && user.role !== 'eo') {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold">
                    Akses ditolak. Halaman ini hanya dapat diakses oleh tim Event Organizer (EO).
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header Title & Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <span className="inline-block text-[11px] font-bold text-[#1D4A54] bg-[#99CDD8]/40 px-3 py-0.5 rounded-full border border-[#85BAC5] mb-1.5 uppercase">
                        MODUL EO & OPERASIONAL
                    </span>
                    <h1 className="text-xl sm:text-2xl font-black text-[#2F3931] tracking-tight">
                        Review Progress Vendor
                    </h1>
                    <p className="text-xs sm:text-sm text-[#738075] mt-1">
                        Tinjau dokumentasi foto dan catatan progres pelaksanaan dari vendor mitra, serta atur visibilitasnya ke klien.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={fetchLogs}
                        disabled={loading}
                        className="px-3.5 py-2.5 bg-white border border-[#E8E2D7] rounded-xl text-xs font-bold text-[#556056] hover:bg-[#FAF6F0] transition shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Muat ulang data"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span>{loading ? 'Memuat...' : 'Segarkan Data'}</span>
                    </button>
                </div>
            </div>

            {/* Metric Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-4.5 border border-[#E8E2D7] shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#738075]">
                            Total Log Masuk
                        </span>
                        <p className="text-2xl font-black text-[#2F3931] mt-1">
                            {counts.total}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#FAF6F0] text-[#657166] border border-[#E8E2D7] flex items-center justify-center font-bold">
                        <ClipboardList className="w-5 h-5 text-[#657166]" />
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4.5 border border-[#E8E2D7] shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#738075]">
                            Terlihat Klien
                        </span>
                        <p className="text-2xl font-black text-emerald-800 mt-1">
                            {counts.visible}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#DAEBE3] text-[#224436] border border-[#BCD4C9] flex items-center justify-center font-bold">
                        <Eye className="w-5 h-5 text-[#224436]" />
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4.5 border border-[#E8E2D7] shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#738075]">
                            Internal EO / Belum Dibagikan
                        </span>
                        <p className="text-2xl font-black text-amber-800 mt-1">
                            {counts.hidden}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#FDE8D3] text-[#63482B] border border-[#E8CEB2] flex items-center justify-center font-bold">
                        <EyeOff className="w-5 h-5 text-[#63482B]" />
                    </div>
                </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="bg-white rounded-2xl border border-[#E8E2D7] p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    <button
                        type="button"
                        onClick={() => setActiveTab('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                            activeTab === 'all'
                                ? 'bg-[#2F3931] text-white shadow-xs'
                                : 'bg-[#FAF6F0] text-[#738075] hover:bg-[#E8E2D7]/50'
                        }`}
                    >
                        Semua Progres ({counts.total})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('visible')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                            activeTab === 'visible'
                                ? 'bg-[#2F3931] text-white shadow-xs'
                                : 'bg-[#FAF6F0] text-[#738075] hover:bg-[#E8E2D7]/50'
                        }`}
                    >
                        Terlihat Klien ({counts.visible})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('hidden')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                            activeTab === 'hidden'
                                ? 'bg-[#2F3931] text-white shadow-xs'
                                : 'bg-[#FAF6F0] text-[#738075] hover:bg-[#E8E2D7]/50'
                        }`}
                    >
                        Internal EO ({counts.hidden})
                    </button>
                </div>

                <div className="relative min-w-[240px]">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#738075]" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Cari acara, vendor, catatan..."
                        className="w-full pl-8 pr-7 py-2 text-xs border border-[#E8E2D7] bg-[#FAF6F0]/60 rounded-xl text-[#2F3931] placeholder-[#98A29A] focus:outline-none focus:ring-2 focus:ring-[#99CDD8] focus:border-[#99CDD8] transition"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => setSearchTerm('')}
                            className="absolute right-2.5 top-2.5 text-[#738075] hover:text-[#2F3931] cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Error Feedback */}
            {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{error}</span>
                    </div>
                    <button
                        type="button"
                        onClick={fetchLogs}
                        className="underline font-bold text-rose-900 cursor-pointer"
                    >
                        Coba lagi
                    </button>
                </div>
            )}

            {/* Daftar Log Progress */}
            {loading && logs.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="bg-white rounded-2xl border border-[#E8E2D7] p-5 space-y-4 animate-pulse shadow-xs"
                        >
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <div className="h-4 w-28 bg-[#E8E2D7]/60 rounded-md" />
                                    <div className="h-5 w-44 bg-[#E8E2D7] rounded-md" />
                                </div>
                                <div className="h-6 w-24 bg-[#E8E2D7]/60 rounded-full" />
                            </div>
                            <div className="h-16 bg-[#FAF6F0] rounded-xl" />
                            <div className="h-40 bg-[#FAF6F0] rounded-xl" />
                        </div>
                    ))}
                </div>
            ) : filteredLogs.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-[#E8E2D7] p-12 text-center text-[#738075] shadow-xs">
                    <div className="w-14 h-14 rounded-2xl bg-[#FAF6F0] text-[#657166] border border-[#E8E2D7] flex items-center justify-center mx-auto mb-3">
                        <ClipboardList className="w-7 h-7" />
                    </div>
                    <h3 className="text-sm font-extrabold text-[#2F3931] mb-1">
                        Tidak Ada Catatan Progres
                    </h3>
                    <p className="text-xs max-w-sm mx-auto leading-relaxed text-[#738075]">
                        {searchTerm || activeTab !== 'all'
                            ? 'Tidak ada progres vendor yang cocok dengan filter atau kata kunci pencarian Anda.'
                            : 'Belum ada catatan progres atau dokumentasi foto yang diunggah oleh vendor mitra.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredLogs.map((log) => (
                        <ProgressCard key={log.id} log={log} onToggle={handleToggle} />
                    ))}
                </div>
            )}
        </div>
    );
}