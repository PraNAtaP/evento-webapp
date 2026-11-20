<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pengajuan Acara Ditolak</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF6F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2F3931;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAF6F0; padding: 40px 15px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #E8E2D7; box-shadow: 0 4px 12px rgba(0,0,0,0.05);" cellspacing="0" cellpadding="0">

                    <!-- Header -->
                    <tr>
                        <td style="background-color: #657166; padding: 32px 30px; text-align: center;">
                            @php
                                $logoSrc = (isset($message) && method_exists($message, 'embed') && file_exists(public_path('logo.png')))
                                    ? $message->embed(public_path('logo.png'))
                                    : asset('logo.png');
                            @endphp
                            <div style="display: inline-block; background-color: #ffffff; padding: 8px 18px; border-radius: 14px; margin-bottom: 12px;">
                                <img src="{{ $logoSrc }}" alt="EVENTO" height="28" style="height: 28px; width: auto; display: block; border: 0;" />
                            </div>
                            <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">EVENTO PLATFORM</h1>
                            <p style="margin: 6px 0 0 0; color: #E8E2D7; font-size: 13px;">Pemberitahuan Status Pengajuan Acara</p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 36px 32px;">

                            <!-- Status Badge -->
                            <div style="background-color: #FFF7ED; border: 1px solid #FED7AA; border-radius: 14px; padding: 16px 20px; margin-bottom: 24px; text-align: center;">
                                <span style="font-size: 28px; display: block; margin-bottom: 6px;">📋</span>
                                <h2 style="margin: 0; font-size: 17px; font-weight: 800; color: #9A3412;">Pengajuan Acara Belum Dapat Diterima</h2>
                                <p style="margin: 4px 0 0 0; font-size: 12px; color: #C2410C;">Mohon maaf, permohonan acara Anda saat ini belum dapat kami proses.</p>
                            </div>

                            <p style="font-size: 14px; line-height: 1.6; color: #2F3931; margin-top: 0;">
                                Halo <strong>{{ $event->client->name ?? 'Pelanggan' }}</strong>,
                            </p>
                            <p style="font-size: 13px; line-height: 1.6; color: #556056;">
                                Terima kasih telah mengajukan rencana acara Anda melalui platform EVENTO. Setelah meninjau jadwal operasional dan ketersediaan mitra vendor kami, dengan berat hati kami sampaikan bahwa pengajuan berikut <strong>belum dapat diterima</strong>:
                            </p>

                            <!-- Event Detail -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAF6F0; border: 1px solid #E8E2D7; border-radius: 14px; margin: 16px 0; padding: 18px;">
                                <tr>
                                    <td style="padding: 6px 0; font-size: 12px; color: #738075; width: 40%;">Nama Acara:</td>
                                    <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #2F3931;">{{ $event->event_name }}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; font-size: 12px; color: #738075;">Kategori:</td>
                                    <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #2F3931;">{{ ucfirst($event->category) }}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; font-size: 12px; color: #738075;">Rencana Tanggal:</td>
                                    <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #2F3931;">{{ \Carbon\Carbon::parse($event->event_date)->translatedFormat('d F Y') }}</td>
                                </tr>
                            </table>

                            @if (!empty($reason))
                            <!-- Alasan Penolakan -->
                            <div style="background-color: #F8F9FA; border-left: 4px solid #657166; padding: 14px 16px; border-radius: 8px; margin: 20px 0;">
                                <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #738075; text-transform: uppercase;">Catatan dari Event Organizer:</p>
                                <p style="margin: 0; font-size: 13px; color: #2F3931; line-height: 1.5;">{{ $reason }}</p>
                            </div>
                            @endif

                            <p style="font-size: 13px; line-height: 1.6; color: #556056;">
                                Anda dipersilakan untuk mengajukan acara baru dengan opsi tanggal lain atau menyesuaikan detail rencana acara Anda melalui platform EVENTO.
                            </p>

                            <!-- CTA Button -->
                            <div style="text-align: center; margin: 30px 0 10px 0;">
                                <a href="{{ url('/client/dashboard') }}" style="display: inline-block; background-color: #657166; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 28px; border-radius: 12px; box-shadow: 0 2px 6px rgba(101, 113, 102, 0.3);">
                                    Buka Dashboard Klien
                                </a>
                            </div>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #FAF6F0; padding: 20px 30px; text-align: center; border-top: 1px solid #E8E2D7;">
                            <p style="margin: 0; font-size: 11px; color: #A8B2A4;">
                                Email ini dikirim secara otomatis oleh sistem EVENTO Platform. Harap tidak membalas langsung ke alamat email ini.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
