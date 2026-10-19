<?php

namespace Database\Seeders;

use App\Models\EventCategory;
use Illuminate\Database\Seeder;

class EventCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Wedding',
                'slug' => 'wedding',
                'min_booking_days' => 60,
                'description' => 'Pernikahan indah dengan persiapan vendor yang matang.',
                'is_active' => true,
            ],
            [
                'name' => 'Seminar',
                'slug' => 'seminar',
                'min_booking_days' => 30,
                'description' => 'Seminar, workshop, konferensi bisnis atau pelatihan profesional.',
                'is_active' => true,
            ],
            [
                'name' => 'Birthday',
                'slug' => 'birthday',
                'min_booking_days' => 14,
                'description' => 'Perayaan ulang tahun pribadi, anak, sweet seventeen, atau korporat.',
                'is_active' => true,
            ],
        ];

        foreach ($categories as $category) {
            EventCategory::updateOrCreate(
                ['slug' => $category['slug']],
                $category
            );
        }
    }
}
