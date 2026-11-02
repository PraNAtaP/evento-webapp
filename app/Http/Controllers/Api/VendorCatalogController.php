<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\VendorCatalogPackageResource;
use App\Http\Resources\VendorCatalogResource;
use App\Models\Event;
use App\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class VendorCatalogController extends Controller
{
    /**
     * Nilai filter khusus untuk vendor tanpa kategori.
     */
    private const NO_CATEGORY = '__none__';

    /**
     * Katalog vendor (ringan, berpaginasi) untuk dipilih EO pada sebuah event.
     *
     * Catatan: tanpa pengecekan kepemilikan karena aplikasi diasumsikan memiliki satu EO;
     * middleware `role:eo` pada route sudah cukup.
     */
    public function index(Request $request, Event $event): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:50'],
            'per_page' => ['nullable', 'integer', 'between:1,50'],
        ]);

        $attachedPackageIds = $this->attachedPackageIds($event);

        $vendors = Vendor::query()
            ->select(['id', 'business_name', 'category', 'address', 'image_url'])
            ->withCount([
                'packages',
                'packages as attached_packages_count' => fn ($query) => $query->whereIn('id', $attachedPackageIds),
            ])
            ->when(filled($filters['search'] ?? null), function ($query) use ($filters) {
                $search = mb_strtolower(trim($filters['search']));
                $escaped = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search);
                $query->whereRaw("LOWER(business_name) LIKE ? ESCAPE '\\'", ['%'.$escaped.'%']);
            })
            ->when(filled($filters['category'] ?? null), function ($query) use ($filters) {
                $category = $filters['category'];
                if ($category === self::NO_CATEGORY) {
                    $query->whereRaw("TRIM(COALESCE(category, '')) = ''");

                    return;
                }

                $query->whereRaw('LOWER(TRIM(category)) = ?', [mb_strtolower(trim($category))]);
            })
            ->orderBy('business_name')
            ->orderBy('id')
            ->paginate($filters['per_page'] ?? 12);

        return VendorCatalogResource::collection($vendors)->additional([
            'categories' => $this->categoryOptions(),
        ]);
    }

    /**
     * Paket milik satu vendor, ditandai bila sudah terpasang di event yang dibuka.
     */
    public function packages(Event $event, Vendor $vendor): AnonymousResourceCollection
    {
        $attachedPackageIds = $this->attachedPackageIds($event);

        // Kolom dipilih eksplisit agar image_public_id tidak pernah ikut dimuat.
        $packages = $vendor->packages()
            ->select(['id', 'vendor_id', 'package_name', 'description', 'price', 'image_url'])
            ->orderBy('package_name')
            ->orderBy('id')
            ->get()
            ->each(fn ($package) => $package->setAttribute('is_attached', in_array($package->id, $attachedPackageIds, true)));

        return VendorCatalogPackageResource::collection($packages);
    }

    /**
     * @return array<int, int>
     */
    private function attachedPackageIds(Event $event): array
    {
        return $event->vendorAssignments()
            ->whereNotNull('package_id')
            ->pluck('package_id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    /**
     * Kategori diambil dari data (distinct, case-insensitive); tidak ada daftar tetap di kode.
     *
     * @return array<int, array{value: string, label: string}>
     */
    private function categoryOptions(): array
    {
        return Vendor::query()
            ->selectRaw('LOWER(TRIM(category)) as value, MIN(TRIM(category)) as label')
            ->groupByRaw('LOWER(TRIM(category))')
            ->orderBy('value')
            ->get()
            ->map(fn ($row) => (string) $row->value === ''
                ? ['value' => self::NO_CATEGORY, 'label' => 'Tanpa kategori']
                : ['value' => (string) $row->value, 'label' => (string) $row->label])
            ->sortBy(fn (array $option) => $option['value'] === self::NO_CATEGORY)
            ->values()
            ->all();
    }
}
