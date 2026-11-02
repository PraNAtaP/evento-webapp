<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Services\KanbanTransitionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ClientEventController extends Controller
{
    public function __construct(
        protected KanbanTransitionService $transitionService
    ) {}

    /**
     * Mengambil daftar seluruh event yang dimiliki oleh klien yang sedang login.
     */
    public function index(Request $request): JsonResponse
    {
        $events = Event::with([
            'vendorAssignments.package',
            'vendorAssignments.vendor:id,business_name,category',
            'payments',
        ])
            ->where('client_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        // Vendor Masking: Lindungi identitas vendor agar klien tidak melihat nama bisnis asli
        $events->each(function ($event) {
            $event->vendorAssignments->each(function ($assignment) {
                if ($assignment->vendor) {
                    $categoryName = ucfirst($assignment->vendor->category ?? 'Layanan');
                    $assignment->vendor->business_name = "Mitra {$categoryName} EO";
                }
            });
        });

        return response()->json([
            'events' => $events,
        ]);
    }

    /**
     * Menampilkan detail suatu event milik klien.
     */
    public function show(Request $request, Event $event): JsonResponse
    {
        if ($event->client_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Anda tidak memiliki hak akses ke acara ini.',
            ], 403);
        }

        $event->load([
            'vendorAssignments.package',
            'vendorAssignments.vendor:id,business_name,category',
            'payments',
        ]);

        // Vendor Masking: Lindungi identitas vendor agar klien tidak melihat nama bisnis asli
        $event->vendorAssignments->each(function ($assignment) {
            if ($assignment->vendor) {
                $categoryName = ucfirst($assignment->vendor->category ?? 'Layanan');
                $assignment->vendor->business_name = "Mitra {$categoryName} EO";
            }
        });

        return response()->json([
            'event' => $event,
        ]);
    }

    /**
     * Endpoint bagi klien untuk menyetujui penawaran EO.
     * Mengubah seluruh assignment aktif menjadi approved dan memicu transisi ke awaiting_dp.
     */
    public function approveQuotation(Request $request, Event $event): JsonResponse
    {
        if ($event->client_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Anda tidak memiliki hak akses ke acara ini.',
            ], 403);
        }

        if ($event->kanban_status !== 'client_review') {
            throw ValidationException::withMessages([
                'event' => ['Acara ini tidak sedang dalam tahap review klien.'],
            ]);
        }

        // Setujui seluruh assignment vendor yang aktif
        $event->vendorAssignments()
            ->where('eo_offer_status', '!=', 'rejected')
            ->update(['client_approval' => 'approved']);

        // Jalankan transisi ke awaiting_dp (membuat tagihan DP dan pelunasan)
        $updatedEvent = $this->transitionService->transition($event, 'awaiting_dp');

        return response()->json([
            'message' => 'Penawaran berhasil disetujui. Tagihan pembayaran DP telah diterbitkan.',
            'event' => $updatedEvent,
        ]);
    }

    /**
     * Endpoint bagi klien untuk meminta revisi penawaran kepada EO.
     * Memicu transisi client_review -> drafting_quotation.
     */
    public function requestRevision(Request $request, Event $event): JsonResponse
    {
        if ($event->client_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Anda tidak memiliki hak akses ke acara ini.',
            ], 403);
        }

        if ($event->kanban_status !== 'client_review') {
            throw ValidationException::withMessages([
                'event' => ['Acara ini tidak sedang dalam tahap review klien.'],
            ]);
        }

        $validated = $request->validate([
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $updatedEvent = $this->transitionService->transition($event, 'drafting_quotation', [
            'revision_note' => $validated['note'] ?? null,
        ]);

        return response()->json([
            'message' => 'Permintaan revisi berhasil dikirim ke Event Organizer.',
            'event' => $updatedEvent,
        ]);
    }
}
