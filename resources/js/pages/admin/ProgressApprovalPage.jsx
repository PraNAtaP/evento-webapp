import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getProgressLogs, toggleVisibility } from '../../api/progressApi';
import ProgressCard from '../../components/progress/ProgressCard';

export default function ProgressApprovalPage() {
    const { user } = useAuth(); // Pastikan role EO
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getProgressLogs();
            setLogs(data);
        } catch (e) {
            setError(e?.response?.data?.message || 'Gagal memuat progress.');
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
        } catch (e) {
            alert(e?.response?.data?.message || 'Gagal mengubah status.');
        }
    };

    // (Opsional) Kalau kamu belum pakai ProtectedRoute, ini pengaman ekstra:
    if (user && user.role !== 'eo') {
        return <div className="p-6 text-red-600">Akses ditolak. Halaman ini hanya untuk EO.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold">Review Progress Vendor</h1>
                <button
                    onClick={fetchLogs}
                    disabled={loading}
                    className="text-sm text-slate-600 hover:text-slate-900 disabled:opacity-50"
                >
                    {loading ? 'Memuat…' : 'Muat ulang'}
                </button>
            </div>

            {error && <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">{error}</div>}
            {loading && logs.length === 0 && <p className="text-slate-500">Memuat progress…</p>}
            {!loading && logs.length === 0 && !error && (
                <p className="text-slate-500">Belum ada progress dari vendor.</p>
            )}

            {logs.map((log) => (
                <ProgressCard key={log.id} log={log} onToggle={handleToggle} />
            ))}
        </div>
    );
}