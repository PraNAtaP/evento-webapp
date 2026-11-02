<?php

namespace App\Http\Resources;

use App\Models\EventVendorAssignment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Satu vendor+paket pada sebuah event (baris event_vendor_assignments) untuk Board Inspector.
 *
 * @mixin EventVendorAssignment
 */
class EventVendorResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $category = trim((string) $this->vendor?->category);

        return [
            'id' => $this->id,
            'vendor_id' => $this->vendor_id,
            'business_name' => $this->vendor?->business_name,
            'category' => $category !== '' ? $category : null,
            'package_name' => $this->package_name,
            'package_price' => $this->package_price !== null ? (float) $this->package_price : null,
            'price' => (float) $this->locked_price,
            'notes' => $this->notes,
            'offer_status' => $this->eo_offer_status,
            'rejection_reason' => $this->rejection_reason,
        ];
    }
}
