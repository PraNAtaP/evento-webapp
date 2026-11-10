<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verifikasi Alamat Email - EVENTO</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF6F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2F3931;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAF6F0; padding: 40px 15px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #E8E2D7; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);" cellspacing="0" cellpadding="0">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #657166; padding: 32px 30px; text-align: center;">
                            <div style="display: inline-block; background-color: #ffffff; padding: 8px 18px; border-radius: 14px; margin-bottom: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
                                <img src="{{ asset('logo.png') }}" alt="EVENTO" height="28" style="height: 28px; width: auto; display: block; border: 0;" />
                            </div>
                            <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">EVENTO PLATFORM</h1>
                            <p style="margin: 6px 0 0 0; color: #E8E2D7; font-size: 13px;">Verifikasi Alamat Email Pelanggan</p>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 36px 32px;">
                            <div style="background-color: #EBF3E8; border: 1px solid #CFD8C4; border-radius: 14px; padding: 18px 20px; margin-bottom: 24px; text-align: center;">
                                <span style="font-size: 32px; display: block; margin-bottom: 6px;">✉️</span>
                                <h2 style="margin: 0; font-size: 17px; font-weight: 800; color: #2A4022;">Satu Langkah Lagi Menuju Acara Impian Anda!</h2>
                                <p style="margin: 6px 0 0 0; font-size: 13px; color: #4F6B43;">Konfirmasikan bahwa ini memang alamat email Anda untuk mengaktifkan akun.</p>
                            </div>

                            <p style="font-size: 15px; line-height: 1.6; color: #2F3931; margin-top: 0;">
                                Halo <strong>{{ $user->name }}</strong>,
                            </p>
                            <p style="font-size: 13px; line-height: 1.6; color: #556056;">
                                Terima kasih telah mendaftar sebagai pelanggan di <strong>EVENTO</strong>. Untuk menjaga keamanan akun Anda dan memastikan Anda dapat menerima penawaran dari Event Organizer, silakan verifikasi alamat email Anda dengan menekan tombol di bawah ini:
                            </p>

                            <!-- Button CTA -->
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="{{ $verificationUrl }}" target="_blank" style="display: inline-block; background-color: #657166; color: #ffffff; font-weight: 800; font-size: 14px; padding: 14px 32px; text-decoration: none; border-radius: 12px; border: 1px solid #525C53; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);">
                                    ✓ Verifikasi Alamat Email Saya
                                </a>
                            </div>

                            <div style="background-color: #FAF6F0; border: 1px solid #E8E2D7; border-radius: 12px; padding: 16px; margin: 24px 0;">
                                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #738075;">
                                    <strong>Catatan Keamanan:</strong> Tautan verifikasi ini hanya berlaku selama <strong>60 menit</strong>. Jika tombol di atas tidak dapat diklik, salin dan tempel URL berikut ke peramban (browser) Anda:
                                </p>
                                <p style="margin: 8px 0 0 0; font-size: 11px; word-break: break-all; color: #657166; font-family: monospace;">
                                    {{ $verificationUrl }}
                                </p>
                            </div>

                            <p style="font-size: 12px; line-height: 1.5; color: #8C998E; margin-bottom: 0;">
                                Jika Anda tidak merasa mendaftar akun di platform EVENTO, silakan abaikan email ini dengan aman.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #FAF6F0; border-top: 1px solid #E8E2D7; padding: 20px 30px; text-align: center;">
                            <p style="margin: 0; font-size: 11px; color: #8C998E;">
                                &copy; {{ date('Y') }} <strong>EVENTO Platform</strong>. Hak Cipta Dilindungi Undang-Undang.
                            </p>
                            <p style="margin: 4px 0 0 0; font-size: 11px; color: #A4B0A6;">
                                Email ini dikirimkan secara otomatis dari sistem autentikasi EVENTO.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>

