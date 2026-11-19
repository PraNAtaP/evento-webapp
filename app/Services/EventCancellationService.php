<?php

namespace App\Services;

use App\Models\Event;
use Illuminate\Support\Facades\DB;

class EventCancellationService
{
    /**
     * Membatalkan acara: ubah status menjadi cancelled, simpan alasan,
     * tandai permintaan pembatalan klien (jika ada) sebagai approved,
     * dan bebaskan seluruh jadwal vendor terkait tanpa hard delete.
     */
    public function cancel(
        Event $event,
        string $reason,
        bool $fromClientRequest = false,
        ?string $reviewNote = null
    ): Event {
        DB::transaction(function () use ($event, $reason, $fromClientRequest, $reviewNote) {
            $payload = [
                'kanban_status' => 'cancelled',
                'cancellation_reason' => $reason,
                'cancelled_at' => now(),
            ];

            if ($fromClientRequest || $event->hasPendingCancellationRequest()) {
                $payload['cancellation_request_status'] = Event::CANCELLATION_REQUEST_APPROVED;
                $payload['cancellation_review_note'] = $reviewNote;
                $payload['cancellation_reviewed_at'] = now();
            }

            $event->update($payload);

            $event->vendorAssignments()->update([
                'eo_offer_status' => 'cancelled',
            ]);
        });

        return $event;
    }
}
