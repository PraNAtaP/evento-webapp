<?php

namespace App\Models;

use Database\Factories\VendorPackageFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

#[Fillable([
    'vendor_id',
    'package_name',
    'slug',
    'description',
    'price',
    'image_url',
    'image_public_id',
    'is_active',
])]
class VendorPackage extends Model
{
    /** @use HasFactory<VendorPackageFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (VendorPackage $package) {
            if (empty($package->slug) && ! empty($package->package_name)) {
                $base = Str::slug($package->package_name) ?: 'package';
                $slug = $base;
                $counter = 1;
                while (static::where('vendor_id', $package->vendor_id)->where('slug', $slug)->exists()) {
                    $slug = "{$base}-{$counter}";
                    $counter++;
                }
                $package->slug = $slug;
            }
        });
    }

    /**
     * Scope paket yang aktif.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get the vendor that owns the package.
     *
     * @return BelongsTo<Vendor, $this>
     */
    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    /**
     * Get assignments that use this package.
     *
     * @return HasMany<EventVendorAssignment, $this>
     */
    public function assignments(): HasMany
    {
        return $this->hasMany(EventVendorAssignment::class, 'package_id');
    }

    /**
     * Get additional images for this package.
     */
    public function images(): HasMany
    {
        return $this->hasMany(VendorPackageImage::class);
    }
}
