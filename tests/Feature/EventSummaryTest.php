<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EventSummaryTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Memastikan user dengan role EO dapat mengakses endpoint ringkasan acara
     * dan menerima data angka mockup yang valid.
     */
    public function test_authenticated_eo_user_can_get_event_summary(): void
    {
        $user = User::factory()->eo()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/admin/event-summary');

        $response->assertOk()
            ->assertJsonStructure([
                'total_proyek',
                'sedang_berjalan',
                'total_nilai_kontrak',
                'total_telah_masuk',
                'status_counts' => [
                    'request',
                    'dp_paid',
                    'on_progress',
                    'done',
                ],
            ])
            ->assertJson([
                'total_proyek' => 9,
                'sedang_berjalan' => 7,
                'total_nilai_kontrak' => 882000000,
                'total_telah_masuk' => 561400000,
                'status_counts' => [
                    'request' => 2,
                    'dp_paid' => 2,
                    'on_progress' => 3,
                    'done' => 2,
                ],
            ]);
    }

    /**
     * Memastikan user dengan role non-EO (misalnya client) mendapatkan response 403 Forbidden.
     */
    public function test_non_eo_user_cannot_access_event_summary(): void
    {
        $client = User::factory()->client()->create();

        $response = $this->actingAs($client, 'sanctum')
            ->getJson('/api/admin/event-summary');

        $response->assertForbidden()
            ->assertJson([
                'message' => 'Akses ditolak. Hanya Event Organizer (EO) yang dapat mengakses data ini.',
            ]);
    }

    /**
     * Memastikan user yang belum terautentikasi mendapatkan response 401 Unauthorized.
     */
    public function test_unauthenticated_user_cannot_access_event_summary(): void
    {
        $response = $this->getJson('/api/admin/event-summary');

        $response->assertUnauthorized();
    }
}
