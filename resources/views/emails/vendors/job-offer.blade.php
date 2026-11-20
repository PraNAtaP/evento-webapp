<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tawaran Pekerjaan Baru - EVENTO</title>
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
                            <p style="margin: 6px 0 0 0; color: #E8E2D7; font-size: 13px;">Penugasan Mitra Vendor</p>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 36px 32px;">
                            <div style="background-color: #DAEBE3; border: 1px solid #B6C2AA; border-radius: 14px; padding: 16px 20px; margin-bottom: 24px; text-align: center;">
                                <span style="font-size: 28px; display: block; margin-bottom: 6px;">💼</span>
                                <h2 style="margin: 0; font-size: 17px; font-weight: 800; color: #1F4B54;">Anda Menerima Tawaran Pekerjaan Baru!</h2>
                                <p style="margin: 4px 0 0 0; font-size: 12px; color: #2D6B77;">Tim EO EVENTO telah memilih paket layanan usaha Anda untuk sebuah acara.</p>
                            </div>

                            <p style="font-size: 14px; line-height: 1.6; color: #2F3931; margin-top: 0;">
                                Halo <strong>{{ $vendor->business_name }}</strong>,
                            </p>
                            <p style="font-size: 13px; line-height: 1.6; color: #556056;">
                                Anda mendapatkan tawaran penugasan baru dari tim Event Organizer untuk acara <strong>{{ $event->title }}</strong>. Berikut rincian pekerjaannya:
                            </p>

                            <!-- Job Offer Info -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAF6F0; border: 1px solid #E8E2D7; border-radius: 14px; margin: 20px 0; padding: 18px;">
                                <tr>
                                    <td style="padding: 6px 0; font-size: 12px; color: #738075; width: 40%;">Nama Acara:</td>
                                    <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #2F3931;">{{ $event->title }}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; font-size: 12px; color: #738075;">Tanggal Pelaksanaan:</td>
                                    <td style="padding: 6px 0; font-size: 12px; color: #2F3931; font-weight: 600;">
                                        {{ $event->event_date ? \Carbon\Carbon::parse($event->event_date)->translatedFormat('d F Y') : '-' }}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; font-size: 12px; color: #738075;">Lokasi Acara:</td>
                                    <td style="padding: 6px 0; font-size: 12px; color: #2F3931;">{{ $event->location ?? '-' }}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; font-size: 12px; color: #738075;">Paket Jasa Dipilih:</td>
                                    <td style="padding: 6px 0; font-size: 12px; font-weight: 600; color: #2F3931;">
                                        {{ $assignment->package_name }}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; font-size: 12px; color: #738075;">Nilai Honor (Locked Price):</td>
                                    <td style="padding: 6px 0; font-size: 15px; font-weight: 800; color: #2A4022;">
                                        Rp {{ number_format($assignment->locked_price, 0, ',', '.') }}
                                    </td>
                                </tr>
                                @if($assignment->notes)
                                <tr>
                                    <td style="padding: 6px 0; font-size: 12px; color: #738075;">Catatan Khusus EO:</td>
                                    <td style="padding: 6px 0; font-size: 12px; color: #556056;">{{ $assignment->notes }}</td>
                                </tr>
                                @endif
                            </table>

                            <p style="font-size: 12px; line-height: 1.6; color: #738075;">
                                Silakan buka dashboard vendor Anda untuk meninjau penugasan ini secara mendalam dan memilih opsi <strong>Terima</strong> atau <strong>Tolak</strong> tawaran.
                            </p>

                            <!-- CTA Button -->
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="{{ url('/vendor/job-offers') }}" style="display: inline-block; background-color: #657166; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-size: 13px; font-weight: 700; border: 1px solid #525C53; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
                                    Buka Tawaran Pekerjaan &rarr;
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
