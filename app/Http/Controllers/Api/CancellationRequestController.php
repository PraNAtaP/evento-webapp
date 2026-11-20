<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\CancellationApprovedMail;
use App\Mail\CancellationRejectedMail;
use App\Models\Event;
use App\Services\AdminNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
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
     * Menghitung apakah DP akan hangus berdasarkan sisa hari menuju event_date.
     * DP hangus jika sisa hari <= EVENTO_DP_FORFEIT_DAYS (default: 30 hari).
     */
    private function isDpForfeited(Event $event): bool
    {
        if (! $event->event_date) {
            return false;
        }

        $daysUntilEvent = (int) now()->startOfDay()->diffInDays($event->event_date, false);
        $forfeitDays = (int) config('evento.cancellation_dp_forfeit_days', 30);

        return $daysUntilEvent <= $forfeitDays;
    }

    /**
     * [KLIEN] Mendapatkan info kebijakan DP sebelum mengajukan pembatalan (preview).
     * GET /client/events/{event}/cancellation-request/policy
     */
    public function policy(Request $request, Event $event): JsonResponse
    {
        if ($event->client_id !== $request->user()->id) {
            return response()->json(['message' => 'Anda tidak memiliki hak akses ke acara ini.'], 403);
        }

        $forfeitDays = (int) config('evento.cancellation_dp_forfeit_days', 30);
        $daysUntilEvent = $event->event_date
            ? (int) now()->startOfDay()->diffInDays($event->event_date, false)
            : null;

        $isDpPaid = $event->payments()
            ->where('payment_type', 'dp')
            ->where('status', 'paid')
            ->exists();

        $isForfeited = $this->isDpForfeited($event);
        $canCancel = in_array($event->kanban_status, self::CANCELLABLE_STATUSES, true)
            && $event->cancellation_request_status !== 'pending';

        return response()->json([
            'can_cancel' => $canCancel,
            'dp_forfeit_days' => $forfeitDays,
            'days_until_event' => $daysUntilEvent,
            'is_dp_paid' => $isDpPaid,
            'is_dp_forfeited' => $isForfeited,
            'forfeit_reason' => $isForfeited
                ? "Acara kurang dari {$forfeitDays} hari lagi sehingga DP tidak dapat dikembalikan."
                : null,
        ]);
    }

    /**
     * [KLIEN] Mengajukan permintaan pembatalan acara.
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

        $isForfeited = $this->isDpForfeited($event);

        $event->update([
            'cancellation_request_reason' => $validated['reason'],
            'cancellation_requested_at' => now(),
            'cancellation_request_status' => 'pending',
            'cancellation_review_note' => null,
            'cancellation_reviewed_at' => null,
        ]);

        AdminNotificationService::notifyAdmins(
            title: 'Pengajuan Pembatalan Acara',
            message: "Klien {$request->user()->name} mengajukan pembatalan untuk acara '{$event->title}'.",
            category: 'cancellation',
            actionUrl: '/admin/orders',
            metadata: ['event_id' => $event->id, 'reason' => $validated['reason']]
        );

        return response()->json([
            'message' => 'Permintaan pembatalan acara berhasil diajukan. Menunggu konfirmasi dari Event Organizer.',
            'is_dp_forfeited' => $isForfeited,
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
            ->get()
            ->map(function (Event $event) {
                $event->is_dp_forfeited = $this->isDpForfeited($event);

                return $event;
            });

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

        $isForfeited = $this->isDpForfeited($event);

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

        // Kirim notifikasi email ke klien
        $clientEmail = $event->client?->email;
        if ($clientEmail) {
            Mail::to($clientEmail)->queue(
                new CancellationApprovedMail(
                    event: $event->load('client'),
                    isDpForfeited: $isForfeited,
                    reviewNote: $validated['review_note'] ?? null,
                )
            );
        }

        return response()->json([
            'message' => 'Permintaan pembatalan disetujui. Acara telah dibatalkan dan notifikasi dikirim ke klien.',
            'is_dp_forfeited' => $isForfeited,
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

        // Kirim notifikasi email ke klien
        $clientEmail = $event->client?->email;
        if ($clientEmail) {
            Mail::to($clientEmail)->queue(
                new CancellationRejectedMail(
                    event: $event->load('client'),
                    reviewNote: $validated['review_note'],
                )
            );
        }

        return response()->json([
            'message' => 'Permintaan pembatalan ditolak. Acara tetap berjalan dan notifikasi dikirim ke klien.',
            'event' => $event->fresh(['client']),
        ]);
    }
}
