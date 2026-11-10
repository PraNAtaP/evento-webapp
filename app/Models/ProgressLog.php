<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'assignment_id',
    'note',
    'photo_url',
    'photo_public_id',
    'is_visible_to_client',
])]
class ProgressLog extends Model
{
    /**
     * Get the assignment that owns this progress log.
     *
     * @return BelongsTo<EventVendorAssignment, $this>
     */
    public function assignment(): BelongsTo
    {
        return $this->belongsTo(EventVendorAssignment::class, 'assignment_id');
    }
}