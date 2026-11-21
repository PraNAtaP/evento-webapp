<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EventDiscussionFeatureTest extends TestCase
{
    use RefreshDatabase;

    public function test_client_and_eo_can_post_and_view_discussions(): void
    {
        $client = User::factory()->create(['role' => 'client']);
        $eo = User::factory()->create(['role' => 'eo']);

        $event = Event::factory()->create([
            'client_id' => $client->id,
            'event_name' => 'Acara Pernikahan Adat',
        ]);

        // Klien mengirim pesan
        $response1 = $this->actingAs($client)->postJson("/api/events/{$event->id}/discussions", [
            'message' => 'Halo tim EO, apakah warna tema bisa diubah ke Sage Green?',
        ]);

        $response1->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.sender_role', 'client')
            ->assertJsonPath('data.message', 'Halo tim EO, apakah warna tema bisa diubah ke Sage Green?');

        // EO membalas pesan
        $response2 = $this->actingAs($eo)->postJson("/api/events/{$event->id}/discussions", [
            'message' => 'Tentu bisa Kak! Kami akan segera koordinasikan dengan vendor dekorasi.',
        ]);

        $response2->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.sender_role', 'eo');

        // Klien membaca riwayat diskusi
        $responseList = $this->actingAs($client)->getJson("/api/events/{$event->id}/discussions");
        $responseList->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_unauthorized_user_cannot_access_event_discussions(): void
    {
        $clientOwner = User::factory()->create(['role' => 'client']);
        $otherClient = User::factory()->create(['role' => 'client']);

        $event = Event::factory()->create([
            'client_id' => $clientOwner->id,
        ]);

        $response = $this->actingAs($otherClient)->getJson("/api/events/{$event->id}/discussions");
        $response->assertStatus(403);
    }
}
