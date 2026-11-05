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

        // Data paket tanpa foto
        $packageData = [
            'package_name' => $validated['package_name'],
            'description' => $validated['description'],
            'price' => $validated['price'],
        ];

        // Upload foto utama
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

            // Foto utama baru
            'image' => ['nullable', 'image', 'max:2048'],

            // Foto tambahan baru
            'images' => ['nullable', 'array'],
            'images.*' => ['image', 'max:2048'],

            // ID foto lama yang ingin dipertahankan
            'keep_images' => ['nullable', 'array'],
            'keep_images.*' => ['integer'],
            'remove_main_image' => ['nullable', 'boolean'],
        ]);

        // Update informasi paket
        $vendorPackage->update([
            'package_name' => $validated['package_name'],
            'description' => $validated['description'],
            'price' => $validated['price'],
        ]);

        // Daftar ID foto tambahan yang dipertahankan
        $keepImageIds = $validated['keep_images'] ?? [];

        // Ambil foto tambahan yang tidak dipertahankan
        $oldImages = $vendorPackage->images()
            ->whereNotIn('id', $keepImageIds)
            ->get();

        // Hapus foto yang tidak dipertahankan
        foreach ($oldImages as $oldImage) {
            if ($oldImage->image_public_id) {
                \Cloudinary::config();

                \Cloudinary\Uploader::destroy(
                    $oldImage->image_public_id
                );
            }

            $oldImage->delete();
        }

        // Hapus foto utama jika vendor memilih untuk menghapusnya
        if ($request->boolean('remove_main_image') && ! $request->hasFile('image')) {
            if ($vendorPackage->image_public_id) {
                \Cloudinary::config();

                \Cloudinary\Uploader::destroy(
                    $vendorPackage->image_public_id
                );
            }

            $vendorPackage->update([
                'image_url' => null,
                'image_public_id' => null,
            ]);
        }
        
        // Ganti foto utama hanya jika ada foto baru
        if ($request->hasFile('image')) {
            if ($vendorPackage->image_public_id) {
                \Cloudinary::config();

                \Cloudinary\Uploader::destroy(
                    $vendorPackage->image_public_id
                );
            }

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

        // Tambahkan foto baru tanpa menghapus foto lama
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