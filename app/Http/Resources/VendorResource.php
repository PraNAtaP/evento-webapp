<?php

namespace App\Http\Resources;

use App\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Vendor
 */
class VendorResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->business_name,
            'slug' => $this->slug,
            'logo' => $this->image_url,
            'category' => $this->category,
            'description' => $this->description,
            'phone' => $this->contact_number,
            'email' => $this->user?->email,
            'address' => $this->address,
            'is_active' => (bool) $this->is_active,
            'packages_count' => (int) ($this->packages_count ?? 0),
            'packages' => VendorPackageResource::collection($this->whenLoaded('packages')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}

