<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\EventVendorAssignment;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EventCancellationRequestTest extends TestCase
{
    use RefreshDatabase;

    private function requestUrl(Event $event): string
    {
        return route('api.client.events.request-cancellation', $event);
    }

    private function pendingEvent(User $client, string $state = 'onProgress'): Event
    {
        return Event::factory()->{$state}()->create([
            'client_id' => $client->id,
            'cancellation_request_status' => Event::CANCELLATION_REQUEST_PENDING,
            'cancellation_request_reason' => 'Dana tidak mencukupi.',
            'cancellation_requested_at' => now(),
        ]);
    }

    public function test_client_can_request_cancellation_with_reason(): void
    {
        $client = User::factory()->client()->create();
        $event = Event::factory()->onProgress()->create(['client_id' => $client->id]);
        Sanctum::actingAs($client);

        $this->postJson($this->requestUrl($event), ['reason' => 'Acara ditunda.'])
            ->assertOk();

        $event->refresh();
        $this->assertSame('on_progress', $event->kanban_status);
        $this->assertSame(Event::CANCELLATION_REQUEST_PENDING, $event->cancellation_request_status);
        $this->assertSame('Acara ditunda.', $event->cancellation_request_reason);
        $this->assertNotNull($event->cancellation_requested_at);
        $this->assertTrue($event->hasPendingCancellationRequest());
    }

    public function test_reason_is_required(): void
    {
        $client = User::factory()->client()->create();
        $event = Event::factory()->create(['client_id' => $client->id]);
        Sanctum::actingAs($client);

        $this->postJson($this->requestUrl($event), [])
            ->assertStatus(422)
            ->assertJsonValidationErrors('reason');
    }

    public function test_other_client_and_non_clients_cannot_request(): void
    {
        $owner = User::factory()->client()->create();
        $event = Event::factory()->create(['client_id' => $owner->id]);

        Sanctum::actingAs(User::factory()->client()->create());
        $this->postJson($this->requestUrl($event), ['reason' => 'x'])->assertForbidden();

        Sanctum::actingAs(User::factory()->eo()->create());
        $this->postJson($this->requestUrl($event), ['reason' => 'x'])->assertForbidden();

        $this->assertNull($event->fresh()->cancellation_request_status);
    }

    public function test_cannot_request_for_finished_rejected_or_cancelled_events(): void
    {
        $client = User::factory()->client()->create();
        Sanctum::actingAs($client);

        foreach (['done', 'rejected', 'cancelled'] as $status) {
            $event = Event::factory()->create(['client_id' => $client->id, 'kanban_status' => $status]);

            $this->postJson($this->requestUrl($event), ['reason' => 'x'])->assertStatus(422);
        }
    }

    public function test_cannot_request_twice_while_pending(): void
    {
        $client = User::factory()->client()->create();
        $event = $this->pendingEvent($client);
        Sanctum::actingAs($client);

        $this->postJson($this->requestUrl($event), ['reason' => 'Lagi'])->assertStatus(422);
        $this->assertSame('Dana tidak mencukupi.', $event->fresh()->cancellation_request_reason);
    }

    public function test_eo_approval_cancels_event_frees_vendors_and_hides_from_kanban(): void
    {
        $eo = User::factory()->eo()->create();
        $client = User::factory()->client()->create();
        $event = $this->pendingEvent($client);
        $assignment = EventVendorAssignment::factory()->accepted()->create(['event_id' => $event->id]);
        Payment::create([
            'event_id' => $event->id,
            'payment_type' => 'dp',
            'nominal' => 1000000,
            'status' => 'paid',
        ]);

        Sanctum::actingAs($eo);
        $this->patchJson(route('api.events.cancellation-request.approve', $event), ['note' => 'DP tidak kembali.'])
            ->assertOk();

        $event->refresh();
        $this->assertSame('cancelled', $event->kanban_status);
        $this->assertSame('Dana tidak mencukupi.', $event->cancellation_reason);
        $this->assertSame(Event::CANCELLATION_REQUEST_APPROVED, $event->cancellation_request_status);
        $this->assertSame('DP tidak kembali.', $event->cancellation_review_note);
        $this->assertNotNull($event->cancelled_at);
        $this->assertNotNull($event->cancellation_reviewed_at);
        $this->assertSame('cancelled', $assignment->fresh()->eo_offer_status);
        $this->assertDatabaseHas('payments', ['event_id' => $event->id]);

        $kanbanIds = collect($this->getJson(route('api.admin.kanban.index'))->json('events'))->pluck('id');
        $this->assertFalse($kanbanIds->contains($event->id));
    }

    public function test_eo_rejection_keeps_event_running_and_client_can_request_again(): void
    {
        $eo = User::factory()->eo()->create();
        $client = User::factory()->client()->create();
        $event = $this->pendingEvent($client);

        Sanctum::actingAs($eo);
        $this->patchJson(route('api.events.cancellation-request.reject', $event), ['note' => 'DP sudah dibayarkan ke vendor.'])
            ->assertOk();

        $event->refresh();
        $this->assertSame('on_progress', $event->kanban_status);
        $this->assertSame(Event::CANCELLATION_REQUEST_REJECTED, $event->cancellation_request_status);
        $this->assertSame('DP sudah dibayarkan ke vendor.', $event->cancellation_review_note);
        $this->assertNotNull($event->cancellation_reviewed_at);

        Sanctum::actingAs($client);
        $this->postJson($this->requestUrl($event), ['reason' => 'Coba lagi'])->assertOk();

        $event->refresh();
        $this->assertSame(Event::CANCELLATION_REQUEST_PENDING, $event->cancellation_request_status);
        $this->assertSame('Coba lagi', $event->cancellation_request_reason);
        $this->assertNull($event->cancellation_review_note);
        $this->assertTrue($event->hasPendingCancellationRequest());
    }

    public function test_rejection_requires_note(): void
    {
        $eo = User::factory()->eo()->create();
        $event = $this->pendingEvent(User::factory()->client()->create());

        Sanctum::actingAs($eo);
        $this->patchJson(route('api.events.cancellation-request.reject', $event), [])
            ->assertStatus(422)
            ->assertJsonValidationErrors('note');
    }

    public function test_review_without_pending_request_is_rejected(): void
    {
        $eo = User::factory()->eo()->create();
        $event = Event::factory()->onProgress()->create();

        Sanctum::actingAs($eo);
        $this->patchJson(route('api.events.cancellation-request.approve', $event))->assertStatus(422);
        $this->patchJson(route('api.events.cancellation-request.reject', $event), ['note' => 'x'])->assertStatus(422);
    }

    public function test_non_eo_cannot_review(): void
    {
        $client = User::factory()->client()->create();
        $event = $this->pendingEvent($client);

        Sanctum::actingAs($client);
        $this->patchJson(route('api.events.cancellation-request.approve', $event))->assertForbidden();
        $this->patchJson(route('api.events.cancellation-request.reject', $event), ['note' => 'x'])->assertForbidden();
        $this->assertTrue($event->fresh()->hasPendingCancellationRequest());
    }

    public function test_action_items_count_pending_cancellation_requests(): void
    {
        $eo = User::factory()->eo()->create();
        $this->pendingEvent(User::factory()->client()->create());
        Event::factory()->onProgress()->create();

        Sanctum::actingAs($eo);
        $items = collect($this->getJson(route('api.admin.action-items'))->json('items'))->keyBy('key');

        $this->assertSame(1, $items['cancellation_requests']['count']);
    }

    public function test_cancelled_event_is_not_counted_as_active_in_summary(): void
    {
        $eo = User::factory()->eo()->create();
        Event::factory()->create([
            'kanban_status' => 'cancelled',
            'agreed_price' => 9000000,
        ]);

        Sanctum::actingAs($eo);
        $response = $this->getJson(route('api.admin.event-summary'))->assertOk();

        $this->assertSame(0, (int) $response->json('active_events_count'));
    }
}
