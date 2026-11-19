<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorPackage;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class VendorCatalogSeeder extends Seeder
{
    /**
     * Data master 15 vendor realistis beserta paket layanan lengkap dan foto high-res.
     */
    public function run(): void
    {
        $defaultPassword = Hash::make('testing@123$');

        $catalog = [
            // 1. CATERING
            [
                'email' => 'vendor.aroma@evento.test',
                'name' => 'Chef Hendra Wijaya',
                'business_name' => 'Aroma Selera Catering',
                'category' => 'Catering',
                'contact_number' => '081234567801',
                'address' => 'Jl. Tebet Raya No. 42, Jakarta Selatan',
                'description' => 'Penyedia jasa katering profesional untuk pesta pernikahan, seminar nasional, dan perayaan keluarga dengan sertifikasi halal dan higienis.',
                'image_url' => 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&auto=format&fit=crop&q=80',
                'bank_name' => 'Bank Central Asia (BCA)',
                'bank_account_number' => '8830192847',
                'bank_account_holder' => 'PT Aroma Selera Nusantara',
                'status' => Vendor::STATUS_APPROVED,
                'packages' => [
                    [
                        'name' => 'Prasmanan Nusantara Deluxe (500 Pax)',
                        'price' => 37500000,
                        'description' => 'Menu lengkap 6 lauk utama khas nusantara, 2 dessert tradisional, aneka puding, dan es buah segar.',
                        'image_url' => 'https://images.unsplash.com/photo-1547573854-74d2a71d0826?w=800&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Prasmanan Modern Western (300 Pax)',
                        'price' => 28500000,
                        'description' => 'Roast beef sirloin, grilled chicken rosemary, pasta carbonara, caesar salad, dan chocolate mousse.',
                        'image_url' => 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Food Stall Kambing Guling (2 Ekor)',
                        'price' => 9000000,
                        'description' => 'Kambing guling muda empuk dengan lontong, bumbu kecap pedas, dan acar segar.',
                        'image_url' => 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Coffee Break & Pastry Set (100 Pax)',
                        'price' => 4500000,
                        'description' => 'Pilihan kopi arabika, teh herbal, serta 3 jenis kue asin dan 3 kue manis premium.',
                        'image_url' => 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Paket Nasi Kotak Eksklusif (150 Box)',
                        'price' => 6750000,
                        'description' => 'Nasi liwet komplit dengan ayam bakar madu, sambal goreng ati, tahu tempe, lalap, dan buah pisang.',
                        'image_url' => 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Stall Dessert & Gelato Bar (200 Porsi)',
                        'price' => 7000000,
                        'description' => 'Bar gelato 4 rasa impor dengan aneka topping renyah dan mini waffle hangat.',
                        'image_url' => 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=800&auto=format&fit=crop&q=80',
                    ],
                ],
            ],

            // 2. DECORATION
            [
                'email' => 'vendor.laksmana@evento.test',
                'name' => 'Raden Laksmana',
                'business_name' => 'Laksmana Pelaminan & Dekor',
                'category' => 'Decoration',
                'contact_number' => '081234567802',
                'address' => 'Jl. Kemang Timur No. 18, Jakarta Selatan',
                'description' => 'Spesialis dekorasi pelaminan adat nusantara, modern rustic, dan minimalis botanical dengan bunga segar berkualitas tinggi.',
                'image_url' => 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
                'bank_name' => 'Bank Mandiri',
                'bank_account_number' => '1370019283746',
                'bank_account_holder' => 'CV Laksmana Dekorasi Utama',
                'status' => Vendor::STATUS_APPROVED,
                'packages' => [
                    [
                        'name' => 'Dekorasi Pelaminan Rustic Botanical (8 Meter)',
                        'price' => 24000000,
                        'description' => 'Pelaminan nuansa kayu hangat, full fresh flowers mawar & krisan, standing flower, dan lampu warm-white fairy.',
                        'image_url' => 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Paket Dekorasi Akad Nikah / Intimate Stage',
                        'price' => 12500000,
                        'description' => 'Backdrop akad minimalis bunga segar, meja akad kaca, 6 kursi tiffany, dan karpet permadani.',
                        'image_url' => 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Gate Masuk & Lorong Bunga Fresh Flowers',
                        'price' => 7500000,
                        'description' => 'Gerbang selamat datang bunga lengkung mewah, karpet jalan tamu 20 meter, dan 4 tiang standing lamp.',
                        'image_url' => 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Photobooth 3D Tematik Custom',
                        'price' => 6000000,
                        'description' => 'Backdrop photobooth ukuran 3x3 meter lengkap dengan neon sign nama acara dan lighting sorot studio.',
                        'image_url' => 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800&auto=format&fit=crop&q=80',
                    ],
                ],
            ],

            // 3. PHOTOGRAPHY & VIDEOGRAPHY
            [
                'email' => 'vendor.lensa@evento.test',
                'name' => 'Christian Pratama',
                'business_name' => 'Lensa Visi Photography',
                'category' => 'Photography',
                'contact_number' => '081234567803',
                'address' => 'Jl. Senopati No. 55, Kebayoran Baru, Jakarta Selatan',
                'description' => 'Studio dokumentasi visual sinematik untuk pre-wedding, liputan hari H, serta video highlight 4K dengan pilot drone berlisensi.',
                'image_url' => 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&auto=format&fit=crop&q=80',
                'bank_name' => 'Bank Central Asia (BCA)',
                'bank_account_number' => '5271928371',
                'bank_account_holder' => 'Christian Pratama',
                'status' => Vendor::STATUS_APPROVED,
                'packages' => [
                    [
                        'name' => 'Wedding Day All-Day Cinematic (Foto & Video 4K)',
                        'price' => 16500000,
                        'description' => '2 Fotografer + 2 Videografer, liputan persiapan hingga resepsi, 1 video teaser 1 menit, 1 highlight 5 menit, dan album kolase mewah.',
                        'image_url' => 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Paket Dokumentasi Seminar & Acara Korporat',
                        'price' => 7500000,
                        'description' => '1 Fotografer + 1 Videografer liputan 8 jam kerja, 300+ foto high-res edit warna, dan video rangkuman event 3 menit.',
                        'image_url' => 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Cinematic Drone 4K Aerial Coverage',
                        'price' => 4500000,
                        'description' => 'Pengambilan gambar lanskap gedung, kerumunan tamu, dan visual outdoor sinematik dengan pilot bersertifikat.',
                        'image_url' => 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Instant Photobooth Unlimited (3 Jam)',
                        'price' => 5000000,
                        'description' => 'Mesin foto cetak instan berkecepatan tinggi, properti lucu, custom frame cetak, dan soft copy via QR code.',
                        'image_url' => 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&auto=format&fit=crop&q=80',
                    ],
                ],
            ],

            // 4. SOUND & LIGHTING
            [
                'email' => 'vendor.harmoni@evento.test',
                'name' => 'Bambang Irawan',
                'business_name' => 'Harmoni Sound & Lighting',
                'category' => 'Sound & Lighting',
                'contact_number' => '081234567804',
                'address' => 'Jl. Fatmawati Raya No. 102, Jakarta Selatan',
                'description' => 'Penyewaan sound system line-array profesional, tata cahaya moving head panggung, mic wireless UHF, dan genset hening.',
                'image_url' => 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
                'bank_name' => 'Bank Negara Indonesia (BNI)',
                'bank_account_number' => '0293847561',
                'bank_account_holder' => 'CV Harmoni Multimedia Audio',
                'status' => Vendor::STATUS_APPROVED,
                'packages' => [
                    [
                        'name' => 'Paket Sound System Gedung 10.000 Watt',
                        'price' => 12000000,
                        'description' => 'Sound line array 10.000W cocok untuk 500-1000 tamu, digital mixer 32 channel, 6 mic wireless, dan operator audio profesional.',
                        'image_url' => 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Tata Cahaya Panggung Lighting Moving Head & Par LED',
                        'price' => 8500000,
                        'description' => '8 unit Moving Beam 230W, 16 unit Par LED RGBW, 2 unit Follow Spot, dan DMX console lighting master.',
                        'image_url' => 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Paket Sound Akustik Intimate 5.000 Watt',
                        'price' => 6000000,
                        'description' => 'Sistem tata suara kompak jernih untuk intimate wedding, gathering cafe, atau resepsi semi outdoor.',
                        'image_url' => 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Genset Silent Power 60 KVA',
                        'price' => 5500000,
                        'description' => 'Cadangan daya listrik stabil super hening 10 jam operasional lengkap dengan solar dan teknisi standby.',
                        'image_url' => 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
                    ],
                ],
            ],

            // 5. MUA & BRIDAL ATTIRE
            [
                'email' => 'vendor.ayu@evento.test',
                'name' => 'Ayu Saraswati',
                'business_name' => 'Ayu Saraswati Bridal & MUA',
                'category' => 'MUA & Attire',
                'contact_number' => '081234567805',
                'address' => 'Jl. Panglima Polim No. 27, Jakarta Selatan',
                'description' => 'Make up artist berpengalaman untuk rias pengantin internasional, adat Jawa, Sunda, Minang, serta sewa kebaya dan jas bespoke.',
                'image_url' => 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&auto=format&fit=crop&q=80',
                'bank_name' => 'Bank Central Asia (BCA)',
                'bank_account_number' => '6040192831',
                'bank_account_holder' => 'Ayu Saraswati Wardhani',
                'status' => Vendor::STATUS_APPROVED,
                'packages' => [
                    [
                        'name' => 'Rias Pengantin Akad & Resepsi (Bride & Groom)',
                        'price' => 11000000,
                        'description' => 'Makeup flawless tahan 16 jam, hair-do/hijab-do, sewa 1 pasang busana akad nikah, dan 1 pasang busana resepsi mewah.',
                        'image_url' => 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Paket Makeup Keluarga Inti (4 Orang Ibu & Saudari)',
                        'price' => 4800000,
                        'description' => 'Makeup natural glam dan hairdo rapi untuk 2 orang ibu pengantin dan 2 orang pendamping/keluarga inti.',
                        'image_url' => 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Touch-up & Retouch Artist Standby Sepanjang Acara',
                        'price' => 2500000,
                        'description' => 'Pendampingan MUA profesional sepanjang sesi pemotretan dan pergantian busana acara hingga selesai.',
                        'image_url' => 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80',
                    ],
                ],
            ],

            // 6. ENTERTAINMENT & MUSIC
            [
                'email' => 'vendor.nada@evento.test',
                'name' => 'Bagus Wicaksono',
                'business_name' => 'Nada Estetika Entertainment',
                'category' => 'Entertainment',
                'contact_number' => '081234567806',
                'address' => 'Jl. Gandaria Tengah No. 12, Kebayoran Baru, Jakarta Selatan',
                'description' => 'Grup live band profesional, master of ceremony (MC) bilingual formal & non-formal, serta acoustic chamber berkelas.',
                'image_url' => 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80',
                'bank_name' => 'Bank Mandiri',
                'bank_account_number' => '1270098761234',
                'bank_account_holder' => 'Bagus Wicaksono',
                'status' => Vendor::STATUS_APPROVED,
                'packages' => [
                    [
                        'name' => 'Full Acoustic Band & 2 Vokalis (Top 40 & Pop)',
                        'price' => 8500000,
                        'description' => 'Vokal pria, vokal wanita, gitar akustik, keyboard, saxophone, dan cajon/mini drum untuk mengiringi jalannya acara 3-4 jam.',
                        'image_url' => 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Master of Ceremony (MC) Bilingual Profesional (ID/EN)',
                        'price' => 4500000,
                        'description' => 'Pemandu acara berpengalaman untuk protokoler pernikahan adat maupun seminar resmi korporat internasional.',
                        'image_url' => 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Mini Chamber Strings Ensemble (Kuartet Gesek)',
                        'price' => 7000000,
                        'description' => '2 Biola, 1 Cello, dan 1 Grand Piano elektrik membawakan aransemen lagu romantis klasik menyambut kedatangan tamu agung.',
                        'image_url' => 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
                    ],
                ],
            ],

            // 7. VENUE & BALLROOM
            [
                'email' => 'vendor.grandballroom@evento.test',
                'name' => 'Mega Puspitasari',
                'business_name' => 'Grand Wijaya Ballroom & Convention',
                'category' => 'Venue',
                'contact_number' => '081234567807',
                'address' => 'Jl. Gatot Subroto Kav. 38, Jakarta Pusat',
                'description' => 'Ballroom megah dengan kapasitas hingga 1.500 standing guests, karpet premium, ceiling tinggi 8 meter, dan akses parkir luas.',
                'image_url' => 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&auto=format&fit=crop&q=80',
                'bank_name' => 'Bank Central Asia (BCA)',
                'bank_account_number' => '7160192834',
                'bank_account_holder' => 'PT Graha Wijaya Megah',
                'status' => Vendor::STATUS_APPROVED,
                'packages' => [
                    [
                        'name' => 'Sewa Grand Ballroom Full Day (8 Jam)',
                        'price' => 45000000,
                        'description' => 'Penggunaan ballroom utama 1.000 m2, ruang VIP transit keluarga, 2 ruang makeup, daya listrik 30.000W, dan 10 jam loading panggung.',
                        'image_url' => 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Sewa Convention Hall Half Day (4 Jam Acara)',
                        'price' => 28000000,
                        'description' => 'Ideal untuk seminar bisnis, pameran produk, atau upacara wisuda dengan tata kursi teater hingga 600 kursi.',
                        'image_url' => 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&auto=format&fit=crop&q=80',
                    ],
                ],
            ],

            // 8. OUTDOOR VENUE
            [
                'email' => 'vendor.pinehill@evento.test',
                'name' => 'Dwi Handoko',
                'business_name' => 'Pinehill Outdoor Glasshouse',
                'category' => 'Venue',
                'contact_number' => '081234567808',
                'address' => 'Jl. Maribaya No. 88, Lembang, Bandung Barat',
                'description' => 'Venue pernikahan outdoor di tengah hutan pinus asri dengan bangunan glasshouse modern nan sejuk dan memukau.',
                'image_url' => 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800&auto=format&fit=crop&q=80',
                'bank_name' => 'Bank Central Asia (BCA)',
                'bank_account_number' => '2840192839',
                'bank_account_holder' => 'Dwi Handoko',
                'status' => Vendor::STATUS_APPROVED,
                'packages' => [
                    [
                        'name' => 'Sewa Area Pinus & Glasshouse Intimate (300 Pax)',
                        'price' => 32000000,
                        'description' => 'Area outdoor rindang, akses bangunan kaca untuk akad nikah, gazebo pesta kebun, dan pemandangan sunset menawan.',
                        'image_url' => 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800&auto=format&fit=crop&q=80',
                    ],
                ],
            ],

            // 9. LED & VISUAL SYSTEM
            [
                'email' => 'vendor.pratama@evento.test',
                'name' => 'Surya Pratama',
                'business_name' => 'Pratama Panggung & Visual LED',
                'category' => 'Visual LED',
                'contact_number' => '081234567809',
                'address' => 'Jl. Cikini Raya No. 64, Menteng, Jakarta Pusat',
                'description' => 'Rental videotron LED Screen P2.9 & P3.9 indoor/outdoor, panggung rigging konser, level panggung melamin, dan video switcher.',
                'image_url' => 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=80',
                'bank_name' => 'Bank Rakyat Indonesia (BRI)',
                'bank_account_number' => '034101009876501',
                'bank_account_holder' => 'Surya Pratama',
                'status' => Vendor::STATUS_APPROVED,
                'packages' => [
                    [
                        'name' => 'Videotron LED Screen Indoor P2.9 (Ukuran 3x5 Meter)',
                        'price' => 15000000,
                        'description' => 'Layar LED ultra HD pixel pitch 2.9mm, visual processor 4K, video switcher live camera, dan 2 kru operator standby.',
                        'image_url' => 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Paket Rigging Panggung Konser 10x8 Meter',
                        'price' => 18000000,
                        'description' => 'Konstruksi panggung kokoh bersertifikasi aman beban, atap canopy rigging, kain backdrop hitam, dan tangga akses samping.',
                        'image_url' => 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&auto=format&fit=crop&q=80',
                    ],
                ],
            ],

            // 10. SOUVENIR & INVITATION
            [
                'email' => 'vendor.kartika@evento.test',
                'name' => 'Kartika Sari',
                'business_name' => 'Kartika Invitation & Souvenir',
                'category' => 'Souvenir',
                'contact_number' => '081234567810',
                'address' => 'Jl. Barito II No. 15, Kebayoran Baru, Jakarta Selatan',
                'description' => 'Spesialis undangan pernikahan cetak hard-cover foil emas, undangan website digital interaktif, dan aneka cinderamata bermanfaat.',
                'image_url' => 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80',
                'bank_name' => 'Bank Central Asia (BCA)',
                'bank_account_number' => '8030192841',
                'bank_account_holder' => 'Kartika Sari',
                'status' => Vendor::STATUS_APPROVED,
                'packages' => [
                    [
                        'name' => 'Paket Undangan Hardcover Emboss Foil (500 Pcs)',
                        'price' => 7500000,
                        'description' => 'Undangan tebal mewah dengan foil gold, amplop kalkir transparan berstempel lilin segel (wax seal), dan pita satin.',
                        'image_url' => 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Souvenir Tumbler Grafir Custom (500 Pcs)',
                        'price' => 12500000,
                        'description' => 'Tumbler stainless tahan panas/dingin dengan ukiran grafir laser nama mempelai serta kotak kemasan kardus eksklusif.',
                        'image_url' => 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
                    ],
                ],
            ],

            // 11. TENDA & RIGGING
            [
                'email' => 'vendor.cendana@evento.test',
                'name' => 'H. Cendana Gunawan',
                'business_name' => 'Cendana Tenda & Rigging',
                'category' => 'Decoration',
                'contact_number' => '081234567811',
                'address' => 'Jl. Raya Pasar Minggu No. 89, Jakarta Selatan',
                'description' => 'Persewaan tenda roder transparan, tenda dekorasi serut VIP, kipas blower misty fan, dan AC standing 5 PK.',
                'image_url' => 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&auto=format&fit=crop&q=80',
                'bank_name' => 'Bank Syariah Indonesia (BSI)',
                'bank_account_number' => '7192837461',
                'bank_account_holder' => 'H. Cendana Gunawan',
                'status' => Vendor::STATUS_APPROVED,
                'packages' => [
                    [
                        'name' => 'Tenda Roder Transparan VIP (Luas 200 m2)',
                        'price' => 20000000,
                        'description' => 'Tenda atap bening transparan memberikan pemandangan langit romantis lengkap dengan instalasi lampu fairy.',
                        'image_url' => 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Paket AC Standing 5 PK (4 Unit)',
                        'price' => 6000000,
                        'description' => 'Penyejuk udara dingin merata untuk kenyamanan tamu di dalam tenda selama 8 jam operasional.',
                        'image_url' => 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
                    ],
                ],
            ],

            // 12. VENDOR BARU DAFTAR (STATUS: PENDING - UNTUK TESTING VERIFIKASI ADMIN EO)
            [
                'email' => 'vendor.barudaftar@evento.test',
                'name' => 'Fajar Sidik',
                'business_name' => 'Surya Kencana Production',
                'category' => 'Sound & Lighting',
                'contact_number' => '081234567812',
                'address' => 'Jl. Daan Mogot KM 11, Jakarta Barat',
                'description' => 'Mitra baru penyedia rental lighting panggung dan genset ramah lingkungan siap melayani event Jabodetabek.',
                'image_url' => 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
                'bank_name' => 'Bank Central Asia (BCA)',
                'bank_account_number' => '8920192849',
                'bank_account_holder' => 'Fajar Sidik',
                'status' => Vendor::STATUS_PENDING, // Menunggu Verifikasi EO
                'packages' => [
                    [
                        'name' => 'Paket Lighting Konser Spektakuler',
                        'price' => 14000000,
                        'description' => 'Paket tata cahaya panggung outdoor dengan moving head beam dan laser show.',
                        'image_url' => 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
                    ],
                ],
            ],

            // 13. VENDOR DITOLAK (STATUS: REJECTED - UNTUK TESTING STATUS PENOLAKAN)
            [
                'email' => 'vendor.ditolak@evento.test',
                'name' => 'Toni Hermawan',
                'business_name' => 'Pesona Mandiri Ditolak',
                'category' => 'Catering',
                'contact_number' => '081234567813',
                'address' => 'Jl. Raya Bogor KM 28, Depok',
                'description' => 'Penyedia boga rasa rumahan untuk kebutuhan syukuran kecil.',
                'image_url' => 'https://images.unsplash.com/photo-1547573854-74d2a71d0826?w=800&auto=format&fit=crop&q=80',
                'bank_name' => 'Bank Mandiri',
                'bank_account_number' => '1570019283749',
                'bank_account_holder' => 'Toni Hermawan',
                'status' => Vendor::STATUS_REJECTED,
                'rejection_reason' => 'Dokumen sertifikasi higienis dan nomor kontak darurat belum memenuhi syarat standar kurasi EVENTO.',
                'packages' => [
                    [
                        'name' => 'Paket Nasi Kotak Sederhana',
                        'price' => 2500000,
                        'description' => 'Nasi kotak menu ayam goreng kremes dan lalapan.',
                        'image_url' => 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80',
                    ],
                ],
            ],
        ];

        foreach ($catalog as $vendorData) {
            // 1. User Vendor (UpdateOrCreate dengan password testing@123$)
            $user = User::updateOrCreate(
                ['email' => $vendorData['email']],
                [
                    'name' => $vendorData['name'],
                    'password' => $defaultPassword,
                    'role' => 'vendor',
                    'email_verified_at' => now(),
                ]
            );

            $status = $vendorData['status'] ?? Vendor::STATUS_APPROVED;
            $slug = Str::slug($vendorData['business_name']);

            // 2. Vendor Record (Aman dari benturan slug & user_id)
            $vendor = Vendor::where('slug', $slug)
                ->orWhere('user_id', $user->id)
                ->first();

            if (! $vendor) {
                $vendor = new Vendor;
            }

            $vendor->fill([
                'user_id' => $user->id,
                'business_name' => $vendorData['business_name'],
                'slug' => $slug,
                'category' => $vendorData['category'],
                'contact_number' => $vendorData['contact_number'],
                'address' => $vendorData['address'],
                'description' => $vendorData['description'],
                'image_url' => $vendorData['image_url'],
                'status' => $status,
                'is_active' => $status === Vendor::STATUS_APPROVED,
                'approved_at' => $status === Vendor::STATUS_APPROVED ? now() : null,
                'bank_name' => $vendorData['bank_name'] ?? 'Bank Central Asia (BCA)',
                'bank_account_number' => $vendorData['bank_account_number'] ?? '8830192847',
                'bank_account_holder' => $vendorData['bank_account_holder'] ?? $vendorData['business_name'],
                'rejection_reason' => $vendorData['rejection_reason'] ?? null,
            ]);
            $vendor->save();

            // 3. Vendor Packages
            foreach ($vendorData['packages'] as $pkgData) {
                $pkgSlug = Str::slug($pkgData['name']);

                VendorPackage::updateOrCreate(
                    [
                        'vendor_id' => $vendor->id,
                        'package_name' => $pkgData['name'],
                    ],
                    [
                        'slug' => $pkgSlug,
                        'description' => $pkgData['description'],
                        'price' => $pkgData['price'],
                        'image_url' => $pkgData['image_url'],
                        'is_active' => true,
                    ]
                );
            }
        }
    }
}
