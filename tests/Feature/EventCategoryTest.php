<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\EventCategory;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EventCategoryTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Pengguna tanpa autentikasi tidak dapat mengakses endpoint kategori admin.
     */
    public function test_unauthenticated_user_cannot_access_category_endpoints(): void
    {
        $response = $this->getJson('/api/admin/event-categories');
        $response->assertUnauthorized();

        $postResponse = $this->postJson('/api/admin/event-categories', [
            'name' => 'Konser Musik',
            'min_booking_days' => 20,
        ]);
        $postResponse->assertUnauthorized();
    }

    /**
     * Klien dan Vendor tidak memiliki hak akses (403 Forbidden) untuk mengelola kategori.
     */
    public function test_non_eo_cannot_manage_categories(): void
    {
        $client = User::factory()->client()->create();
        $vendor = User::factory()->vendor()->create();

        // Klien mencoba membuat kategori
        $this->actingAs($client, 'sanctum')
            ->postJson('/api/admin/event-categories', [
                'name' => 'Festival',
                'min_booking_days' => 15,
            ])
            ->assertForbidden();

        // Vendor mencoba mengakses daftar admin kategori
        $this->actingAs($vendor, 'sanctum')
            ->getJson('/api/admin/event-categories')
            ->assertForbidden();
    }

    /**
     * Klien dapat mengambil daftar kategori aktif untuk keperluan form & kalender booking.
     */
    public function test_client_can_fetch_active_categories(): void
    {
        $client = User::factory()->client()->create();

        EventCategory::factory()->create([
            'name' => 'Kategori Aktif',
            'slug' => 'kategori-aktif',
            'is_active' => true,
        ]);

        EventCategory::factory()->create([
            'name' => 'Kategori Nonaktif',
            'slug' => 'kategori-nonaktif',
            'is_active' => false,
        ]);

        $response = $this->actingAs($client, 'sanctum')
            ->getJson('/api/event-categories');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', 'kategori-aktif');
    }

    /**
     * EO dapat mengambil seluruh kategori (termasuk nonaktif) beserta jumlah acara terkait.
     */
    public function test_eo_can_fetch_all_categories_with_events_count(): void
    {
        $eo = User::factory()->eo()->create();

        $wedding = EventCategory::factory()->create([
            'name' => 'Wedding',
            'slug' => 'wedding',
            'min_booking_days' => 60,
            'is_active' => true,
        ]);

        EventCategory::factory()->create([
            'name' => 'Pameran',
            'slug' => 'pameran',
            'min_booking_days' => 25,
            'is_active' => false,
        ]);

        // Buat 2 event bertema wedding
        Event::factory()->count(2)->create([
            'category' => 'wedding',
        ]);

        $response = $this->actingAs($eo, 'sanctum')
            ->getJson('/api/admin/event-categories');

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment([
                'id' => $wedding->id,
                'name' => 'Wedding',
                'events_count' => 2,
            ]);
    }

    /**
     * EO dapat membuat kategori baru dengan batas hari pemesanan minimum (min_booking_days).
     */
    public function test_eo_can_create_new_category(): void
    {
        $eo = User::factory()->eo()->create();

        $response = $this->actingAs($eo, 'sanctum')
            ->postJson('/api/admin/event-categories', [
                'name' => 'Konser Musik',
                'slug' => 'konser-musik',
                'min_booking_days' => 45,
                'description' => 'Konser musik live dengan peralatan audio dan panggung besar.',
                'is_active' => true,
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'message' => 'Kategori acara berhasil ditambahkan.',
                'category' => [
                    'name' => 'Konser Musik',
                    'slug' => 'konser-musik',
                    'min_booking_days' => 45,
                    'is_active' => true,
                ],
            ]);

        $this->assertDatabaseHas('event_categories', [
            'name' => 'Konser Musik',
            'slug' => 'konser-musik',
            'min_booking_days' => 45,
        ]);
    }

    /**
     * Pembuatan kategori gagal jika data tidak valid (nama kosong, min_booking_days negatif, atau duplikat).
     */
    public function test_category_creation_fails_with_validation_errors(): void
    {
        $eo = User::factory()->eo()->create();

        EventCategory::factory()->create([
            'name' => 'Workshop',
            'slug' => 'workshop',
        ]);

        // Nama kosong dan batas hari negatif
        $response = $this->actingAs($eo, 'sanctum')
            ->postJson('/api/admin/event-categories', [
                'name' => '',
                'min_booking_days' => -5,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'min_booking_days']);

        // Nama dan slug duplikat
        $duplicateResponse = $this->actingAs($eo, 'sanctum')
            ->postJson('/api/admin/event-categories', [
                'name' => 'Workshop',
                'slug' => 'workshop',
                'min_booking_days' => 10,
            ]);

        $duplicateResponse->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'slug']);
    }

    /**
     * EO dapat memperbarui kategori yang sudah ada dan mengubah batas hari minimumnya.
     */
    public function test_eo_can_update_category(): void
    {
        $eo = User::factory()->eo()->create();

        $category = EventCategory::factory()->create([
            'name' => 'Ulang Tahun',
            'slug' => 'ulang-tahun',
            'min_booking_days' => 14,
        ]);

        $response = $this->actingAs($eo, 'sanctum')
            ->putJson("/api/admin/event-categories/{$category->id}", [
                'name' => 'Pesta Ulang Tahun',
                'slug' => 'pesta-ulang-tahun',
                'min_booking_days' => 21,
                'description' => 'Pesta perayaan ulang tahun meriah.',
                'is_active' => true,
            ]);

        $response->assertOk()
            ->assertJson([
                'message' => 'Kategori acara berhasil diperbarui.',
                'category' => [
                    'id' => $category->id,
                    'name' => 'Pesta Ulang Tahun',
                    'slug' => 'pesta-ulang-tahun',
                    'min_booking_days' => 21,
                ],
            ]);

        $this->assertDatabaseHas('event_categories', [
            'id' => $category->id,
            'name' => 'Pesta Ulang Tahun',
            'min_booking_days' => 21,
        ]);
    }

    /**
     * EO dapat menghapus kategori yang belum pernah digunakan oleh acara apapun.
     */
    public function test_eo_can_delete_unused_category(): void
    {
        $eo = User::factory()->eo()->create();

        $category = EventCategory::factory()->create([
            'name' => 'Reuni Akbar',
            'slug' => 'reuni-akbar',
        ]);

        $response = $this->actingAs($eo, 'sanctum')
            ->deleteJson("/api/admin/event-categories/{$category->id}");

        $response->assertOk()
            ->assertJson(['message' => 'Kategori acara berhasil dihapus.']);

        $this->assertDatabaseMissing('event_categories', [
            'id' => $category->id,
        ]);
    }

    /**
     * EO tidak dapat menghapus kategori jika kategori tersebut sedang digunakan oleh data acara.
     */
    public function test_eo_cannot_delete_category_in_use(): void
    {
        $eo = User::factory()->eo()->create();

        $category = EventCategory::factory()->create([
            'name' => 'Wedding',
            'slug' => 'wedding',
        ]);

        Event::factory()->create([
            'category' => 'wedding',
        ]);

        $response = $this->actingAs($eo, 'sanctum')
            ->deleteJson("/api/admin/event-categories/{$category->id}");

        $response->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'Kategori acara tidak dapat dihapus karena sudah digunakan oleh acara tersimpan. Silakan nonaktifkan kategori ini sebagai alternatif.',
            ]);

        $this->assertDatabaseHas('event_categories', [
            'id' => $category->id,
        ]);
    }

    /**
     * Booking acara dari klien mematuhi batas hari minimum (min_booking_days) dari database.
     * Jika kurang dari batas H-min, booking ditolak dengan pesan yang sesuai.
     */
    public function test_booking_fails_if_violating_dynamic_min_booking_days_from_database(): void
    {
        $client = User::factory()->client()->create();

        // EO membuat kategori custom: Gala Dinner dengan batas H-40
        EventCategory::factory()->create([
            'name' => 'Gala Dinner',
            'slug' => 'gala-dinner',
            'min_booking_days' => 40,
            'is_active' => true,
        ]);

        // Klien mencoba memesan di H-30 (kurang dari 40 hari)
        $invalidDate = Carbon::today()->addDays(30)->format('Y-m-d');

        $response = $this->actingAs($client, 'sanctum')
            ->postJson('/api/bookings', [
                'event_name' => 'Gala Dinner Tahunan Perusahaan',
                'category' => 'gala-dinner',
                'guest_count' => 150,
                'budget' => 60000000,
                'has_own_venue' => false,
                'event_date' => $invalidDate,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['event_date'])
            ->assertJsonPath('errors.event_date.0', 'Pemesanan kategori Gala Dinner minimal H-40 (40 hari sebelum acara).');
    }

    /**
     * Booking berhasil jika tanggal pemesanan memenuhi aturan batas hari minimum (min_booking_days) dari database.
     */
    public function test_booking_succeeds_when_satisfying_dynamic_min_booking_days(): void
    {
        $client = User::factory()->client()->create();

        EventCategory::factory()->create([
            'name' => 'Festival Musik',
            'slug' => 'festival-musik',
            'min_booking_days' => 50,
            'is_active' => true,
        ]);

        // Klien memesan di H-55 (lebih dari 50 hari)
        $validDate = Carbon::today()->addDays(55)->format('Y-m-d');

        $response = $this->actingAs($client, 'sanctum')
            ->postJson('/api/bookings', [
                'event_name' => 'Festival Musik Senja',
                'category' => 'festival-musik',
                'guest_count' => 500,
                'budget' => 100000000,
                'has_own_venue' => false,
                'event_date' => $validDate,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('event.category', 'festival-musik')
            ->assertJsonPath('event.event_name', 'Festival Musik Senja');

        $this->assertDatabaseHas('events', [
            'client_id' => $client->id,
            'event_name' => 'Festival Musik Senja',
            'category' => 'festival-musik',
        ]);
    }

    /**
     * Booking ditolak jika kategori acara dalam status nonaktif.
     */
    public function test_booking_fails_if_category_is_inactive(): void
    {
        $client = User::factory()->client()->create();

        EventCategory::factory()->inactive()->create([
            'name' => 'Pameran Otomotif',
            'slug' => 'pameran-otomotif',
            'min_booking_days' => 10,
        ]);

        $response = $this->actingAs($client, 'sanctum')
            ->postJson('/api/bookings', [
                'event_name' => 'Pameran Mobil 2026',
                'category' => 'pameran-otomotif',
                'guest_count' => 200,
                'budget' => 50000000,
                'has_own_venue' => false,
                'event_date' => Carbon::today()->addDays(20)->format('Y-m-d'),
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['category'])
            ->assertJsonPath('errors.category.0', 'Kategori acara yang dipilih sedang tidak aktif.');
    }
}
