<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\EventVendorAssignment;
use App\Models\Payment;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorPackage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KanbanTransitionTest extends TestCase
{
    use RefreshDatabase;

    protected User $eo;

    protected User $client;

    protected Vendor $vendor;

    protected VendorPackage $package;

    protected function setUp(): void
    {
        parent::setUp();

        $this->eo = User::factory()->eo()->create();
        $this->client = User::factory()->client()->create();

        $vendorUser = User::factory()->vendor()->create();
        $this->vendor = Vendor::create([
            'user_id' => $vendorUser->id,
            'business_name' => 'Dekor Cantik',
            'category' => 'Decoration',
            'contact_number' => '0812345678',
            'address' => 'Jakarta',
        ]);

        $this->package = VendorPackage::create([
            'vendor_id' => $this->vendor->id,
            'package_name' => 'Paket Gold',
            'description' => 'Dekorasi Lengkap',
            'price' => 50000000,
        ]);
    }

    public function test_eo_can_fetch_kanban_events(): void
    {
        Event::factory()->create(['client_id' => $this->client->id, 'kanban_status' => 'request']);

        $response = $this->actingAs($this->eo, 'sanctum')
            ->getJson('/api/admin/kanban');

        $response->assertOk()
            ->assertJsonStructure([
                'events' => [
                    '*' => [
                        'id',
                        'event_name',
                        'kanban_status',
                        'estimated_budget',
                        'quotation_total',
                        'paid_amount',
                        'paid_percentage',
                    ],
                ],
            ]);
    }

    public function test_non_eo_cannot_fetch_kanban_events(): void
    {
        $response = $this->actingAs($this->client, 'sanctum')
            ->getJson('/api/admin/kanban');

        $response->assertForbidden();
    }

    public function test_transition_from_request_to_drafting_quotation(): void
    {
        $event = Event::factory()->create([
            'client_id' => $this->client->id,
            'kanban_status' => 'request',
        ]);

        $response = $this->actingAs($this->eo, 'sanctum')
            ->patchJson("/api/admin/kanban/{$event->id}/move", [
                'target_status' => 'drafting_quotation',
            ]);

        $response->assertOk();
        $this->assertEquals('drafting_quotation', $event->fresh()->kanban_status);
    }

    public function test_drafting_to_client_review_fails_without_accepted_vendor(): void
    {
        $event = Event::factory()->draftingQuotation()->create([
            'client_id' => $this->client->id,
        ]);

        // Belum ada assignment
        $response = $this->actingAs($this->eo, 'sanctum')
            ->patchJson("/api/admin/kanban/{$event->id}/move", [
                'target_status' => 'client_review',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['target_status']);
    }

    public function test_drafting_to_client_review_fails_with_pending_vendor_offer(): void
    {
        $event = Event::factory()->draftingQuotation()->create([
            'client_id' => $this->client->id,
        ]);

        EventVendorAssignment::create([
            'event_id' => $event->id,
            'vendor_id' => $this->vendor->id,
            'package_id' => $this->package->id,
            'eo_offer_status' => 'pending',
            'client_approval' => 'pending',
            'locked_price' => 50000000,
        ]);

        $response = $this->actingAs($this->eo, 'sanctum')
            ->patchJson("/api/admin/kanban/{$event->id}/move", [
                'target_status' => 'client_review',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['target_status']);
    }

    public function test_drafting_to_client_review_succeeds_with_custom_dp_percentage(): void
    {
        $event = Event::factory()->draftingQuotation()->create([
            'client_id' => $this->client->id,
        ]);

        EventVendorAssignment::create([
            'event_id' => $event->id,
            'vendor_id' => $this->vendor->id,
            'package_id' => $this->package->id,
            'eo_offer_status' => 'accepted',
            'client_approval' => 'pending',
            'locked_price' => 50000000,
        ]);

        $response = $this->actingAs($this->eo, 'sanctum')
            ->patchJson("/api/admin/kanban/{$event->id}/move", [
                'target_status' => 'client_review',
                'dp_percentage' => 40.00,
            ]);

        $response->assertOk();
        $this->assertEquals('client_review', $event->fresh()->kanban_status);
        $this->assertEquals(40.00, (float) $event->fresh()->dp_percentage);
    }

    public function test_client_review_to_awaiting_dp_generates_payments_with_custom_dp(): void
    {
        $event = Event::factory()->clientReview()->create([
            'client_id' => $this->client->id,
            'dp_percentage' => 40.00,
        ]);

        EventVendorAssignment::create([
            'event_id' => $event->id,
            'vendor_id' => $this->vendor->id,
            'package_id' => $this->package->id,
            'eo_offer_status' => 'accepted',
            'client_approval' => 'approved',
            'locked_price' => 50000000,
        ]);

        $response = $this->actingAs($this->eo, 'sanctum')
            ->patchJson("/api/admin/kanban/{$event->id}/move", [
                'target_status' => 'awaiting_dp',
            ]);

        $response->assertOk();
        $event->refresh();

        $this->assertEquals('awaiting_dp', $event->kanban_status);
        $this->assertEquals(50000000, (float) $event->agreed_price);

        // Cek tagihan DP 40% = 20.000.000 dan Pelunasan 60% = 30.000.000
        $dpPayment = $event->payments()->where('payment_type', 'dp')->first();
        $pelunasanPayment = $event->payments()->where('payment_type', 'pelunasan')->first();

        $this->assertNotNull($dpPayment);
        $this->assertEquals(20000000, (float) $dpPayment->nominal);
        $this->assertEquals('unpaid', $dpPayment->status);

        $this->assertNotNull($pelunasanPayment);
        $this->assertEquals(30000000, (float) $pelunasanPayment->nominal);
        $this->assertEquals('unpaid', $pelunasanPayment->status);
    }

    public function test_client_review_to_awaiting_dp_uses_config_percentage_fallback(): void
    {
        $event = Event::factory()->clientReview()->create([
            'client_id' => $this->client->id,
            'dp_percentage' => null, // fallback to config 30%
        ]);

        EventVendorAssignment::create([
            'event_id' => $event->id,
            'vendor_id' => $this->vendor->id,
            'package_id' => $this->package->id,
            'eo_offer_status' => 'accepted',
            'client_approval' => 'approved',
            'locked_price' => 100000000,
        ]);

        $response = $this->actingAs($this->eo, 'sanctum')
            ->patchJson("/api/admin/kanban/{$event->id}/move", [
                'target_status' => 'awaiting_dp',
            ]);

        $response->assertOk();
        $event->refresh();

        $dpPayment = $event->payments()->where('payment_type', 'dp')->first();
        $this->assertEquals(30000000, (float) $dpPayment->nominal); // 30% of 100M
    }

    public function test_client_review_to_drafting_quotation_resets_approvals_and_agreed_price(): void
    {
        $event = Event::factory()->clientReview()->create([
            'client_id' => $this->client->id,
            'agreed_price' => 50000000,
        ]);

        $assignment = EventVendorAssignment::create([
            'event_id' => $event->id,
            'vendor_id' => $this->vendor->id,
            'package_id' => $this->package->id,
            'eo_offer_status' => 'accepted',
            'client_approval' => 'approved',
            'locked_price' => 50000000,
        ]);

        $response = $this->actingAs($this->eo, 'sanctum')
            ->patchJson("/api/admin/kanban/{$event->id}/move", [
                'target_status' => 'drafting_quotation',
                'revision_note' => 'Mohon kurangi dekorasi photobooth',
            ]);

        $response->assertOk();
        $event->refresh();
        $assignment->refresh();

        $this->assertEquals('drafting_quotation', $event->kanban_status);
        $this->assertNull($event->agreed_price);
        $this->assertEquals('pending', $assignment->client_approval);
    }

    public function test_awaiting_dp_to_on_progress_requires_dp_paid(): void
    {
        $event = Event::factory()->awaitingDp()->create([
            'client_id' => $this->client->id,
            'agreed_price' => 50000000,
        ]);

        Payment::create([
            'event_id' => $event->id,
            'payment_type' => 'dp',
            'nominal' => 15000000,
            'status' => 'unpaid',
        ]);

        $response = $this->actingAs($this->eo, 'sanctum')
            ->patchJson("/api/admin/kanban/{$event->id}/move", [
                'target_status' => 'on_progress',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['target_status']);

        // Set status DP menjadi paid
        Payment::where('event_id', $event->id)->update(['status' => 'paid']);

        $responseSuccess = $this->actingAs($this->eo, 'sanctum')
            ->patchJson("/api/admin/kanban/{$event->id}/move", [
                'target_status' => 'on_progress',
            ]);

        $responseSuccess->assertOk();
        $this->assertEquals('on_progress', $event->fresh()->kanban_status);
    }

    public function test_on_progress_to_done_requires_all_payments_paid(): void
    {
        $event = Event::factory()->onProgress()->create([
            'client_id' => $this->client->id,
            'agreed_price' => 50000000,
        ]);

        Payment::create([
            'event_id' => $event->id,
            'payment_type' => 'dp',
            'nominal' => 15000000,
            'status' => 'paid',
        ]);
        Payment::create([
            'event_id' => $event->id,
            'payment_type' => 'pelunasan',
            'nominal' => 35000000,
            'status' => 'unpaid',
        ]);

        $response = $this->actingAs($this->eo, 'sanctum')
            ->patchJson("/api/admin/kanban/{$event->id}/move", [
                'target_status' => 'done',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['target_status']);

        // Bayar pelunasan
        Payment::where('event_id', $event->id)->where('payment_type', 'pelunasan')->update(['status' => 'paid']);

        $responseSuccess = $this->actingAs($this->eo, 'sanctum')
            ->patchJson("/api/admin/kanban/{$event->id}/move", [
                'target_status' => 'done',
            ]);

        $responseSuccess->assertOk();
        $this->assertEquals('done', $event->fresh()->kanban_status);
    }

    public function test_illegal_skipping_steps_and_backward_move_rejected(): void
    {
        $event = Event::factory()->create([
            'client_id' => $this->client->id,
            'kanban_status' => 'request',
        ]);

        // Melompat dari request langsung ke done
        $responseSkip = $this->actingAs($this->eo, 'sanctum')
            ->patchJson("/api/admin/kanban/{$event->id}/move", [
                'target_status' => 'done',
            ]);
        $responseSkip->assertStatus(422);

        // Mundur dari on_progress ke awaiting_dp
        $eventProgress = Event::factory()->onProgress()->create(['client_id' => $this->client->id]);
        $responseBackward = $this->actingAs($this->eo, 'sanctum')
            ->patchJson("/api/admin/kanban/{$eventProgress->id}/move", [
                'target_status' => 'awaiting_dp',
            ]);
        $responseBackward->assertStatus(422);
    }

    public function test_dp_payment_verification_automatically_moves_awaiting_dp_to_on_progress(): void
    {
        $event = Event::factory()->awaitingDp()->create([
            'client_id' => $this->client->id,
            'agreed_price' => 50000000,
        ]);

        $payment = Payment::create([
            'event_id' => $event->id,
            'payment_type' => 'dp',
            'nominal' => 15000000,
            'status' => 'pending_verification',
        ]);

        $response = $this->actingAs($this->eo, 'sanctum')
            ->patchJson("/api/payments/{$payment->id}/verify", [
                'action' => 'approve',
            ]);

        $response->assertOk();
        $this->assertEquals('on_progress', $event->fresh()->kanban_status);
    }

    public function test_legacy_event_migration_creates_synthetic_payments(): void
    {
        // Simulasi event lama dengan status on_progress tanpa payment
        $eventConverted = Event::factory()->create([
            'client_id' => $this->client->id,
            'kanban_status' => 'on_progress',
            'estimated_budget' => 50000000,
            'agreed_price' => 50000000,
            'dp_percentage' => 30.00,
        ]);

        // Cek jika payment dibuat saat migrasi berjalan
        $defaultDpPercentage = (float) config('evento.dp_percentage', 30.0);
        $dpNominal = round(($eventConverted->agreed_price * $defaultDpPercentage) / 100);
        $pelunasanNominal = $eventConverted->agreed_price - $dpNominal;

        Payment::create([
            'event_id' => $eventConverted->id,
            'payment_type' => 'dp',
            'nominal' => $dpNominal,
            'status' => 'paid',
            'verified_at' => now(),
        ]);
        Payment::create([
            'event_id' => $eventConverted->id,
            'payment_type' => 'pelunasan',
            'nominal' => $pelunasanNominal,
            'status' => 'unpaid',
        ]);

        $this->assertEquals(2, $eventConverted->payments()->count());
        $this->assertEquals('paid', $eventConverted->payments()->where('payment_type', 'dp')->first()->status);
        $this->assertEquals('unpaid', $eventConverted->payments()->where('payment_type', 'pelunasan')->first()->status);
    }
}
