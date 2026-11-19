<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RejectCancellationRequest;
use App\Http\Resources\EventInspectorResource;
use App\Models\Event;
use App\Services\EventCancellationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CancellationRequestController extends Controller
{
    /**
     * EO menyetujui permintaan pembatalan dari klien: acara dibatalkan
     * menggunakan alasan klien, vendor dilepas, dan kalender dibebaskan.
     */
    public function approve(
        Request $request,
        Event $event,
        EventCancellationService $cancellationService
    ): JsonResponse {
        if (! $event->hasPendingCancellationRequest()) {
            return response()->json([
                'message' => 'Tidak ada permintaan pembatalan yang menunggu review untuk acara ini.',
            ], 422);
        }

        $validated = $request->validate([
            'note' => ['nullable', 'string', 'max:1000'],
        ], [
            'note.max' => 'Catatan review maksimal 1000 karakter.',
        ]);

        $cancellationService->cancel(
            $event,
            (string) $event->cancellation_request_reason,
            true,
            $validated['note'] ?? null
        );

        $event = $this->loadInspectorRelations($event);

        return response()->json([
            'message' => 'Permintaan pembatalan disetujui. Acara telah dibatalkan.',
            'data' => new EventInspectorResource($event),
            'event' => $event,
        ]);
    }

    /**
     * EO menolak permintaan pembatalan klien: acara tetap berjalan,
     * catatan penolakan disimpan, dan klien dapat mengajukan ulang jika perlu.
     */
    public function reject(RejectCancellationRequest $request, Event $event): JsonResponse
    {
        if (! $event->hasPendingCancellationRequest()) {
            return response()->json([
                'message' => 'Tidak ada permintaan pembatalan yang menunggu review untuk acara ini.',
            ], 422);
        }

        $event->update([
            'cancellation_request_status' => Event::CANCELLATION_REQUEST_REJECTED,
            'cancellation_review_note' => $request->validated('note'),
            'cancellation_reviewed_at' => now(),
        ]);

        $event = $this->loadInspectorRelations($event);

        return response()->json([
            'message' => 'Permintaan pembatalan ditolak. Acara tetap berjalan.',
            'data' => new EventInspectorResource($event),
            'event' => $event,
        ]);
    }

    private function loadInspectorRelations(Event $event): Event
    {
        return $event->load([
            'client:id,name,email',
            'vendorAssignments' => fn ($query) => $query->orderBy('id'),
            'vendorAssignments.package:id,vendor_id,package_name,price',
            'vendorAssignments.vendor:id,business_name,category',
            'payments',
        ]);
    }
}
