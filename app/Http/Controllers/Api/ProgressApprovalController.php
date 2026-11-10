<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProgressLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Requests\ToggleProgressVisibilityRequest;

class ProgressApprovalController extends Controller
{
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

    public function toggleVisibility(
        ToggleProgressVisibilityRequest $request,
        ProgressLog $progressLog
    ): JsonResponse {
        $progressLog->update([
            'is_visible_to_client' => $request->boolean('is_visible_to_client'),
        ]);

        return response()->json([
            'message' => $request->boolean('is_visible_to_client')
                ? 'Progress berhasil dibagikan ke Klien.'
                : 'Progress berhasil disembunyikan dari Klien.',
            'log' => $progressLog->fresh(),
        ]);
    }
}