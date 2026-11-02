<?php

namespace Database\Factories;

use App\Models\Vendor;
use App\Models\VendorPackage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<VendorPackage>
 */
class VendorPackageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'vendor_id' => Vendor::factory(),
            'package_name' => 'Paket '.fake()->word(),
            'description' => fake()->sentence(),
            'price' => fake()->numberBetween(5, 100) * 1000000,
            'image_url' => null,
            'image_public_id' => null,
        ];
    }

    /**
     * Paket dengan foto utama (membawa image_public_id untuk menguji agar tidak bocor).
     */
    public function withImage(): static
    {
        return $this->state(fn (array $attributes) => [
            'image_url' => 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            'image_public_id' => 'evento/packages/rahasia-'.fake()->unique()->numerify('####'),
        ]);
    }
}
