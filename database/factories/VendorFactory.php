<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;

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
        return [
            'user_id' => User::factory()->vendor(),
            'business_name' => fake()->company(),
            'category' => fake()->randomElement(['Catering', 'Decoration', 'Photography']),
            'contact_number' => fake()->numerify('08##########'),
            'address' => fake()->address(),
            'image_url' => null,
        ];
    }

    public function inCategory(?string $category): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => $category ?? '',
        ]);
    }
}
