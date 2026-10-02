<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id',
    'business_name',
    'category',
    'contact_number',
    'address',
    'image_url',
])]
class Vendor extends Model
{
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
     * Get the packages owned by the vendor.
     *
     * @return HasMany<VendorPackage, $this>
     */
    public function packages(): HasMany
    {
        return $this->hasMany(VendorPackage::class);
    }
}