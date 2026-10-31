<?php

namespace Tests\Feature;

use App\Http\Controllers\Api\EventInspectorController;
use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class BoardInspectorTest extends TestCase
{
    use RefreshDatabase;

    /**
     * 15 key awal + 4 key Tahap 2 + 3 key Tahap 3 (can_send_quotation, send_quotation_blockers, dp_percentage).
     * Penambahan ini disengaja: resource inspector diperluas untuk Tahap 3.
     *
     * @var list<string>
     */
    private const ALLOWED_KEYS = [
        'id',
        'event_name',
        'category',
        'client_name',
        'event_date',
        'end_date',
        'is_multi_day',
        'has_own_venue',
        'venue',
        'lat',
        'lng',
        'guest_count',
        'estimated_budget',
        'created_at',
        'updated_at',
        'show_vendor_section',
        'can_manage_vendors',
        'can_send_quotation',
        'send_quotation_blockers',
        'dp_percentage',
        'vendors',
        'vendors_total',
    ];

    public function test_eo_can_view_event_inspector_with_only_allowed_fields(): void
    {
        $eo = User::factory()->eo()->create();
        $client = User::factory()->client()->create(['name' => 'Budi Santoso']);
        $event = Event::factory()->create([
            'client_id' => $client->id,
            'event_name' => 'Pernikahan Uji',
            'category' => 'wedding',
            'has_own_venue' => true,
            'venue' => 'Hotel Savana',
            'lat' => -7.9626238,
            'lng' => 112.636413,
            'guest_count' => 100,
            'estimated_budget' => 248000000,
        ]);

        $response = $this->actingAs($eo, 'sanctum')->getJson("/api/events/{$event->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $event->id)
            ->assertJsonPath('data.event_name', 'Pernikahan Uji')
            ->assertJsonPath('data.client_name', 'Budi Santoso')
            ->assertJsonPath('data.venue', 'Hotel Savana')
            ->assertJsonPath('data.has_own_venue', true);

        $data = $response->json('data');
        $this->assertEqualsCanonicalizing(self::ALLOWED_KEYS, array_keys($data));
    }

    public function test_forbidden_fields_are_not_exposed(): void
    {
        $eo = User::factory()->eo()->create();
        $event = Event::factory()->onProgress()->create();

        $data = $this->actingAs($eo, 'sanctum')
            ->getJson("/api/events/{$event->id}")
            ->assertOk()
            ->json('data');

        foreach (['adm4', 'location_name', 'agreed_price', 'kanban_status', 'status', 'budget', 'client_id'] as $forbidden) {
            $this->assertArrayNotHasKey($forbidden, $data);
        }
    }

    public function test_coordinates_and_budget_are_returned_as_numbers(): void
    {
        $eo = User::factory()->eo()->create();
        $event = Event::factory()->create([
            'lat' => -7.9626238,
            'lng' => 112.636413,
            'estimated_budget' => 85000000,
        ]);

        $data = $this->actingAs($eo, 'sanctum')
            ->getJson("/api/events/{$event->id}")
            ->assertOk()
            ->json('data');

        $this->assertIsFloat($data['lat']);
        $this->assertIsFloat($data['lng']);
        $this->assertIsNotString($data['estimated_budget']);
        $this->assertEqualsWithDelta(-7.9626238, $data['lat'], 0.0000001);
        $this->assertEqualsWithDelta(112.636413, $data['lng'], 0.0000001);
    }

    public function test_null_coordinates_remain_null(): void
    {
        $eo = User::factory()->eo()->create();
        $event = Event::factory()->create(['lat' => null, 'lng' => null, 'category' => null, 'guest_count' => null, 'estimated_budget' => null]);

        $this->actingAs($eo, 'sanctum')
            ->getJson("/api/events/{$event->id}")
            ->assertOk()
            ->assertJsonPath('data.lat', null)
            ->assertJsonPath('data.lng', null)
            ->assertJsonPath('data.category', null)
            ->assertJsonPath('data.guest_count', null)
            ->assertJsonPath('data.estimated_budget', null);
    }

    public function test_multi_day_event_returns_end_date(): void
    {
        $eo = User::factory()->eo()->create();
        $event = Event::factory()->create([
            'event_date' => '2027-02-13',
            'is_multi_day' => true,
            'end_date' => '2027-02-14',
        ]);

        $this->actingAs($eo, 'sanctum')
            ->getJson("/api/events/{$event->id}")
            ->assertOk()
            ->assertJsonPath('data.event_date', '2027-02-13')
            ->assertJsonPath('data.end_date', '2027-02-14')
            ->assertJsonPath('data.is_multi_day', true);
    }

    public function test_missing_event_returns_not_found(): void
    {
        $eo = User::factory()->eo()->create();

        $this->actingAs($eo, 'sanctum')
            ->getJson('/api/events/999999')
            ->assertNotFound();
    }

    public function test_guest_cannot_access_inspector(): void
    {
        $event = Event::factory()->create();

        $this->getJson("/api/events/{$event->id}")->assertUnauthorized();
    }

    public function test_client_and_vendor_cannot_access_inspector(): void
    {
        $event = Event::factory()->create();

        $this->actingAs(User::factory()->client()->create(), 'sanctum')
            ->getJson("/api/events/{$event->id}")
            ->assertForbidden();

        $this->actingAs(User::factory()->vendor()->create(), 'sanctum')
            ->getJson("/api/events/{$event->id}")
            ->assertForbidden();
    }

    public function test_query_count_is_constant_regardless_of_client(): void
    {
        $eo = User::factory()->eo()->create();
        $eventA = Event::factory()->create(['client_id' => User::factory()->client()->create()->id]);
        $eventB = Event::factory()->create(['client_id' => User::factory()->client()->create()->id]);

        $this->actingAs($eo, 'sanctum')->getJson("/api/events/{$eventA->id}")->assertOk();

        $countFor = function (Event $event) use ($eo): int {
            DB::flushQueryLog();
            DB::enableQueryLog();
            $this->actingAs($eo, 'sanctum')->getJson("/api/events/{$event->id}")->assertOk();
            $count = count(DB::getQueryLog());
            DB::disableQueryLog();

            return $count;
        };

        $this->assertSame($countFor($eventA), $countFor($eventB));
    }

    public function test_client_relation_is_eager_loaded_with_limited_columns(): void
    {
        $event = Event::factory()->create();
        $eo = User::factory()->eo()->create();

        $this->actingAs($eo, 'sanctum')->getJson("/api/events/{$event->id}")->assertOk();

        $resource = (new EventInspectorController)->show($event->fresh());
        $loaded = $resource->resource;

        $this->assertTrue($loaded->relationLoaded('client'));
        $this->assertSame(['id', 'name'], array_keys($loaded->client->getAttributes()));
    }
}
