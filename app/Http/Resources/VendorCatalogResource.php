<?php

namespace App\Http\Resources;

use App\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Vendor pada katalog (payload ringan, tanpa daftar paket).
 *
 * @mixin Vendor
 */
class VendorCatalogResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $category = trim((string) $this->category);
        $attachedCount = (int) ($this->attached_packages_count ?? 0);

        return [
            'id' => $this->id,
            'business_name' => $this->business_name,
            'category' => $category !== '' ? $category : null,
            'address' => $this->address,
            'image_url' => $this->image_url,
            'packages_count' => (int) ($this->packages_count ?? 0),
            'attached_packages_count' => $attachedCount,
            'is_attached' => $attachedCount > 0,
        ];
    }
}
