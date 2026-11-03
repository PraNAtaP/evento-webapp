<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\EventVendorAssignment;
use App\Models\Payment;
use App\Models\User;
use App\Models\VendorPackage;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EventSummaryTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_eo_user_can_get_event_summary(): void
    {
        $user = User::factory()->eo()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/admin/event-summary');

        $response->assertOk()
            ->assertJsonStructure([
                'selected_month',
                'selected_month_label',
                'financial' => [
                    'recognized_revenue',
                    'previous_month_recognized_revenue',
                    'revenue_growth_percentage',
                    'cash_in',
                    'gross_margin',
                    'gross_margin_percentage',
                ],
                'total_proyek',
                'sedang_berjalan',
                'status_counts',
                'operational' => [
                    'deferred_revenue',
                    'dp_in_this_month',
                    'total_receivables',
                    'due_this_month',
                    'active_events_count',
                ],
                'monthly_chart' => [
                    '*' => [
                        'month_key',
                        'month',
                        'month_full',
                        'revenue',
                        'is_selected',
                    ],
                ],
            ]);

        $this->assertCount(6, $response->json('monthly_chart'));
    }

    public function test_calculates_financial_metrics_for_selected_month_accurately(): void
    {
        $eo = User::factory()->eo()->create();
        $targetMonth = '2026-05';
        $currentMonthDate = Carbon::createFromFormat('Y-m-d', '2026-05-15');
        $prevMonthDate = Carbon::createFromFormat('Y-m-d', '2026-04-15');

        // Acara done di bulan sebelumnya: agreed_price 50.000.000
        Event::factory()->create([
            'kanban_status' => 'done',
            'agreed_price' => 50000000,
            'event_date' => $prevMonthDate->toDateString(),
            'completed_at' => $prevMonthDate,
        ]);

        // Acara done di bulan target: agreed_price 100.000.000
        $currentEvent = Event::factory()->create([
            'kanban_status' => 'done',
            'agreed_price' => 100000000,
            'event_date' => $currentMonthDate->toDateString(),
            'completed_at' => $currentMonthDate,
        ]);

        // Vendor assignment aktif untuk acara target: locked_price 60.000.000
        $package = VendorPackage::factory()->create();
        EventVendorAssignment::create([
            'event_id' => $currentEvent->id,
            'vendor_id' => $package->vendor_id,
            'package_id' => $package->id,
            'package_name' => $package->package_name,
            'package_price' => 60000000,
            'locked_price' => 60000000,
            'eo_offer_status' => 'accepted',
            'client_approval' => 'accepted',
        ]);

        // Pembayaran terverifikasi di bulan target: 35.000.000
        Payment::create([
            'event_id' => $currentEvent->id,
            'payment_type' => 'dp',
            'nominal' => 35000000,
            'status' => 'paid',
            'verified_at' => $currentMonthDate,
        ]);

        // Pembayaran di bulan lain: 10.000.000 (tidak boleh terhitung ke kas masuk bulan target)
        Payment::create([
            'event_id' => $currentEvent->id,
            'payment_type' => 'pelunasan',
            'nominal' => 10000000,
            'status' => 'paid',
            'verified_at' => $prevMonthDate,
        ]);

        // Acara aktif 1: event_date di bulan target (Mei), agreed_price 40jt, DP dibayar 15jt di Mei
        $activeEvent1 = Event::factory()->create([
            'kanban_status' => 'on_progress',
            'agreed_price' => 40000000,
            'event_date' => '2026-05-20',
        ]);
        Payment::create([
            'event_id' => $activeEvent1->id,
            'payment_type' => 'dp',
            'nominal' => 15000000,
            'status' => 'paid',
            'verified_at' => '2026-05-05',
        ]);

        // Acara aktif 2: event_date di bulan depan (Juni), agreed_price 30jt, DP dibayar 10jt di April
        $activeEvent2 = Event::factory()->create([
            'kanban_status' => 'awaiting_dp',
            'agreed_price' => 30000000,
            'event_date' => '2026-06-25',
        ]);
        Payment::create([
            'event_id' => $activeEvent2->id,
            'payment_type' => 'dp',
            'nominal' => 10000000,
            'status' => 'paid',
            'verified_at' => '2026-04-20',
        ]);

        $response = $this->actingAs($eo, 'sanctum')
            ->getJson("/api/admin/event-summary?month={$targetMonth}");

        $response->assertOk()
            ->assertJson([
                'selected_month' => '2026-05',
                'financial' => [
                    'recognized_revenue' => 100000000,
                    'previous_month_recognized_revenue' => 50000000,
                    'revenue_growth_percentage' => 100.0,
                    'cash_in' => 50000000, // 35jt (event selesai) + 15jt (activeEvent1 DP)
                    'gross_margin' => 40000000,
                    'gross_margin_percentage' => 40.0,
                ],
                'operational' => [
                    'deferred_revenue' => 25000000, // 15jt + 10jt DP acara aktif
                    'dp_in_this_month' => 50000000,  // 35jt + 15jt DP di Mei
                    'total_receivables' => 45000000, // (40jt-15jt) + (30jt-10jt) = 25jt + 20jt
                    'due_this_month' => 25000000,    // Hanya activeEvent1 yang event_date di Mei: 40jt - 15jt
                    'active_events_count' => 2,
                ],
            ]);

        $monthlyChart = $response->json('monthly_chart');
        $this->assertCount(6, $monthlyChart);
        $this->assertSame('2026-05', $monthlyChart[5]['month_key']);
        $this->assertEquals(100000000, $monthlyChart[5]['revenue']);
        $this->assertSame('2026-04', $monthlyChart[4]['month_key']);
        $this->assertEquals(50000000, $monthlyChart[4]['revenue']);
        $this->assertSame('2026-03', $monthlyChart[3]['month_key']);
        $this->assertEquals(0, $monthlyChart[3]['revenue']);
    }

    /**
     * Memastikan user dengan role non-EO (misalnya client) mendapatkan response 403 Forbidden.
     */
    public function test_non_eo_user_cannot_access_event_summary(): void
    {
        $client = User::factory()->client()->create();

        $response = $this->actingAs($client, 'sanctum')
            ->getJson('/api/admin/event-summary');

        $response->assertForbidden()
            ->assertJson([
                'message' => 'Akses ditolak. Hanya Event Organizer (EO) yang dapat mengakses data ini.',
            ]);
    }

    /**
     * Memastikan user yang belum terautentikasi mendapatkan response 401 Unauthorized.
     */
    public function test_unauthenticated_user_cannot_access_event_summary(): void
    {
        $response = $this->getJson('/api/admin/event-summary');

        $response->assertUnauthorized();
    }
}
