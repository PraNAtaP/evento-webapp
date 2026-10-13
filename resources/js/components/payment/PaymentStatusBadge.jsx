export default function PaymentStatusBadge({ status }) {
    const config = {
        unpaid: { label: 'Belum Dibayar', className: 'bg-[#F3C3B2]/40 text-[#6B3222] border border-[#F3C3B2]' },
        pending_verification: { label: 'Menunggu Verifikasi', className: 'bg-[#FDE8D3] text-[#5C3F22] border border-[#E8CEB2]' },
        paid: { label: 'Lunas Disahkan', className: 'bg-[#DAEBE3] text-[#2C483D] border border-[#BCD4C9]' },
    };

    const { label, className } = config[status] || config.unpaid;

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-2xs ${className}`}>
            {label}
        </span>
    );
}