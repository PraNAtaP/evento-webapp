<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReviewFeatureTest extends TestCase
{
    use RefreshDatabase;

    public function test_client_can_submit_review_for_completed_event(): void
    {
        $client = User::factory()->create(['role' => 'client']);
        $vendor = Vendor::factory()->create();

        $event = Event::factory()->create([
            'client_id' => $client->id,
            'kanban_status' => 'completed',
            'completed_at' => now(),
        ]);

        $response = $this->actingAs($client)->postJson("/api/events/{$event->id}/reviews", [
            'reviewee_type' => 'vendor',
            'vendor_id' => $vendor->id,
            'rating' => 5,
            'comment' => 'Pelayanan dekorasi sangat memuaskan dan tepat waktu!',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.rating', 5)
            ->assertJsonPath('data.comment', 'Pelayanan dekorasi sangat memuaskan dan tepat waktu!');

        $this->assertDatabaseHas('reviews', [
            'event_id' => $event->id,
            'client_id' => $client->id,
            'vendor_id' => $vendor->id,
            'rating' => 5,
        ]);
    }

    public function test_client_cannot_submit_review_for_incomplete_event(): void
    {
        $client = User::factory()->create(['role' => 'client']);

        $event = Event::factory()->create([
            'client_id' => $client->id,
            'kanban_status' => 'on_progress',
            'completed_at' => null,
        ]);

        $response = $this->actingAs($client)->postJson("/api/events/{$event->id}/reviews", [
            'reviewee_type' => 'eo',
            'rating' => 5,
            'comment' => 'Bagus!',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('status', 'error');
    }

    public function test_unauthorized_user_cannot_submit_review(): void
    {
        $clientOwner = User::factory()->create(['role' => 'client']);
        $otherClient = User::factory()->create(['role' => 'client']);

        $event = Event::factory()->create([
            'client_id' => $clientOwner->id,
            'kanban_status' => 'completed',
            'completed_at' => now(),
        ]);

        $response = $this->actingAs($otherClient)->postJson("/api/events/{$event->id}/reviews", [
            'reviewee_type' => 'eo',
            'rating' => 5,
        ]);

        $response->assertStatus(403);
    }
}
