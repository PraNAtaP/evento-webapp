<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Atur Ulang Kata Sandi - EVENTO</title>
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
                            <p style="margin: 6px 0 0 0; color: #E8E2D7; font-size: 13px;">Pengaturan Ulang Kata Sandi Akun</p>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 36px 32px;">
                            <div style="background-color: #FDE8D3; border: 1px solid #E8CEB2; border-radius: 14px; padding: 18px 20px; margin-bottom: 24px; text-align: center;">
                                <span style="font-size: 32px; display: block; margin-bottom: 6px;">🔐</span>
                                <h2 style="margin: 0; font-size: 17px; font-weight: 800; color: #5C3F22;">Permintaan Reset Kata Sandi</h2>
                                <p style="margin: 6px 0 0 0; font-size: 13px; color: #7A5432;">Kami menerima permintaan untuk mengatur ulang kata sandi akun Anda.</p>
                            </div>

                            <p style="font-size: 15px; line-height: 1.6; color: #2F3931; margin-top: 0;">
                                Halo <strong>{{ $user->name }}</strong>,
                            </p>
                            <p style="font-size: 13px; line-height: 1.6; color: #556056;">
                                Anda menerima email ini karena ada permintaan pengaturan ulang kata sandi untuk akun EVENTO dengan alamat email <strong>{{ $user->email }}</strong>. Silakan tekan tombol di bawah ini untuk membuat kata sandi baru:
                            </p>

                            <!-- Button CTA -->
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="{{ $resetUrl }}" target="_blank" style="display: inline-block; background-color: #657166; color: #ffffff; font-weight: 800; font-size: 14px; padding: 14px 32px; text-decoration: none; border-radius: 12px; border: 1px solid #525C53; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);">
                                    Atur Ulang Kata Sandi Sekarang →
                                </a>
                            </div>

                            <div style="background-color: #FAF6F0; border: 1px solid #E8E2D7; border-radius: 12px; padding: 16px; margin: 24px 0;">
                                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #738075;">
                                    <strong>Peringatan Keamanan:</strong> Tautan pengaturan ulang kata sandi ini hanya berlaku selama <strong>{{ $expireMinutes }} menit</strong> dan hanya dapat digunakan <strong>satu kali</strong>. Jika tombol di atas tidak berfungsi, salin dan tempel tautan berikut ke peramban (browser) Anda:
                                </p>
                                <p style="margin: 8px 0 0 0; font-size: 11px; word-break: break-all; color: #657166; font-family: monospace;">
                                    {{ $resetUrl }}
                                </p>
                            </div>

                            <p style="font-size: 12px; line-height: 1.5; color: #8C998E; margin-bottom: 0;">
                                Jika Anda tidak pernah meminta untuk mengatur ulang kata sandi, abaikan email ini secara aman. Akun Anda tetap terlindungi dan kata sandi Anda tidak akan berubah.
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
                                Email ini dikirimkan secara otomatis dari sistem keamanan EVENTO.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>

