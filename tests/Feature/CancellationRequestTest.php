<?php

namespace Tests\Feature;

use App\Mail\CancellationApprovedMail;
use App\Mail\CancellationRejectedMail;
use App\Models\Event;
use App\Models\EventVendorAssignment;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorPackage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class CancellationRequestTest extends TestCase
{
    use RefreshDatabase;

    protected User $eo;

    protected User $client;

    protected User $otherClient;

    protected function setUp(): void
    {
        parent::setUp();

        $this->eo = User::factory()->eo()->create();
        $this->client = User::factory()->client()->create();
        $this->otherClient = User::factory()->client()->create();
    }

    public function test_client_cancellation_policy_shows_refundable_when_more_than_30_days(): void
    {
        $event = Event::factory()->create([
            'client_id' => $this->client->id,
            'kanban_status' => 'on_progress',
            'event_date' => now()->addDays(60)->toDateString(),
        ]);

        $response = $this->actingAs($this->client, 'sanctum')
            ->getJson("/api/client/events/{$event->id}/cancellation-request/policy");

        $response->assertOk()
            ->assertJson([
                'can_cancel' => true,
                'dp_forfeit_days' => 30,
                'is_dp_forfeited' => false,
                'forfeit_reason' => null,
            ]);
    }

    public function test_client_cancellation_policy_shows_forfeited_when_30_days_or_less(): void
    {
        $event = Event::factory()->create([
            'client_id' => $this->client->id,
            'kanban_status' => 'on_progress',
            'event_date' => now()->addDays(20)->toDateString(),
        ]);

        $response = $this->actingAs($this->client, 'sanctum')
            ->getJson("/api/client/events/{$event->id}/cancellation-request/policy");

        $response->assertOk()
            ->assertJson([
                'can_cancel' => true,
                'dp_forfeit_days' => 30,
                'is_dp_forfeited' => true,
            ]);

        $this->assertNotNull($response->json('forfeit_reason'));
    }

    public function test_client_can_request_cancellation_with_valid_reason(): void
    {
        $event = Event::factory()->create([
            'client_id' => $this->client->id,
            'kanban_status' => 'on_progress',
            'event_date' => now()->addDays(45)->toDateString(),
        ]);

        $response = $this->actingAs($this->client, 'sanctum')
            ->postJson("/api/client/events/{$event->id}/cancellation-request", [
                'reason' => 'Ada perubahan rencana penting dari keluarga besar.',
            ]);

        $response->assertOk()
            ->assertJsonPath('event.cancellation_request_status', 'pending');

        $this->assertDatabaseHas('events', [
            'id' => $event->id,
            'cancellation_request_status' => 'pending',
            'cancellation_request_reason' => 'Ada perubahan rencana penting dari keluarga besar.',
        ]);
    }

    public function test_client_cannot_request_cancellation_with_short_reason(): void
    {
        $event = Event::factory()->create([
            'client_id' => $this->client->id,
            'kanban_status' => 'on_progress',
        ]);

        $response = $this->actingAs($this->client, 'sanctum')
            ->postJson("/api/client/events/{$event->id}/cancellation-request", [
                'reason' => 'Batal ya',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['reason']);
    }

    public function test_client_cannot_submit_duplicate_cancellation_while_pending(): void
    {
        $event = Event::factory()->create([
            'client_id' => $this->client->id,
            'kanban_status' => 'on_progress',
            'cancellation_request_status' => 'pending',
            'cancellation_request_reason' => 'Permintaan sebelumnya masih diproses.',
        ]);

        $response = $this->actingAs($this->client, 'sanctum')
            ->postJson("/api/client/events/{$event->id}/cancellation-request", [
                'reason' => 'Mencoba mengajukan pembatalan kembali sekarang.',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['event']);
    }

    public function test_client_can_withdraw_pending_cancellation_request(): void
    {
        $event = Event::factory()->create([
            'client_id' => $this->client->id,
            'kanban_status' => 'on_progress',
            'cancellation_request_status' => 'pending',
            'cancellation_request_reason' => 'Ingin membatalkan acara.',
            'cancellation_requested_at' => now(),
        ]);

        $response = $this->actingAs($this->client, 'sanctum')
            ->deleteJson("/api/client/events/{$event->id}/cancellation-request");

        $response->assertOk()
            ->assertJsonPath('message', 'Permintaan pembatalan berhasil ditarik kembali.');

        $this->assertDatabaseHas('events', [
            'id' => $event->id,
            'cancellation_request_status' => null,
            'cancellation_request_reason' => null,
        ]);
    }

    public function test_eo_can_list_pending_cancellation_requests(): void
    {
        Event::factory()->create([
            'cancellation_request_status' => 'pending',
            'cancellation_request_reason' => 'Alasan pembatalan satu.',
            'cancellation_requested_at' => now(),
        ]);

        Event::factory()->create([
            'cancellation_request_status' => null,
        ]);

        $response = $this->actingAs($this->eo, 'sanctum')
            ->getJson('/api/admin/cancellation-requests');

        $response->assertOk()
            ->assertJsonCount(1, 'events');
    }

    public function test_eo_can_approve_cancellation_request_and_email_is_sent(): void
    {
        Mail::fake();

        $vendorUser = User::factory()->vendor()->create();
        $vendor = Vendor::create([
            'user_id' => $vendorUser->id,
            'business_name' => 'Katering Enak',
            'category' => 'Catering',
            'contact_number' => '081234567890',
            'address' => 'Jakarta',
        ]);
        $package = VendorPackage::create([
            'vendor_id' => $vendor->id,
            'package_name' => 'Paket Buffet',
            'description' => 'Menu lengkap',
            'price' => 15000000,
        ]);

        $event = Event::factory()->create([
            'client_id' => $this->client->id,
            'kanban_status' => 'on_progress',
            'event_date' => now()->addDays(50)->toDateString(),
            'cancellation_request_status' => 'pending',
            'cancellation_request_reason' => 'Klien tidak dapat melanjutkan acara.',
            'cancellation_requested_at' => now(),
        ]);

        $assignment = EventVendorAssignment::create([
            'event_id' => $event->id,
            'vendor_id' => $vendor->id,
            'package_id' => $package->id,
            'locked_price' => 15000000,
            'eo_offer_status' => 'accepted',
            'client_approval' => 'approved',
        ]);

        $response = $this->actingAs($this->eo, 'sanctum')
            ->patchJson("/api/admin/cancellation-requests/{$event->id}/approve", [
                'review_note' => 'Pembatalan disetujui. Tim kami akan menghubungi untuk pengembalian dana.',
            ]);

        $response->assertOk();

        $this->assertDatabaseHas('events', [
            'id' => $event->id,
            'kanban_status' => 'cancelled',
            'cancellation_request_status' => 'approved',
            'cancellation_review_note' => 'Pembatalan disetujui. Tim kami akan menghubungi untuk pengembalian dana.',
        ]);

        $this->assertDatabaseHas('event_vendor_assignments', [
            'id' => $assignment->id,
            'eo_offer_status' => 'cancelled',
        ]);

        Mail::assertQueued(CancellationApprovedMail::class, function (CancellationApprovedMail $mail) use ($event) {
            return $mail->event->id === $event->id && $mail->isDpForfeited === false;
        });
    }

    public function test_eo_can_reject_cancellation_request_and_email_is_sent(): void
    {
        Mail::fake();

        $event = Event::factory()->create([
            'client_id' => $this->client->id,
            'kanban_status' => 'on_progress',
            'cancellation_request_status' => 'pending',
            'cancellation_request_reason' => 'Minta batal tapi hari sudah H-2.',
            'cancellation_requested_at' => now(),
        ]);

        $response = $this->actingAs($this->eo, 'sanctum')
            ->patchJson("/api/admin/cancellation-requests/{$event->id}/reject", [
                'review_note' => 'Persiapan lapangan sudah selesai 100% sehingga tidak dapat dibatalkan.',
            ]);

        $response->assertOk();

        $this->assertDatabaseHas('events', [
            'id' => $event->id,
            'kanban_status' => 'on_progress', // status tidak berubah
            'cancellation_request_status' => 'rejected',
            'cancellation_review_note' => 'Persiapan lapangan sudah selesai 100% sehingga tidak dapat dibatalkan.',
        ]);

        Mail::assertQueued(CancellationRejectedMail::class, function (CancellationRejectedMail $mail) use ($event) {
            return $mail->event->id === $event->id
                && $mail->reviewNote === 'Persiapan lapangan sudah selesai 100% sehingga tidak dapat dibatalkan.';
        });
    }

    public function test_other_client_cannot_access_or_cancel_another_clients_event(): void
    {
        $event = Event::factory()->create([
            'client_id' => $this->client->id,
            'kanban_status' => 'on_progress',
        ]);

        $response = $this->actingAs($this->otherClient, 'sanctum')
            ->postJson("/api/client/events/{$event->id}/cancellation-request", [
                'reason' => 'Mencoba membatalkan acara orang lain secara ilegal.',
            ]);

        $response->assertStatus(403);
    }
}
