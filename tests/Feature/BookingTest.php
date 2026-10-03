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
        ]);
        Event::factory()->create([
            'event_date' => '2026-11-10',
        ]);
        Event::factory()->create([
            'event_date' => '2026-12-01',
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
     * Memastikan klien dapat membuat booking baru jika tanggal masih tersedia.
     */
    public function test_authenticated_client_can_create_booking_successfully(): void
    {
        $client = User::factory()->client()->create();

        $response = $this->actingAs($client, 'sanctum')
            ->postJson('/api/bookings', [
                'event_name' => 'Pernikahan Budi & Siti',
                'event_date' => '2026-11-20',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'message' => 'Booking acara berhasil dibuat.',
                'event' => [
                    'client_id' => $client->id,
                    'event_name' => 'Pernikahan Budi & Siti',
                    'event_date' => '2026-11-20',
                    'kanban_status' => 'request',
                ],
            ]);

        $this->assertDatabaseHas('events', [
            'client_id' => $client->id,
            'event_name' => 'Pernikahan Budi & Siti',
            'event_date' => '2026-11-20',
            'kanban_status' => 'request',
        ]);
    }

    /**
     * Memastikan aturan ketat: satu tanggal hanya untuk satu acara.
     * Jika tanggal sudah terisi, tolak dan kembalikan error validation HTTP 422 dengan pesan 'Tanggal sudah terisi'.
     */
    public function test_client_cannot_book_already_taken_date(): void
    {
        $firstClient = User::factory()->client()->create();
        $secondClient = User::factory()->client()->create();

        // Acara pertama dibuat pada tanggal 2026-11-20
        Event::factory()->create([
            'client_id' => $firstClient->id,
            'event_date' => '2026-11-20',
        ]);

        // Klien kedua mencoba memesan pada tanggal yang sama
        $response = $this->actingAs($secondClient, 'sanctum')
            ->postJson('/api/bookings', [
                'event_name' => 'Pameran Seni Kreatif',
                'event_date' => '2026-11-20',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['event_date'])
            ->assertJson([
                'message' => 'Tanggal sudah terisi',
                'errors' => [
                    'event_date' => [
                        'Tanggal sudah terisi',
                    ],
                ],
            ]);
    }

    /**
     * Memastikan validasi input dasar saat data booking tidak lengkap atau format tanggal salah.
     */
    public function test_booking_validation_requires_valid_fields(): void
    {
        $client = User::factory()->client()->create();

        $response = $this->actingAs($client, 'sanctum')
            ->postJson('/api/bookings', [
                'event_name' => '',
                'event_date' => 'invalid-date',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['event_name', 'event_date']);
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
                'event_date' => '2026-11-25',
            ]);

        $responseVendor->assertForbidden();

        $responseEo = $this->actingAs($eo, 'sanctum')
            ->postJson('/api/bookings', [
                'event_name' => 'Acara EO',
                'event_date' => '2026-11-25',
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
            'event_date' => '2026-11-25',
        ]);
        $responsePost->assertUnauthorized();
    }
}
