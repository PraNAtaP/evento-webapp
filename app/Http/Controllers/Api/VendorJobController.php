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
}