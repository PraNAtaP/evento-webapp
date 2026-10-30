<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminEventOrderController extends Controller
{
    /**
     * Mengambil daftar pesanan acara klien yang masuk (status request atau rejected).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Event::with(['client:id,name,email,role'])
            ->orderByDesc('created_at');

        if ($request->has('status') && in_array($request->query('status'), ['request', 'drafting_quotation', 'rejected', 'all'], true)) {
            $status = $request->query('status');
            if ($status !== 'all') {
                $query->where('kanban_status', $status);
            }
        } else {
            // Default: Tampilkan pesanan yang baru masuk (request)
            $query->where('kanban_status', 'request');
        }

        $events = $query->paginate(10);

        return response()->json($events);
    }

    /**
     * Terima pesanan acara klien: pindahkan status dari 'request' ke 'drafting_quotation'.
     */
    public function accept(Event $event): JsonResponse
    {
        if ($event->kanban_status !== 'request') {
            return response()->json([
                'message' => 'Hanya pesanan berstatus request yang dapat diterima.',
            ], 422);
        }

        $event->update([
            'kanban_status' => 'drafting_quotation',
            'rejection_reason' => null,
        ]);

        return response()->json([
            'message' => 'Pesanan acara berhasil diterima dan masuk ke tahap penyusunan penawaran.',
            'event' => $event->fresh(['client:id,name,email']),
        ]);
    }

    /**
     * Tolak pesanan acara klien: ubah status ke 'rejected' dan simpan alasannya.
     */
    public function reject(Request $request, Event $event): JsonResponse
    {
        if ($event->kanban_status !== 'request') {
            return response()->json([
                'message' => 'Hanya pesanan berstatus request yang dapat ditolak.',
            ], 422);
        }

        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $event->update([
            'kanban_status' => 'rejected',
            'rejection_reason' => $validated['reason'] ?? 'Pesanan ditolak oleh Event Organizer.',
        ]);

        return response()->json([
            'message' => 'Pesanan acara berhasil ditolak.',
            'event' => $event->fresh(['client:id,name,email']),
        ]);
    }
}
