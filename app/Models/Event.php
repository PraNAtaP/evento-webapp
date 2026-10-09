<?php

namespace App\Models;

use Database\Factories\EventFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'client_id',
    'event_name',
    'category',
    'guest_count',
    'budget',
    'has_own_venue',
    'venue',
    'event_date',
    'is_multi_day',
    'end_date',
    'kanban_status',
])]
class Event extends Model
{
    /** @use HasFactory<EventFactory> */
    use HasFactory;

    /**
     * Aturan batas minimal hari pemesanan (Lead Time) per kategori:
     * - Wedding: Minimal H-60
     * - Seminar: Minimal H-30
     * - Birthday: Minimal H-14
     */
    public const CATEGORY_MIN_DAYS = [
        'wedding' => 60,
        'seminar' => 30,
        'birthday' => 14,
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'event_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
            'is_multi_day' => 'boolean',
            'has_own_venue' => 'boolean',
            'guest_count' => 'integer',
            'budget' => 'decimal:2',
        ];
    }

    /**
     * Helper untuk mendapatkan batas minimal hari booking berdasarkan kategori.
     */
    public static function getMinBookingDays(?string $category): int
    {
        return self::CATEGORY_MIN_DAYS[$category] ?? 0;
    }

    /**
     * Get the client (user) that owns the event.
     *
     * @return BelongsTo<User, $this>
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    /**
     * Get vendor assignments for this event.
     *
     * @return HasMany<EventVendorAssignment, $this>
     */
    public function vendorAssignments(): HasMany
    {
        return $this->hasMany(EventVendorAssignment::class);
    }

    /**
     * Get payments associated with this event.
     *
     * @return HasMany<Payment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
