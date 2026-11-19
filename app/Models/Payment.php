<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'event_id',
    'payment_type',
    'nominal',
    'invoice_number',
    'receipt_number',
    'due_date',
    'status',
    'payment_proof_url',
    'rejection_note',
    'verified_by',
    'verified_at',
])]
class Payment extends Model
{
    use HasFactory;

    /**
     * Bootstrap model events.
     */
    protected static function booted(): void
    {
        static::creating(function (Payment $payment) {
            if (empty($payment->invoice_number)) {
                $typeCode = $payment->payment_type === 'dp' ? 'DP' : 'PEL';
                $ym = date('Ym');
                // Unique invoice code placeholder based on microtime/random, will be formatted nicely
                $payment->invoice_number = sprintf('INV/EVN/%s/%04d-%s', $ym, rand(1000, 9999), $typeCode);
            }
        });

        static::created(function (Payment $payment) {
            // Update to definitive ID once saved
            $typeCode = $payment->payment_type === 'dp' ? 'DP' : 'PEL';
            $ym = $payment->created_at ? $payment->created_at->format('Ym') : date('Ym');
            $definitive = sprintf('INV/EVN/%s/%04d-%s', $ym, $payment->id, $typeCode);
            if ($payment->invoice_number !== $definitive) {
                $payment->withoutEvents(fn () => $payment->update(['invoice_number' => $definitive]));
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
            'nominal' => 'decimal:2',
            'verified_at' => 'datetime',
            'due_date' => 'date',
        ];
    }

    /**
     * Accessor invoice_number dengan fallback dinamis.
     */
    public function getInvoiceNumberAttribute(?string $value): string
    {
        if (! empty($value)) {
            return $value;
        }

        $typeCode = $this->payment_type === 'dp' ? 'DP' : 'PEL';
        $ym = $this->created_at ? $this->created_at->format('Ym') : date('Ym');

        return sprintf('INV/EVN/%s/%04d-%s', $ym, $this->id, $typeCode);
    }

    /**
     * Accessor receipt_number dengan fallback dinamis saat status paid.
     */
    public function getReceiptNumberAttribute(?string $value): ?string
    {
        if (! empty($value)) {
            return $value;
        }

        if ($this->status !== 'paid') {
            return null;
        }

        $typeCode = $this->payment_type === 'dp' ? 'DP' : 'PEL';
        $ym = $this->verified_at ? $this->verified_at->format('Ym') : date('Ym');

        return sprintf('RCP/EVN/%s/%04d-%s', $ym, $this->id, $typeCode);
    }

    /**
     * Get the event for this payment.
     *
     * @return BelongsTo<Event, $this>
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * Get the user who verified this payment.
     *
     * @return BelongsTo<User, $this>
     */
    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
