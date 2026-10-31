<?php

namespace App\Http\Resources;

use App\Models\VendorPackage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin VendorPackage
 */
class VendorPackageResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $price = (float) $this->price;

        return [
            'id' => $this->id,
            'vendor_id' => $this->vendor_id,
            'name' => $this->package_name,
            'slug' => $this->slug,
            'description' => $this->description,
            'price' => $price,
            'price_formatted' => 'Rp '.number_format($price, 0, ',', '.'),
            'image' => $this->image_url,
            'is_active' => (bool) $this->is_active,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
