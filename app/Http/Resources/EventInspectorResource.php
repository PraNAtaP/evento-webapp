<?php

namespace App\Http\Resources;

use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Representasi read-only sebuah event untuk panel Board Inspector.
 *
 * @mixin Event
 */
class EventInspectorResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'event_name' => $this->event_name,
            'category' => $this->category,
            'client_name' => $this->client?->name,
            'event_date' => $this->event_date?->format('Y-m-d'),
            'end_date' => $this->end_date?->format('Y-m-d'),
            'is_multi_day' => (bool) $this->is_multi_day,
            'has_own_venue' => (bool) $this->has_own_venue,
            'venue' => $this->venue,
            'lat' => $this->lat !== null ? (float) $this->lat : null,
            'lng' => $this->lng !== null ? (float) $this->lng : null,
            'guest_count' => $this->guest_count,
            'estimated_budget' => $this->estimated_budget !== null ? (float) $this->estimated_budget : null,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'show_vendor_section' => $this->showsVendorSection(),
            'can_manage_vendors' => $this->canManageVendors(),
            'can_send_quotation' => $this->canSendQuotation(),
            'send_quotation_blockers' => $this->quotationBlockers(),
            'dp_percentage' => $this->dp_percentage !== null ? (float) $this->dp_percentage : 30.0,
            'vendors' => EventVendorResource::collection($this->whenLoaded('vendorAssignments', default: [])),
            // Predikat sama dengan Event::quotation_total: baris yang ditolak vendor tidak dihitung.
            'vendors_total' => round(
                $this->relationLoaded('vendorAssignments')
                    ? $this->vendorAssignments
                        ->where('eo_offer_status', '!=', 'rejected')
                        ->sum(fn ($assignment) => (float) $assignment->locked_price)
                    : 0.0,
                2
            ),
        ];
    }
}
