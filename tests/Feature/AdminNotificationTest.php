<?php

namespace Tests\Feature;

use App\Mail\InvoiceIssuedMail;
use App\Mail\OrderAcceptedMail;
use App\Mail\PaymentVerifiedMail;
use App\Mail\QuotationSentMail;
use App\Mail\VendorJobOfferMail;
use App\Mail\VendorPayoutMail;
use App\Mail\VendorRejectedMail;
use App\Models\Event;
use App\Models\EventVendorAssignment;
use App\Models\Payment;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorPackage;
use App\Services\AdminNotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_or_non_eo_cannot_access_notifications(): void
    {
        $this->getJson('/api/admin/notifications')->assertUnauthorized();

        $client = User::factory()->client()->create();
        $this->actingAs($client, 'sanctum')
            ->getJson('/api/admin/notifications')
            ->assertForbidden();
    }

    public function test_eo_admin_can_retrieve_notifications_and_summary(): void
    {
        $admin = User::factory()->eo()->create();

        AdminNotificationService::notifyAdmins(
            title: 'Pesanan Masuk Baru',
            message: 'Klien baru memesan acara.',
            category: 'event',
            actionUrl: '/admin/orders',
            metadata: ['test' => 123]
        );

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/notifications');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['id', 'title', 'message', 'category', 'action_url', 'is_read', 'created_at', 'created_at_human'],
                ],
                'summary' => ['unread_count', 'total_count'],
            ]);

        $this->assertSame(1, $response->json('summary.unread_count'));
        $this->assertSame(1, $response->json('summary.total_count'));
        $this->assertSame('Pesanan Masuk Baru', $response->json('data.0.title'));
    }

    public function test_eo_admin_can_mark_single_notification_as_read(): void
    {
        $admin = User::factory()->eo()->create();

        AdminNotificationService::notifyAdmins(
            title: 'Pembayaran DP Masuk',
            message: 'Bukti transfer diunggah',
            category: 'payment',
            actionUrl: '/admin/payments'
        );

        $list = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/notifications')->json('data');
        $notifId = $list[0]['id'];

        $patchRes = $this->actingAs($admin, 'sanctum')->patchJson("/api/admin/notifications/{$notifId}/read");
        $patchRes->assertOk()->assertJson(['success' => true]);

        $checkRes = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/notifications');
        $this->assertSame(0, $checkRes->json('summary.unread_count'));
        $this->assertTrue($checkRes->json('data.0.is_read'));
    }

    public function test_eo_admin_can_mark_all_notifications_as_read(): void
    {
        $admin = User::factory()->eo()->create();

        AdminNotificationService::notifyAdmins('Notif 1', 'Pesan 1', 'event');
        AdminNotificationService::notifyAdmins('Notif 2', 'Pesan 2', 'vendor');

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/notifications/mark-all-read');

        $response->assertOk()->assertJson(['success' => true]);

        $check = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/notifications');
        $this->assertSame(0, $check->json('summary.unread_count'));
    }

    public function test_eo_admin_can_delete_notification(): void
    {
        $admin = User::factory()->eo()->create();

        AdminNotificationService::notifyAdmins('Notif Hapus', 'Pesan hapus', 'general');

        $list = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/notifications')->json('data');
        $notifId = $list[0]['id'];

        $delRes = $this->actingAs($admin, 'sanctum')->deleteJson("/api/admin/notifications/{$notifId}");
        $delRes->assertOk()->assertJson(['success' => true]);

        $check = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/notifications');
        $this->assertSame(0, $check->json('summary.total_count'));
    }

    public function test_order_acceptance_dispatches_order_accepted_mail_to_client(): void
    {
        Mail::fake();

        $admin = User::factory()->eo()->create();
        $client = User::factory()->client()->create(['email' => 'client@evento.test']);
        $event = Event::factory()->create([
            'client_id' => $client->id,
            'kanban_status' => 'request',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/orders/{$event->id}/accept");

        $response->assertOk();

        Mail::assertSent(OrderAcceptedMail::class, function (OrderAcceptedMail $mail) use ($client) {
            return $mail->hasTo($client->email);
        });
    }

    public function test_send_quotation_dispatches_quotation_sent_mail_to_client(): void
    {
        Mail::fake();

        $admin = User::factory()->eo()->create();
        $client = User::factory()->client()->create(['email' => 'client@evento.test']);
        $event = Event::factory()->draftingQuotation()->create([
            'client_id' => $client->id,
        ]);

        EventVendorAssignment::factory()->accepted()->create([
            'event_id' => $event->id,
        ]);

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/events/{$event->id}/send-quotation")
            ->assertOk();

        Mail::assertSent(QuotationSentMail::class, function (QuotationSentMail $mail) use ($client) {
            return $mail->hasTo($client->email);
        });
    }

    public function test_payment_verified_dispatches_payment_verified_mail_to_client(): void
    {
        Mail::fake();

        $admin = User::factory()->eo()->create();
        $client = User::factory()->client()->create(['email' => 'client@evento.test']);
        $event = Event::factory()->create([
            'client_id' => $client->id,
            'kanban_status' => 'awaiting_dp',
            'agreed_price' => 10000000,
        ]);

        $payment = Payment::create([
            'event_id' => $event->id,
            'payment_type' => 'dp',
            'nominal' => 3000000,
            'status' => 'pending_verification',
            'proof_url' => 'uploads/proofs/test.png',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/payments/{$payment->id}/verify", [
                'action' => 'approve',
            ])
            ->assertOk();

        Mail::assertSent(PaymentVerifiedMail::class, function (PaymentVerifiedMail $mail) use ($client) {
            return $mail->hasTo($client->email);
        });
    }

    public function test_assign_vendor_dispatches_vendor_job_offer_mail(): void
    {
        Mail::fake();

        $admin = User::factory()->eo()->create();
        $vendorUser = User::factory()->vendor()->create(['email' => 'vendor@evento.test']);
        $vendor = Vendor::factory()->for($vendorUser)->create([
            'status' => 'approved',
        ]);
        $package = VendorPackage::factory()->for($vendor)->create([
            'price' => 2500000,
        ]);
        $event = Event::factory()->draftingQuotation()->create();

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/events/{$event->id}/vendors", [
                'vendor_id' => $vendor->id,
                'package_id' => $package->id,
                'cost_negotiated' => 2400000,
            ])
            ->assertCreated();

        Mail::assertSent(VendorJobOfferMail::class, function (VendorJobOfferMail $mail) use ($vendorUser) {
            return $mail->hasTo($vendorUser->email);
        });
    }

    public function test_vendor_payout_dispatches_vendor_payout_mail(): void
    {
        Storage::fake('public');
        Mail::fake();

        $admin = User::factory()->eo()->create();
        $vendorUser = User::factory()->vendor()->create(['email' => 'vendor@evento.test']);
        $vendor = Vendor::factory()->for($vendorUser)->create([
            'status' => 'approved',
        ]);
        $package = VendorPackage::factory()->for($vendor)->create([
            'price' => 5000000,
        ]);
        $event = Event::factory()->create(['kanban_status' => 'in_progress']);

        $assignment = EventVendorAssignment::create([
            'event_id' => $event->id,
            'vendor_id' => $vendor->id,
            'package_id' => $package->id,
            'cost_negotiated' => 4500000,
            'eo_offer_status' => 'accepted',
            'client_approval' => 'accepted',
            'payout_status' => 'pending',
        ]);

        $proofFile = UploadedFile::fake()->image('transfer_proof.jpg');

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/vendor-assignments/{$assignment->id}/payout", [
                'nominal' => 4500000,
                'note' => 'Transfer honor via BCA',
                'proof' => $proofFile,
            ])
            ->assertOk();

        Mail::assertSent(VendorPayoutMail::class, function (VendorPayoutMail $mail) use ($vendorUser) {
            return $mail->hasTo($vendorUser->email);
        });
    }

    public function test_vendor_rejection_dispatches_vendor_rejected_mail(): void
    {
        Mail::fake();

        $admin = User::factory()->eo()->create();
        $vendorUser = User::factory()->vendor()->create(['email' => 'vendor@evento.test']);
        $vendor = Vendor::factory()->for($vendorUser)->create([
            'status' => 'pending',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/vendors/{$vendor->id}/reject", [
                'rejection_reason' => 'Portofolio belum memenuhi standar Evento.',
            ])
            ->assertOk();

        Mail::assertSent(VendorRejectedMail::class, function (VendorRejectedMail $mail) use ($vendorUser) {
            return $mail->hasTo($vendorUser->email);
        });
    }

    public function test_approve_quotation_dispatches_invoice_issued_mail_and_notifies_admin(): void
    {
        Mail::fake();

        $eo = User::factory()->eo()->create();
        $client = User::factory()->client()->create(['email' => 'client@evento.test']);
        $vendorUser = User::factory()->vendor()->create();
        $vendor = Vendor::factory()->for($vendorUser)->create();
        $package = VendorPackage::factory()->for($vendor)->create(['price' => 20000000]);

        $event = Event::factory()->clientReview()->create([
            'client_id' => $client->id,
            'dp_percentage' => 30.00,
        ]);

        EventVendorAssignment::create([
            'event_id' => $event->id,
            'vendor_id' => $vendor->id,
            'package_id' => $package->id,
            'eo_offer_status' => 'accepted',
            'client_approval' => 'pending',
            'locked_price' => 20000000,
        ]);

        $this->actingAs($client, 'sanctum')
            ->postJson("/api/client/events/{$event->id}/approve-quotation", [
                'terms_accepted' => true,
            ])
            ->assertOk();

        Mail::assertSent(InvoiceIssuedMail::class, function (InvoiceIssuedMail $mail) use ($client) {
            return $mail->hasTo($client->email);
        });

        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $eo->id,
        ]);
    }
}
