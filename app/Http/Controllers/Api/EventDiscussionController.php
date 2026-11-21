<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Services\AdminNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventDiscussionController extends Controller
{
    /**
     * Memeriksa apakah pengguna memiliki hak akses pada event ini.
     */
    protected function authorizeAccess(Request $request, Event $event): bool
    {
        $user = $request->user();

        if ($user->isEo()) {
            return true;
        }

        if ($user->isClient() && $event->client_id === $user->id) {
            return true;
        }

        if ($user->isVendor() && $user->vendor) {
            return $event->vendorAssignments()->where('vendor_id', $user->vendor->id)->exists();
        }

        return false;
    }

    /**
     * Mengambil seluruh percakapan atau catatan diskusi pada acara.
     */
    public function index(Request $request, Event $event): JsonResponse
    {
        if (! $this->authorizeAccess($request, $event)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Anda tidak memiliki hak akses pada diskusi acara ini.',
            ], 403);
        }

        $discussions = $event->discussions()
            ->with('user:id,name,role,avatar_url')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $discussions,
        ]);
    }

    /**
     * Mengirim pesan catatan atau diskusi baru pada acara.
     */
    public function store(Request $request, Event $event): JsonResponse
    {
        if (! $this->authorizeAccess($request, $event)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Anda tidak memiliki hak akses untuk mengirim catatan pada acara ini.',
            ], 403);
        }

        $validated = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ], [
            'message.required' => 'Pesan diskusi tidak boleh kosong.',
            'message.max' => 'Pesan diskusi maksimal 2000 karakter.',
        ]);

        $user = $request->user();

        $discussion = $event->discussions()->create([
            'user_id' => $user->id,
            'sender_role' => $user->role,
            'message' => $validated['message'],
        ]);

        $discussion->load('user:id,name,role,avatar_url');

        // Notifikasi otomatis jika klien mengirim pesan ke EO
        if ($user->isClient()) {
            AdminNotificationService::notifyAdmins(
                title: 'Catatan Baru dari Klien',
                message: "Klien {$user->name} mengirimkan pesan baru pada acara \"{$event->event_name}\".",
                category: 'event_discussion',
                actionUrl: '/admin/kanban',
                metadata: [
                    'event_id' => $event->id,
                    'event_name' => $event->event_name,
                    'client_name' => $user->name,
                ]
            );
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Pesan berhasil dikirim.',
            'data' => $discussion,
        ], 201);
    }
}
