<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pendaftaran Vendor Disetujui</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF6F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2F3931;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAF6F0; padding: 40px 15px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #E8E2D7; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);" cellspacing="0" cellpadding="0">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #657166; padding: 32px 30px; text-align: center;">
                            <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background-color: #F3C3B2; color: #55271C; font-weight: 900; font-size: 24px; border-radius: 12px; margin-bottom: 12px;">E</div>
                            <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">EVENTO PLATFORM</h1>
                            <p style="margin: 6px 0 0 0; color: #E8E2D7; font-size: 13px;">Pemberitahuan Persetujuan Mitra Vendor</p>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 36px 32px;">
                            <div style="background-color: #EBF3E8; border: 1px solid #CFD8C4; border-radius: 14px; padding: 16px 20px; margin-bottom: 24px; text-align: center;">
                                <span style="font-size: 28px; display: block; margin-bottom: 6px;">🎉</span>
                                <h2 style="margin: 0; font-size: 17px; font-weight: 800; color: #2A4022;">Selamat! Akun Vendor Anda Resmi Disetujui</h2>
                                <p style="margin: 4px 0 0 0; font-size: 12px; color: #4F6B43;">Tim Event Organizer (EO) EVENTO telah selesai memverifikasi profil usaha Anda.</p>
                            </div>

                            <p style="font-size: 14px; line-height: 1.6; color: #2F3931; margin-top: 0;">
                                Halo <strong>{{ $vendor->user->name ?? 'Mitra Vendor' }}</strong>,
                            </p>
                            <p style="font-size: 13px; line-height: 1.6; color: #556056;">
                                Kami dengan senang hati menginformasikan bahwa permohonan kemitraan vendor untuk usaha Anda telah berhasil disetujui oleh tim kurator EO EVENTO:
                            </p>

                            <!-- Vendor Card Info -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAF6F0; border: 1px solid #E8E2D7; border-radius: 14px; margin: 20px 0; padding: 18px;">
                                <tr>
                                    <td style="padding: 6px 0; font-size: 12px; color: #738075; width: 40%;">Nama Usaha:</td>
                                    <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #2F3931;">{{ $vendor->business_name }}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; font-size: 12px; color: #738075;">Kategori:</td>
                                    <td style="padding: 6px 0; font-size: 12px; font-weight: 600; color: #2F3931;">
                                        <span style="background-color: #DAEBE3; color: #1F4B54; padding: 3px 8px; border-radius: 6px; font-size: 11px;">{{ $vendor->category }}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; font-size: 12px; color: #738075;">Kontak Bisnis:</td>
                                    <td style="padding: 6px 0; font-size: 12px; color: #2F3931;">{{ $vendor->contact_number }}</td>
                                </tr>
                                @if($vendor->social_media)
                                <tr>
                                    <td style="padding: 6px 0; font-size: 12px; color: #738075;">Media Sosial:</td>
                                    <td style="padding: 6px 0; font-size: 12px; color: #2F3931; font-weight: 600;">{{ $vendor->social_media }}</td>
                                </tr>
                                @endif
                                <tr>
                                    <td style="padding: 6px 0; font-size: 12px; color: #738075;">Tanggal Disetujui:</td>
                                    <td style="padding: 6px 0; font-size: 12px; color: #2F3931;">{{ $vendor->approved_at ? $vendor->approved_at->format('d M Y, H:i') : date('d M Y, H:i') }} WIB</td>
                                </tr>
                            </table>

                            <h3 style="font-size: 14px; font-weight: 800; color: #2F3931; margin: 24px 0 10px 0;">Langkah Selanjutnya:</h3>
                            <ol style="font-size: 13px; line-height: 1.7; color: #556056; padding-left: 20px; margin: 0 0 24px 0;">
                                <li><strong>Masuk ke Dashboard Vendor:</strong> Gunakan email dan kata sandi yang Anda daftarkan.</li>
                                <li><strong>Buat Paket Layanan:</strong> Publikasikan katalog paket foto, catering, dekorasi, atau sewa perlengkapan Anda.</li>
                                <li><strong>Terima Tawaran Acara:</strong> Pantau dan tanggapi tawaran kolaborasi langsung dari Event Organizer EVENTO.</li>
                            </ol>

                            <!-- CTA Button -->
                            <div style="text-align: center; margin: 30px 0 16px 0;">
                                <a href="{{ config('app.url') }}/login" style="background-color: #657166; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 13px 28px; border-radius: 12px; display: inline-block; box-shadow: 0 2px 6px rgba(101, 113, 102, 0.3);">
                                    Masuk ke Dashboard Vendor →
                                </a>
                            </div>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #FAF6F0; padding: 22px 30px; text-align: center; border-top: 1px solid #E8E2D7;">
                            <p style="margin: 0; font-size: 11px; color: #738075; line-height: 1.5;">
                                Email ini dikirim secara otomatis oleh Sistem EVENTO untuk mitra vendor terdaftar.<br>
                                Jika Anda memiliki pertanyaan, silakan hubungi tim dukungan kami di support@evento.id.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
