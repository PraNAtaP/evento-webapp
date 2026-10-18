    const STAGES = [
    { key: 'request', label: 'Pengajuan', desc: 'Acara sedang diajukan', icon: '📝' },
    { key: 'drafting_quotation', label: 'Penyusunan Penawaran', desc: 'EO sedang menyusun penawaran', icon: '📋' },
    { key: 'client_review', label: 'Review Klien', desc: 'Menunggu persetujuan Anda', icon: '🔍' },
    { key: 'awaiting_dp', label: 'Menunggu DP', desc: 'Menunggu pembayaran DP', icon: '💳' },
    { key: 'on_progress', label: 'Dikerjakan', desc: 'Acara sedang dipersiapkan', icon: '🔨' },
    { key: 'done', label: 'Selesai', desc: 'Acara telah selesai', icon: '🎉' },
    ];

    export default function ProgressTimeline({ event }) {
    const currentIndex = STAGES.findIndex((s) => s.key === event.kanban_status);
    const safeIndex = currentIndex === -1 ? 0 : currentIndex;

    const formatTanggal = (dateString) => {
        if (!dateString) return '-';
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        });
    };

    const formattedEventDate = formatTanggal(event.event_date);
    const formattedLastUpdate = formatTanggal(event.updated_at);

    return (
        <div className="bg-white rounded-2xl border border-[#E8E2D7] p-5 shadow-sm hover:shadow-md transition-shadow mb-4 flex flex-col">
        
        {/* Header Kartu: Judul & Status */}
        <div className="flex items-start justify-between mb-4 pb-4 border-b border-[#E8E2D7]">
            <div>
            <h3 className="text-base font-black text-[#2F3931] tracking-tight">
                {event.event_name === "-" ? "Acara Tanpa Nama" : event.event_name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-medium text-[#738075]">
                <span>📅 Pelaksanaan:</span>
                <span>{formattedEventDate}</span>
            </div>
            </div>
            
            <span className="px-2.5 py-1 text-[11px] font-bold text-[#2F3931] bg-[#DAEBE3] rounded-md border border-[#CFD8C4] shrink-0 ml-2">
            {STAGES[safeIndex]?.label}
            </span>
        </div>

        {/* Timeline */}
        <div className="space-y-0 flex-1">
            {STAGES.map((stage, i) => {
            const isDone = i < safeIndex;
            const isCurrent = i === safeIndex;
            
            return (
                <div key={stage.key} className="flex gap-3 relative group">
                <div className="flex flex-col items-center">
                    <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] shadow-sm transition-all z-10 ${
                        isDone 
                        ? 'bg-[#657166] text-white' 
                        : isCurrent 
                        ? 'bg-[#99CDD8] text-[#2F3931] ring-4 ring-[#DAEBE3] scale-110 font-bold' 
                        : 'bg-[#F3F0EA] text-[#A8B2A4] border border-[#CFD8C4]'
                    }`}
                    >
                    {isDone ? '✓' : isCurrent ? '●' : stage.icon}
                    </div>
                    {i < STAGES.length - 1 && (
                    <div className={`w-0.5 h-10 my-0.5 ${isDone ? 'bg-[#657166]' : 'bg-[#E8E2D7]'}`} />
                    )}
                </div>

                <div className={`flex-1 pb-4 ${i === STAGES.length - 1 ? 'pb-0' : ''}`}>
                    <p className={`text-sm font-bold ${isCurrent ? 'text-[#2F3931]' : isDone ? 'text-[#424C43]' : 'text-[#A8B2A4]'}`}>
                    {stage.label}
                    </p>
                    <p className={`text-[11px] leading-snug mt-0.5 ${isCurrent ? 'text-[#556056]' : isDone ? 'text-[#738075]' : 'text-[#A8B2A4]'}`}>
                    {stage.desc}
                    </p>
                </div>
                </div>
            );
            })}
        </div>

        {/* Footer: Terakhir Update */}
        <div className="mt-4 pt-3 border-t border-[#E8E2D7] text-[11px] font-medium text-[#738075] flex items-center gap-1.5">
            <span>🔄</span>
            <span>Terakhir diperbarui: {formattedLastUpdate}</span>
        </div>

        </div>
    );
    }