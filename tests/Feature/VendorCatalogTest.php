<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorPackage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VendorCatalogTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['role' => 'client']);
    }

    public function test_unauthenticated_user_cannot_access_vendor_catalog(): void
    {
        $this->getJson('/api/vendors')->assertUnauthorized();
        $this->getJson('/api/vendors/some-slug')->assertUnauthorized();
    }

    public function test_authenticated_user_can_view_active_approved_vendors(): void
    {
        $vendor = Vendor::factory()->create([
            'business_name' => 'Katering Nusantara Enak',
            'category' => 'Catering',
            'status' => Vendor::STATUS_APPROVED,
            'is_active' => true,
        ]);

        VendorPackage::factory()->create([
            'vendor_id' => $vendor->id,
            'package_name' => 'Paket Prasmanan',
            'is_active' => true,
        ]);

        VendorPackage::factory()->create([
            'vendor_id' => $vendor->id,
            'package_name' => 'Paket Nasi Box Tidak Aktif',
            'is_active' => false,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')->getJson('/api/vendors');

        $response->assertOk()
            ->assertJsonPath('data.0.slug', $vendor->slug)
            ->assertJsonPath('data.0.name', 'Katering Nusantara Enak')
            ->assertJsonPath('data.0.packages_count', 1);
    }

    public function test_pending_or_rejected_or_inactive_vendors_do_not_appear_in_index(): void
    {
        Vendor::factory()->create([
            'business_name' => 'Vendor Approved Aktif',
            'status' => Vendor::STATUS_APPROVED,
            'is_active' => true,
        ]);

        Vendor::factory()->create([
            'business_name' => 'Vendor Pending',
            'status' => Vendor::STATUS_PENDING,
            'is_active' => true,
        ]);

        Vendor::factory()->create([
            'business_name' => 'Vendor Rejected',
            'status' => Vendor::STATUS_REJECTED,
            'is_active' => true,
        ]);

        Vendor::factory()->create([
            'business_name' => 'Vendor Nonaktif',
            'status' => Vendor::STATUS_APPROVED,
            'is_active' => false,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')->getJson('/api/vendors');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Vendor Approved Aktif');
    }

    public function test_can_filter_vendors_by_search_and_category(): void
    {
        Vendor::factory()->create([
            'business_name' => 'Pelaminan Mewah Indah',
            'category' => 'Decoration',
            'status' => Vendor::STATUS_APPROVED,
            'is_active' => true,
        ]);

        Vendor::factory()->create([
            'business_name' => 'Foto Video Kenangan',
            'category' => 'Photography',
            'status' => Vendor::STATUS_APPROVED,
            'is_active' => true,
        ]);

        // Cari Pelaminan
        $searchRes = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/vendors?search=Mewah');
        $searchRes->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Pelaminan Mewah Indah');

        // Filter Kategori
        $catRes = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/vendors?category=photography');
        $catRes->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Foto Video Kenangan');
    }

    public function test_can_view_vendor_detail_by_slug(): void
    {
        $vendor = Vendor::factory()->create([
            'business_name' => 'Studio Foto Abadi',
            'status' => Vendor::STATUS_APPROVED,
            'is_active' => true,
        ]);

        $pkg = VendorPackage::factory()->create([
            'vendor_id' => $vendor->id,
            'package_name' => 'Paket All Day Wedding',
            'price' => 15000000,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/vendors/{$vendor->slug}");

        $response->assertOk()
            ->assertJsonPath('vendor.name', 'Studio Foto Abadi')
            ->assertJsonCount(1, 'packages')
            ->assertJsonPath('packages.0.name', 'Paket All Day Wedding')
            ->assertJsonPath('packages.0.price_formatted', 'Rp 15.000.000');
    }

    public function test_vendor_detail_returns_404_for_inactive_or_unapproved_vendor(): void
    {
        $pending = Vendor::factory()->create([
            'status' => Vendor::STATUS_PENDING,
            'is_active' => true,
        ]);

        $rejected = Vendor::factory()->create([
            'status' => Vendor::STATUS_REJECTED,
            'is_active' => true,
        ]);

        $inactive = Vendor::factory()->create([
            'status' => Vendor::STATUS_APPROVED,
            'is_active' => false,
        ]);

        $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/vendors/{$pending->slug}")
            ->assertNotFound();

        $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/vendors/{$rejected->slug}")
            ->assertNotFound();

        $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/vendors/{$inactive->slug}")
            ->assertNotFound();

        $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/vendors/slug-yang-tidak-ada-sama-sekali')
            ->assertNotFound();
    }

    public function test_inactive_packages_do_not_appear_in_vendor_detail(): void
    {
        $vendor = Vendor::factory()->create([
            'business_name' => 'Vendor Test Paket',
            'status' => Vendor::STATUS_APPROVED,
            'is_active' => true,
        ]);

        VendorPackage::factory()->create([
            'vendor_id' => $vendor->id,
            'package_name' => 'Paket Tersedia',
            'is_active' => true,
        ]);

        VendorPackage::factory()->create([
            'vendor_id' => $vendor->id,
            'package_name' => 'Paket Tidak Aktif',
            'is_active' => false,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/vendors/{$vendor->slug}");

        $response->assertOk()
            ->assertJsonCount(1, 'packages')
            ->assertJsonPath('packages.0.name', 'Paket Tersedia');
    }

    public function test_can_search_packages_in_vendor_detail(): void
    {
        $vendor = Vendor::factory()->create([
            'business_name' => 'Vendor Test Cari',
            'status' => Vendor::STATUS_APPROVED,
            'is_active' => true,
        ]);

        VendorPackage::factory()->create([
            'vendor_id' => $vendor->id,
            'package_name' => 'Paket Buffet Eksklusif',
            'is_active' => true,
        ]);

        VendorPackage::factory()->create([
            'vendor_id' => $vendor->id,
            'package_name' => 'Paket Gubukan Sate',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/vendors/{$vendor->slug}?search=Gubukan");

        $response->assertOk()
            ->assertJsonCount(1, 'packages')
            ->assertJsonPath('packages.0.name', 'Paket Gubukan Sate');
    }
}
