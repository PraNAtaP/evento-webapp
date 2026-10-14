<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class SeasonForecastTest extends TestCase
{
    use RefreshDatabase;

    private const HOT_TIP = 'Suhu siang cukup panas, pilih venue ber-AC atau area teduh.';

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2026-10-14 10:00:00');
        Cache::flush();
    }

    /**
     * Membuat respons palsu Open-Meteo dengan ensemble mean, member, dan nilai null.
     *
     * @return array<string, mixed>
     */
    private function fakeForecast(float $monthlyRain, float $tempMax = 31.0, float $tempMin = 24.0): array
    {
        $dailyRain = $monthlyRain / 30;

        return [
            'daily' => [
                'time' => ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04'],
                'precipitation_sum' => [$dailyRain, $dailyRain, null, $dailyRain],
                'precipitation_sum_member01' => [99.0, 99.0, 99.0, 99.0],
                'temperature_2m_max' => [$tempMax, $tempMax, null, $tempMax],
                'temperature_2m_max_member01' => [50.0, 50.0, 50.0, 50.0],
                'temperature_2m_min' => [$tempMin, $tempMin, $tempMin, null],
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'latitude' => -6.2,
            'longitude' => 106.85,
            'tanggal' => '2026-11-15',
        ], $overrides);
    }

    private function postForecast(array $payload)
    {
        $client = User::factory()->client()->create();

        return $this->actingAs($client, 'sanctum')->postJson('/api/musim', $payload);
    }

    public function test_valid_input_returns_forecast_using_ensemble_mean_only(): void
    {
        Http::fake(['seasonal-api.open-meteo.com/*' => Http::response($this->fakeForecast(180.0, 32.0, 24.0))]);

        $response = $this->postForecast($this->payload());

        $response->assertOk()
            ->assertJsonStructure(['periode' => ['mulai', 'selesai'], 'hujan_mm_bulan', 'suhu_max', 'suhu_min', 'ikon', 'musim', 'saran', 'tips'])
            ->assertJson([
                'periode' => ['mulai' => '2026-10-31', 'selesai' => '2026-11-30'],
                'hujan_mm_bulan' => 180.0,
                'suhu_max' => 32.0,
                'suhu_min' => 24.0,
                'musim' => 'Musim hujan / cenderung basah',
            ]);

        Http::assertSent(function ($request): bool {
            $query = $request->data();

            return $query['daily'] === 'temperature_2m_max,temperature_2m_min,precipitation_sum'
                && $query['start_date'] === '2026-10-31'
                && $query['end_date'] === '2026-11-30';
        });
    }

    public function test_period_start_is_never_before_today(): void
    {
        Http::fake(['seasonal-api.open-meteo.com/*' => Http::response($this->fakeForecast(50.0))]);

        $this->postForecast($this->payload(['tanggal' => '2026-10-20']))
            ->assertOk()
            ->assertJsonPath('periode.mulai', '2026-10-14');
    }

    /**
     * @return array<string, array{float, string, string, string, list<string>}>
     */
    public static function categoryProvider(): array
    {
        return [
            'sangat basah' => [350.0, '⛈️', 'Musim hujan (sangat basah)', 'Prioritaskan venue indoor atau gedung tertutup.', [
                'Hindari acara outdoor murni.',
                'Pastikan area parkir dan akses masuk ternaung.',
                'Siapkan jalur tamu yang tidak becek.',
            ]],
            'batas 300' => [300.0, '⛈️', 'Musim hujan (sangat basah)', 'Prioritaskan venue indoor atau gedung tertutup.', [
                'Hindari acara outdoor murni.',
                'Pastikan area parkir dan akses masuk ternaung.',
                'Siapkan jalur tamu yang tidak becek.',
            ]],
            'cenderung basah' => [200.0, '🌧️', 'Musim hujan / cenderung basah', 'Pilih venue indoor, atau outdoor yang punya atap/tenda permanen.', [
                'Siapkan tenda cadangan.',
                'Sediakan payung untuk tamu.',
                'Pertimbangkan jadwal acara siang agar hujan sore tidak mengganggu.',
            ]],
            'batas 150' => [150.0, '🌧️', 'Musim hujan / cenderung basah', 'Pilih venue indoor, atau outdoor yang punya atap/tenda permanen.', [
                'Siapkan tenda cadangan.',
                'Sediakan payung untuk tamu.',
                'Pertimbangkan jadwal acara siang agar hujan sore tidak mengganggu.',
            ]],
            'pancaroba' => [120.0, '🌦️', 'Peralihan (pancaroba)', 'Pilih venue semi-outdoor atau outdoor dengan rencana cadangan.', [
                'Cuaca bisa berubah cepat, siapkan tenda cadangan.',
                'Pantau forecast jangka pendek saat H-14.',
            ]],
            'batas 100' => [100.0, '🌦️', 'Peralihan (pancaroba)', 'Pilih venue semi-outdoor atau outdoor dengan rencana cadangan.', [
                'Cuaca bisa berubah cepat, siapkan tenda cadangan.',
                'Pantau forecast jangka pendek saat H-14.',
            ]],
            'kemarau' => [40.0, '☀️', 'Musim kemarau / cenderung kering', 'Venue outdoor relatif aman, tapi pilih yang teduh atau sejuk.', [
                'Cari area teduh, pepohonan, atau ventilasi bagus.',
                'Sediakan air minum dan kipas/pendingin.',
                'Hindari acara tengah hari di area terbuka.',
            ]],
        ];
    }

    /**
     * @param  list<string>  $expectedTips
     *
     * @dataProvider categoryProvider
     */
    #[DataProvider('categoryProvider')]
    public function test_category_returns_saran_and_tips(float $rain, string $ikon, string $musim, string $saran, array $expectedTips): void
    {
        Http::fake(['seasonal-api.open-meteo.com/*' => Http::response($this->fakeForecast($rain, 31.0))]);

        $this->postForecast($this->payload())
            ->assertOk()
            ->assertJsonPath('ikon', $ikon)
            ->assertJsonPath('musim', $musim)
            ->assertJsonPath('saran', $saran)
            ->assertJsonPath('tips', $expectedTips);
    }

    public function test_hot_temperature_tip_replaces_last_tip_when_three_tips(): void
    {
        Http::fake(['seasonal-api.open-meteo.com/*' => Http::response($this->fakeForecast(40.0, 34.0))]);

        $response = $this->postForecast($this->payload())->assertOk();

        $this->assertSame([
            'Cari area teduh, pepohonan, atau ventilasi bagus.',
            'Sediakan air minum dan kipas/pendingin.',
            self::HOT_TIP,
        ], $response->json('tips'));
    }

    public function test_hot_temperature_tip_is_appended_for_two_tip_category(): void
    {
        Http::fake(['seasonal-api.open-meteo.com/*' => Http::response($this->fakeForecast(120.0, 33.0))]);

        $response = $this->postForecast($this->payload())->assertOk();

        $this->assertSame([
            'Cuaca bisa berubah cepat, siapkan tenda cadangan.',
            'Pantau forecast jangka pendek saat H-14.',
            self::HOT_TIP,
        ], $response->json('tips'));
    }

    public function test_cooler_temperature_does_not_add_hot_tip(): void
    {
        Http::fake(['seasonal-api.open-meteo.com/*' => Http::response($this->fakeForecast(40.0, 32.9))]);

        $response = $this->postForecast($this->payload())->assertOk();

        $this->assertNotContains(self::HOT_TIP, $response->json('tips'));
        $this->assertCount(3, $response->json('tips'));
    }

    public function test_past_date_returns_422(): void
    {
        Http::fake();

        $this->postForecast($this->payload(['tanggal' => '2026-10-10']))
            ->assertStatus(422)
            ->assertJsonStructure(['message']);

        Http::assertNothingSent();
    }

    public function test_date_more_than_270_days_ahead_returns_422(): void
    {
        Http::fake();

        $this->postForecast($this->payload(['tanggal' => '2027-07-30']))
            ->assertStatus(422)
            ->assertJsonStructure(['message']);

        Http::assertNothingSent();
    }

    public function test_coordinates_outside_indonesia_return_422(): void
    {
        Http::fake();

        $this->postForecast($this->payload(['latitude' => 35.68, 'longitude' => 139.69]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['latitude']);

        Http::assertNothingSent();
    }

    public function test_invalid_date_format_returns_422(): void
    {
        Http::fake();

        $this->postForecast($this->payload(['tanggal' => '15-11-2026']))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['tanggal']);
    }

    public function test_open_meteo_failure_returns_502(): void
    {
        Http::fake(['seasonal-api.open-meteo.com/*' => Http::response(['error' => true], 500)]);

        $this->postForecast($this->payload())
            ->assertStatus(502)
            ->assertJsonStructure(['message']);
    }

    public function test_open_meteo_out_of_allowed_range_returns_422(): void
    {
        Http::fake([
            'seasonal-api.open-meteo.com/*' => Http::response([
                'error' => true,
                'reason' => "Parameter 'end_date' is out of allowed range from 2025-09-01 to 2027-05-18",
            ], 400),
        ]);

        $response = $this->postForecast($this->payload(['tanggal' => '2027-05-15']));

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'Tanggal acara di luar rentang perkiraan Open-Meteo (saat ini hanya mencakup hingga sekitar 6-7 bulan ke depan).',
            ]);
    }

    public function test_null_precipitation_data_returns_422(): void
    {
        Http::fake([
            'seasonal-api.open-meteo.com/*' => Http::response([
                'daily' => [
                    'time' => ['2027-04-10'],
                    'precipitation_sum' => [null],
                    'temperature_2m_max' => [31.0],
                    'temperature_2m_min' => [25.0],
                ],
            ]),
        ]);

        $response = $this->postForecast($this->payload(['tanggal' => '2027-04-10']));

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'Data perkiraan musim belum tersedia untuk tanggal ini (Open-Meteo saat ini hanya mencakup hingga sekitar 6 bulan ke depan).',
            ]);
    }

    public function test_guest_cannot_access_endpoint(): void
    {
        $this->postJson('/api/musim', $this->payload())->assertUnauthorized();
    }
}
