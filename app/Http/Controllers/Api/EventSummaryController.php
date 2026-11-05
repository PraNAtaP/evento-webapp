<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventSummaryController extends Controller
{
    /**
     * Mengembalikan data ringkasan acara dan keuangan untuk Event Organizer (EO)
     * berdasarkan bulan yang dipilih (default: bulan berjalan).
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'eo') {
            return response()->json([
                'message' => 'Akses ditolak. Hanya Event Organizer (EO) yang dapat mengakses data ini.',
            ], 403);
        }

        // Tentukan bulan yang dipilih (format: YYYY-MM)
        $monthInput = $request->query('month');
        if (is_string($monthInput) && preg_match('/^\d{4}-\d{2}$/', $monthInput)) {
            $selectedDate = Carbon::createFromFormat('Y-m', $monthInput)->startOfMonth();
        } else {
            $selectedDate = now()->startOfMonth();
        }

        $selectedMonth = $selectedDate->format('Y-m');
        $selectedMonthLabel = $selectedDate->translatedFormat('F Y');

        $startOfMonth = $selectedDate->copy()->startOfMonth();
        $endOfMonth = $selectedDate->copy()->endOfMonth();

        $prevStart = $selectedDate->copy()->subMonth()->startOfMonth();
        $prevEnd = $selectedDate->copy()->subMonth()->endOfMonth();

        // 1. Pendapatan Diakui Bulan Terpilih (Acara 'done' di bulan terpilih)
        $doneEventsCurrentMonth = Event::where('kanban_status', 'done')
            ->where(function ($query) use ($startOfMonth, $endOfMonth) {
                $query->whereBetween('event_date', [$startOfMonth->toDateString(), $endOfMonth->toDateString()])
                    ->orWhereBetween('completed_at', [$startOfMonth, $endOfMonth]);
            })
            ->with(['vendorAssignments' => function ($query) {
                $query->where('eo_offer_status', '!=', 'rejected');
            }])
            ->get();

        $recognizedRevenue = (float) $doneEventsCurrentMonth->sum('agreed_price');

        // Pendapatan Diakui Bulan Sebelumnya (untuk perbandingan)
        $prevDoneEvents = Event::where('kanban_status', 'done')
            ->where(function ($query) use ($prevStart, $prevEnd) {
                $query->whereBetween('event_date', [$prevStart->toDateString(), $prevEnd->toDateString()])
                    ->orWhereBetween('completed_at', [$prevStart, $prevEnd]);
            })
            ->get();

        $prevRecognizedRevenue = (float) $prevDoneEvents->sum('agreed_price');

        if ($prevRecognizedRevenue > 0) {
            $growthPercentage = round((($recognizedRevenue - $prevRecognizedRevenue) / $prevRecognizedRevenue) * 100, 1);
        } elseif ($recognizedRevenue > 0) {
            $growthPercentage = 100.0;
        } else {
            $growthPercentage = 0.0;
        }

        // 2. Kas Masuk (Pembayaran berstatus 'paid' dengan verified_at di bulan terpilih)
        $cashIn = (float) Payment::where('status', 'paid')
            ->whereBetween('verified_at', [$startOfMonth, $endOfMonth])
            ->sum('nominal');

        // 3. Margin Kotor (agreed_price - locked_price vendor aktif) acara done di bulan terpilih
        $totalVendorCost = 0.0;
        foreach ($doneEventsCurrentMonth as $event) {
            $totalVendorCost += (float) $event->vendorAssignments->sum('locked_price');
        }

        $grossMargin = max(0.0, $recognizedRevenue - $totalVendorCost);
        $grossMarginPercentage = $recognizedRevenue > 0
            ? round(($grossMargin / $recognizedRevenue) * 100, 1)
            : 0.0;

        // 4. Baris Kedua: Uang Muka Diterima (akumulatif acara belum done & bukan rejected)
        $deferredRevenue = (float) Payment::where('status', 'paid')
            ->whereHas('event', function ($query) {
                $query->whereNotIn('kanban_status', ['done', 'rejected']);
            })
            ->sum('nominal');

        // DP masuk bulan ini (pembayaran DP yang diverifikasi di bulan terpilih)
        $dpInThisMonth = (float) Payment::where('status', 'paid')
            ->where('payment_type', 'dp')
            ->whereBetween('verified_at', [$startOfMonth, $endOfMonth])
            ->sum('nominal');

        // 5. Piutang / Sisa Tagihan (agreed_price - pembayaran paid untuk seluruh acara aktif)
        $activeEventsWithPayments = Event::whereNotIn('kanban_status', ['done', 'rejected'])
            ->whereNotNull('agreed_price')
            ->where('agreed_price', '>', 0)
            ->with(['payments' => function ($query) {
                $query->where('status', 'paid');
            }])
            ->get();

        $totalReceivables = (float) $activeEventsWithPayments->sum(function ($event) {
            $paid = (float) $event->payments->sum('nominal');

            return max(0.0, (float) $event->agreed_price - $paid);
        });

        // Jatuh tempo bulan ini: sisa tagihan acara aktif yang event_date-nya di bulan terpilih
        $dueThisMonth = (float) $activeEventsWithPayments
            ->filter(function ($event) use ($startOfMonth, $endOfMonth) {
                return $event->event_date >= $startOfMonth->toDateString()
                    && $event->event_date <= $endOfMonth->toDateString();
            })
            ->sum(function ($event) {
                $paid = (float) $event->payments->sum('nominal');

                return max(0.0, (float) $event->agreed_price - $paid);
            });

        // 6. Jumlah Acara Aktif (belum done dan bukan rejected)
        $activeEventsCount = Event::whereNotIn('kanban_status', ['done', 'rejected'])->count();

        // 7. Diagram Pendapatan Bulanan: 6 bulan ke belakang dari bulan terpilih
        $monthlyChart = [];
        for ($i = 5; $i >= 0; $i--) {
            $mDate = $selectedDate->copy()->subMonths($i);
            $mStart = $mDate->copy()->startOfMonth();
            $mEnd = $mDate->copy()->endOfMonth();

            $mRevenue = (float) Event::where('kanban_status', 'done')
                ->where(function ($query) use ($mStart, $mEnd) {
                    $query->whereBetween('event_date', [$mStart->toDateString(), $mEnd->toDateString()])
                        ->orWhereBetween('completed_at', [$mStart, $mEnd]);
                })
                ->sum('agreed_price');

            $monthlyChart[] = [
                'month_key' => $mDate->format('Y-m'),
                'month' => $mDate->translatedFormat('M'),
                'month_full' => $mDate->translatedFormat('F Y'),
                'revenue' => $mRevenue,
                'is_selected' => $i === 0,
            ];
        }

        // Metrik Ringkasan Proyek Global
        $totalProyek = Event::count();
        $sedangBerjalan = $activeEventsCount;
        $totalNilaiKontrak = (float) Event::whereNotIn('kanban_status', ['request', 'rejected'])->sum('agreed_price');
        $totalTelahMasuk = (float) Payment::where('status', 'paid')->sum('nominal');

        $statusCounts = [
            'request' => Event::where('kanban_status', 'request')->count(),
            'dp_paid' => Event::where('kanban_status', 'awaiting_dp')->count(),
            'on_progress' => Event::where('kanban_status', 'on_progress')->count(),
            'done' => Event::where('kanban_status', 'done')->count(),
        ];

        return response()->json([
            'selected_month' => $selectedMonth,
            'selected_month_label' => $selectedMonthLabel,
            'financial' => [
                'recognized_revenue' => $recognizedRevenue,
                'previous_month_recognized_revenue' => $prevRecognizedRevenue,
                'revenue_growth_percentage' => $growthPercentage,
                'cash_in' => $cashIn,
                'gross_margin' => $grossMargin,
                'gross_margin_percentage' => $grossMarginPercentage,
            ],
            'operational' => [
                'deferred_revenue' => $deferredRevenue,
                'dp_in_this_month' => $dpInThisMonth,
                'total_receivables' => $totalReceivables,
                'due_this_month' => $dueThisMonth,
                'active_events_count' => $activeEventsCount,
            ],
            'monthly_chart' => $monthlyChart,
            // Field untuk kemudahan dan kompatibilitas
            'recognized_revenue' => $recognizedRevenue,
            'cash_in' => $cashIn,
            'gross_margin' => $grossMargin,
            'gross_margin_percentage' => $grossMarginPercentage,
            'deferred_revenue' => $deferredRevenue,
            'dp_in_this_month' => $dpInThisMonth,
            'total_receivables' => $totalReceivables,
            'due_this_month' => $dueThisMonth,
            'active_events_count' => $activeEventsCount,
            'total_proyek' => $totalProyek,
            'sedang_berjalan' => $sedangBerjalan,
            'total_nilai_kontrak' => $totalNilaiKontrak,
            'total_telah_masuk' => $totalTelahMasuk,
            'status_counts' => $statusCounts,
        ]);
    }
}
