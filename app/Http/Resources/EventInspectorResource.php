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
            'revision_note' => $this->revision_note,
            'revision_requested_at' => $this->revision_requested_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
