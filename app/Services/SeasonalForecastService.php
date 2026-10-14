<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use InvalidArgumentException;

class SeasonalForecastService
{
    private const ENDPOINT = 'https://seasonal-api.open-meteo.com/v1/seasonal';

    private const DAILY_VARIABLES = ['temperature_2m_max', 'temperature_2m_min', 'precipitation_sum'];

    /** Batas maksimal hari ke depan yang didukung (Open-Meteo seasonal ~9 bulan). */
    public const MAX_DAYS_AHEAD = 270;

    private const CACHE_TTL_HOURS = 12;

    private const MAX_TIPS = 3;

    private const HOT_TEMPERATURE = 33.0;

    private const HOT_TIP = 'Suhu siang cukup panas, pilih venue ber-AC atau area teduh.';

    /**
     * Ambang curah hujan bulanan (mm) dari tinggi ke rendah. Nilai >= ambang
     * memakai kunci kategori di CATEGORIES; di bawah semua ambang = kemarau.
     *
     * @var array<string, int>
     */
    private const THRESHOLDS = [
        'sangat_basah' => 300,
        'basah' => 150,
        'pancaroba' => 100,
    ];

    /**
     * Teks per kategori musim. Edit teks di sini saja.
     *
     * @var array<string, array{ikon: string, musim: string, saran: string, tips: list<string>}>
     */
    private const CATEGORIES = [
        'sangat_basah' => [
            'ikon' => '⛈️',
            'musim' => 'Musim hujan (sangat basah)',
            'saran' => 'Prioritaskan venue indoor atau gedung tertutup.',
            'tips' => [
                'Hindari acara outdoor murni.',
                'Pastikan area parkir dan akses masuk ternaung.',
                'Siapkan jalur tamu yang tidak becek.',
            ],
        ],
        'basah' => [
            'ikon' => '🌧️',
            'musim' => 'Musim hujan / cenderung basah',
            'saran' => 'Pilih venue indoor, atau outdoor yang punya atap/tenda permanen.',
            'tips' => [
                'Siapkan tenda cadangan.',
                'Sediakan payung untuk tamu.',
                'Pertimbangkan jadwal acara siang agar hujan sore tidak mengganggu.',
            ],
        ],
        'pancaroba' => [
            'ikon' => '🌦️',
            'musim' => 'Peralihan (pancaroba)',
            'saran' => 'Pilih venue semi-outdoor atau outdoor dengan rencana cadangan.',
            'tips' => [
                'Cuaca bisa berubah cepat, siapkan tenda cadangan.',
                'Pantau forecast jangka pendek saat H-14.',
            ],
        ],
        'kemarau' => [
            'ikon' => '☀️',
            'musim' => 'Musim kemarau / cenderung kering',
            'saran' => 'Venue outdoor relatif aman, tapi pilih yang teduh atau sejuk.',
            'tips' => [
                'Cari area teduh, pepohonan, atau ventilasi bagus.',
                'Sediakan air minum dan kipas/pendingin.',
                'Hindari acara tengah hari di area terbuka.',
            ],
        ],
    ];

    /**
     * Perkiraan musim untuk lokasi dan tanggal acara (rentang +-$window hari).
     *
     * @return array{
     *     periode: array{mulai: string, selesai: string},
     *     hujan_mm_bulan: float,
     *     suhu_max: float,
     *     suhu_min: float,
     *     ikon: string,
     *     musim: string,
     *     saran: string,
     *     tips: list<string>
     * }
     *
     * @throws InvalidArgumentException jika tanggal sudah lewat, terlalu jauh, atau data tidak tersedia
     */
    public function forEvent(float $lat, float $lon, string $date, int $window = 15): array
    {
        $today = CarbonImmutable::today();
        $eventDate = CarbonImmutable::createFromFormat('Y-m-d', $date)?->startOfDay();

        if ($eventDate === null) {
            throw new InvalidArgumentException('Format tanggal tidak valid.');
        }

        $daysAhead = (int) $today->diffInDays($eventDate, false);

        if ($daysAhead < 0) {
            throw new InvalidArgumentException('Tanggal acara sudah lewat.');
        }

        if ($daysAhead > self::MAX_DAYS_AHEAD) {
            throw new InvalidArgumentException('Tanggal acara terlalu jauh. Perkiraan musim hanya tersedia sekitar 9 bulan ke depan.');
        }

        $start = $eventDate->subDays($window);
        if ($start->lessThan($today)) {
            $start = $today;
        }

        $end = $eventDate->addDays($window);
        $limit = $today->addDays(self::MAX_DAYS_AHEAD);
        if ($end->greaterThan($limit)) {
            $end = $limit;
        }

        $cacheKey = sprintf(
            'seasonal:%.1f:%.1f:%s:%s',
            round($lat, 1),
            round($lon, 1),
            $start->toDateString(),
            $end->toDateString(),
        );

        $daily = Cache::remember(
            $cacheKey,
            now()->addHours(self::CACHE_TTL_HOURS),
            fn (): array => $this->fetchDaily($lat, $lon, $start, $end),
        );

        $precipitation = $this->meanOf($daily['precipitation_sum'] ?? []);
        $tempMax = $this->meanOf($daily['temperature_2m_max'] ?? []);
        $tempMin = $this->meanOf($daily['temperature_2m_min'] ?? []);

        if ($precipitation === null || $tempMax === null || $tempMin === null) {
            throw new InvalidArgumentException('Data perkiraan musim belum tersedia untuk tanggal ini (Open-Meteo saat ini hanya mencakup hingga sekitar 6 bulan ke depan).');
        }

        $monthlyRain = round($precipitation * 30, 1);
        $category = self::CATEGORIES[$this->classify($monthlyRain)];
        $tempMax = round($tempMax, 1);

        return [
            'periode' => [
                'mulai' => $start->toDateString(),
                'selesai' => $end->toDateString(),
            ],
            'hujan_mm_bulan' => $monthlyRain,
            'suhu_max' => $tempMax,
            'suhu_min' => round($tempMin, 1),
            'ikon' => $category['ikon'],
            'musim' => $category['musim'],
            'saran' => $category['saran'],
            'tips' => $this->buildTips($category['tips'], $tempMax),
        ];
    }

    /**
     * Menentukan kunci kategori dari estimasi curah hujan bulanan (mm).
     */
    private function classify(float $monthlyRain): string
    {
        foreach (self::THRESHOLDS as $key => $minimum) {
            if ($monthlyRain >= $minimum) {
                return $key;
            }
        }

        return 'kemarau';
    }

    /**
     * Menambahkan tip suhu panas di akhir, lalu memotong maksimal MAX_TIPS.
     *
     * @param  list<string>  $tips
     * @return list<string>
     */
    private function buildTips(array $tips, float $tempMax): array
    {
        if ($tempMax >= self::HOT_TEMPERATURE) {
            $tips = array_slice($tips, 0, self::MAX_TIPS - 1);
            $tips[] = self::HOT_TIP;
        }

        return array_slice($tips, 0, self::MAX_TIPS);
    }

    /**
     * Mengambil data harian ensemble mean (bukan member) dari Open-Meteo.
     *
     * @return array<string, list<float|null>>
     */
    private function fetchDaily(float $lat, float $lon, CarbonImmutable $start, CarbonImmutable $end): array
    {
        try {
            $response = Http::timeout(30)
                ->retry(2, 200)
                ->get(self::ENDPOINT, [
                    'latitude' => $lat,
                    'longitude' => $lon,
                    'daily' => implode(',', self::DAILY_VARIABLES),
                    'start_date' => $start->toDateString(),
                    'end_date' => $end->toDateString(),
                    'timezone' => 'auto',
                ])
                ->throw();
        } catch (RequestException $e) {
            $reason = (string) $e->response?->json('reason');
            if (str_contains($reason, 'out of allowed range')) {
                throw new InvalidArgumentException('Tanggal acara di luar rentang perkiraan Open-Meteo (saat ini hanya mencakup hingga sekitar 6-7 bulan ke depan).');
            }

            throw $e;
        }

        $daily = $response->json('daily');

        return is_array($daily) ? array_intersect_key($daily, array_flip(self::DAILY_VARIABLES)) : [];
    }

    /**
     * Rata-rata nilai non-null; null jika tidak ada data.
     *
     * @param  array<int, float|int|null>  $values
     */
    private function meanOf(array $values): ?float
    {
        $values = array_filter($values, fn ($value): bool => is_numeric($value));

        return $values === [] ? null : array_sum($values) / count($values);
    }
}
