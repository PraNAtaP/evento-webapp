<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EventVendorAssignment;
use App\Services\AdminNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VendorJobController extends Controller
{
    /**
     * Menampilkan tawaran pekerjaan untuk vendor yang sedang login.
     */
    public function index(Request $request): JsonResponse
    {
        $vendor = $request->user()->vendor;

        if (! $vendor) {
            return response()->json([
                'message' => 'Profil vendor tidak ditemukan.',
            ], 404);
        }

        $jobOffers = EventVendorAssignment::with([
            'event',
            'package',
        ])
            ->where('vendor_id', $vendor->id)
            ->where('eo_offer_status', 'pending')
            ->whereHas('event', function ($q) {
                $q->whereNotIn('kanban_status', ['cancelled', 'rejected', 'done']);
            })
            ->latest()
            ->get();

        return response()->json([
            'data' => $jobOffers,
        ]);
    }

    /**
     * Menerima atau menolak tawaran pekerjaan.
     */
    public function respond(
        Request $request,
        EventVendorAssignment $assignment
    ): JsonResponse {
        $vendor = $request->user()->vendor;

        if (! $vendor) {
            return response()->json([
                'message' => 'Profil vendor tidak ditemukan.',
            ], 404);
        }

        // Memastikan tawaran merupakan milik vendor yang sedang login.
        if ($assignment->vendor_id !== $vendor->id) {
            return response()->json([
                'message' => 'Tawaran pekerjaan tidak ditemukan.',
            ], 404);
        }

        // Tawaran yang sudah direspons tidak bisa direspons ulang.
        if ($assignment->eo_offer_status !== 'pending') {
            return response()->json([
                'message' => 'Tawaran pekerjaan sudah direspons.',
            ], 422);
        }

        // Acara yang sudah dibatalkan, ditolak, atau selesai tidak dapat direspons.
        if (in_array($assignment->event->kanban_status, ['cancelled', 'rejected', 'done'], true)) {
            return response()->json([
                'message' => 'Tidak dapat merespons tawaran untuk acara yang sudah dibatalkan, ditolak, atau selesai.',
            ], 422);
        }

        // Memvalidasi respons vendor.
        $validated = $request->validate([
            'status' => ['required', 'in:accepted,rejected'],
            'rejection_reason' => [
                'required_if:status,rejected',
                'nullable',
                'string',
                'max:1000',
            ],
        ]);

        // Menyimpan status dan alasan penolakan.
        $assignment->eo_offer_status = $validated['status'];

        $assignment->rejection_reason =
            $validated['status'] === 'rejected'
                ? $validated['rejection_reason']
                : null;

        $assignment->save();

        $assignment->load('event');
        $statusText = $validated['status'] === 'accepted' ? 'menerima' : 'menolak';
        AdminNotificationService::notifyAdmins(
            title: 'Respon Tawaran Pekerjaan Vendor',
            message: "Vendor {$vendor->business_name} telah {$statusText} tawaran pekerjaan untuk acara '{$assignment->event->title}'.",
            category: 'vendor',
            actionUrl: '/admin/kanban',
            metadata: ['assignment_id' => $assignment->id, 'event_id' => $assignment->event_id, 'status' => $validated['status']]
        );

        return response()->json([
            'message' => $validated['status'] === 'accepted'
                ? 'Tawaran pekerjaan berhasil diterima.'
                : 'Tawaran pekerjaan berhasil ditolak.',
            'data' => $assignment,
        ]);
    }
}
