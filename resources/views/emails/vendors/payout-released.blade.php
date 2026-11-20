<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pencairan Honor Vendor - EVENTO</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF6F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2F3931;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAF6F0; padding: 40px 15px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #E8E2D7; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);" cellspacing="0" cellpadding="0">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #657166; padding: 32px 30px; text-align: center;">
                            @php
                                $logoSrc = (isset($message) && method_exists($message, 'embed') && file_exists(public_path('logo.png')))
                                    ? $message->embed(public_path('logo.png'))
                                    : asset('logo.png');
                            @endphp
                            <div style="display: inline-block; background-color: #ffffff; padding: 8px 18px; border-radius: 14px; margin-bottom: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
                                <img src="{{ $logoSrc }}" alt="EVENTO" height="28" style="height: 28px; width: auto; display: block; border: 0;" />
                            </div>
                            <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">EVENTO PLATFORM</h1>
                            <p style="margin: 6px 0 0 0; color: #E8E2D7; font-size: 13px;">Voucher Pencairan Honorarium Mitra</p>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 36px 32px;">
                            <div style="background-color: #EBF3E8; border: 1px solid #CFD8C4; border-radius: 14px; padding: 16px 20px; margin-bottom: 24px; text-align: center;">
                                <span style="font-size: 28px; display: block; margin-bottom: 6px;">💰</span>
                                <h2 style="margin: 0; font-size: 17px; font-weight: 800; color: #2A4022;">Honorarium Vendor Telah Dicairkan!</h2>
                                <p style="margin: 4px 0 0 0; font-size: 12px; color: #4F6B43;">Tim EO EVENTO telah mentransfer pembayaran honor atas penugasan acara Anda.</p>
                            </div>

                            <p style="font-size: 14px; line-height: 1.6; color: #2F3931; margin-top: 0;">
                                Halo <strong>{{ $vendor->business_name }}</strong>,
                            </p>
                            <p style="font-size: 13px; line-height: 1.6; color: #556056;">
                                Pencairan honorarium untuk pekerjaan Anda pada acara <strong>{{ $event->title }}</strong> telah berhasil diproses. Rincian voucher pembayaran:
                            </p>

                            <!-- Payout Info Card -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAF6F0; border: 1px solid #E8E2D7; border-radius: 14px; margin: 20px 0; padding: 18px;">
                                <tr>
                                    <td style="padding: 6px 0; font-size: 12px; color: #738075; width: 40%;">Nomor Voucher Kas:</td>
                                    <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #2F3931;">{{ $assignment->payout_receipt_number }}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; font-size: 12px; color: #738075;">Nama Acara:</td>
                                    <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #2F3931;">{{ $event->title }}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; font-size: 12px; color: #738075;">Paket Jasa:</td>
                                    <td style="padding: 6px 0; font-size: 12px; color: #2F3931;">{{ $assignment->package_name }}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; font-size: 12px; color: #738075;">Nominal Dicairkan:</td>
                                    <td style="padding: 6px 0; font-size: 15px; font-weight: 800; color: #2A4022;">
                                        Rp {{ number_format($assignment->payout_nominal ?? $assignment->locked_price, 0, ',', '.') }}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; font-size: 12px; color: #738075;">Waktu Transfer:</td>
                                    <td style="padding: 6px 0; font-size: 12px; color: #2F3931;">
                                        {{ $assignment->payout_at ? \Carbon\Carbon::parse($assignment->payout_at)->translatedFormat('d F Y, H:i') : date('d F Y, H:i') }} WIB
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; font-size: 12px; color: #738075;">Catatan EO:</td>
                                    <td style="padding: 6px 0; font-size: 12px; color: #556056;">{{ $assignment->payout_note ?? 'Transfer honorarium via Rekening Resmi EO.' }}</td>
                                </tr>
                            </table>

                            <p style="font-size: 12px; line-height: 1.6; color: #738075;">
                                Terima kasih atas kerja sama dan dedikasi profesional Anda dalam menyukseskan acara bersama EVENTO!
                            </p>

                            <!-- CTA Button -->
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="{{ url('/vendor/dashboard') }}" style="display: inline-block; background-color: #657166; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-size: 13px; font-weight: 700; border: 1px solid #525C53; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
                                    Buka Dashboard Vendor &rarr;
                                </a>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #FAF6F0; border-top: 1px solid #E8E2D7; padding: 20px 30px; text-align: center;">
                            <p style="margin: 0; font-size: 11px; color: #8C998E;">
                                &copy; {{ date('Y') }} <strong>EVENTO Platform</strong>. Hak Cipta Dilindungi.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
