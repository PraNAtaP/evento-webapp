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
                'description' => 'Pernikahan indah adat nusantara, internasional, maupun intimate modern.',
                'is_active' => true,
            ],
            [
                'name' => 'Seminar',
                'slug' => 'seminar',
                'min_booking_days' => 30,
                'description' => 'Seminar nasional, workshop, symposium bisnis, dan konferensi profesional.',
                'is_active' => true,
            ],
            [
                'name' => 'Birthday',
                'slug' => 'birthday',
                'min_booking_days' => 14,
                'description' => 'Perayaan ulang tahun pribadi, sweet seventeen, anak, dan pesta keluarga.',
                'is_active' => true,
            ],
            [
                'name' => 'Corporate Gathering',
                'slug' => 'corporate',
                'min_booking_days' => 21,
                'description' => 'Gala dinner tahunan, peresmian cabang, gathering karyawan, dan award night.',
                'is_active' => true,
            ],
            [
                'name' => 'Concert & Music Festival',
                'slug' => 'concert',
                'min_booking_days' => 45,
                'description' => 'Konser musik live, pertunjukan seni panggung, festival budaya, dan pentas musik.',
                'is_active' => true,
            ],
            [
                'name' => 'Exhibition & Expo',
                'slug' => 'exhibition',
                'min_booking_days' => 30,
                'description' => 'Pameran industri kreatif, bazar kuliner, expo properti, dan pameran multiproduk.',
                'is_active' => true,
            ],
            [
                'name' => 'Engagement & Sangjit',
                'slug' => 'engagement',
                'min_booking_days' => 30,
                'description' => 'Prosesi lamaran adat, upacara pertunangan intimate, dan tradisi sangjit keluarga.',
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
