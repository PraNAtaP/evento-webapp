<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
                        'status',
                    ],
                ],
            ])
            ->assertJsonPath('user.role', 'vendor')
            ->assertJsonPath('user.vendor.status', 'pending')
            ->assertJsonPath('user.vendor.business_name', 'CV Berkah Rasa Nusantara');

        $this->assertDatabaseHas('users', [
            'email' => 'budicatering@evento.test',
            'role' => 'vendor',
        ]);

        $this->assertDatabaseHas('vendors', [
            'business_name' => 'CV Berkah Rasa Nusantara',
            'category' => 'Catering & Jamuan',
            'status' => 'pending',
        ]);
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
            ]);
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
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_eo_can_list_vendors_with_summary_and_filters(): void
    {
        $eo = User::factory()->eo()->create();

        // Create vendors with different statuses
        $user1 = User::factory()->vendor()->create();
        $vendorPending = Vendor::create([
            'user_id' => $user1->id,
            'business_name' => 'Pending Flora',
            'category' => 'Florist',
            'contact_number' => '081111',
            'address' => 'Jakarta',
            'status' => 'pending',
        ]);

        $user2 = User::factory()->vendor()->create();
        $vendorApproved = Vendor::create([
            'user_id' => $user2->id,
            'business_name' => 'Approved Sound',
            'category' => 'Sound',
            'contact_number' => '082222',
            'address' => 'Bandung',
            'status' => 'approved',
        ]);

        // List all
        $response = $this->actingAs($eo, 'sanctum')->getJson('/api/admin/vendors');

        $response->assertOk()
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

        // Search by keyword
        $responseSearch = $this->actingAs($eo, 'sanctum')->getJson('/api/admin/vendors?search=Flora');
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

    public function test_eo_can_approve_vendor(): void
    {
        $eo = User::factory()->eo()->create();
        $vendorUser = User::factory()->vendor()->create();
        $vendor = Vendor::create([
            'user_id' => $vendorUser->id,
            'business_name' => 'Kandidat Vendor Bagus',
            'category' => 'Photography',
            'contact_number' => '083333',
            'address' => 'Surabaya',
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
            'status' => 'pending',
        ]);

        $response = $this->actingAs($eo, 'sanctum')
            ->getJson("/api/admin/vendors/{$vendor->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $vendor->id)
            ->assertJsonPath('data.business_name', 'Vendor Detail Test')
            ->assertJsonPath('data.user.email', $vendorUser->email);
    }
}
