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
            'budget' => fake()->randomFloat(2, 10000000, 100000000),
            'has_own_venue' => false,
            'venue' => null,
            'event_date' => fake()->unique()->dateTimeBetween('+3 months', '+1 year')->format('Y-m-d'),
            'is_multi_day' => false,
            'end_date' => null,
            'kanban_status' => 'request',
        ];
    }

    /**
     * Indicate that the event is in dp_paid status.
     */
    public function dpPaid(): static
    {
        return $this->state(fn (array $attributes) => [
            'kanban_status' => 'dp_paid',
        ]);
    }

    /**
     * Indicate that the event is in on_progress status.
     */
    public function onProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'kanban_status' => 'on_progress',
        ]);
    }

    /**
     * Indicate that the event is in done status.
     */
    public function done(): static
    {
        return $this->state(fn (array $attributes) => [
            'kanban_status' => 'done',
        ]);
    }
}
