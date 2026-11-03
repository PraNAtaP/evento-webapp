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

    const isLunas = payment.status === 'paid';

    return (
        <div className="border border-[#E8E2D7] rounded-2xl p-5 mb-4 bg-white shadow-sm hover:shadow-md transition-shadow">
        {/* Header Kartu */}
        <div className="flex justify-between items-start mb-4 pb-3 border-b border-[#E8E2D7]">
            <div>
            <h3 className="font-bold text-lg text-[#2F3931]">
                {payment.payment_type === 'dp' ? 'Down Payment (DP)' : 'Pelunasan'}
            </h3>
            <p className="text-sm text-[#738075] font-medium">
                {payment.event?.event_name || 'Nama Acara'}
            </p>
            <p className="text-xs text-[#738075] mt-0.5">
                Pelaksanaan: {formatTanggal(payment.event?.event_date)}
            </p>
            </div>
            <div className="text-right">
            <p className="font-black text-xl text-[#2F3931]">
                {rupiah(payment.nominal)}
            </p>
            <PaymentStatusBadge status={payment.status} />
            </div>
        </div>

        {/* Pesan Penolakan (Jika Ada) */}
        {payment.rejection_note && (
            <div className="mb-4 bg-[#FDE8D3] text-[#63482B] text-sm p-3 rounded-xl border border-[#E8CEB2]">
            <span className="font-bold">Catatan EO:</span> {payment.rejection_note}
            </div>
        )}

        {/* Tombol Aksi & Bukti */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-2">
            <div className="flex gap-2">
            {/* Tombol Upload Bukti (Klien) */}
            {role === 'client' && payment.status === 'unpaid' && (
                <button
                onClick={() => onUpload(payment)}
                className="bg-[#657166] hover:bg-[#4A534B] text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer"
                >
                Unggah Bukti Transfer
                </button>
            )}

            {/* Tombol Verifikasi (EO) */}
            {role === 'eo' && payment.status === 'pending_verification' && (
                <>
                <button
                    onClick={() => onVerify(payment, 'approve')}
                    className="bg-[#DAEBE3] hover:bg-[#C5DED4] text-[#2F3931] border border-[#CFD8C4] px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer"
                >
                    Tandai Lunas
                </button>
                <button
                    onClick={() => onVerify(payment, 'reject')}
                    className="bg-[#F3C3B2] hover:bg-[#EAAFA0] text-[#63482B] border border-[#EAAFA0] px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer"
                >
                    Tolak
                </button>
                </>
            )}

            {/* Link Bukti Transfer */}
            {payment.payment_proof_url && (
                <a
                href={`/storage/${payment.payment_proof_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#99CDD8] hover:text-[#7AB5C2] transition-colors px-3 py-2"
                >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Lihat Bukti
                </a>
            )}
            </div>

            {/* Tombol Dokumen (Lihat Invoice & Kwitansi) */}
            <div className="flex gap-2">
            {/* Invoice: Muncul jika BELUM lunas */}
            {!isLunas && (
                <button
                className="border border-[#CFD8C4] text-[#738075] hover:bg-[#F3F0EA] px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-not-allowed"
                title="Fitur pratinjau PDF segera hadir"
                >
                Lihat Invoice
                </button>
            )}

            {/* Kwitansi: Muncul jika SUDAH lunas */}
            {isLunas && (
                <button
                className="border border-[#CFD8C4] text-[#738075] hover:bg-[#F3F0EA] px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-not-allowed"
                title="Fitur pratinjau PDF segera hadir"
                >
                Lihat Kwitansi
                </button>
            )}
            </div>
        </div>
        </div>
    );
    }