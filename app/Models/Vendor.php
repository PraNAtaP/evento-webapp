<?php

namespace App\Models;

use Database\Factories\VendorFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

#[Fillable([
    'user_id',
    'business_name',
    'slug',
    'category',
    'contact_number',
    'address',
    'social_media',
    'description',
    'image_url',
    'status',
    'is_active',
    'rejection_reason',
    'agreement_accepted_at',
    'approved_at',
    'approved_by',
])]
class Vendor extends Model
{
    /** @use HasFactory<VendorFactory> */
    use HasFactory;

    public const STATUS_PENDING = 'pending';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'approved_at' => 'datetime',
            'agreement_accepted_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Vendor $vendor) {
            if (empty($vendor->slug) && ! empty($vendor->business_name)) {
                $base = Str::slug($vendor->business_name) ?: 'vendor';
                $slug = $base;
                $counter = 1;
                while (static::where('slug', $slug)->exists()) {
                    $slug = "{$base}-{$counter}";
                    $counter++;
                }
                $vendor->slug = $slug;
            }
        });
    }

    /**
     * Scope untuk vendor yang aktif dan sudah di-approve.
     */
    public function scopeCatalogActive($query)
    {
        return $query->where('is_active', true)->where('status', self::STATUS_APPROVED);
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isApproved(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }

    public function isRejected(): bool
    {
        return $this->status === self::STATUS_REJECTED;
    }

    /**
     * Get the user that owns the vendor profile.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the EO user who approved or reviewed this vendor.
     *
     * @return BelongsTo<User, $this>
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get the packages owned by the vendor.
     *
     * @return HasMany<VendorPackage, $this>
     */
    public function packages(): HasMany
    {
        return $this->hasMany(VendorPackage::class);
    }
}
