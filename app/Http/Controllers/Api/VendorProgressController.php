<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EventVendorAssignment;
use App\Models\ProgressLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class VendorProgressController extends Controller
{
    /**
     * Menampilkan pekerjaan yang sudah diterima vendor.
     */
    public function index(Request $request): JsonResponse
    {
        $vendor = $request->user()->vendor;

        if (! $vendor) {
            return response()->json([
                'message' => 'Profil vendor tidak ditemukan.',
            ], 404);
        }

        $jobs = EventVendorAssignment::with([
            'event',
            'package',
            'progressLogs',
        ])
            ->where('vendor_id', $vendor->id)
            ->where('eo_offer_status', 'accepted')
            ->latest()
            ->get();

        return response()->json([
            'data' => $jobs,
        ]);
    }

    /**
     * Menyimpan catatan progres atau kesiapan vendor.
     */
    public function store(
        Request $request,
        EventVendorAssignment $assignment
    ): JsonResponse {
        $vendor = $request->user()->vendor;

        if (! $vendor) {
            return response()->json([
                'message' => 'Profil vendor tidak ditemukan.',
            ], 404);
        }

        // Memastikan pekerjaan milik vendor yang sedang login.
        if (
            $assignment->vendor_id !== $vendor->id ||
            $assignment->eo_offer_status !== 'accepted'
        ) {
            return response()->json([
                'message' => 'Pekerjaan aktif tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'note' => ['required', 'string', 'max:2000'],
        ]);

        $progressLog = ProgressLog::create([
            'assignment_id' => $assignment->id,
            'note' => $validated['note'],
        ]);

        return response()->json([
            'message' => 'Progress kesiapan berhasil diperbarui.',
            'data' => $progressLog,
        ], 201);
    }
}