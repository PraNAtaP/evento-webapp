export default function PaymentStatusBadge({ status }) {
    const config = {
        unpaid: { label: 'Belum Dibayar', className: 'bg-rose-100 text-rose-900 border border-rose-300 font-bold' },
        pending_verification: { label: 'Menunggu Verifikasi', className: 'bg-amber-100 text-amber-950 border border-amber-300 font-bold' },
        paid: { label: 'Lunas Disahkan', className: 'bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold' },
    };

    const { label, className } = config[status] || config.unpaid;

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-2xs ${className}`}>
            {label}
        </span>
    );
}