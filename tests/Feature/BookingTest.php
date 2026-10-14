<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Memastikan klien yang terautentikasi dapat mengambil daftar tanggal yang sudah dibooking.
     */
    public function test_authenticated_client_can_fetch_booked_dates(): void
    {
        $client = User::factory()->client()->create();

        Event::factory()->create([
            'event_date' => '2026-11-15',
            'is_multi_day' => false,
            'end_date' => null,
        ]);
        Event::factory()->create([
            'event_date' => '2026-11-10',
            'is_multi_day' => false,
            'end_date' => null,
        ]);
        Event::factory()->create([
            'event_date' => '2026-12-01',
            'is_multi_day' => false,
            'end_date' => null,
        ]);

        $response = $this->actingAs($client, 'sanctum')
            ->getJson('/api/bookings/booked-dates');

        $response->assertOk()
            ->assertExactJson([
                '2026-11-10',
                '2026-11-15',
                '2026-12-01',
            ]);
    }

    /**
     * Memastikan jika belum ada acara yang dibooking, response berupa array kosong.
     */
    public function test_empty_booked_dates_returns_empty_array(): void
    {
        $client = User::factory()->client()->create();

        $response = $this->actingAs($client, 'sanctum')
            ->getJson('/api/bookings/booked-dates');

        $response->assertOk()
            ->assertExactJson([]);
    }

    /**
     * Memastikan klien dapat membuat booking baru dengan data lengkap dan tanggal memenuhi H-min.
     */
    public function test_authenticated_client_can_create_booking_successfully(): void
    {
        $client = User::factory()->client()->create();
        $validWeddingDate = now()->addDays(70)->format('Y-m-d');

        $response = $this->actingAs($client, 'sanctum')
            ->postJson('/api/bookings', [
                'event_name' => 'Pernikahan Budi & Siti',
                'category' => 'wedding',
                'guest_count' => 300,
                'budget' => 75000000,
                'has_own_venue' => true,
                'venue' => 'Grand Ballroom Hotel Indonesia',
                'lat' => -7.9797,
                'lng' => 112.6304,
                'event_date' => $validWeddingDate,
                'is_multi_day' => false,
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'message' => 'Booking acara berhasil dibuat.',
                'event' => [
                    'client_id' => $client->id,
                    'event_name' => 'Pernikahan Budi & Siti',
                    'category' => 'wedding',
                    'guest_count' => 300,
                    'has_own_venue' => true,
                    'venue' => 'Grand Ballroom Hotel Indonesia',
                    'lat' => -7.9797,
                    'lng' => 112.6304,
                    'event_date' => $validWeddingDate,
                    'is_multi_day' => false,
                    'end_date' => null,
                    'kanban_status' => 'request',
                ],
            ]);

        $this->assertDatabaseHas('events', [
            'client_id' => $client->id,
            'event_name' => 'Pernikahan Budi & Siti',
            'category' => 'wedding',
            'guest_count' => 300,
            'event_date' => $validWeddingDate,
            'lat' => -7.9797,
            'lng' => 112.6304,
            'kanban_status' => 'request',
        ]);
    }

    /**
     * Memastikan aturan H-min dinamis kategori Wedding (minimal H-60).
     */
    public function test_wedding_booking_fails_if_less_than_h_minus_60(): void
    {
        $client = User::factory()->client()->create();
        $invalidWeddingDate = now()->addDays(45)->format('Y-m-d'); // Kurang dari 60 hari

        $response = $this->actingAs($client, 'sanctum')
            ->postJson('/api/bookings', [
                'event_name' => 'Pernikahan Kilat',
                'category' => 'wedding',
                'guest_count' => 150,
                'budget' => 50000000,
                'has_own_venue' => false,
                'event_date' => $invalidWeddingDate,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['event_date'])
            ->assertJsonPath('errors.event_date.0', 'Pemesanan kategori Wedding minimal H-60 (60 hari sebelum acara).');
    }

    /**
     * Memastikan aturan H-min dinamis kategori Seminar (minimal H-30).
     */
    public function test_seminar_booking_fails_if_less_than_h_minus_30(): void
    {
        $client = User::factory()->client()->create();
        $invalidSeminarDate = now()->addDays(20)->format('Y-m-d'); // Kurang dari 30 hari

        $response = $this->actingAs($client, 'sanctum')
            ->postJson('/api/bookings', [
                'event_name' => 'Seminar Teknologi AI',
                'category' => 'seminar',
                'guest_count' => 100,
                'budget' => 20000000,
                'has_own_venue' => true,
                'venue' => 'Auditorium Kampus',
                'event_date' => $invalidSeminarDate,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['event_date'])
            ->assertJsonPath('errors.event_date.0', 'Pemesanan kategori Seminar minimal H-30 (30 hari sebelum acara).');
    }

    /**
     * Memastikan aturan H-min dinamis kategori Birthday (minimal H-14).
     */
    public function test_birthday_booking_fails_if_less_than_h_minus_14(): void
    {
        $client = User::factory()->client()->create();
        $invalidBirthdayDate = now()->addDays(7)->format('Y-m-d'); // Kurang dari 14 hari

        $response = $this->actingAs($client, 'sanctum')
            ->postJson('/api/bookings', [
                'event_name' => 'Pesta Ulang Tahun Sweet 17',
                'category' => 'birthday',
                'guest_count' => 50,
                'budget' => 15000000,
                'has_own_venue' => false,
                'event_date' => $invalidBirthdayDate,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['event_date'])
            ->assertJsonPath('errors.event_date.0', 'Pemesanan kategori Birthday minimal H-14 (14 hari sebelum acara).');
    }

    /**
     * Memastikan multi-day booking berhasil dan endpoint booked-dates mencakup semua hari dalam rentang.
     */
    public function test_multi_day_booking_reserves_full_date_range(): void
    {
        $client = User::factory()->client()->create();
        $startDate = now()->addDays(35)->format('Y-m-d');
        $endDate = now()->addDays(37)->format('Y-m-d');

        $response = $this->actingAs($client, 'sanctum')
            ->postJson('/api/bookings', [
                'event_name' => 'Konferensi Multi-Hari',
                'category' => 'seminar',
                'guest_count' => 200,
                'budget' => 45000000,
                'has_own_venue' => false,
                'event_date' => $startDate,
                'is_multi_day' => true,
                'end_date' => $endDate,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('event.is_multi_day', true)
            ->assertJsonPath('event.end_date', $endDate);

        // Ambil booked-dates, pastikan ketiga tanggal (H, H+1, H+2) ada di booked-dates
        $datesResponse = $this->actingAs($client, 'sanctum')
            ->getJson('/api/bookings/booked-dates');

        $datesResponse->assertOk()
            ->assertJsonFragment([$startDate])
            ->assertJsonFragment([now()->addDays(36)->format('Y-m-d')])
            ->assertJsonFragment([$endDate]);
    }

    /**
     * Memastikan jika ada tanggal di dalam rentang multi-day yang sudah terisi, booking ditolak.
     */
    public function test_multi_day_booking_fails_if_any_date_in_range_already_taken(): void
    {
        $firstClient = User::factory()->client()->create();
        $secondClient = User::factory()->client()->create();

        $occupiedDate = now()->addDays(36)->format('Y-m-d');

        // Acara pertama mengambil hari di tengah-tengah rentang
        Event::factory()->create([
            'client_id' => $firstClient->id,
            'event_date' => $occupiedDate,
            'is_multi_day' => false,
            'end_date' => null,
        ]);

        $startDate = now()->addDays(35)->format('Y-m-d');
        $endDate = now()->addDays(37)->format('Y-m-d');

        // Acara kedua mencoba booking rentang yang melewati occupiedDate
        $response = $this->actingAs($secondClient, 'sanctum')
            ->postJson('/api/bookings', [
                'event_name' => 'Seminar Bentrok',
                'category' => 'seminar',
                'guest_count' => 100,
                'budget' => 25000000,
                'has_own_venue' => false,
                'event_date' => $startDate,
                'is_multi_day' => true,
                'end_date' => $endDate,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['event_date'])
            ->assertJsonPath('errors.event_date.0', 'Tanggal sudah terisi');
    }

    /**
     * Memastikan validasi field baru (category, guest_count, budget, has_own_venue, venue).
     */
    public function test_booking_validation_requires_extended_fields(): void
    {
        $client = User::factory()->client()->create();

        $response = $this->actingAs($client, 'sanctum')
            ->postJson('/api/bookings', [
                'event_name' => '',
                'category' => 'invalid_category',
                'guest_count' => 0,
                'budget' => -100,
                'has_own_venue' => true,
                'venue' => '', // Wajib jika has_own_venue true
                'event_date' => 'invalid-date',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors([
                'event_name',
                'category',
                'guest_count',
                'budget',
                'venue',
                'event_date',
            ]);
    }

    /**
     * Memastikan klien tidak dapat memesan tanggal di masa lalu.
     */
    public function test_client_cannot_book_past_date(): void
    {
        $client = User::factory()->client()->create();
        $pastDate = now()->subDays(3)->format('Y-m-d');

        $response = $this->actingAs($client, 'sanctum')
            ->postJson('/api/bookings', [
                'event_name' => 'Acara Masa Lalu',
                'category' => 'birthday',
                'guest_count' => 20,
                'budget' => 5000000,
                'has_own_venue' => false,
                'event_date' => $pastDate,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['event_date']);
    }

    /**
     * Memastikan role non-klien (misalnya vendor atau EO) tidak dapat membuat booking.
     */
    public function test_non_client_role_cannot_create_booking(): void
    {
        $vendor = User::factory()->vendor()->create();
        $eo = User::factory()->eo()->create();

        $responseVendor = $this->actingAs($vendor, 'sanctum')
            ->postJson('/api/bookings', [
                'event_name' => 'Acara Vendor',
                'category' => 'seminar',
                'guest_count' => 50,
                'budget' => 10000000,
                'has_own_venue' => false,
                'event_date' => now()->addDays(35)->format('Y-m-d'),
            ]);

        $responseVendor->assertForbidden();

        $responseEo = $this->actingAs($eo, 'sanctum')
            ->postJson('/api/bookings', [
                'event_name' => 'Acara EO',
                'category' => 'seminar',
                'guest_count' => 50,
                'budget' => 10000000,
                'has_own_venue' => false,
                'event_date' => now()->addDays(35)->format('Y-m-d'),
            ]);

        $responseEo->assertForbidden();
    }

    /**
     * Memastikan request tanpa autentikasi ditolak dengan 401 Unauthorized.
     */
    public function test_unauthenticated_user_cannot_access_booking_endpoints(): void
    {
        $responseGet = $this->getJson('/api/bookings/booked-dates');
        $responseGet->assertUnauthorized();

        $responsePost = $this->postJson('/api/bookings', [
            'event_name' => 'Acara Tanpa Auth',
            'category' => 'seminar',
            'guest_count' => 50,
            'budget' => 10000000,
            'has_own_venue' => false,
            'event_date' => now()->addDays(35)->format('Y-m-d'),
        ]);
        $responsePost->assertUnauthorized();
    }

    /**
     * Memastikan titik lokasi (lat/lng) wajib diisi jika klien memiliki venue sendiri.
     */
    public function test_booking_with_own_venue_requires_coordinates(): void
    {
        $client = User::factory()->client()->create();

        $response = $this->actingAs($client, 'sanctum')
            ->postJson('/api/bookings', [
                'event_name' => 'Seminar Venue Sendiri',
                'category' => 'seminar',
                'guest_count' => 100,
                'budget' => 20000000,
                'has_own_venue' => true,
                'venue' => 'Aula Kampus',
                'event_date' => now()->addDays(40)->format('Y-m-d'),
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['lat', 'lng'])
            ->assertJsonPath('errors.lat.0', 'Pilih titik lokasi venue di peta.');
    }

    /**
     * Memastikan koordinat dipaksa null jika lokasi dipilih oleh EO.
     */
    public function test_booking_without_own_venue_forces_null_coordinates(): void
    {
        $client = User::factory()->client()->create();

        $response = $this->actingAs($client, 'sanctum')
            ->postJson('/api/bookings', [
                'event_name' => 'Ulang Tahun Anak',
                'category' => 'birthday',
                'guest_count' => 30,
                'budget' => 5000000,
                'has_own_venue' => false,
                'lat' => -7.9797,
                'lng' => 112.6304,
                'event_date' => now()->addDays(20)->format('Y-m-d'),
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('event.lat', null)
            ->assertJsonPath('event.lng', null);

        $this->assertDatabaseHas('events', [
            'event_name' => 'Ulang Tahun Anak',
            'lat' => null,
            'lng' => null,
        ]);
    }

    /**
     * Memastikan koordinat di luar rentang valid ditolak.
     */
    public function test_booking_rejects_out_of_range_coordinates(): void
    {
        $client = User::factory()->client()->create();

        $response = $this->actingAs($client, 'sanctum')
            ->postJson('/api/bookings', [
                'event_name' => 'Seminar Koordinat Salah',
                'category' => 'seminar',
                'guest_count' => 100,
                'budget' => 20000000,
                'has_own_venue' => true,
                'venue' => 'Aula Kampus',
                'lat' => 100,
                'lng' => 200,
                'event_date' => now()->addDays(40)->format('Y-m-d'),
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['lat', 'lng']);
    }
}
