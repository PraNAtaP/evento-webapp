<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminEventOrderController extends Controller
{
    /**
     * Mengambil daftar pesanan acara klien yang masuk (termasuk input manual dari Smart Calendar EO).
     * Diurutkan berdasarkan updated_at terbaru agar reschedule atau pesanan terbaru langsung terlihat di atas.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Event::with(['client:id,name,email,role'])
            ->orderByDesc('updated_at')
            ->orderByDesc('created_at');

        if ($request->has('status') && in_array($request->query('status'), ['request', 'accepted', 'rejected', 'all'], true)) {
            $status = $request->query('status');
            if ($status === 'accepted') {
                // Tampilkan semua pesanan yang sudah diterima EO (mulai dari drafting_quotation hingga done)
                $query->whereIn('kanban_status', [
                    'drafting_quotation',
                    'client_review',
                    'awaiting_dp',
                    'on_progress',
                    'done',
                ]);
            } elseif ($status !== 'all') {
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
