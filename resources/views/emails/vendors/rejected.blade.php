<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Status Pendaftaran Vendor - EVENTO</title>
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
                            <p style="margin: 6px 0 0 0; color: #E8E2D7; font-size: 13px;">Pemberitahuan Status Pendaftaran Mitra</p>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 36px 32px;">
                            <div style="background-color: #FEE2E2; border: 1px solid #FCA5A5; border-radius: 14px; padding: 16px 20px; margin-bottom: 24px; text-align: center;">
                                <span style="font-size: 28px; display: block; margin-bottom: 6px;">📋</span>
                                <h2 style="margin: 0; font-size: 17px; font-weight: 800; color: #991B1B;">Pendaftaran Profil Vendor Belum Disetujui</h2>
                                <p style="margin: 4px 0 0 0; font-size: 12px; color: #B91C1C;">Tim kurasi EO EVENTO telah meninjau pengajuan pendaftaran profil bisnis Anda.</p>
                            </div>

                            <p style="font-size: 14px; line-height: 1.6; color: #2F3931; margin-top: 0;">
                                Halo <strong>{{ $vendor->business_name }}</strong>,
                            </p>
                            <p style="font-size: 13px; line-height: 1.6; color: #556056;">
                                Terima kasih atas minat Anda bergabung sebagai mitra vendor di platform EVENTO. Setelah melalui proses kurasi dan peninjauan, pengajuan pendaftaran profil bisnis Anda saat ini belum dapat kami setujui karena alasan berikut:
                            </p>

                            <!-- Reason Box -->
                            <div style="background-color: #FFF5F5; border-left: 4px solid #EF4444; border-radius: 8px; padding: 16px; margin: 20px 0;">
                                <p style="margin: 0; font-size: 11px; text-transform: uppercase; font-weight: 700; color: #991B1B;">Alasan Penolakan dari Tim EO:</p>
                                <p style="margin: 6px 0 0 0; font-size: 13px; font-weight: 600; color: #7F1D1D; line-height: 1.6;">
                                    "{{ $reason }}"
                                </p>
                            </div>

                            <p style="font-size: 12px; line-height: 1.6; color: #738075;">
                                Anda dapat masuk kembali ke dashboard vendor untuk melengkapi atau memperbarui informasi profil, portofolio media sosial, dan nomor kontak yang dapat dihubungi.
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
