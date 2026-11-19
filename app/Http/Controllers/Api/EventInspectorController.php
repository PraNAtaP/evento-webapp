<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RescheduleEventRequest;
use App\Http\Resources\EventInspectorResource;
use App\Mail\CancellationApprovedMail;
use App\Models\Event;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

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

    /**
     * Membatalkan acara oleh EO dengan menyertakan alasan pembatalan.
     * Mengubah status acara menjadi cancelled, membebaskan jadwal vendor terkait,
     * serta mempertahankan data (tanpa hard delete).
     */
    public function cancel(Request $request, Event $event): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['required_without:cancellation_reason', 'nullable', 'string', 'max:1000'],
            'cancellation_reason' => ['required_without:reason', 'nullable', 'string', 'max:1000'],
        ], [
            'reason.required_without' => 'Alasan pembatalan wajib diisi.',
            'cancellation_reason.required_without' => 'Alasan pembatalan wajib diisi.',
            'reason.max' => 'Alasan pembatalan maksimal 1000 karakter.',
            'cancellation_reason.max' => 'Alasan pembatalan maksimal 1000 karakter.',
        ]);

        $reason = $validated['reason'] ?? $validated['cancellation_reason'];

        if ($event->kanban_status === 'cancelled') {
            return response()->json([
                'message' => 'Acara sudah dibatalkan sebelumnya.',
            ], 422);
        }

        DB::transaction(function () use ($event, $reason) {
            $event->update([
                'kanban_status' => 'cancelled',
                'cancellation_reason' => $reason,
                'cancelled_at' => Carbon::now(),
            ]);

            // Bebaskan seluruh jadwal vendor terkait
            $event->vendorAssignments()->update([
                'eo_offer_status' => 'cancelled',
            ]);
        });

        $event->load([
            'client:id,name,email',
            'vendorAssignments' => fn ($query) => $query->orderBy('id'),
            'vendorAssignments.package:id,vendor_id,package_name,price',
            'vendorAssignments.vendor:id,business_name,category',
            'payments',
        ]);

        $daysUntilEvent = $event->event_date
            ? (int) now()->startOfDay()->diffInDays($event->event_date, false)
            : 0;
        $forfeitDays = (int) config('evento.cancellation_dp_forfeit_days', 30);
        $isDpForfeited = $event->event_date ? ($daysUntilEvent <= $forfeitDays) : false;

        $clientEmail = $event->client?->email;
        if ($clientEmail) {
            Mail::to($clientEmail)->queue(
                new CancellationApprovedMail(
                    event: $event,
                    isDpForfeited: $isDpForfeited,
                    reviewNote: $reason,
                )
            );
        }

        return response()->json([
            'message' => 'Acara berhasil dibatalkan.',
            'data' => new EventInspectorResource($event),
            'event' => $event,
        ]);
    }
}
