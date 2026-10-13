<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Event>
 */
class EventFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'client_id' => User::factory()->client(),
            'event_name' => fake()->sentence(3),
            'category' => fake()->randomElement(['wedding', 'seminar', 'birthday']),
            'guest_count' => fake()->numberBetween(50, 500),
            'estimated_budget' => fake()->randomFloat(2, 10000000, 100000000),
            'agreed_price' => null,
            'dp_percentage' => 30.00,
            'has_own_venue' => false,
            'venue' => null,
            'event_date' => fake()->unique()->dateTimeBetween('+3 months', '+1 year')->format('Y-m-d'),
            'is_multi_day' => false,
            'end_date' => null,
            'kanban_status' => 'request',
        ];
    }

    public function draftingQuotation(): static
    {
        return $this->state(fn (array $attributes) => [
            'kanban_status' => 'drafting_quotation',
        ]);
    }

    public function clientReview(): static
    {
        return $this->state(fn (array $attributes) => [
            'kanban_status' => 'client_review',
        ]);
    }

    public function awaitingDp(): static
    {
        return $this->state(fn (array $attributes) => [
            'kanban_status' => 'awaiting_dp',
            'agreed_price' => $attributes['estimated_budget'] ?? 50000000,
        ]);
    }

    /**
     * Backward-compatible state for dpPaid.
     */
    public function dpPaid(): static
    {
        return $this->awaitingDp();
    }

    public function onProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'kanban_status' => 'on_progress',
            'agreed_price' => $attributes['estimated_budget'] ?? 50000000,
        ]);
    }

    public function done(): static
    {
        return $this->state(fn (array $attributes) => [
            'kanban_status' => 'done',
            'agreed_price' => $attributes['estimated_budget'] ?? 50000000,
        ]);
    }
}
