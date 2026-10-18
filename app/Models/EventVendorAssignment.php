<?php

namespace App\Models;

use Database\Factories\EventVendorAssignmentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Catatan: `locked_price` (harga untuk acara ini) tidak dapat diedit setelah baris dibuat.
 * Untuk mengubahnya, hapus baris lalu tambahkan ulang.
 * `notes` dan `package_price` hanya untuk EO sehingga disembunyikan dari serialisasi JSON
 * ke vendor dan klien.
 */
#[Fillable([
    'event_id',
    'vendor_id',
    'package_id',
    'package_name',
    'package_price',
    'eo_offer_status',
    'client_approval',
    'locked_price',
    'notes',
    'rejection_reason',
])]
#[Hidden(['notes', 'package_price'])]
class EventVendorAssignment extends Model
{
    /** @use HasFactory<EventVendorAssignmentFactory> */
    use HasFactory;

    /**
     * Bootstrap the model and its traits.
     */
    protected static function booted(): void
    {
        static::creating(function (EventVendorAssignment $assignment) {
            $needsPackage = $assignment->package_id
                && ($assignment->locked_price === null
                    || $assignment->package_name === null
                    || $assignment->package_price === null);

            if ($needsPackage) {
                $package = $assignment->package ?? VendorPackage::find($assignment->package_id);
                if ($package) {
                    $assignment->locked_price ??= $package->price;
                    $assignment->package_name ??= $package->package_name;
                    $assignment->package_price ??= $package->price;
                }
            }
        });
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'locked_price' => 'decimal:2',
            'package_price' => 'decimal:2',
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
