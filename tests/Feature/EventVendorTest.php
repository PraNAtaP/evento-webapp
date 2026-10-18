<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\EventVendorAssignment;
use App\Models\ProgressLog;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorPackage;
use App\Services\KanbanTransitionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use Illuminate\Validation\ValidationException;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class EventVendorTest extends TestCase
{
    use RefreshDatabase;

    private User $eo;

    private Vendor $vendor;

    private VendorPackage $package;

    protected function setUp(): void
    {
        parent::setUp();

        $this->eo = User::factory()->eo()->create();
        $this->vendor = Vendor::factory()->inCategory('Catering')->create(['business_name' => 'Katering Nusantara']);
        $this->package = VendorPackage::factory()->for($this->vendor)->create([
            'package_name' => 'Paket Prasmanan',
            'price' => 25000000,
        ]);
    }

    private function draftingEvent(array $attributes = []): Event
    {
        return Event::factory()->draftingQuotation()->create($attributes);
    }

    private function addVendor(Event $event, array $payload): TestResponse
    {
        return $this->actingAs($this->eo, 'sanctum')->postJson("/api/events/{$event->id}/vendors", $payload);
    }

    private function inspect(Event $event): array
    {
        return $this->actingAs($this->eo, 'sanctum')
            ->getJson("/api/events/{$event->id}")
            ->assertOk()
            ->json('data');
    }

    public function test_eo_can_add_vendor_package_with_default_price_from_package(): void
    {
        $event = $this->draftingEvent();

        $response = $this->addVendor($event, ['package_id' => $this->package->id]);

        $response->assertCreated()
            ->assertJsonPath('data.vendor_id', $this->vendor->id)
            ->assertJsonPath('data.business_name', 'Katering Nusantara')
            ->assertJsonPath('data.category', 'Catering')
            ->assertJsonPath('data.package_name', 'Paket Prasmanan')
            ->assertJsonPath('data.package_price', 25000000)
            ->assertJsonPath('data.price', 25000000)
            ->assertJsonPath('data.offer_status', 'pending');

        $this->assertIsNotString($response->json('data.price'));
        $this->assertIsNotString($response->json('data.package_price'));

        $this->assertDatabaseHas('event_vendor_assignments', [
            'event_id' => $event->id,
            'vendor_id' => $this->vendor->id,
            'package_id' => $this->package->id,
            'package_name' => 'Paket Prasmanan',
            'eo_offer_status' => 'pending',
            'client_approval' => 'pending',
        ]);
    }

    public function test_custom_price_is_stored_while_package_price_snapshot_stays(): void
    {
        $event = $this->draftingEvent();

        $this->addVendor($event, ['package_id' => $this->package->id, 'price' => 22500000, 'notes' => 'Nego diskon 10%'])
            ->assertCreated()
            ->assertJsonPath('data.price', 22500000)
            ->assertJsonPath('data.package_price', 25000000)
            ->assertJsonPath('data.notes', 'Nego diskon 10%');

        $assignment = EventVendorAssignment::firstOrFail();
        $this->assertEquals(22500000, (float) $assignment->locked_price);
        $this->assertEquals(25000000, (float) $assignment->package_price);
    }

    public function test_price_zero_is_accepted_and_not_replaced_by_package_price(): void
    {
        $event = $this->draftingEvent();

        $this->addVendor($event, ['package_id' => $this->package->id, 'price' => 0])
            ->assertCreated()
            ->assertJsonPath('data.price', 0);
    }

    public function test_vendor_id_is_derived_from_package_not_from_input(): void
    {
        $event = $this->draftingEvent();
        $otherVendor = Vendor::factory()->create();

        $this->addVendor($event, ['package_id' => $this->package->id, 'vendor_id' => $otherVendor->id])
            ->assertCreated()
            ->assertJsonPath('data.vendor_id', $this->vendor->id);
    }

    public function test_total_changes_after_adding_vendors(): void
    {
        $event = $this->draftingEvent();
        $second = VendorPackage::factory()->for($this->vendor)->create(['price' => 5000000]);

        $this->assertSame(0.0, (float) $this->inspect($event)['vendors_total']);

        $this->addVendor($event, ['package_id' => $this->package->id, 'price' => 20000000])->assertCreated();
        $this->addVendor($event, ['package_id' => $second->id])->assertCreated();

        $data = $this->inspect($event);
        $this->assertEquals(25000000, $data['vendors_total']);
        $this->assertCount(2, $data['vendors']);
    }

    public function test_row_is_a_snapshot_when_package_price_changes_or_package_is_deleted(): void
    {
        $event = $this->draftingEvent();
        $this->addVendor($event, ['package_id' => $this->package->id])->assertCreated();

        $this->package->update(['price' => 99000000, 'package_name' => 'Nama Baru']);

        $row = $this->inspect($event)['vendors'][0];
        $this->assertSame('Paket Prasmanan', $row['package_name']);
        $this->assertEquals(25000000, $row['package_price']);
        $this->assertEquals(25000000, $row['price']);

        $this->package->delete();

        $row = $this->inspect($event)['vendors'][0];
        $this->assertSame('Paket Prasmanan', $row['package_name']);
        $this->assertEquals(25000000, $row['price']);
        $this->assertNull(EventVendorAssignment::firstOrFail()->package_id);
    }

    public function test_same_vendor_can_have_two_different_packages_on_one_event(): void
    {
        $event = $this->draftingEvent();
        $snack = VendorPackage::factory()->for($this->vendor)->create();

        $this->addVendor($event, ['package_id' => $this->package->id])->assertCreated();
        $this->addVendor($event, ['package_id' => $snack->id])->assertCreated();

        $this->assertSame(2, EventVendorAssignment::where('event_id', $event->id)->count());
    }

    public function test_same_package_twice_on_one_event_is_rejected(): void
    {
        $event = $this->draftingEvent();

        $this->addVendor($event, ['package_id' => $this->package->id])->assertCreated();
        $this->addVendor($event, ['package_id' => $this->package->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['package_id']);

        $this->assertSame(1, EventVendorAssignment::count());
    }

    public function test_same_package_is_allowed_on_a_different_event(): void
    {
        $this->addVendor($this->draftingEvent(), ['package_id' => $this->package->id])->assertCreated();
        $this->addVendor($this->draftingEvent(), ['package_id' => $this->package->id])->assertCreated();
    }

    public function test_eo_can_remove_vendor_without_deleting_catalog_data(): void
    {
        $event = $this->draftingEvent();
        $assignment = EventVendorAssignment::factory()->for($event)->create(['package_id' => $this->package->id]);

        $this->actingAs($this->eo, 'sanctum')
            ->deleteJson("/api/events/{$event->id}/vendors/{$assignment->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('event_vendor_assignments', ['id' => $assignment->id]);
        $this->assertDatabaseHas('vendors', ['id' => $this->vendor->id]);
        $this->assertDatabaseHas('vendor_packages', ['id' => $this->package->id]);
    }

    public function test_removing_row_of_another_event_returns_not_found(): void
    {
        $eventA = $this->draftingEvent();
        $eventB = $this->draftingEvent();
        $assignment = EventVendorAssignment::factory()->for($eventB)->create(['package_id' => $this->package->id]);

        $this->actingAs($this->eo, 'sanctum')
            ->deleteJson("/api/events/{$eventA->id}/vendors/{$assignment->id}")
            ->assertNotFound();

        $this->assertDatabaseHas('event_vendor_assignments', ['id' => $assignment->id]);
    }

    /**
     * @return array<string, array{string}>
     */
    public static function nonDraftingStatuses(): array
    {
        return [
            'request' => ['request'],
            'client_review' => ['client_review'],
            'awaiting_dp' => ['awaiting_dp'],
            'on_progress' => ['on_progress'],
            'done' => ['done'],
        ];
    }

    #[DataProvider('nonDraftingStatuses')]
    public function test_add_and_remove_are_rejected_outside_drafting_quotation(string $status): void
    {
        $event = Event::factory()->create(['kanban_status' => $status]);
        $assignment = EventVendorAssignment::factory()->for($event)->create();

        $this->addVendor($event, ['package_id' => $this->package->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['event']);

        $this->actingAs($this->eo, 'sanctum')
            ->deleteJson("/api/events/{$event->id}/vendors/{$assignment->id}")
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['event']);

        $this->assertSame(1, EventVendorAssignment::where('event_id', $event->id)->count());
    }

    public function test_pending_and_rejected_rows_can_be_removed(): void
    {
        $event = $this->draftingEvent();
        $pending = EventVendorAssignment::factory()->for($event)->pending()->create();
        $rejected = EventVendorAssignment::factory()->for($event)->rejected()->create();

        foreach ([$pending, $rejected] as $assignment) {
            $this->actingAs($this->eo, 'sanctum')
                ->deleteJson("/api/events/{$event->id}/vendors/{$assignment->id}")
                ->assertNoContent();
        }
    }

    public function test_accepted_row_without_progress_logs_can_be_removed(): void
    {
        $event = $this->draftingEvent();
        $assignment = EventVendorAssignment::factory()->for($event)->accepted()->create();

        $this->actingAs($this->eo, 'sanctum')
            ->deleteJson("/api/events/{$event->id}/vendors/{$assignment->id}")
            ->assertNoContent();
    }

    public function test_accepted_row_with_progress_logs_cannot_be_removed(): void
    {
        $event = $this->draftingEvent();
        $assignment = EventVendorAssignment::factory()->for($event)->accepted()->create();
        ProgressLog::create(['assignment_id' => $assignment->id, 'note' => 'Bahan sudah dipesan']);

        $this->actingAs($this->eo, 'sanctum')
            ->deleteJson("/api/events/{$event->id}/vendors/{$assignment->id}")
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['event']);

        $this->assertDatabaseHas('event_vendor_assignments', ['id' => $assignment->id]);
    }

    /**
     * @return array<string, array{array<string, mixed>, string}>
     */
    public static function invalidPayloads(): array
    {
        return [
            'tanpa paket' => [[], 'package_id'],
            'paket tidak ada' => [['package_id' => 999999], 'package_id'],
            'harga negatif' => [['price' => -1], 'price'],
            'harga bukan angka' => [['price' => 'abc'], 'price'],
            'catatan terlalu panjang' => [['notes' => str_repeat('a', 501)], 'notes'],
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    #[DataProvider('invalidPayloads')]
    public function test_validation_errors(array $payload, string $field): void
    {
        $event = $this->draftingEvent();

        if ($field !== 'package_id') {
            $payload['package_id'] = $this->package->id;
        }

        $this->addVendor($event, $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors([$field]);

        $this->assertSame(0, EventVendorAssignment::count());
    }

    public function test_notes_of_500_characters_is_accepted(): void
    {
        $this->addVendor($this->draftingEvent(), ['package_id' => $this->package->id, 'notes' => str_repeat('a', 500)])
            ->assertCreated();
    }

    public function test_client_data_is_never_changed_by_adding_a_vendor(): void
    {
        $event = $this->draftingEvent([
            'has_own_venue' => true,
            'venue' => 'Hotel Savana',
            'lat' => -7.9626238,
            'lng' => 112.636413,
        ]);
        $before = $event->only(['event_name', 'guest_count', 'estimated_budget', 'agreed_price', 'dp_percentage', 'kanban_status', 'venue', 'lat', 'lng', 'has_own_venue']);

        $this->addVendor($event, ['package_id' => $this->package->id])->assertCreated();

        $this->assertEquals($before, $event->fresh()->only(array_keys($before)));
    }

    public function test_inspector_reflects_has_own_venue(): void
    {
        $this->assertTrue($this->inspect($this->draftingEvent(['has_own_venue' => true]))['has_own_venue']);
        $this->assertFalse($this->inspect($this->draftingEvent(['has_own_venue' => false]))['has_own_venue']);
    }

    public function test_inspector_vendor_flags_per_kanban_column(): void
    {
        $expectations = [
            'request' => [false, false],
            'drafting_quotation' => [true, true],
            'client_review' => [true, false],
            'awaiting_dp' => [true, false],
            'on_progress' => [true, false],
            'done' => [true, false],
        ];

        $i = 0;
        foreach ($expectations as $status => [$show, $manage]) {
            $data = $this->inspect(Event::factory()->create([
                'kanban_status' => $status,
                'event_date' => now()->addDays(++$i * 10)->toDateString(),
            ]));

            $this->assertSame($show, $data['show_vendor_section'], "show_vendor_section untuk {$status}");
            $this->assertSame($manage, $data['can_manage_vendors'], "can_manage_vendors untuk {$status}");
            $this->assertArrayNotHasKey('kanban_status', $data);
        }
    }

    public function test_vendors_total_matches_event_quotation_total_and_excludes_rejected(): void
    {
        $event = $this->draftingEvent();
        EventVendorAssignment::factory()->for($event)->pending()->create(['locked_price' => 10000000]);
        EventVendorAssignment::factory()->for($event)->accepted()->create(['locked_price' => 15000000]);
        EventVendorAssignment::factory()->for($event)->rejected()->create(['locked_price' => 7000000]);

        $data = $this->inspect($event);

        $this->assertCount(3, $data['vendors']);
        $this->assertEquals(25000000, $data['vendors_total']);
        $this->assertEquals($event->fresh()->quotation_total, $data['vendors_total']);

        $rejected = collect($data['vendors'])->firstWhere('offer_status', 'rejected');
        $this->assertSame('Jadwal bentrok', $rejected['rejection_reason']);
    }

    public function test_new_row_is_visible_to_the_vendor_as_a_pending_job_offer(): void
    {
        $event = $this->draftingEvent();
        $this->addVendor($event, ['package_id' => $this->package->id])->assertCreated();

        $this->actingAs($this->vendor->user, 'sanctum')
            ->getJson('/api/vendor/job-offers')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.eo_offer_status', 'pending');
    }

    public function test_eo_only_fields_are_hidden_from_vendor_client_and_kanban_responses(): void
    {
        $client = User::factory()->client()->create();
        $event = $this->draftingEvent(['client_id' => $client->id]);
        EventVendorAssignment::factory()->for($event)->accepted()->create([
            'package_id' => $this->package->id,
            'notes' => 'RAHASIA-EO',
        ]);

        $responses = [
            $this->actingAs($this->vendor->user, 'sanctum')->getJson('/api/vendor/job-offers'),
            $this->actingAs($this->vendor->user, 'sanctum')->getJson('/api/vendor/active-jobs'),
            $this->actingAs($client, 'sanctum')->getJson('/api/client/events'),
            $this->actingAs($this->eo, 'sanctum')->getJson('/api/admin/kanban'),
        ];

        foreach ($responses as $response) {
            $response->assertOk();
            $this->assertStringNotContainsString('RAHASIA-EO', $response->getContent());
            $this->assertStringNotContainsString('package_price', $response->getContent());
        }
    }

    public function test_vendor_job_offers_and_active_jobs_work_when_package_was_deleted(): void
    {
        $event = $this->draftingEvent();
        $pending = EventVendorAssignment::factory()->for($event)->pending()->create(['package_id' => $this->package->id]);
        $otherPackage = VendorPackage::factory()->for($this->vendor)->create();
        $accepted = EventVendorAssignment::factory()->for($event)->accepted()->create(['package_id' => $otherPackage->id]);

        $this->package->delete();
        $otherPackage->delete();

        $this->assertNull($pending->fresh()->package_id);

        $vendorUser = $this->vendor->user;

        $this->actingAs($vendorUser, 'sanctum')
            ->getJson('/api/vendor/job-offers')
            ->assertOk()
            ->assertJsonPath('data.0.id', $pending->id)
            ->assertJsonPath('data.0.package', null)
            ->assertJsonPath('data.0.package_id', null);

        $this->actingAs($vendorUser, 'sanctum')
            ->getJson('/api/vendor/active-jobs')
            ->assertOk()
            ->assertJsonPath('data.0.id', $accepted->id)
            ->assertJsonPath('data.0.package', null);
    }

    public function test_creating_hook_fills_snapshot_for_assignments_created_without_it(): void
    {
        $assignment = EventVendorAssignment::create([
            'event_id' => $this->draftingEvent()->id,
            'vendor_id' => $this->vendor->id,
            'package_id' => $this->package->id,
        ]);

        $this->assertSame('Paket Prasmanan', $assignment->package_name);
        $this->assertEquals(25000000, (float) $assignment->package_price);
        $this->assertEquals(25000000, (float) $assignment->locked_price);
    }

    public function test_explicit_locked_price_is_kept_by_creating_hook(): void
    {
        $assignment = EventVendorAssignment::create([
            'event_id' => $this->draftingEvent()->id,
            'vendor_id' => $this->vendor->id,
            'package_id' => $this->package->id,
            'locked_price' => 1000,
        ]);

        $this->assertEquals(1000, (float) $assignment->locked_price);
        $this->assertEquals(25000000, (float) $assignment->package_price);
    }

    public function test_client_and_vendor_roles_are_forbidden_and_guest_is_unauthorized(): void
    {
        $event = $this->draftingEvent();
        $assignment = EventVendorAssignment::factory()->for($event)->create();
        $payload = ['package_id' => $this->package->id];

        $this->postJson("/api/events/{$event->id}/vendors", $payload)->assertUnauthorized();
        $this->deleteJson("/api/events/{$event->id}/vendors/{$assignment->id}")->assertUnauthorized();

        foreach ([User::factory()->client()->create(), User::factory()->vendor()->create()] as $user) {
            $this->actingAs($user, 'sanctum')->postJson("/api/events/{$event->id}/vendors", $payload)->assertForbidden();
            $this->actingAs($user, 'sanctum')->deleteJson("/api/events/{$event->id}/vendors/{$assignment->id}")->assertForbidden();
        }

        $this->assertSame(1, EventVendorAssignment::count());
    }

    public function test_inspector_query_count_is_constant_regardless_of_vendor_rows(): void
    {
        $eventOne = $this->draftingEvent();
        EventVendorAssignment::factory()->for($eventOne)->create();

        $eventMany = $this->draftingEvent();
        EventVendorAssignment::factory()->count(6)->for($eventMany)->create();

        $this->inspect($eventOne);

        $countFor = function (Event $event): int {
            DB::flushQueryLog();
            DB::enableQueryLog();
            $this->inspect($event);
            $count = count(DB::getQueryLog());
            DB::disableQueryLog();

            return $count;
        };

        $this->assertSame($countFor($eventOne), $countFor($eventMany));
    }

    public function test_can_send_quotation_is_false_without_vendors(): void
    {
        $event = $this->draftingEvent();
        $data = $this->inspect($event);

        $this->assertFalse($data['can_send_quotation']);
        $this->assertContains('Belum ada vendor yang menerima tawaran.', $data['send_quotation_blockers']);
    }

    public function test_can_send_quotation_is_false_with_pending_vendors(): void
    {
        $event = $this->draftingEvent();
        EventVendorAssignment::factory()->for($event)->pending()->create();

        $data = $this->inspect($event);

        $this->assertFalse($data['can_send_quotation']);
        $this->assertContains('Belum ada vendor yang menerima tawaran.', $data['send_quotation_blockers']);
        $this->assertContains('1 vendor belum merespons tawaran.', $data['send_quotation_blockers']);
    }

    public function test_can_send_quotation_is_false_with_mixed_accepted_and_pending_vendors(): void
    {
        $event = $this->draftingEvent();
        EventVendorAssignment::factory()->for($event)->accepted()->create();
        EventVendorAssignment::factory()->for($event)->pending()->create();

        $data = $this->inspect($event);

        $this->assertFalse($data['can_send_quotation']);
        $this->assertNotContains('Belum ada vendor yang menerima tawaran.', $data['send_quotation_blockers']);
        $this->assertContains('1 vendor belum merespons tawaran.', $data['send_quotation_blockers']);
    }

    public function test_can_send_quotation_is_false_when_all_vendors_are_rejected(): void
    {
        $event = $this->draftingEvent();
        EventVendorAssignment::factory()->for($event)->rejected()->create();

        $data = $this->inspect($event);

        $this->assertFalse($data['can_send_quotation']);
        $this->assertContains('Belum ada vendor yang menerima tawaran.', $data['send_quotation_blockers']);
    }

    public function test_can_send_quotation_is_true_with_at_least_one_accepted_and_zero_pending(): void
    {
        $event = $this->draftingEvent();
        EventVendorAssignment::factory()->for($event)->accepted()->create();
        // Rejected baris tidak menghalangi
        EventVendorAssignment::factory()->for($event)->rejected()->create();

        $data = $this->inspect($event);

        $this->assertTrue($data['can_send_quotation']);
        $this->assertEmpty($data['send_quotation_blockers']);
    }

    public function test_eo_can_successfully_send_quotation_to_client(): void
    {
        $event = $this->draftingEvent(['dp_percentage' => 30.00]);
        EventVendorAssignment::factory()->for($event)->accepted()->create();

        $response = $this->actingAs($this->eo, 'sanctum')
            ->postJson("/api/events/{$event->id}/send-quotation", [
                'dp_percentage' => 45,
            ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Penawaran berhasil dikirim ke klien.')
            ->assertJsonPath('event.id', $event->id)
            ->assertJsonPath('event.kanban_status', 'client_review')
            ->assertJsonPath('event.dp_percentage', '45.00');

        $this->assertSame('client_review', $event->fresh()->kanban_status);
        $this->assertEquals(45.0, (float) $event->fresh()->dp_percentage);

        // Setelah terkirim: vendor list menjadi read-only
        $inspectorData = $this->inspect($event);
        $this->assertFalse($inspectorData['can_manage_vendors']);
        $this->assertFalse($inspectorData['can_send_quotation']);

        // Tambah vendor ditolak
        $this->addVendor($event, ['package_id' => $this->package->id])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['event']);
    }

    public function test_sending_quotation_fails_when_blockers_exist(): void
    {
        $event = $this->draftingEvent();
        EventVendorAssignment::factory()->for($event)->pending()->create();

        $this->actingAs($this->eo, 'sanctum')
            ->postJson("/api/events/{$event->id}/send-quotation")
            ->assertStatus(422)
            ->assertJsonValidationErrors(['target_status']);

        $this->assertSame('drafting_quotation', $event->fresh()->kanban_status);
    }

    public function test_double_click_or_resending_already_moved_event_fails_cleanly(): void
    {
        $event = $this->draftingEvent();
        EventVendorAssignment::factory()->for($event)->accepted()->create();

        // Pengiriman pertama sukses
        $this->actingAs($this->eo, 'sanctum')
            ->postJson("/api/events/{$event->id}/send-quotation")
            ->assertOk();

        // Pengiriman kedua (double submit) ditolak 422
        $this->actingAs($this->eo, 'sanctum')
            ->postJson("/api/events/{$event->id}/send-quotation")
            ->assertStatus(422);

        $this->assertSame('client_review', $event->fresh()->kanban_status);
    }

    public function test_invalid_dp_percentage_is_rejected(): void
    {
        $event = $this->draftingEvent();
        EventVendorAssignment::factory()->for($event)->accepted()->create();

        // Di bawah 10%
        $this->actingAs($this->eo, 'sanctum')
            ->postJson("/api/events/{$event->id}/send-quotation", ['dp_percentage' => 5])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['dp_percentage']);

        // Di atas 100%
        $this->actingAs($this->eo, 'sanctum')
            ->postJson("/api/events/{$event->id}/send-quotation", ['dp_percentage' => 120])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['dp_percentage']);

        // Non numerik
        $this->actingAs($this->eo, 'sanctum')
            ->postJson("/api/events/{$event->id}/send-quotation", ['dp_percentage' => 'abc'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['dp_percentage']);
    }

    public function test_non_eo_roles_cannot_send_quotation(): void
    {
        $event = $this->draftingEvent();
        EventVendorAssignment::factory()->for($event)->accepted()->create();

        $this->postJson("/api/events/{$event->id}/send-quotation")->assertUnauthorized();

        $this->actingAs(User::factory()->client()->create(), 'sanctum')
            ->postJson("/api/events/{$event->id}/send-quotation")
            ->assertForbidden();

        $this->actingAs(User::factory()->vendor()->create(), 'sanctum')
            ->postJson("/api/events/{$event->id}/send-quotation")
            ->assertForbidden();
    }

    public function test_sending_quotation_from_status_other_than_drafting_is_rejected(): void
    {
        $nonDraftingStatuses = ['request', 'client_review', 'awaiting_dp', 'on_progress', 'done'];

        $i = 0;
        foreach ($nonDraftingStatuses as $status) {
            $event = Event::factory()->create([
                'kanban_status' => $status,
                'event_date' => now()->addDays(++$i * 15)->toDateString(),
            ]);

            $this->actingAs($this->eo, 'sanctum')
                ->postJson("/api/events/{$event->id}/send-quotation")
                ->assertStatus(422)
                ->assertJsonValidationErrors(['event']);
        }
    }

    public function test_resource_and_guard_always_agree_on_all_quotation_scenarios(): void
    {
        $service = app(KanbanTransitionService::class);

        // 1. Tanpa vendor
        $e1 = $this->draftingEvent(['event_date' => now()->addDays(1)->toDateString()]);
        $this->assertFalse($this->inspect($e1)['can_send_quotation']);
        try {
            $service->transition($e1, 'client_review');
            $this->fail('Harus gagal.');
        } catch (ValidationException $ex) {
            $this->assertSame(
                'Tidak dapat mengirim penawaran. Minimal 1 vendor harus menerima tawaran (accepted).',
                $ex->errors()['target_status'][0]
            );
        }

        // 2. Semua pending
        $e2 = $this->draftingEvent(['event_date' => now()->addDays(2)->toDateString()]);
        EventVendorAssignment::factory()->for($e2)->pending()->create();
        $this->assertFalse($this->inspect($e2)['can_send_quotation']);
        try {
            $service->transition($e2, 'client_review');
            $this->fail('Harus gagal.');
        } catch (ValidationException $ex) {
            $this->assertSame(
                'Tidak dapat mengirim penawaran. Minimal 1 vendor harus menerima tawaran (accepted).',
                $ex->errors()['target_status'][0]
            );
        }

        // 3. Campuran: 1 accepted + 1 pending
        $e3 = $this->draftingEvent(['event_date' => now()->addDays(3)->toDateString()]);
        EventVendorAssignment::factory()->for($e3)->accepted()->create();
        EventVendorAssignment::factory()->for($e3)->pending()->create();
        $this->assertFalse($this->inspect($e3)['can_send_quotation']);
        try {
            $service->transition($e3, 'client_review');
            $this->fail('Harus gagal.');
        } catch (ValidationException $ex) {
            $this->assertSame(
                'Tidak dapat mengirim penawaran. Masih ada tawaran vendor yang belum dikonfirmasi (pending).',
                $ex->errors()['target_status'][0]
            );
        }

        // 4. Hanya rejected
        $e4 = $this->draftingEvent(['event_date' => now()->addDays(4)->toDateString()]);
        EventVendorAssignment::factory()->for($e4)->rejected()->create();
        $this->assertFalse($this->inspect($e4)['can_send_quotation']);
        try {
            $service->transition($e4, 'client_review');
            $this->fail('Harus gagal.');
        } catch (ValidationException $ex) {
            $this->assertSame(
                'Tidak dapat mengirim penawaran. Minimal 1 vendor harus menerima tawaran (accepted).',
                $ex->errors()['target_status'][0]
            );
        }

        // 5. Accepted + Rejected
        $e5 = $this->draftingEvent(['event_date' => now()->addDays(5)->toDateString()]);
        EventVendorAssignment::factory()->for($e5)->accepted()->create();
        EventVendorAssignment::factory()->for($e5)->rejected()->create();
        $this->assertTrue($this->inspect($e5)['can_send_quotation']);
        $transitioned = $service->transition($e5, 'client_review');
        $this->assertSame('client_review', $transitioned->kanban_status);
    }
}
