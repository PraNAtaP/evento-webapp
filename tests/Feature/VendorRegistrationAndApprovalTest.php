<?php

namespace Tests\Feature;

use App\Mail\VendorApprovedMail;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class VendorRegistrationAndApprovalTest extends TestCase
{
    use RefreshDatabase;

    public function test_vendor_can_register_successfully_with_pending_status(): void
    {
        $payload = [
            'name' => 'Budi Catering Master',
            'email' => 'budicatering@evento.test',
            'password' => 'password123',
            'business_name' => 'CV Berkah Rasa Nusantara',
            'category' => 'Catering & Jamuan',
            'contact_number' => '081234567899',
            'address' => 'Jl. Boulevard Kelapa Gading No. 12, Jakarta Utara',
            'social_media' => '@budicatering_id',
            'agreement' => true,
            'description' => 'Spesialis katering pernikahan nusantara & internasional.',
        ];

        $response = $this->postJson('/api/register/vendor', $payload);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'token',
                'user' => [
                    'id',
                    'name',
                    'email',
                    'role',
                    'vendor' => [
                        'id',
                        'business_name',
                        'category',
                        'contact_number',
                        'address',
                        'social_media',
                        'agreement_accepted_at',
                        'status',
                    ],
                ],
            ])
            ->assertJsonPath('user.role', 'vendor')
            ->assertJsonPath('user.vendor.status', 'pending')
            ->assertJsonPath('user.vendor.business_name', 'CV Berkah Rasa Nusantara')
            ->assertJsonPath('user.vendor.social_media', '@budicatering_id');

        $this->assertDatabaseHas('users', [
            'email' => 'budicatering@evento.test',
            'role' => 'vendor',
        ]);

        $this->assertDatabaseHas('vendors', [
            'business_name' => 'CV Berkah Rasa Nusantara',
            'category' => 'Catering & Jamuan',
            'social_media' => '@budicatering_id',
            'status' => 'pending',
        ]);

        $vendor = Vendor::where('business_name', 'CV Berkah Rasa Nusantara')->first();
        $this->assertNotNull($vendor->agreement_accepted_at);
    }

    public function test_vendor_registration_validates_required_fields(): void
    {
        $response = $this->postJson('/api/register/vendor', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors([
                'name',
                'email',
                'password',
                'business_name',
                'category',
                'contact_number',
                'address',
                'social_media',
                'agreement',
            ]);
    }

    public function test_vendor_registration_fails_if_agreement_is_not_accepted(): void
    {
        $response = $this->postJson('/api/register/vendor', [
            'name' => 'Vendor Test',
            'email' => 'vendortest@evento.test',
            'password' => 'password123',
            'business_name' => 'Test Vendor Corp',
            'category' => 'Dekorasi & Florist',
            'contact_number' => '081234567890',
            'address' => 'Jl. Uji Coba',
            'social_media' => '@vendortest',
            'agreement' => false,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['agreement']);
    }

    public function test_vendor_registration_fails_if_email_already_registered(): void
    {
        User::factory()->create(['email' => 'existing@evento.test']);

        $response = $this->postJson('/api/register/vendor', [
            'name' => 'Vendor Test',
            'email' => 'existing@evento.test',
            'password' => 'password123',
            'business_name' => 'Test Vendor Corp',
            'category' => 'Decor',
            'contact_number' => '081234567890',
            'address' => 'Jl. Uji Coba',
            'social_media' => '@vendortest',
            'agreement' => true,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_eo_can_list_vendors_with_summary_and_filters(): void
    {
        $eo = User::factory()->eo()->create();

        // 1 pending vendor
        $pendingUser = User::factory()->vendor()->create();
        Vendor::create([
            'user_id' => $pendingUser->id,
            'business_name' => 'Pending Flora',
            'category' => 'Dekorasi',
            'contact_number' => '081111',
            'address' => 'Jakarta',
            'social_media' => '@pendingflora',
            'status' => 'pending',
        ]);

        // 1 approved vendor
        $approvedUser = User::factory()->vendor()->create();
        Vendor::create([
            'user_id' => $approvedUser->id,
            'business_name' => 'Approved Sound',
            'category' => 'Sound System',
            'contact_number' => '082222',
            'address' => 'Bandung',
            'social_media' => '@approvedsound',
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => $eo->id,
        ]);

        // List all
        $responseAll = $this->actingAs($eo, 'sanctum')->getJson('/api/admin/vendors');
        $responseAll->assertOk()
            ->assertJsonStructure([
                'data',
                'summary' => [
                    'total',
                    'pending',
                    'approved',
                    'rejected',
                ],
            ]);

        // Filter pending only
        $responsePending = $this->actingAs($eo, 'sanctum')->getJson('/api/admin/vendors?status=pending');
        $responsePending->assertOk();
        $data = $responsePending->json('data');
        $this->assertTrue(collect($data)->every(fn ($v) => $v['status'] === 'pending'));

        // Search by keyword (including social_media)
        $responseSearch = $this->actingAs($eo, 'sanctum')->getJson('/api/admin/vendors?search=pendingflora');
        $responseSearch->assertOk()
            ->assertJsonFragment(['business_name' => 'Pending Flora']);
    }

    public function test_non_eo_cannot_access_admin_vendor_endpoints(): void
    {
        $client = User::factory()->client()->create();
        $vendorUser = User::factory()->vendor()->create();

        $this->actingAs($client, 'sanctum')
            ->getJson('/api/admin/vendors')
            ->assertForbidden();

        $this->actingAs($vendorUser, 'sanctum')
            ->getJson('/api/admin/vendors')
            ->assertForbidden();
    }

    public function test_eo_can_approve_vendor_and_sends_email(): void
    {
        Mail::fake();

        $eo = User::factory()->eo()->create();
        $vendorUser = User::factory()->vendor()->create(['email' => 'partner@vendor.test']);
        $vendor = Vendor::create([
            'user_id' => $vendorUser->id,
            'business_name' => 'Kandidat Vendor Bagus',
            'category' => 'Photography',
            'contact_number' => '083333',
            'address' => 'Surabaya',
            'social_media' => '@kandidatbagus',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($eo, 'sanctum')
            ->patchJson("/api/admin/vendors/{$vendor->id}/approve");

        $response->assertOk()
            ->assertJsonPath('data.status', 'approved')
            ->assertJsonPath('data.approved_by', $eo->id);

        $this->assertDatabaseHas('vendors', [
            'id' => $vendor->id,
            'status' => 'approved',
            'approved_by' => $eo->id,
            'rejection_reason' => null,
        ]);

        // Assert that email notification is sent to vendor via Mail (SMTP)
        Mail::assertSent(VendorApprovedMail::class, function ($mail) {
            return $mail->hasTo('partner@vendor.test');
        });
    }

    public function test_eo_can_reject_vendor_with_reason(): void
    {
        $eo = User::factory()->eo()->create();
        $vendorUser = User::factory()->vendor()->create();
        $vendor = Vendor::create([
            'user_id' => $vendorUser->id,
            'business_name' => 'Vendor Belum Lengkap',
            'category' => 'Entertainment',
            'contact_number' => '084444',
            'address' => 'Yogyakarta',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($eo, 'sanctum')
            ->patchJson("/api/admin/vendors/{$vendor->id}/reject", [
                'rejection_reason' => 'Portofolio tidak valid dan kontak tidak dapat dihubungi.',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'rejected')
            ->assertJsonPath('data.rejection_reason', 'Portofolio tidak valid dan kontak tidak dapat dihubungi.');

        $this->assertDatabaseHas('vendors', [
            'id' => $vendor->id,
            'status' => 'rejected',
            'rejection_reason' => 'Portofolio tidak valid dan kontak tidak dapat dihubungi.',
        ]);
    }

    public function test_eo_rejection_requires_reason(): void
    {
        $eo = User::factory()->eo()->create();
        $vendorUser = User::factory()->vendor()->create();
        $vendor = Vendor::create([
            'user_id' => $vendorUser->id,
            'business_name' => 'Vendor X',
            'category' => 'Catering',
            'contact_number' => '085555',
            'address' => 'Semarang',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($eo, 'sanctum')
            ->patchJson("/api/admin/vendors/{$vendor->id}/reject", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['rejection_reason']);
    }

    public function test_eo_can_view_single_vendor_detail(): void
    {
        $eo = User::factory()->eo()->create();
        $vendorUser = User::factory()->vendor()->create();
        $vendor = Vendor::create([
            'user_id' => $vendorUser->id,
            'business_name' => 'Vendor Detail Test',
            'category' => 'MUA',
            'contact_number' => '086666',
            'address' => 'Bali',
            'social_media' => '@mua_bali_cantik',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($eo, 'sanctum')
            ->getJson("/api/admin/vendors/{$vendor->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $vendor->id)
            ->assertJsonPath('data.business_name', 'Vendor Detail Test')
            ->assertJsonPath('data.social_media', '@mua_bali_cantik')
            ->assertJsonPath('data.user.email', $vendorUser->email);
    }
}
