<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\EventVendorAssignment;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorPackage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClientQuotationTest extends TestCase
{
    use RefreshDatabase;

    protected User $client1;

    protected User $client2;

    protected Vendor $vendor;

    protected VendorPackage $package;

    protected function setUp(): void
    {
        parent::setUp();

        $this->client1 = User::factory()->client()->create();
        $this->client2 = User::factory()->client()->create();

        $vendorUser = User::factory()->vendor()->create();
        $this->vendor = Vendor::create([
            'user_id' => $vendorUser->id,
            'business_name' => 'Foto Megah',
            'category' => 'Photography',
            'contact_number' => '08123456789',
            'address' => 'Bandung',
        ]);

        $this->package = VendorPackage::create([
            'vendor_id' => $this->vendor->id,
            'package_name' => 'Paket Wedding Album',
            'description' => 'Dokumentasi 2 Hari',
            'price' => 30000000,
        ]);
    }

    public function test_client_can_view_own_events_and_details(): void
    {
        $event = Event::factory()->create(['client_id' => $this->client1->id]);

        $responseList = $this->actingAs($this->client1, 'sanctum')
            ->getJson('/api/client/events');
        $responseList->assertOk()
            ->assertJsonCount(1, 'events');

        $responseDetail = $this->actingAs($this->client1, 'sanctum')
            ->getJson("/api/client/events/{$event->id}");
        $responseDetail->assertOk()
            ->assertJsonPath('event.id', $event->id);
    }

    public function test_client_cannot_access_other_clients_event(): void
    {
        $eventClient2 = Event::factory()->create(['client_id' => $this->client2->id]);

        $response = $this->actingAs($this->client1, 'sanctum')
            ->getJson("/api/client/events/{$eventClient2->id}");

        $response->assertForbidden();
    }

    public function test_client_can_approve_quotation(): void
    {
        $event = Event::factory()->clientReview()->create([
            'client_id' => $this->client1->id,
            'dp_percentage' => 30.00,
        ]);

        $assignment = EventVendorAssignment::create([
            'event_id' => $event->id,
            'vendor_id' => $this->vendor->id,
            'package_id' => $this->package->id,
            'eo_offer_status' => 'accepted',
            'client_approval' => 'pending',
            'locked_price' => 30000000,
        ]);

        $response = $this->actingAs($this->client1, 'sanctum')
            ->postJson("/api/client/events/{$event->id}/approve-quotation");

        $response->assertOk();
        $event->refresh();
        $assignment->refresh();

        $this->assertEquals('approved', $assignment->client_approval);
        $this->assertEquals('awaiting_dp', $event->kanban_status);
        $this->assertEquals(30000000, (float) $event->agreed_price);

        // Pastikan tagihan DP otomatis terbuat
        $this->assertDatabaseHas('payments', [
            'event_id' => $event->id,
            'payment_type' => 'dp',
            'nominal' => 9000000, // 30% of 30jt
            'status' => 'unpaid',
        ]);
    }

    public function test_client_can_request_revision(): void
    {
        $event = Event::factory()->clientReview()->create([
            'client_id' => $this->client1->id,
            'agreed_price' => 30000000,
        ]);

        $assignment = EventVendorAssignment::create([
            'event_id' => $event->id,
            'vendor_id' => $this->vendor->id,
            'package_id' => $this->package->id,
            'eo_offer_status' => 'accepted',
            'client_approval' => 'approved',
            'locked_price' => 30000000,
        ]);

        $response = $this->actingAs($this->client1, 'sanctum')
            ->postJson("/api/client/events/{$event->id}/request-revision", [
                'note' => 'Tolong sesuaikan durasi pemotretan jadi 1 hari',
            ]);

        $response->assertOk();
        $event->refresh();
        $assignment->refresh();

        $this->assertEquals('drafting_quotation', $event->kanban_status);
        $this->assertNull($event->agreed_price);
        $this->assertEquals('pending', $assignment->client_approval);
    }

    public function test_client_cannot_approve_other_clients_event(): void
    {
        $eventClient2 = Event::factory()->clientReview()->create(['client_id' => $this->client2->id]);

        $response = $this->actingAs($this->client1, 'sanctum')
            ->postJson("/api/client/events/{$eventClient2->id}/approve-quotation");

        $response->assertForbidden();
    }
}
