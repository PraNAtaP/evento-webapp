<?php

namespace App\Models;

use Database\Factories\EventFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    /** @use HasFactory<EventFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'client_id',
        'event_name',
        'category',
        'guest_count',
        'estimated_budget',
        'agreed_price',
        'dp_percentage',
        'budget',
        'has_own_venue',
        'venue',
        'lat',
        'lng',
        'event_date',
        'is_multi_day',
        'end_date',
        'kanban_status',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = [
        'budget',
        'status',
        'quotation_total',
        'paid_amount',
        'paid_percentage',
        'payment_badge',
    ];

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
            'estimated_budget' => 'decimal:2',
            'agreed_price' => 'decimal:2',
            'dp_percentage' => 'decimal:2',
            'lat' => 'float',
            'lng' => 'float',
        ];
    }

    /**
     * Alias atribut status untuk kompatibilitas ke kanban_status.
     */
    protected function status(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->kanban_status,
            set: fn ($value) => ['kanban_status' => $value]
        );
    }

    /**
     * Alias atribut budget untuk kompatibilitas ke estimated_budget.
     */
    protected function budget(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->estimated_budget,
            set: fn ($value) => ['estimated_budget' => $value]
        );
    }

    /**
     * Accessor: Total penawaran dari vendor assignments aktif (tidak rejected).
     */
    public function getQuotationTotalAttribute(): float
    {
        return (float) $this->vendorAssignments()
            ->where('eo_offer_status', '!=', 'rejected')
            ->sum('locked_price');
    }

    /**
     * Accessor: Total nominal pembayaran yang berstatus 'paid'.
     */
    public function getPaidAmountAttribute(): float
    {
        return (float) $this->payments()
            ->where('status', 'paid')
            ->sum('nominal');
    }

    /**
     * Accessor: Persentase pembayaran terhadap agreed_price.
     */
    public function getPaidPercentageAttribute(): int
    {
        $agreed = (float) ($this->agreed_price ?? 0);

        if ($agreed <= 0) {
            return 0;
        }

        return (int) round(($this->paid_amount / $agreed) * 100);
    }

    /**
     * Accessor: Label dan styling badge pembayaran.
     *
     * @return array{label: string, percentage: int, badge_class: string}
     */
    public function getPaymentBadgeAttribute(): array
    {
        $percentage = $this->paid_percentage;
        $paid = $this->paid_amount;
        $agreed = (float) ($this->agreed_price ?? 0);

        if ($paid <= 0) {
            return [
                'label' => 'Belum Bayar',
                'percentage' => 0,
                'badge_class' => 'bg-rose-50 text-rose-700 border-rose-200',
            ];
        }

        if ($percentage >= 100 || ($agreed > 0 && $paid >= $agreed)) {
            return [
                'label' => 'Lunas (100%)',
                'percentage' => 100,
                'badge_class' => 'bg-emerald-50 text-emerald-700 border-emerald-200',
            ];
        }

        if ($percentage <= 50) {
            return [
                'label' => "DP Lunas ({$percentage}%)",
                'percentage' => $percentage,
                'badge_class' => 'bg-blue-50 text-blue-700 border-blue-200',
            ];
        }

        return [
            'label' => "Termin ({$percentage}%)",
            'percentage' => $percentage,
            'badge_class' => 'bg-indigo-50 text-indigo-700 border-indigo-200',
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
