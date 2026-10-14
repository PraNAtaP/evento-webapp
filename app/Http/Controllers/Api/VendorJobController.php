<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EventVendorAssignment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

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

        return response()->json([
            'message' => $validated['status'] === 'accepted'
                ? 'Tawaran pekerjaan berhasil diterima.'
                : 'Tawaran pekerjaan berhasil ditolak.',
            'data' => $assignment,
        ]);
    }
}