<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\EventVendorAssignment;
use App\Models\Payment;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorPackage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class InvoiceAndPayoutTest extends TestCase
{
    use RefreshDatabase;

    private User $clientUser;

    private User $otherClientUser;

    private User $eoUser;

    private User $vendorUser;

    private Vendor $vendor;

    private User $otherVendorUser;

    private Event $event;

    private Payment $dpPayment;

    private EventVendorAssignment $assignment;

    protected function setUp(): void
    {
        parent::setUp();

        // Setup Client
        $this->clientUser = User::factory()->client()->create();
        $this->otherClientUser = User::factory()->client()->create();

        // Setup EO
        $this->eoUser = User::factory()->eo()->create();

        // Setup Vendor
        $this->vendorUser = User::factory()->vendor()->create();
        $this->vendor = Vendor::factory()->for($this->vendorUser)->create([
            'business_name' => 'Foto Kreatif Jaya',
            'bank_name' => 'BCA',
            'bank_account_number' => '1234567890',
            'bank_account_holder' => 'CV Foto Kreatif Jaya',
        ]);

        $this->otherVendorUser = User::factory()->vendor()->create();
        Vendor::factory()->for($this->otherVendorUser)->create();

        // Setup Event
        $this->event = Event::factory()->create([
            'client_id' => $this->clientUser->id,
            'budget' => 20000000,
            'kanban_status' => 'on_progress',
        ]);

        // Setup Payment
        $this->dpPayment = Payment::create([
            'event_id' => $this->event->id,
            'nominal' => 5000000,
            'payment_type' => 'dp',
            'status' => 'pending',
            'due_date' => now()->addDays(7)->toDateString(),
        ]);

        // Setup Vendor Assignment
        $package = VendorPackage::factory()->for($this->vendor)->create([
            'package_name' => 'Paket Dokumentasi Gold',
            'price' => 3000000,
        ]);

        $this->assignment = EventVendorAssignment::create([
            'event_id' => $this->event->id,
            'vendor_id' => $this->vendor->id,
            'package_id' => $package->id,
            'package_name' => $package->package_name,
            'package_price' => $package->price,
            'locked_price' => $package->price,
            'eo_offer_status' => 'accepted',
            'client_approval' => 'accepted',
            'payout_status' => 'pending',
        ]);
    }

    /**
     * Test klien dapat melihat tagihan (invoice) miliknya.
     */
    public function test_client_can_view_own_invoice(): void
    {
        $response = $this->actingAs($this->clientUser, 'sanctum')
            ->getJson("/api/payments/{$this->dpPayment->id}/invoice");

        $response->assertOk()
            ->assertJsonPath('data.document_type', 'invoice')
            ->assertJsonPath('data.payment.id', $this->dpPayment->id)
            ->assertJsonStructure([
                'data' => [
                    'document_type',
                    'title',
                    'invoice_number',
                    'receipt_number',
                    'company',
                    'client',
                    'event',
                    'payment',
                    'items',
                ],
            ]);
    }

    /**
     * Test tagihan berstatus paid berubah menjadi kuitansi pembayaran resmi (receipt/nota).
     */
    public function test_verified_payment_becomes_official_receipt(): void
    {
        $this->dpPayment->update([
            'status' => 'paid',
            'verified_at' => now(),
            'receipt_number' => 'RCP/EVN/2026/11/0001',
        ]);

        $response = $this->actingAs($this->clientUser, 'sanctum')
            ->getJson("/api/payments/{$this->dpPayment->id}/invoice");

        $response->assertOk()
            ->assertJsonPath('data.document_type', 'receipt')
            ->assertJsonPath('data.receipt_number', 'RCP/EVN/2026/11/0001');
    }

    /**
     * Test klien lain tidak berhak mengakses invoice milik klien lain (403).
     */
    public function test_client_cannot_view_another_clients_invoice(): void
    {
        $this->actingAs($this->otherClientUser, 'sanctum')
            ->getJson("/api/payments/{$this->dpPayment->id}/invoice")
            ->assertForbidden();
    }

    /**
     * Test EO dapat mengakses semua invoice klien.
     */
    public function test_eo_can_view_any_client_invoice(): void
    {
        $this->actingAs($this->eoUser, 'sanctum')
            ->getJson("/api/payments/{$this->dpPayment->id}/invoice")
            ->assertOk();
    }

    /**
     * Test vendor dapat melihat invoice & status pencairan honornya ke EO.
     */
    public function test_vendor_can_view_own_job_invoice_and_payout(): void
    {
        $response = $this->actingAs($this->vendorUser, 'sanctum')
            ->getJson("/api/vendor-assignments/{$this->assignment->id}/invoice");

        $response->assertOk()
            ->assertJsonPath('data.assignment.payout_status', 'pending')
            ->assertJsonPath('data.vendor.business_name', 'Foto Kreatif Jaya')
            ->assertJsonStructure([
                'data' => [
                    'vendor_invoice_number',
                    'payout_receipt_number',
                    'assignment',
                    'event',
                    'vendor',
                    'company',
                ],
            ]);
    }

    /**
     * Test vendor lain dilarang melihat dokumen invoice vendor lain (403).
     */
    public function test_other_vendor_cannot_view_unowned_assignment_invoice(): void
    {
        $this->actingAs($this->otherVendorUser, 'sanctum')
            ->getJson("/api/vendor-assignments/{$this->assignment->id}/invoice")
            ->assertForbidden();
    }

    /**
     * Test EO dapat mencairkan honor vendor, mengunggah bukti transfer, dan menghasilkan voucher kas keluar.
     */
    public function test_eo_can_disburse_vendor_payout(): void
    {
        Storage::fake('public');

        $proofFile = UploadedFile::fake()->image('transfer_proof.jpg');

        $response = $this->actingAs($this->eoUser, 'sanctum')
            ->postJson("/api/admin/vendor-assignments/{$this->assignment->id}/payout", [
                'nominal' => 3000000,
                'note' => 'Pelunasan honor dokumentasi panggung utama via transfer BCA',
                'proof' => $proofFile,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.payout_status', 'paid')
            ->assertJsonPath('data.payout_nominal', '3000000.00');

        $this->assignment->refresh();
        $this->assertSame('paid', $this->assignment->payout_status);
        $this->assertEquals(3000000, (int) $this->assignment->payout_nominal);
        $this->assertNotNull($this->assignment->payout_at);
        $this->assertNotNull($this->assignment->payout_proof_url);
        $this->assertStringStartsWith('VCH/EVN/', $this->assignment->payout_receipt_number);
    }

    /**
     * Test non-EO (misal klien atau vendor) dilarang mencairkan honor vendor.
     */
    public function test_non_eo_cannot_disburse_vendor_payout(): void
    {
        $this->actingAs($this->clientUser, 'sanctum')
            ->postJson("/api/admin/vendor-assignments/{$this->assignment->id}/payout", [
                'nominal' => 3000000,
            ])
            ->assertForbidden();

        $this->actingAs($this->vendorUser, 'sanctum')
            ->postJson("/api/admin/vendor-assignments/{$this->assignment->id}/payout", [
                'nominal' => 3000000,
            ])
            ->assertForbidden();
    }

    /**
     * Test vendor dapat memperbarui data rekening bank untuk pencairan honor.
     */
    public function test_vendor_can_update_bank_account_info(): void
    {
        $response = $this->actingAs($this->vendorUser, 'sanctum')
            ->putJson('/api/vendor/bank-account', [
                'bank_name' => 'Bank Mandiri',
                'bank_account_number' => '9876543210123',
                'bank_account_holder' => 'Foto Kreatif Mandiri PT',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.bank_name', 'Bank Mandiri')
            ->assertJsonPath('data.bank_account_number', '9876543210123')
            ->assertJsonPath('data.bank_account_holder', 'Foto Kreatif Mandiri PT');

        $this->vendor->refresh();
        $this->assertSame('Bank Mandiri', $this->vendor->bank_name);
        $this->assertSame('9876543210123', $this->vendor->bank_account_number);
        $this->assertSame('Foto Kreatif Mandiri PT', $this->vendor->bank_account_holder);
    }
}
