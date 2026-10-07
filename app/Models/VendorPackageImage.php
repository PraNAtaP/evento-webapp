<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'vendor_package_id',
    'image_url',
    'image_public_id',
])]
class VendorPackageImage extends Model
{
    /**
     * Foto ini milik paket vendor.
     */
    public function vendorPackage(): BelongsTo
    {
        return $this->belongsTo(VendorPackage::class);
    }
}