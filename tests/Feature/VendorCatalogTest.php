<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\EventVendorAssignment;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorPackage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class VendorCatalogTest extends TestCase
{
    use RefreshDatabase;

    private User $eo;

    private Event $event;

    protected function setUp(): void
    {
        parent::setUp();

        $this->eo = User::factory()->eo()->create();
        $this->event = Event::factory()->draftingQuotation()->create();
    }

    private function catalog(string $query = ''): TestResponse
    {
        return $this->actingAs($this->eo, 'sanctum')
            ->getJson("/api/events/{$this->event->id}/vendor-catalog{$query}");
    }

    public function test_empty_catalog_returns_empty_data_and_categories(): void
    {
        $this->catalog()
            ->assertOk()
            ->assertJsonPath('data', [])
            ->assertJsonPath('categories', [])
            ->assertJsonPath('meta.total', 0);
    }

    public function test_catalog_lists_vendor_fields_and_package_counts(): void
    {
        $vendor = Vendor::factory()->inCategory('Catering')->create([
            'business_name' => 'Katering Nusantara',
            'address' => 'Jl. Melati 1, Malang',
        ]);
        VendorPackage::factory()->count(3)->for($vendor)->create();

        $response = $this->catalog()->assertOk();

        $response->assertJsonPath('data.0.id', $vendor->id)
            ->assertJsonPath('data.0.business_name', 'Katering Nusantara')
            ->assertJsonPath('data.0.category', 'Catering')
            ->assertJsonPath('data.0.address', 'Jl. Melati 1, Malang')
            ->assertJsonPath('data.0.image_url', null)
            ->assertJsonPath('data.0.packages_count', 3)
            ->assertJsonPath('data.0.attached_packages_count', 0)
            ->assertJsonPath('data.0.is_attached', false);

        $this->assertEqualsCanonicalizing(
            ['id', 'business_name', 'category', 'address', 'image_url', 'packages_count', 'attached_packages_count', 'is_attached'],
            array_keys($response->json('data.0'))
        );
    }

    public function test_vendor_without_packages_has_zero_packages_count(): void
    {
        Vendor::factory()->create();

        $this->catalog()->assertOk()->assertJsonPath('data.0.packages_count', 0);
    }

    public function test_search_matches_business_name_case_insensitively(): void
    {
        Vendor::factory()->create(['business_name' => 'Dekorasi Impian']);
        Vendor::factory()->create(['business_name' => 'Katering Nusantara']);

        $this->catalog('?search=DEKOR')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.business_name', 'Dekorasi Impian');
    }

    public function test_search_treats_wildcards_literally(): void
    {
        Vendor::factory()->create(['business_name' => 'Diskon 50% Studio']);
        Vendor::factory()->create(['business_name' => 'Studio Biasa']);

        $this->catalog('?search='.urlencode('%'))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.business_name', 'Diskon 50% Studio');
    }

    public function test_category_filter_is_case_insensitive(): void
    {
        Vendor::factory()->inCategory('Catering')->create(['business_name' => 'A']);
        Vendor::factory()->inCategory('catering')->create(['business_name' => 'B']);
        Vendor::factory()->inCategory('Decoration')->create(['business_name' => 'C']);

        $this->catalog('?category=CATERING')
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->catalog('?category=catering')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_categories_are_distinct_data_driven_and_case_insensitive(): void
    {
        Vendor::factory()->inCategory('Catering')->create();
        Vendor::factory()->inCategory('catering')->create();
        Vendor::factory()->inCategory('Venue')->create();

        $categories = $this->catalog()->assertOk()->json('categories');

        $this->assertCount(2, $categories);
        $this->assertEqualsCanonicalizing(['catering', 'venue'], array_column($categories, 'value'));
    }

    public function test_blank_category_is_listed_as_tanpa_kategori_and_filterable(): void
    {
        Vendor::factory()->inCategory('Catering')->create();
        $uncategorized = Vendor::factory()->inCategory('')->create(['business_name' => 'Tanpa Label']);

        $response = $this->catalog()->assertOk();

        $this->assertSame(['value' => '__none__', 'label' => 'Tanpa kategori'], collect($response->json('categories'))->last());

        $row = collect($response->json('data'))->firstWhere('id', $uncategorized->id);
        $this->assertNull($row['category']);

        $this->catalog('?category=__none__')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $uncategorized->id);
    }

    public function test_no_matching_vendor_returns_empty_list(): void
    {
        Vendor::factory()->create(['business_name' => 'Katering Nusantara']);

        $this->catalog('?search=tidak-ada')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_catalog_is_paginated(): void
    {
        Vendor::factory()->count(5)->create();

        $this->catalog('?per_page=2')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.total', 5)
            ->assertJsonPath('meta.per_page', 2)
            ->assertJsonPath('meta.last_page', 3);
    }

    public function test_per_page_is_validated(): void
    {
        $this->catalog('?per_page=1000')->assertUnprocessable()->assertJsonValidationErrors(['per_page']);
    }

    public function test_catalog_marks_vendor_attached_to_the_opened_event_only(): void
    {
        $vendor = Vendor::factory()->create();
        $package = VendorPackage::factory()->for($vendor)->create();
        VendorPackage::factory()->for($vendor)->create();

        EventVendorAssignment::factory()->for($this->event)->create(['package_id' => $package->id]);

        $this->catalog()
            ->assertOk()
            ->assertJsonPath('data.0.attached_packages_count', 1)
            ->assertJsonPath('data.0.is_attached', true);

        $otherEvent = Event::factory()->draftingQuotation()->create();
        $this->actingAs($this->eo, 'sanctum')
            ->getJson("/api/events/{$otherEvent->id}/vendor-catalog")
            ->assertOk()
            ->assertJsonPath('data.0.is_attached', false);
    }

    public function test_packages_endpoint_lists_packages_and_marks_attached_without_exposing_public_id(): void
    {
        $vendor = Vendor::factory()->create();
        $attached = VendorPackage::factory()->withImage()->for($vendor)->create(['package_name' => 'A Paket', 'price' => 12000000]);
        $free = VendorPackage::factory()->withImage()->for($vendor)->create(['package_name' => 'B Paket']);
        VendorPackage::factory()->for(Vendor::factory())->create(['package_name' => 'Milik Vendor Lain']);

        EventVendorAssignment::factory()->for($this->event)->create(['package_id' => $attached->id]);

        $response = $this->actingAs($this->eo, 'sanctum')
            ->getJson("/api/events/{$this->event->id}/vendor-catalog/{$vendor->id}/packages")
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $attached->id)
            ->assertJsonPath('data.0.price', 12000000)
            ->assertJsonPath('data.0.is_attached', true)
            ->assertJsonPath('data.1.id', $free->id)
            ->assertJsonPath('data.1.is_attached', false);

        $this->assertIsNotString($response->json('data.0.price'));
        $this->assertEqualsCanonicalizing(
            ['id', 'package_name', 'description', 'price', 'image_url', 'is_attached'],
            array_keys($response->json('data.0'))
        );
        $this->assertStringNotContainsString('image_public_id', $response->getContent());
        $this->assertStringNotContainsString('rahasia-', $response->getContent());
    }

    public function test_image_public_id_never_appears_in_catalog_or_inspector_responses(): void
    {
        $vendor = Vendor::factory()->create();
        $package = VendorPackage::factory()->withImage()->for($vendor)->create();
        EventVendorAssignment::factory()->for($this->event)->create(['package_id' => $package->id]);

        $responses = [
            $this->catalog(),
            $this->actingAs($this->eo, 'sanctum')->getJson("/api/events/{$this->event->id}/vendor-catalog/{$vendor->id}/packages"),
            $this->actingAs($this->eo, 'sanctum')->getJson("/api/events/{$this->event->id}"),
            $this->actingAs($this->eo, 'sanctum')->postJson("/api/events/{$this->event->id}/vendors", [
                'package_id' => VendorPackage::factory()->withImage()->for($vendor)->create()->id,
            ]),
        ];

        foreach ($responses as $response) {
            $this->assertStringNotContainsString('image_public_id', $response->getContent());
            $this->assertStringNotContainsString('rahasia-', $response->getContent());
        }
    }

    public function test_packages_of_vendor_without_packages_is_empty(): void
    {
        $vendor = Vendor::factory()->create();

        $this->actingAs($this->eo, 'sanctum')
            ->getJson("/api/events/{$this->event->id}/vendor-catalog/{$vendor->id}/packages")
            ->assertOk()
            ->assertJsonPath('data', []);
    }

    public function test_missing_event_or_vendor_returns_not_found(): void
    {
        $vendor = Vendor::factory()->create();

        $this->actingAs($this->eo, 'sanctum')->getJson('/api/events/999999/vendor-catalog')->assertNotFound();
        $this->actingAs($this->eo, 'sanctum')
            ->getJson("/api/events/{$this->event->id}/vendor-catalog/999999/packages")
            ->assertNotFound();
        $this->actingAs($this->eo, 'sanctum')
            ->getJson("/api/events/999999/vendor-catalog/{$vendor->id}/packages")
            ->assertNotFound();
    }

    public function test_client_and_vendor_roles_are_forbidden_and_guest_is_unauthorized(): void
    {
        $vendor = Vendor::factory()->create();
        $urls = [
            "/api/events/{$this->event->id}/vendor-catalog",
            "/api/events/{$this->event->id}/vendor-catalog/{$vendor->id}/packages",
        ];

        foreach ($urls as $url) {
            $this->getJson($url)->assertUnauthorized();
        }

        foreach ($urls as $url) {
            $this->actingAs(User::factory()->client()->create(), 'sanctum')->getJson($url)->assertForbidden();
            $this->actingAs(User::factory()->vendor()->create(), 'sanctum')->getJson($url)->assertForbidden();
        }
    }
}
