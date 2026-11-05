<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Vendor>
 */
class VendorFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $businessName = fake()->company();

        return [
            'user_id' => User::factory()->vendor(),
            'business_name' => $businessName,
            'slug' => Str::slug($businessName).'-'.fake()->unique()->numerify('####'),
            'category' => fake()->randomElement(['Catering', 'Decoration', 'Photography']),
            'contact_number' => fake()->numerify('08##########'),
            'address' => fake()->address(),
            'image_url' => null,
            'status' => Vendor::STATUS_APPROVED,
            'is_active' => true,
        ];
    }

    public function inCategory(?string $category): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => $category ?? '',
        ]);
    }
}
