    export default function PaymentStatusBadge({ status }) {
    const config = {
        unpaid: { label: 'Belum Dibayar', className: 'bg-red-100 text-red-700' },
        pending_verification: { label: 'Menunggu Verifikasi', className: 'bg-yellow-100 text-yellow-700' },
        paid: { label: 'Lunas', className: 'bg-green-100 text-green-700' },
    };

    const { label, className } = config[status] || config.unpaid;

    return (
        <span className={`px-3 py-1 rounded-md text-sm font-medium ${className}`}>
        {label}
        </span>
    );
    }