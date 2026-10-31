<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\EventVendorAssignment;
use App\Models\VendorPackage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EventVendorAssignment>
 */
class EventVendorAssignmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * vendor_id, package_name, package_price, dan locked_price diturunkan dari paket
     * (kecuali locked_price diisi eksplisit).
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'event_id' => Event::factory()->draftingQuotation(),
            'package_id' => VendorPackage::factory(),
            'eo_offer_status' => 'pending',
            'client_approval' => 'pending',
        ];
    }

    public function configure(): static
    {
        return $this->afterMaking(function (EventVendorAssignment $assignment) {
            $package = VendorPackage::find($assignment->package_id);

            if ($package) {
                $assignment->vendor_id ??= $package->vendor_id;
            }
        });
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => ['eo_offer_status' => 'pending']);
    }

    public function accepted(): static
    {
        return $this->state(fn (array $attributes) => ['eo_offer_status' => 'accepted']);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'eo_offer_status' => 'rejected',
            'rejection_reason' => 'Jadwal bentrok',
        ]);
    }
}
