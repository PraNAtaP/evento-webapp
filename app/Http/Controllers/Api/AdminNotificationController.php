<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminNotificationController extends Controller
{
    /**
     * Get list of notifications for the authenticated admin user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $unreadOnly = $request->boolean('unread_only');
        $limit = min($request->integer('limit', 20), 50);

        $query = $unreadOnly
            ? $user->unreadNotifications()
            : $user->notifications();

        $notifications = $query->latest()->limit($limit)->get()->map(function ($n) {
            return [
                'id' => $n->id,
                'title' => $n->data['title'] ?? 'Pemberitahuan Sistem',
                'message' => $n->data['message'] ?? '',
                'category' => $n->data['category'] ?? 'general',
                'action_url' => $n->data['action_url'] ?? null,
                'metadata' => $n->data['metadata'] ?? [],
                'is_read' => ! is_null($n->read_at),
                'read_at' => $n->read_at,
                'created_at' => $n->created_at,
                'created_at_human' => $n->created_at?->diffForHumans(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $notifications,
            'summary' => [
                'unread_count' => $user->unreadNotifications()->count(),
                'total_count' => $user->notifications()->count(),
            ],
        ]);
    }

    /**
     * Mark a specific notification as read.
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->where('id', $id)->first();

        if (! $notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notifikasi tidak ditemukan.',
            ], 404);
        }

        $notification->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi berhasil ditandai telah dibaca.',
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    /**
     * Mark all notifications as read for the authenticated admin.
     */
    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'Semua notifikasi berhasil ditandai telah dibaca.',
            'unread_count' => 0,
        ]);
    }

    /**
     * Delete a notification.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->where('id', $id)->first();

        if (! $notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notifikasi tidak ditemukan.',
            ], 404);
        }

        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi berhasil dihapus.',
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }
}
