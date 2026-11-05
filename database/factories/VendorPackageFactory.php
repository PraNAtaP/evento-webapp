<?php

namespace Database\Factories;

use App\Models\Vendor;
use App\Models\VendorPackage;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

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
        $packageName = 'Paket '.fake()->word();

        return [
            'vendor_id' => Vendor::factory(),
            'package_name' => $packageName,
            'slug' => Str::slug($packageName).'-'.fake()->unique()->numerify('####'),
            'description' => fake()->sentence(),
            'price' => fake()->numberBetween(5, 100) * 1000000,
            'image_url' => null,
            'image_public_id' => null,
            'is_active' => true,
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
