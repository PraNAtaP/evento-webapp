<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\EventVendorAssignment;
use App\Models\Payment;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminActionItemTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, int>
     */
    private function countsFor(User $eo): array
    {
        $response = $this->actingAs($eo, 'sanctum')->getJson('/api/admin/action-items');
        $response->assertOk()->assertJsonStructure(['items' => [['key', 'label', 'count', 'path']], 'total']);

        return collect($response->json('items'))->pluck('count', 'key')->all();
    }

    public function test_returns_zero_counts_when_nothing_needs_action(): void
    {
        $counts = $this->countsFor(User::factory()->eo()->create());

        $this->assertSame(0, array_sum($counts));
    }

    public function test_counts_each_action_item(): void
    {
        $eo = User::factory()->eo()->create();

        Event::factory()->count(2)->create(['kanban_status' => 'request']);

        Event::factory()->draftingQuotation()->create([
            'revision_requested_at' => now(),
            'revision_note' => 'Turunkan harga',
        ]);
        $draftingEvent = Event::factory()->draftingQuotation()->create();

        $paymentEvent = Event::factory()->create(['kanban_status' => 'awaiting_dp']);
        Payment::create(['event_id' => $paymentEvent->id, 'payment_type' => 'dp', 'nominal' => 1000, 'status' => 'pending_verification']);
        Payment::create(['event_id' => $paymentEvent->id, 'payment_type' => 'pelunasan', 'nominal' => 1000, 'status' => 'unpaid']);

        Vendor::factory()->create(['status' => 'pending']);
        Vendor::factory()->create(['status' => 'approved']);

        EventVendorAssignment::factory()->pending()->create(['event_id' => $draftingEvent->id]);
        EventVendorAssignment::factory()->accepted()->create(['event_id' => $draftingEvent->id]);

        $counts = $this->countsFor($eo);

        $this->assertSame(2, $counts['new_requests']);
        $this->assertSame(1, $counts['revision_requests']);
        $this->assertSame(1, $counts['payments_pending']);
        $this->assertSame(1, $counts['vendor_registrations']);
        $this->assertSame(1, $counts['vendor_offers_unanswered']);
    }

    public function test_non_eo_cannot_access_action_items(): void
    {
        $client = User::factory()->client()->create();

        $this->actingAs($client, 'sanctum')->getJson('/api/admin/action-items')->assertForbidden();
    }

    public function test_guest_cannot_access_action_items(): void
    {
        $this->getJson('/api/admin/action-items')->assertUnauthorized();
    }
}
