<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VendorPackage;
use App\Models\VendorPackageImage;
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
            ->with('images')
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

            // Foto utama
            'image' => ['nullable', 'image', 'max:2048'],

            // Foto tambahan
            'images' => ['nullable', 'array'],
            'images.*' => ['image', 'max:2048'],
        ]);

        // Buat data paket tanpa data foto
        $packageData = [
            'package_name' => $validated['package_name'],
            'description' => $validated['description'],
            'price' => $validated['price'],
        ];

        // Foto utama tetap menggunakan kolom yang sudah ada
        if ($request->hasFile('image')) {
            \Cloudinary::config();

            $upload = \Cloudinary\Uploader::upload(
                $request->file('image')->getRealPath(),
                [
                    'folder' => 'evento/packages',
                ]
            );

            $packageData['image_url'] = $upload['secure_url'];
            $packageData['image_public_id'] = $upload['public_id'];
        }

        // Simpan paket
        $package = $vendor->packages()->create($packageData);

        // Upload foto tambahan
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                \Cloudinary::config();

                $upload = \Cloudinary\Uploader::upload(
                    $image->getRealPath(),
                    [
                        'folder' => 'evento/packages',
                    ]
                );

                VendorPackageImage::create([
                    'vendor_package_id' => $package->id,
                    'image_url' => $upload['secure_url'],
                    'image_public_id' => $upload['public_id'],
                ]);
            }
        }

        return response()->json([
            'message' => 'Paket berhasil ditambahkan.',
            'data' => $package->load('images'),
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

            // Foto utama
            'image' => ['nullable', 'image', 'max:2048'],

            // Foto tambahan
            'images' => ['nullable', 'array'],
            'images.*' => ['image', 'max:2048'],
        ]);

        // Update data paket
        $vendorPackage->update([
            'package_name' => $validated['package_name'],
            'description' => $validated['description'],
            'price' => $validated['price'],
        ]);

        // Jika ada foto baru yang dipilih
        if ($request->hasFile('image') || $request->hasFile('images')) {

            // Hapus foto utama lama dari Cloudinary
            if ($vendorPackage->image_public_id) {
                \Cloudinary::config();

                \Cloudinary\Uploader::destroy(
                    $vendorPackage->image_public_id
                );
            }

            // Hapus foto tambahan lama dari Cloudinary
            foreach ($vendorPackage->images as $oldImage) {
                \Cloudinary::config();

                \Cloudinary\Uploader::destroy(
                    $oldImage->image_public_id
                );
            }

            // Hapus data foto tambahan lama dari database
            $vendorPackage->images()->delete();

            // Foto utama baru
            if ($request->hasFile('image')) {
                \Cloudinary::config();

                $upload = \Cloudinary\Uploader::upload(
                    $request->file('image')->getRealPath(),
                    [
                        'folder' => 'evento/packages',
                    ]
                );

                $vendorPackage->update([
                    'image_url' => $upload['secure_url'],
                    'image_public_id' => $upload['public_id'],
                ]);
            }

            // Foto tambahan baru
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $image) {
                    \Cloudinary::config();

                    $upload = \Cloudinary\Uploader::upload(
                        $image->getRealPath(),
                        [
                            'folder' => 'evento/packages',
                        ]
                    );

                    VendorPackageImage::create([
                        'vendor_package_id' => $vendorPackage->id,
                        'image_url' => $upload['secure_url'],
                        'image_public_id' => $upload['public_id'],
                    ]);
                }
            }
        }

        return response()->json([
            'message' => 'Paket berhasil diperbarui.',
            'data' => $vendorPackage->fresh()->load('images'),
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