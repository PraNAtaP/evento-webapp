<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\VendorPackageResource;
use App\Http\Resources\VendorResource;
use App\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VendorController extends Controller
{
    /**
     * Escape wildcard SQL LIKE.
     */
    private function escapeLike(string $value): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], mb_strtolower(trim($value)));
    }

    /**
     * Ambil daftar vendor aktif dan terverifikasi untuk Katalog Vendor.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Vendor::query()
            ->catalogActive()
            ->with('user:id,email')
            ->withCount([
                'packages as packages_count' => fn ($q) => $q->where('is_active', true),
            ]);

        // Filter Pencarian
        if ($request->filled('search')) {
            $escaped = $this->escapeLike($request->query('search'));
            $query->where(function ($q) use ($escaped) {
                $q->whereRaw("LOWER(business_name) LIKE ? ESCAPE '\\'", ["%{$escaped}%"])
                    ->orWhereRaw("LOWER(description) LIKE ? ESCAPE '\\'", ["%{$escaped}%"])
                    ->orWhereRaw("LOWER(category) LIKE ? ESCAPE '\\'", ["%{$escaped}%"]);
            });
        }

        // Filter Kategori
        if ($request->filled('category') && $request->query('category') !== 'all') {
            $category = mb_strtolower(trim($request->query('category')));
            $query->whereRaw('LOWER(TRIM(category)) = ?', [$category]);
        }

        $vendors = $query
            ->orderBy('business_name')
            ->orderBy('id')
            ->paginate(12)
            ->withQueryString();

        // Daftar kategori untuk filter frontend
        $categories = Vendor::query()
            ->catalogActive()
            ->whereNotNull('category')
            ->selectRaw('LOWER(TRIM(category)) as value, MIN(TRIM(category)) as label')
            ->groupByRaw('LOWER(TRIM(category))')
            ->orderBy('label')
            ->get()
            ->map(fn ($row) => [
                'value' => (string) $row->value,
                'label' => (string) $row->label,
            ])
            ->values();

        $resourceCollection = VendorResource::collection($vendors)->response()->getData(true);

        return response()->json([
            'data' => $resourceCollection['data'] ?? [],
            'links' => $resourceCollection['links'] ?? null,
            'meta' => $resourceCollection['meta'] ?? null,
            'categories' => $categories,
        ]);
    }

    /**
     * Detail vendor beserta daftar produk/paket aktif miliknya.
     */
    public function show(Request $request, string $slug): JsonResponse
    {
        $vendor = Vendor::query()
            ->catalogActive()
            ->with('user:id,email')
            ->withCount([
                'packages as packages_count' => fn ($q) => $q->where('is_active', true),
            ])
            ->where('slug', $slug)
            ->first();

        if (! $vendor) {
            abort(404, 'Vendor tidak ditemukan atau belum aktif.');
        }

        $packagesQuery = $vendor->packages()
            ->where('is_active', true);

        if ($request->filled('search')) {
            $escaped = $this->escapeLike($request->query('search'));
            $packagesQuery->where(function ($q) use ($escaped) {
                $q->whereRaw("LOWER(package_name) LIKE ? ESCAPE '\\'", ["%{$escaped}%"])
                    ->orWhereRaw("LOWER(description) LIKE ? ESCAPE '\\'", ["%{$escaped}%"]);
            });
        }

        $packages = $packagesQuery
            ->orderBy('package_name')
            ->orderBy('id')
            ->paginate(12)
            ->withQueryString();

        $packagesData = VendorPackageResource::collection($packages)->response()->getData(true);

        return response()->json([
            'vendor' => new VendorResource($vendor),
            'packages' => $packagesData['data'] ?? [],
            'links' => $packagesData['links'] ?? null,
            'meta' => $packagesData['meta'] ?? null,
        ]);
    }
}

