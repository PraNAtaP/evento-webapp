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
            'vendorAssignments' => fn ($query) => $query->where('eo_offer_status', '!=', 'rejected'),
            'vendorAssignments.package.images',
            'vendorAssignments.vendor',
            'vendorAssignments.progressLogs' => fn ($query) => $query->where('is_visible_to_client', true)->orderByDesc('created_at'),
            'payments',
        ])
            ->where('client_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        // Vendor Masking: Buka identitas vendor hanya jika DP sudah dibayar / acara sudah masuk tahap on_progress / done
        $events->each(function ($event) {
            $isDpPaid = in_array($event->kanban_status, ['on_progress', 'done'], true)
                || $event->payments->where('payment_type', 'dp')->where('status', 'paid')->isNotEmpty();

            $event->is_vendor_unmasked = $isDpPaid;

            $event->vendorAssignments->each(function ($assignment) use ($isDpPaid) {
                if ($assignment->vendor && ! $isDpPaid) {
                    $categoryName = ucfirst($assignment->vendor->category ?? 'Layanan');
                    $assignment->vendor->business_name = "Mitra {$categoryName} EO";
                    $assignment->vendor->contact_number = null;
                    $assignment->vendor->social_media = null;
                    $assignment->vendor->address = null;
                    $assignment->vendor->description = null;
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
            'vendorAssignments' => fn ($query) => $query->where('eo_offer_status', '!=', 'rejected'),
            'vendorAssignments.package.images',
            'vendorAssignments.vendor',
            'vendorAssignments.progressLogs' => fn ($query) => $query->where('is_visible_to_client', true)->orderByDesc('created_at'),
            'payments',
        ]);

        $isDpPaid = in_array($event->kanban_status, ['on_progress', 'done'], true)
            || $event->payments->where('payment_type', 'dp')->where('status', 'paid')->isNotEmpty();

        $event->is_vendor_unmasked = $isDpPaid;

        $event->vendorAssignments->each(function ($assignment) use ($isDpPaid) {
            if ($assignment->vendor && ! $isDpPaid) {
                $categoryName = ucfirst($assignment->vendor->category ?? 'Layanan');
                $assignment->vendor->business_name = "Mitra {$categoryName} EO";
                $assignment->vendor->contact_number = null;
                $assignment->vendor->social_media = null;
                $assignment->vendor->address = null;
                $assignment->vendor->description = null;
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

        // Validasi persetujuan Syarat dan Ketentuan
        $validated = $request->validate([
            'terms_accepted' => ['required', 'accepted'],
        ], [
            'terms_accepted.required' => 'Anda harus menyetujui Syarat dan Ketentuan terlebih dahulu.',
            'terms_accepted.accepted' => 'Anda harus menyetujui Syarat dan Ketentuan terlebih dahulu.',
        ]);

        // Simpan waktu dan versi Syarat dan Ketentuan yang disetujui
        $event->update([
            'terms_accepted_at' => now(),
            'terms_version' => '1.0',
        ]);

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
