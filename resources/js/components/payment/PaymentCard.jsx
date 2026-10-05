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
        <div className="border rounded-md p-4 mb-4 bg-white shadow-sm">
        <div className="flex justify-between items-start">
            <div>
            <p className="font-semibold text-slate-900">
                {payment.payment_type === 'dp' ? 'Down Payment' : 'Pelunasan'}
            </p>
            <p className="text-slate-600 text-sm">{payment.event?.event_name}</p>
            <p className="text-slate-500 text-xs">
                Tanggal acara: {formatTanggal(payment.event?.event_date)}
            </p>
            </div>
            <div className="text-right">
            <p className="font-bold text-lg text-slate-900">{rupiah(payment.nominal)}</p>
            <PaymentStatusBadge status={payment.status} />
            </div>
        </div>

        {payment.rejection_note && (
            <div className="mt-3 bg-red-50 text-red-700 text-sm p-2 rounded-md">
            Catatan EO: {payment.rejection_note}
            </div>
        )}

        {role === 'client' && payment.status === 'unpaid' && (
            <div className="mt-4">
            <button
                onClick={() => onUpload(payment)}
                className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm hover:bg-slate-700"
            >
                Unggah Bukti Transfer
            </button>
            </div>
        )}

        {role === 'eo' && payment.status === 'pending_verification' && (
            <div className="mt-4 flex gap-2">
            <button
                onClick={() => onVerify(payment, 'approve')}
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700"
            >
                Tandai Lunas
            </button>
            <button
                onClick={() => onVerify(payment, 'reject')}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
            >
                Tolak
            </button>
            </div>
        )}

        {payment.payment_proof_url && (
            <a
            href={`/storage/${payment.payment_proof_url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 text-sm text-blue-600 hover:underline"
            >
            Lihat bukti transfer →
            </a>
        )}
        </div>
    );
    }