<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VendorPackage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;


class VendorPackageController extends Controller
{
    /**
     * Display the vendor's packages.
     */
    public function index(Request $request): JsonResponse
    {
        $vendor = $request->user()->vendor;

        if (! $vendor) {
            return response()->json([
                'message' => 'Profil vendor tidak ditemukan.',
            ], 404);
        }

        $packages = VendorPackage::where('vendor_id', $vendor->id)
            ->latest()
            ->get();

        return response()->json([
            'data' => $packages,
        ]);
    }

    /**
     * Store a new package for the authenticated vendor.
     */
    public function store(Request $request): JsonResponse
    {
        $vendor = $request->user()->vendor;

        if (! $vendor) {
            return response()->json([
                'message' => 'Profil vendor tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'package_name' => ['required', 'string', 'max:150'],
            'description' => ['required', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'image' => ['nullable', 'image', 'max:2048'],
        ]);

        if ($request->hasFile('image')) {
            \Cloudinary::config();

            $upload = \Cloudinary\Uploader::upload(
                $request->file('image')->getRealPath(),
                [
                    'folder' => 'evento/packages',
                ]
            );

            $validated['image_url'] = $upload['secure_url'];
            $validated['image_public_id'] = $upload['public_id'];
        }

        unset($validated['image']);

        $package = $vendor->packages()->create($validated);

        return response()->json([
            'message' => 'Paket berhasil ditambahkan.',
            'data' => $package,
        ], 201);
    }

    /**
     * Update a package owned by the authenticated vendor.
     */
    public function update(Request $request, VendorPackage $vendorPackage): JsonResponse
    {
        $vendor = $request->user()->vendor;

        if (! $vendor) {
            return response()->json([
                'message' => 'Profil vendor tidak ditemukan.',
            ], 404);
        }

        if ($vendorPackage->vendor_id !== $vendor->id) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses ke paket ini.',
            ], 403);
        }

        $validated = $request->validate([
            'package_name' => ['required', 'string', 'max:150'],
            'description' => ['required', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
        ]);

        $vendorPackage->update($validated);

        return response()->json([
            'message' => 'Paket berhasil diperbarui.',
            'data' => $vendorPackage->fresh(),
        ]);
    }

    /**
     * Delete a package owned by the authenticated vendor.
     */
    public function destroy(Request $request, VendorPackage $vendorPackage): JsonResponse
    {
        $vendor = $request->user()->vendor;

        if (! $vendor) {
            return response()->json([
                'message' => 'Profil vendor tidak ditemukan.',
            ], 404);
        }

        if ($vendorPackage->vendor_id !== $vendor->id) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses ke paket ini.',
            ], 403);
        }

        $vendorPackage->delete();

        return response()->json([
            'message' => 'Paket berhasil dihapus.',
        ]);
    }
}