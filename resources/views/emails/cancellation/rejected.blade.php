<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Permintaan Pembatalan Ditolak</title>
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
                            <p style="margin: 6px 0 0 0; color: #E8E2D7; font-size: 13px;">Pembaruan Status Permintaan Pembatalan</p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 36px 32px;">

                            <!-- Status Badge -->
                            <div style="background-color: #FFF7ED; border: 1px solid #FED7AA; border-radius: 14px; padding: 16px 20px; margin-bottom: 24px; text-align: center;">
                                <span style="font-size: 28px; display: block; margin-bottom: 6px;">❌</span>
                                <h2 style="margin: 0; font-size: 17px; font-weight: 800; color: #9A3412;">Permintaan Pembatalan Ditolak</h2>
                                <p style="margin: 4px 0 0 0; font-size: 12px; color: #C2410C;">Acara Anda tetap berjalan sesuai jadwal yang telah disepakati.</p>
                            </div>

                            <p style="font-size: 14px; line-height: 1.6; color: #2F3931; margin-top: 0;">
                                Halo <strong>{{ $event->client->name ?? 'Pelanggan' }}</strong>,
                            </p>
                            <p style="font-size: 13px; line-height: 1.6; color: #556056;">
                                Kami ingin memberitahukan bahwa permintaan pembatalan acara Anda <strong>tidak dapat disetujui</strong> oleh tim Event Organizer EVENTO. Acara Anda akan tetap berjalan sesuai dengan jadwal yang telah disepakati.
                            </p>

                            <!-- Event Detail -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAF6F0; border: 1px solid #E8E2D7; border-radius: 14px; margin: 16px 0; padding: 18px;">
                                <tr>
                                    <td style="padding: 6px 0; font-size: 12px; color: #738075; width: 40%;">Nama Acara:</td>
                                    <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #2F3931;">{{ $event->event_name }}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; font-size: 12px; color: #738075;">Tanggal Acara:</td>
                                    <td style="padding: 6px 0; font-size: 12px; color: #2F3931;">{{ $event->event_date ? $event->event_date->format('d M Y') : '-' }}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; font-size: 12px; color: #738075;">Ditinjau pada:</td>
                                    <td style="padding: 6px 0; font-size: 12px; color: #2F3931;">{{ now()->format('d M Y, H:i') }} WIB</td>
                                </tr>
                            </table>

                            <!-- Rejection Reason -->
                            <div style="background-color: #FFF7ED; border-left: 4px solid #F97316; border-radius: 0 10px 10px 0; padding: 14px 16px; margin: 20px 0;">
                                <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 800; color: #9A3412;">Alasan Penolakan dari EO:</p>
                                <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #7C2D12;">{{ $reviewNote }}</p>
                            </div>

                            <p style="font-size: 12px; line-height: 1.6; color: #738075;">
                                Jika Anda memiliki pertanyaan lebih lanjut atau ingin mendiskusikan situasi Anda, jangan ragu untuk menghubungi tim kami secara langsung.
                            </p>

                            <!-- CTA -->
                            <div style="text-align: center; margin: 28px 0 8px 0;">
                                <a href="{{ config('app.url') }}/login" style="background-color: #657166; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 13px 28px; border-radius: 12px; display: inline-block;">
                                    Lihat Detail Acara →
                                </a>
                            </div>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #FAF6F0; padding: 22px 30px; text-align: center; border-top: 1px solid #E8E2D7;">
                            <p style="margin: 0; font-size: 11px; color: #738075; line-height: 1.5;">
                                Email ini dikirim secara otomatis oleh Sistem EVENTO.<br>
                                Hubungi kami di <a href="mailto:support@evento.id" style="color: #657166;">support@evento.id</a> jika ada pertanyaan.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
