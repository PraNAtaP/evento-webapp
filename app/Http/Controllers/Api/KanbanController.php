<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Services\KanbanTransitionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KanbanController extends Controller
{
    public function __construct(
        protected KanbanTransitionService $transitionService
    ) {}

    /**
     * Mengambil seluruh data event untuk papan Kanban internal EO.
     */
    public function index(): JsonResponse
    {
        $events = Event::with([
            'client:id,name,email',
            'vendorAssignments.package:id,vendor_id,package_name,price',
            'vendorAssignments.vendor:id,business_name,category',
            'payments',
        ])
            ->orderBy('event_date', 'asc')
            ->get();

        return response()->json([
            'events' => $events,
        ]);
    }

    /**
     * Memindahkan kartu event ke tahapan status kanban baru dengan validasi alur kerja.
     */
    public function move(Request $request, Event $event): JsonResponse
    {
        $validated = $request->validate([
            'target_status' => ['required', 'string'],
            'dp_percentage' => ['nullable', 'numeric', 'between:10,100'],
            'revision_note' => ['nullable', 'string', 'max:1000'],
        ], [
            'target_status.required' => 'Status target wajib disertakan.',
            'dp_percentage.between' => 'Persentase DP harus bernilai antara 10% sampai 100%.',
        ]);

        $updatedEvent = $this->transitionService->transition(
            $event,
            $validated['target_status'],
            [
                'dp_percentage' => $validated['dp_percentage'] ?? null,
                'revision_note' => $validated['revision_note'] ?? null,
            ]
        );

        return response()->json([
            'message' => 'Status acara berhasil diperbarui.',
            'event' => $updatedEvent,
        ]);
    }
}
