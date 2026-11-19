<?php

namespace Tests\Feature;

use App\Mail\CancellationApprovedMail;
use App\Mail\OrderRejectedMail;
use App\Models\Client;
use App\Models\Event;
use App\Models\EventVendorAssignment;
use App\Models\Payment;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorPackage;
use App\Services\KanbanTransitionService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BusinessLogicFixesTest extends TestCase
{
    use RefreshDatabase;

    private User $client;

    private User $eo;

    protected function setUp(): void
    {
        parent::setUp();

        $this->client = User::factory()->client()->create();
        $this->eo = User::factory()->eo()->create();
    }

    /**
     * BUG-LOGIC-001: Tanggal acara yang dibatalkan / ditolak dapat dipesan kembali tanpa konflik jadwal.
     */
    public function test_bug_logic_001_cancelled_or_rejected_event_dates_do_not_block_new_bookings(): void
    {
        $targetDate = Carbon::now()->addDays(70)->format('Y-m-d');

        // Acara lama yang dibatalkan
        Event::factory()->create([
            'event_date' => $targetDate,
            'kanban_status' => 'cancelled',
        ]);

        $payload = [
            'event_name' => 'Acara Pernikahan Baru',
            'category' => 'wedding',
            'event_date' => $targetDate,
            'guest_count' => 150,
            'budget' => 50000000,
            'has_own_venue' => false,
            'location' => 'Gedung Serbaguna',
        ];

        // Client memesan di tanggal yang sama dengan acara cancelled
        $response = $this->actingAs($this->client, 'sanctum')
            ->postJson('/api/bookings', $payload);

        $response->assertCreated();
    }

    /**
     * BUG-LOGIC-002: Nominal tagihan DP dan Pelunasan dihitung ulang ketika terjadi revisi harga penawaran.
     */
    public function test_bug_logic_002_dp_and_pelunasan_nominal_recalculated_after_quotation_revision(): void
    {
        $event = Event::factory()->create([
            'client_id' => $this->client->id,
            'kanban_status' => 'client_review',
            'dp_percentage' => 30.0,
        ]);

        $vendor = Vendor::factory()->create();
        $package = VendorPackage::factory()->for($vendor)->create(['price' => 10000000]);

        $assignment = EventVendorAssignment::create([
            'event_id' => $event->id,
            'vendor_id' => $vendor->id,
            'package_id' => $package->id,
            'package_name' => $package->package_name,
            'package_price' => 10000000,
            'locked_price' => 10000000,
            'eo_offer_status' => 'accepted',
            'client_approval' => 'approved',
        ]);

        // Simulasikan tagihan lama bernilai 10jt (DP 3jt, Pelunasan 7jt) yang sudah pernah dibuat
        Payment::create([
            'event_id' => $event->id,
            'payment_type' => 'dp',
            'nominal' => 3000000,
            'status' => 'unpaid',
        ]);
        Payment::create([
            'event_id' => $event->id,
            'payment_type' => 'pelunasan',
            'nominal' => 7000000,
            'status' => 'unpaid',
        ]);

        // Terjadi revisi penawaran harga menjadi 20jt dan disetujui klien
        $assignment->update([
            'locked_price' => 20000000,
            'client_approval' => 'approved',
        ]);

        $service = app(KanbanTransitionService::class);

        // Transisi ke awaiting_dp setelah revisi penawaran
        $service->transition($event->fresh(), 'awaiting_dp');

        // Nominal DP dan pelunasan harus otomatis terhitung ulang (DP 6jt, Pelunasan 14jt)
        $this->assertDatabaseHas('payments', [
            'event_id' => $event->id,
            'payment_type' => 'dp',
            'nominal' => 6000000,
            'status' => 'unpaid',
        ]);
        $this->assertDatabaseHas('payments', [
            'event_id' => $event->id,
            'payment_type' => 'pelunasan',
            'nominal' => 14000000,
            'status' => 'unpaid',
        ]);
    }

    /**
     * BUG-LOGIC-003: Upload bukti dan verifikasi pembayaran dilarang untuk event cancelled.
     */
    public function test_bug_logic_003_cannot_upload_proof_or_verify_payment_for_cancelled_event(): void
    {
        Storage::fake('public');

        $event = Event::factory()->create([
            'client_id' => $this->client->id,
            'kanban_status' => 'cancelled',
        ]);

        $payment = Payment::create([
            'event_id' => $event->id,
            'payment_type' => 'dp',
            'nominal' => 5000000,
            'status' => 'unpaid',
        ]);

        $file = UploadedFile::fake()->image('transfer.jpg');

        // Client coba upload bukti pada acara cancelled -> 422
        $this->actingAs($this->client, 'sanctum')
            ->postJson("/api/payments/{$payment->id}/proof", [
                'payment_proof' => $file,
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Tidak dapat mengunggah bukti bayar untuk acara yang sudah dibatalkan atau ditolak.');

        // Status diubah ke pending_verification secara manual untuk uji verifikasi EO
        $payment->update(['status' => 'pending_verification']);

        // EO coba verifikasi pembayaran pada acara cancelled -> 422
        $this->actingAs($this->eo, 'sanctum')
            ->patchJson("/api/payments/{$payment->id}/verify", [
                'action' => 'approve',
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Tidak dapat memverifikasi pembayaran untuk acara yang sudah dibatalkan atau ditolak.');
    }

    /**
     * BUG-LOGIC-004: Vendor tidak dapat melihat tawaran atau mengunggah progres pada event yang dibatalkan/selesai.
     */
    public function test_bug_logic_004_vendor_cannot_accept_offers_or_add_progress_on_cancelled_or_done_events(): void
    {
        $vendorUser = User::factory()->vendor()->create();
        $vendor = Vendor::factory()->create(['user_id' => $vendorUser->id]);
        $package = VendorPackage::factory()->for($vendor)->create();

        $cancelledEvent = Event::factory()->create(['kanban_status' => 'cancelled']);
        $doneEvent = Event::factory()->create(['kanban_status' => 'done']);

        $assignmentCancelled = EventVendorAssignment::create([
            'event_id' => $cancelledEvent->id,
            'vendor_id' => $vendor->id,
            'package_id' => $package->id,
            'package_name' => $package->package_name,
            'package_price' => $package->price,
            'locked_price' => $package->price,
            'eo_offer_status' => 'pending',
            'client_approval' => 'pending',
        ]);

        $assignmentDone = EventVendorAssignment::create([
            'event_id' => $doneEvent->id,
            'vendor_id' => $vendor->id,
            'package_id' => $package->id,
            'package_name' => $package->package_name,
            'package_price' => $package->price,
            'locked_price' => $package->price,
            'eo_offer_status' => 'accepted',
            'client_approval' => 'accepted',
        ]);

        // Job offers tidak menampilkan assignment dari cancelled event
        $this->actingAs($vendorUser, 'sanctum')
            ->getJson('/api/vendor/job-offers')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        // Respond offer pada cancelled event ditolak
        $this->actingAs($vendorUser, 'sanctum')
            ->patchJson("/api/vendor/job-offers/{$assignmentCancelled->id}/response", [
                'status' => 'accepted',
            ])
            ->assertStatus(422);

        // Active jobs tidak menampilkan assignment dari done event
        $this->actingAs($vendorUser, 'sanctum')
            ->getJson('/api/vendor/active-jobs')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        // Store progress pada done event ditolak
        $this->actingAs($vendorUser, 'sanctum')
            ->postJson("/api/vendor/active-jobs/{$assignmentDone->id}/progress", [
                'note' => 'Persiapan selesai 100%',
            ])
            ->assertStatus(422);
    }

    /**
     * BUG-LOGIC-005: Pembatalan acara via Inspector EO mengirimkan notifikasi email ke klien.
     */
    public function test_bug_logic_005_eo_inspector_cancel_dispatches_cancellation_email_to_client(): void
    {
        Mail::fake();

        $event = Event::factory()->create([
            'client_id' => $this->client->id,
            'kanban_status' => 'drafting_quotation',
            'event_date' => Carbon::now()->addDays(45)->format('Y-m-d'),
        ]);

        $response = $this->actingAs($this->eo, 'sanctum')
            ->postJson("/api/events/{$event->id}/cancel", [
                'reason' => 'Permintaan khusus pembatalan dari EO.',
            ]);

        $response->assertOk();

        Mail::assertQueued(CancellationApprovedMail::class, function (CancellationApprovedMail $mail) {
            return $mail->event->client_id === $this->client->id
                && $mail->reviewNote === 'Permintaan khusus pembatalan dari EO.';
        });
    }

    /**
     * BUG-LOGIC-006: Riwayat pembayaran acara cancelled tetap dapat diakses oleh client.
     */
    public function test_bug_logic_006_client_can_retrieve_payments_for_cancelled_events(): void
    {
        $event = Event::factory()->create([
            'client_id' => $this->client->id,
            'kanban_status' => 'cancelled',
        ]);

        $payment = Payment::create([
            'event_id' => $event->id,
            'payment_type' => 'dp',
            'nominal' => 5000000,
            'status' => 'paid',
        ]);

        $response = $this->actingAs($this->client, 'sanctum')
            ->getJson('/api/payments');

        $response->assertOk()
            ->assertJsonFragment([
                'id' => $payment->id,
                'status' => 'paid',
            ]);
    }

    /**
     * BUG-LOGIC-007: Klien belum verifikasi email dilarang membuat pemesanan atau menyetujui penawaran.
     */
    public function test_bug_logic_007_unverified_client_cannot_create_booking_or_approve_quotation(): void
    {
        $unverifiedClient = User::factory()->client()->unverified()->create();

        $payload = [
            'event_name' => 'Acara Pernikahan Belum Verif',
            'category' => 'wedding',
            'event_date' => Carbon::now()->addDays(70)->format('Y-m-d'),
            'guest_count' => 150,
            'budget' => 50000000,
            'has_own_venue' => false,
            'location' => 'Gedung Serbaguna',
        ];

        // Pemesanan dilarang bagi klien belum verifikasi email
        $this->actingAs($unverifiedClient, 'sanctum')
            ->postJson('/api/bookings', $payload)
            ->assertStatus(403);

        // Menyetujui penawaran juga dilarang bagi akun belum verifikasi email
        $event = Event::factory()->clientReview()->create(['client_id' => $unverifiedClient->id]);
        $this->actingAs($unverifiedClient, 'sanctum')
            ->postJson("/api/client/events/{$event->id}/approve-quotation", ['terms_accepted' => true])
            ->assertStatus(403);
    }

    /**
     * BUG-LOGIC-008: Acara dibatalkan tidak dihitung sebagai acara aktif atau piutang di dashboard EO.
     */
    public function test_bug_logic_008_cancelled_events_are_excluded_from_eo_dashboard_active_events_and_receivables(): void
    {
        // 1 acara batal dengan nilai agreed_price 10jt
        $cancelledEvent = Event::factory()->create([
            'client_id' => $this->client->id,
            'kanban_status' => 'cancelled',
            'agreed_price' => 10000000,
            'event_date' => Carbon::now()->addDays(15)->format('Y-m-d'),
        ]);

        Payment::create([
            'event_id' => $cancelledEvent->id,
            'payment_type' => 'dp',
            'nominal' => 3000000,
            'status' => 'paid',
            'verified_at' => Carbon::now(),
        ]);

        Payment::create([
            'event_id' => $cancelledEvent->id,
            'payment_type' => 'pelunasan',
            'nominal' => 7000000,
            'status' => 'unpaid',
        ]);

        $response = $this->actingAs($this->eo, 'sanctum')
            ->getJson('/api/admin/event-summary');

        $response->assertOk();

        // Acara aktif harus 0 (karena satu-satunya acara berstatus cancelled)
        $this->assertEquals(0, $response->json('operational.active_events_count'));

        // Piutang aktif harus 0 (tidak boleh memasukkan 7jt dari acara yang batal)
        $this->assertEquals(0, $response->json('operational.total_receivables'));

        // Uang muka operasional tersimpan harus 0
        $this->assertEquals(0, $response->json('operational.deferred_revenue'));
    }

    /**
     * BUG-LOGIC-009: Upload bukti dan verifikasi pelunasan dilarang jika DP belum lunas.
     */
    public function test_bug_logic_009_cannot_upload_or_verify_pelunasan_before_dp_is_paid(): void
    {
        Storage::fake('public');

        $event = Event::factory()->awaitingDp()->create([
            'client_id' => $this->client->id,
        ]);

        $dpPayment = Payment::create([
            'event_id' => $event->id,
            'payment_type' => 'dp',
            'nominal' => 3000000,
            'status' => 'unpaid',
        ]);

        $pelunasanPayment = Payment::create([
            'event_id' => $event->id,
            'payment_type' => 'pelunasan',
            'nominal' => 7000000,
            'status' => 'unpaid',
        ]);

        $file = UploadedFile::fake()->image('pelunasan.jpg');

        // Klien coba upload pelunasan saat DP masih unpaid -> Ditolak 422
        $this->actingAs($this->client, 'sanctum')
            ->postJson("/api/payments/{$pelunasanPayment->id}/proof", [
                'payment_proof' => $file,
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Uang muka (DP) harus dilunasi dan diverifikasi terlebih dahulu sebelum mengunggah bukti pelunasan.');

        // Begitu juga verifikasi pelunasan oleh EO ditolak jika DP belum paid
        $pelunasanPayment->update(['status' => 'pending_verification']);
        $this->actingAs($this->eo, 'sanctum')
            ->patchJson("/api/payments/{$pelunasanPayment->id}/verify", [
                'action' => 'approve',
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Tidak dapat memverifikasi pelunasan karena pembayaran DP belum lunas.');
    }

    /**
     * BUG-LOGIC-010: Kartu Kanban tidak dapat dimajukan saat acara memiliki permohonan pembatalan pending.
     */
    public function test_bug_logic_010_cannot_move_kanban_card_when_cancellation_request_is_pending(): void
    {
        $event = Event::factory()->awaitingDp()->create([
            'client_id' => $this->client->id,
            'cancellation_request_status' => 'pending',
            'cancellation_request_reason' => 'Ingin membatalkan acara',
        ]);

        $this->actingAs($this->eo, 'sanctum')
            ->patchJson("/api/admin/kanban/{$event->id}/move", [
                'target_status' => 'on_progress',
            ])
            ->assertStatus(422)
            ->assertJsonPath('errors.target_status.0', 'Tidak dapat memindahkan status acara. Klien telah mengajukan permohonan pembatalan yang sedang menunggu konfirmasi EO.');
    }

    /**
     * BUG-LOGIC-011: EO dilarang menghapus akun klien yang masih memiliki acara aktif.
     */
    public function test_bug_logic_011_cannot_soft_delete_client_with_active_events(): void
    {
        $clientUser = User::factory()->client()->create();
        Event::factory()->onProgress()->create(['client_id' => $clientUser->id]);

        $clientModel = Client::findOrFail($clientUser->id);

        $this->actingAs($this->eo, 'sanctum')
            ->deleteJson("/api/admin/clients/{$clientModel->id}")
            ->assertStatus(422)
            ->assertJsonPath('message', 'Tidak dapat menghapus akun Client yang masih memiliki acara aktif atau berjalan. Harap selesaikan atau batalkan acara terlebih dahulu.');

        $this->assertDatabaseHas('users', [
            'id' => $clientModel->id,
            'deleted_at' => null,
        ]);
    }

    /**
     * BUG-LOGIC-012: Penolakan pesanan masuk oleh EO men-dispatch email notifikasi ke klien.
     */
    public function test_bug_logic_012_eo_reject_order_dispatches_notification_email_to_client(): void
    {
        Mail::fake();

        $event = Event::factory()->create([
            'client_id' => $this->client->id,
            'kanban_status' => 'request',
        ]);

        $response = $this->actingAs($this->eo, 'sanctum')
            ->patchJson("/api/admin/orders/{$event->id}/reject", [
                'reason' => 'Kapasitas EO penuh pada jadwal tersebut.',
            ]);

        $response->assertOk();

        Mail::assertQueued(OrderRejectedMail::class, function (OrderRejectedMail $mail) {
            return $mail->event->client_id === $this->client->id
                && $mail->reason === 'Kapasitas EO penuh pada jadwal tersebut.';
        });
    }
}
