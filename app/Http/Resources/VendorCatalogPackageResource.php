<?php

namespace App\Http\Resources;

use App\Models\VendorPackage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Paket milik vendor pada katalog. Tidak pernah memetakan image_public_id.
 *
 * Atribut `is_attached` diisi controller (paket sudah terpasang di event yang dibuka).
 *
 * @mixin VendorPackage
 */
class VendorCatalogPackageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'package_name' => $this->package_name,
            'description' => $this->description,
            'price' => (float) $this->price,
            'image_url' => $this->image_url,
            'is_attached' => (bool) ($this->is_attached ?? false),
        ];
    }
}
