<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RescheduleEventRequest;
use App\Http\Resources\EventInspectorResource;
use App\Models\Event;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class EventInspectorController extends Controller
{
    /**
     * Menampilkan detail read-only satu event untuk Board Inspector.
     *
     * Catatan: tidak ada pengecekan kepemilikan karena aplikasi ini diasumsikan
     * memiliki satu EO; middleware `role:eo` pada route sudah cukup.
     */
    public function show(Event $event): EventInspectorResource
    {
        $event->load([
            'client:id,name',
            'vendorAssignments' => fn ($query) => $query->orderBy('id'),
            'vendorAssignments.vendor:id,business_name,category',
        ]);

        return new EventInspectorResource($event);
    }

    /**
     * Mengubah tanggal pelaksanaan acara (Reschedule) oleh EO
     * untuk acara berstatus Request hingga Menunggu DP, serta memperbarui updated_at.
     */
    public function reschedule(RescheduleEventRequest $request, Event $event): JsonResponse
    {
        $validated = $request->validated();
        $isMultiDay = (bool) ($validated['is_multi_day'] ?? false);
        $endDate = $isMultiDay ? ($validated['end_date'] ?? null) : null;

        $event->event_date = $validated['event_date'];
        $event->is_multi_day = $isMultiDay;
        $event->end_date = $endDate;
        // Pastikan updated_at sinkron dengan waktu perubahan terakhir meskipun tanggal kebetulan dikirim sama
        $event->updated_at = Carbon::now();
        $event->save();

        $event->load([
            'client:id,name,email',
            'vendorAssignments' => fn ($query) => $query->orderBy('id'),
            'vendorAssignments.package:id,vendor_id,package_name,price',
            'vendorAssignments.vendor:id,business_name,category',
            'payments',
        ]);

        return response()->json([
            'message' => 'Jadwal acara berhasil diperbarui (Reschedule).',
            'data' => new EventInspectorResource($event),
            'event' => $event,
        ]);
    }
}
