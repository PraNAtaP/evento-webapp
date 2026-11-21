<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\Review;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Database\Seeder;

class ReviewSeeder extends Seeder
{
    /**
     * Mengisi data ulasan dan penilaian bintang (rating 1-5) realistis untuk vendor dan EO.
     */
    public function run(): void
    {
        $clients = User::where('role', 'client')->get();
        if ($clients->isEmpty()) {
            $clients = collect([
                User::factory()->create([
                    'name' => 'Ratna Sari',
                    'email' => 'ratna.review@evento.test',
                    'role' => 'client',
                ]),
                User::factory()->create([
                    'name' => 'Dimas Anggara',
                    'email' => 'dimas.review@evento.test',
                    'role' => 'client',
                ]),
            ]);
        }

        $event = Event::where('kanban_status', 'completed')
            ->orWhereNotNull('completed_at')
            ->first();

        if (! $event) {
            $client = $clients->first();
            $event = Event::create([
                'client_id' => $client->id,
                'event_name' => 'Resepsi Pernikahan Ananda & Rizky',
                'category' => 'wedding',
                'guest_count' => 500,
                'estimated_budget' => 85000000,
                'agreed_price' => 85000000,
                'event_date' => now()->subMonths(2)->format('Y-m-d'),
                'kanban_status' => 'completed',
                'completed_at' => now()->subMonths(2),
            ]);
        }

        $vendors = Vendor::where('status', Vendor::STATUS_APPROVED)->get();

        $sampleComments = [
            'Decoration' => [
                ['rating' => 5, 'comment' => 'Dekorasi pelaminan dan photobooth luar biasa megah! Bunga segar dan pencahayaannya persis seperti moodboard impian kami.'],
                ['rating' => 5, 'comment' => 'Detail panggung dan lorong masuk sangat rapi. Tim dekorasi bekerja cepat dan profesional.'],
                ['rating' => 4, 'comment' => 'Secara keseluruhan sangat bagus dan cantik, tamu-tamu banyak yang memuji dekorasi pelaminannya.'],
            ],
            'Catering' => [
                ['rating' => 5, 'comment' => 'Makanan luar biasa enak! Seluruh tamu memuji rasa daging rendang dan olahan salmonnya. Porsi sangat berlimpah.'],
                ['rating' => 5, 'comment' => 'Penyajian makanan sangat higienis, staf pramusaji cepat tanggap membersihkan piring kotor.'],
                ['rating' => 4, 'comment' => 'Dessert dan es buahnya juara, variasi menu nusantara pas untuk lidah keluarga besar.'],
            ],
            'Photography' => [
                ['rating' => 5, 'comment' => 'Hasil foto dan video cinematic sangat memukau! Fotografer sangat sabar dan mengarahkan pose dengan luwes.'],
                ['rating' => 5, 'comment' => 'Pengeditan foto selesai tepat waktu dengan tone warna warm estetik. Sangat recommended!'],
                ['rating' => 5, 'comment' => 'Momen-momen sakral dan emosional tertangkap kamera dengan sangat apik.'],
            ],
            'Videography' => [
                ['rating' => 5, 'comment' => 'Video teaser same day edit (SDE) diputar saat resepsi bikin semua tamu terharu. Kualitas 4K jernih!'],
                ['rating' => 4, 'comment' => 'Angle pengambilan gambar dinamis dan sinematik seperti film bioskop.'],
            ],
            'Venue' => [
                ['rating' => 5, 'comment' => 'Ballroom sangat megah, AC dingin, fasilitas kamar ganti pengantin dan toilet sangat bersih terawat.'],
                ['rating' => 5, 'comment' => 'Parkiran luas dan akses lokasi sangat mudah dijangkau dari tol. Staf venue sangat kooperatif.'],
            ],
            'Sound' => [
                ['rating' => 5, 'comment' => 'Tata suara akustik jernih tanpa ada feedback mendengung sama sekali. Band pengiring tampil memukau.'],
                ['rating' => 4, 'comment' => 'Lighting panggung sinkron dengan musik. Suasana pesta jadi semakin hidup.'],
            ],
            'Entertainment' => [
                ['rating' => 5, 'comment' => 'MC sangat interaktif dan pandai mencairkan suasana. Tamu tidak ada yang bosan selama acara.'],
                ['rating' => 5, 'comment' => 'Pilihan lagu yang dibawakan sangat pas dengan tema intimate wedding kami.'],
            ],
            'Makeup' => [
                ['rating' => 5, 'comment' => 'Riasan makeup tahan seharian tanpa luntur atau crack. Hasilnya flawless dan manglingi!'],
                ['rating' => 5, 'comment' => 'Pilihan busana adat sangat mewah dan terawat rapi. Sangat puas dengan pelayanannya.'],
            ],
        ];

        $defaultComments = [
            ['rating' => 5, 'comment' => 'Pelayanan sangat memuaskan, komunikatif, dan hasil kerja melampaui ekspektasi!'],
            ['rating' => 5, 'comment' => 'Sangat profesional dan tepat waktu. Kerja sama yang luar biasa untuk acara kami.'],
            ['rating' => 4, 'comment' => 'Kualitas layanan bagus dan tim sangat kooperatif dalam merespons permintaan revisi.'],
        ];

        foreach ($vendors as $vendor) {
            $catKey = $vendor->category ?: 'General';
            $reviewsPool = $sampleComments[$catKey] ?? $defaultComments;

            foreach ($reviewsPool as $idx => $sample) {
                $client = $clients[$idx % $clients->count()];

                Review::updateOrCreate(
                    [
                        'event_id' => $event->id,
                        'client_id' => $client->id,
                        'vendor_id' => $vendor->id,
                        'reviewee_type' => 'vendor',
                    ],
                    [
                        'rating' => $sample['rating'],
                        'comment' => $sample['comment'],
                        'created_at' => now()->subDays(rand(5, 120)),
                        'updated_at' => now(),
                    ]
                );
            }
        }

        // Tambahkan juga ulasan untuk EO
        Review::updateOrCreate(
            [
                'event_id' => $event->id,
                'client_id' => $clients->first()->id,
                'vendor_id' => null,
                'reviewee_type' => 'eo',
            ],
            [
                'rating' => 5,
                'comment' => 'Tim EO EVENTO sangat profesional dan tenang mengelola rundown. Kami sebagai tuan rumah bisa menikmati acara tanpa pusing memikirkan teknis!',
                'created_at' => now()->subMonths(1),
                'updated_at' => now(),
            ]
        );
    }
}
