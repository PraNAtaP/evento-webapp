<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CancellationRequestController extends Controller
{
    /**
     * Status yang memperbolehkan klien mengajukan pembatalan acara.
     */
    private const CANCELLABLE_STATUSES = [
        'drafting_quotation',
        'client_review',
        'awaiting_dp',
        'on_progress',
    ];

    /**
     * [KLIEN] Mengajukan permintaan pembatalan acara.
     * Hanya bisa dilakukan saat kanban_status bukan 'request', 'done', 'rejected', atau 'cancelled'.
     * Serta belum ada permintaan pembatalan yang masih pending.
     */
    public function request(Request $request, Event $event): JsonResponse
    {
        if ($event->client_id !== $request->user()->id) {
            return response()->json(['message' => 'Anda tidak memiliki hak akses ke acara ini.'], 403);
        }

        if (! in_array($event->kanban_status, self::CANCELLABLE_STATUSES, true)) {
            throw ValidationException::withMessages([
                'event' => ['Acara pada tahap ini tidak dapat diajukan pembatalan.'],
            ]);
        }

        if ($event->cancellation_request_status === 'pending') {
            throw ValidationException::withMessages([
                'event' => ['Sudah ada permintaan pembatalan yang sedang menunggu review EO.'],
            ]);
        }

        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:10', 'max:1000'],
        ], [
            'reason.required' => 'Alasan pembatalan wajib diisi.',
            'reason.min' => 'Alasan pembatalan minimal 10 karakter.',
            'reason.max' => 'Alasan pembatalan maksimal 1000 karakter.',
        ]);

        $event->update([
            'cancellation_request_reason' => $validated['reason'],
            'cancellation_requested_at' => now(),
            'cancellation_request_status' => 'pending',
            'cancellation_review_note' => null,
            'cancellation_reviewed_at' => null,
        ]);

        return response()->json([
            'message' => 'Permintaan pembatalan acara berhasil diajukan. Menunggu konfirmasi dari Event Organizer.',
            'event' => $event->fresh(),
        ]);
    }

    /**
     * [KLIEN] Menarik kembali permintaan pembatalan yang masih pending.
     */
    public function withdraw(Request $request, Event $event): JsonResponse
    {
        if ($event->client_id !== $request->user()->id) {
            return response()->json(['message' => 'Anda tidak memiliki hak akses ke acara ini.'], 403);
        }

        if ($event->cancellation_request_status !== 'pending') {
            throw ValidationException::withMessages([
                'event' => ['Tidak ada permintaan pembatalan yang dapat ditarik.'],
            ]);
        }

        $event->update([
            'cancellation_request_reason' => null,
            'cancellation_requested_at' => null,
            'cancellation_request_status' => null,
            'cancellation_review_note' => null,
            'cancellation_reviewed_at' => null,
        ]);

        return response()->json([
            'message' => 'Permintaan pembatalan berhasil ditarik kembali.',
            'event' => $event->fresh(),
        ]);
    }

    /**
     * [EO] Melihat daftar acara yang memiliki permintaan pembatalan pending.
     */
    public function index(): JsonResponse
    {
        $events = Event::with(['client:id,name,email'])
            ->where('cancellation_request_status', 'pending')
            ->orderByDesc('cancellation_requested_at')
            ->get();

        return response()->json(['events' => $events]);
    }

    /**
     * [EO] Menyetujui permintaan pembatalan: acara diubah ke status 'cancelled'.
     */
    public function approve(Request $request, Event $event): JsonResponse
    {
        if ($event->cancellation_request_status !== 'pending') {
            throw ValidationException::withMessages([
                'event' => ['Tidak ada permintaan pembatalan yang perlu ditinjau.'],
            ]);
        }

        $validated = $request->validate([
            'review_note' => ['nullable', 'string', 'max:500'],
        ]);

        // Batalkan seluruh vendor assignment aktif
        $event->vendorAssignments()
            ->whereIn('eo_offer_status', ['pending', 'accepted'])
            ->update(['eo_offer_status' => 'cancelled']);

        $event->update([
            'kanban_status' => 'cancelled',
            'cancellation_reason' => $event->cancellation_request_reason,
            'cancelled_at' => now(),
            'cancellation_request_status' => 'approved',
            'cancellation_review_note' => $validated['review_note'] ?? null,
            'cancellation_reviewed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Permintaan pembatalan disetujui. Acara telah dibatalkan.',
            'event' => $event->fresh(['client', 'vendorAssignments']),
        ]);
    }

    /**
     * [EO] Menolak permintaan pembatalan: acara tetap berjalan.
     */
    public function reject(Request $request, Event $event): JsonResponse
    {
        if ($event->cancellation_request_status !== 'pending') {
            throw ValidationException::withMessages([
                'event' => ['Tidak ada permintaan pembatalan yang perlu ditinjau.'],
            ]);
        }

        $validated = $request->validate([
            'review_note' => ['required', 'string', 'min:5', 'max:500'],
        ], [
            'review_note.required' => 'Catatan penolakan wajib diisi agar klien memahami alasannya.',
            'review_note.min' => 'Catatan penolakan minimal 5 karakter.',
        ]);

        $event->update([
            'cancellation_request_status' => 'rejected',
            'cancellation_review_note' => $validated['review_note'],
            'cancellation_reviewed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Permintaan pembatalan ditolak. Acara tetap berjalan.',
            'event' => $event->fresh(['client']),
        ]);
    }
}
