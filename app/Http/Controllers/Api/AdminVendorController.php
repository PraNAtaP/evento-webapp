<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminVendorController extends Controller
{
    /**
     * List all vendors with their user, packages count, and approval status.
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status', 'all');
        $search = $request->query('search');

        $query = Vendor::with(['user:id,name,email', 'approver:id,name,email'])
            ->withCount('packages');

        if ($status && in_array($status, [Vendor::STATUS_PENDING, Vendor::STATUS_APPROVED, Vendor::STATUS_REJECTED])) {
            $query->where('status', $status);
        }

        if ($search) {
            $operator = DB::getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where(function ($q) use ($search, $operator) {
                $q->where('business_name', $operator, "%{$search}%")
                    ->orWhere('category', $operator, "%{$search}%")
                    ->orWhere('contact_number', $operator, "%{$search}%")
                    ->orWhere('address', $operator, "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search, $operator) {
                        $userQuery->where('name', $operator, "%{$search}%")
                            ->orWhere('email', $operator, "%{$search}%");
                    });
            });
        }

        $vendors = $query->latest()->get();

        // Summary counts for dashboard badges/tabs
        $summary = [
            'total' => Vendor::count(),
            'pending' => Vendor::where('status', Vendor::STATUS_PENDING)->count(),
            'approved' => Vendor::where('status', Vendor::STATUS_APPROVED)->count(),
            'rejected' => Vendor::where('status', Vendor::STATUS_REJECTED)->count(),
        ];

        return response()->json([
            'data' => $vendors,
            'summary' => $summary,
        ]);
    }

    /**
     * Show detail of a single vendor registration.
     */
    public function show(Vendor $vendor): JsonResponse
    {
        $vendor->load(['user:id,name,email', 'approver:id,name,email', 'packages.images']);

        return response()->json([
            'data' => $vendor,
        ]);
    }

    /**
     * Approve a vendor's registration.
     */
    public function approve(Request $request, Vendor $vendor): JsonResponse
    {
        $vendor->update([
            'status' => Vendor::STATUS_APPROVED,
            'approved_at' => now(),
            'approved_by' => $request->user()->id,
            'rejection_reason' => null,
        ]);

        $vendor->load(['user:id,name,email', 'approver:id,name,email']);

        return response()->json([
            'message' => "Pendaftaran vendor '{$vendor->business_name}' berhasil disetujui.",
            'data' => $vendor,
        ]);
    }

    /**
     * Reject a vendor's registration with reason.
     */
    public function reject(Request $request, Vendor $vendor): JsonResponse
    {
        $validated = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:1000'],
        ], [
            'rejection_reason.required' => 'Alasan penolakan pendaftaran vendor wajib disertakan.',
        ]);

        $vendor->update([
            'status' => Vendor::STATUS_REJECTED,
            'rejection_reason' => $validated['rejection_reason'],
            'approved_at' => null,
            'approved_by' => $request->user()->id,
        ]);

        $vendor->load(['user:id,name,email', 'approver:id,name,email']);

        return response()->json([
            'message' => "Pendaftaran vendor '{$vendor->business_name}' telah ditolak.",
            'data' => $vendor,
        ]);
    }
}
