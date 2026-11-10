<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProgressLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProgressApprovalController extends Controller
{
    /**
     * Menampilkan semua progress log dari semua vendor untuk di-review EO.
     */
    public function index(Request $request): JsonResponse
    {
        $logs = ProgressLog::with([
            'assignment.event:id,event_name',
            'assignment.vendor:id,business_name'
        ])
        ->orderByDesc('created_at')
        ->get();

        return response()->json([
            'logs' => $logs,
        ]);
    }

    /**
     * Mengubah status visibilitas progress log (Bagikan ke Klien / Sembunyikan).
     */
    public function toggleVisibility(Request $request, ProgressLog $progressLog): JsonResponse
    {
        $validated = $request->validate([
            'is_visible_to_client' => ['required', 'boolean'],
        ]);

        $progressLog->update([
            'is_visible_to_client' => $validated['is_visible_to_client'],
        ]);

        return response()->json([
            'message' => $validated['is_visible_to_client']
                ? 'Progress berhasil dibagikan ke Klien.'
                : 'Progress berhasil disembunyikan dari Klien.',
            'log' => $progressLog->fresh(),
        ]);
    }
}