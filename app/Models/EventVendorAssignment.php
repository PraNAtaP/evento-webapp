<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'event_id',
    'vendor_id',
    'package_id',
    'eo_offer_status',
    'client_approval',
    'locked_price',
])]
class EventVendorAssignment extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'locked_price' => 'decimal:2',
        ];
    }

    /**
     * Get the event associated with this assignment.
     *
     * @return BelongsTo<Event, $this>
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * Get the vendor assigned.
     *
     * @return BelongsTo<Vendor, $this>
     */
    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    /**
     * Get the vendor package assigned.
     *
     * @return BelongsTo<VendorPackage, $this>
     */
    public function package(): BelongsTo
    {
        return $this->belongsTo(VendorPackage::class, 'package_id');
    }

    /**
     * Get progress logs for this assignment.
     *
     * @return HasMany<ProgressLog, $this>
     */
    public function progressLogs(): HasMany
    {
        return $this->hasMany(ProgressLog::class, 'assignment_id');
    }
}
