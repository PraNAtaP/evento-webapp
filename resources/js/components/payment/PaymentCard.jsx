import PaymentStatusBadge from './PaymentStatusBadge';

export default function PaymentCard({ payment, role, onUpload, onVerify }) {
    const rupiah = (n) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(n);

    const formatTanggal = (isoDate) => {
        if (!isoDate) return '-';
        return new Date(isoDate).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    return (
        <div className="border border-[#E8E2D7] rounded-2xl p-5 mb-4 bg-white shadow-xs">
            <div className="flex justify-between items-start">
                <div>
                    <span className="inline-block text-[10px] font-bold text-[#1D4A54] bg-[#99CDD8]/30 px-2 py-0.5 rounded-full border border-[#86BAC5] mb-1">
                        {payment.payment_type === 'dp' ? 'Down Payment (DP)' : 'Pelunasan Akhir'}
                    </span>
                    <h3 className="font-bold text-base text-[#2F3931]">
                        {payment.event?.event_name || 'Acara Evento'}
                    </h3>
                    <p className="text-[#738075] text-xs mt-0.5">
                        Tanggal acara: <span className="font-medium text-[#2F3931]">{formatTanggal(payment.event?.event_date)}</span>
                    </p>
                </div>
                <div className="text-right">
                    <p className="font-extrabold text-lg text-[#2F3931] mb-1.5">{rupiah(payment.nominal)}</p>
                    <PaymentStatusBadge status={payment.status} />
                </div>
            </div>

            {payment.rejection_note && (
                <div className="mt-3 bg-[#F3C3B2]/30 border border-[#F3C3B2] text-[#6B3222] text-xs p-3 rounded-xl font-medium">
                    Catatan EO: {payment.rejection_note}
                </div>
            )}

            {role === 'client' && payment.status === 'unpaid' && (
                <div className="mt-4 pt-3 border-t border-[#F0ECE1]">
                    <button
                        onClick={() => onUpload(payment)}
                        className="bg-[#657166] hover:bg-[#556056] text-white font-bold px-4 py-2 rounded-xl text-xs border border-[#525C53] transition shadow-xs cursor-pointer"
                    >
                        Unggah Bukti Transfer
                    </button>
                </div>
            )}

            {role === 'eo' && payment.status === 'pending_verification' && (
                <div className="mt-4 pt-3 border-t border-[#F0ECE1] flex gap-2">
                    <button
                        onClick={() => onVerify(payment, 'approve')}
                        className="bg-[#DAEBE3] hover:bg-[#cbe0d7] text-[#2C483D] font-bold px-4 py-2 rounded-xl text-xs border border-[#BCD4C9] transition shadow-xs cursor-pointer"
                    >
                        Tandai Lunas
                    </button>
                    <button
                        onClick={() => onVerify(payment, 'reject')}
                        className="bg-[#F3C3B2]/50 hover:bg-[#F3C3B2]/80 text-[#6B3222] font-bold px-4 py-2 rounded-xl text-xs border border-[#E8CEB2] transition shadow-xs cursor-pointer"
                    >
                        Tolak
                    </button>
                </div>
            )}

            {payment.payment_proof_url && (
                <div className="mt-3">
                    <a
                        href={`/storage/${payment.payment_proof_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1D4A54] bg-[#99CDD8]/20 px-3 py-1 rounded-lg border border-[#86BAC5] hover:bg-[#99CDD8]/40 transition"
                    >
                        <span>Lihat bukti transfer</span>
                        <span>→</span>
                    </a>
                </div>
            )}
        </div>
    );
}