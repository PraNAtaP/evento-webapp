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
     * Data master 9 vendor realistis beserta 6-8 paket layanan per vendor.
     */
    public function run(): void
    {
        $catalog = [
            [
                'email' => 'vendor.aroma@evento.test',
                'name' => 'Chef Hendra Wijaya',
                'business_name' => 'Aroma Selera Catering',
                'category' => 'Catering',
                'contact_number' => '081234567801',
                'address' => 'Jl. Tebet Raya No. 42, Jakarta Selatan',
                'description' => 'Penyedia jasa katering profesional untuk pesta pernikahan, seminar nasional, dan perayaan keluarga dengan sertifikasi halal dan higienis.',
                'image_url' => 'https://images.unsplash.com/photo-1555244162-803834f70033?w=600&auto=format&fit=crop&q=80',
                'packages' => [
                    [
                        'name' => 'Prasmanan Nusantara Deluxe (500 Pax)',
                        'price' => 37500000,
                        'description' => 'Menu lengkap 6 lauk utama khas nusantara, 2 dessert tradisional, aneka puding, dan es buah segar.',
                        'image_url' => 'https://images.unsplash.com/photo-1547573854-74d2a71d0826?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Prasmanan Modern Western (300 Pax)',
                        'price' => 28500000,
                        'description' => 'Roast beef sirloin, grilled chicken rosemary, pasta carbonara, caesar salad, dan chocolate mousse.',
                        'image_url' => 'https://images.unsplash.com/photo-1555244162-803834f70033?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Food Stall Kambing Guling (2 Ekor)',
                        'price' => 9000000,
                        'description' => 'Kambing guling muda empuk dengan lontong, bumbu kecap pedas, dan acar segar.',
                        'image_url' => 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Coffee Break & Pastry Set (100 Pax)',
                        'price' => 4500000,
                        'description' => 'Pilihan kopi arabika, teh herbal, serta 3 jenis kue asin dan 3 kue manis premium.',
                        'image_url' => 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Paket Nasi Kotak Eksklusif (150 Box)',
                        'price' => 6750000,
                        'description' => 'Nasi liwet komplit dengan ayam bakar madu, sambal goreng ati, tahu tempe, lalap, dan buah pisang.',
                        'image_url' => 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Stall Dessert & Gelato Bar (200 Porsi)',
                        'price' => 7000000,
                        'description' => 'Bar gelato 4 rasa impor dengan aneka topping renyah dan mini waffle hangat.',
                        'image_url' => 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Paket Tumpeng Mini Syukuran (50 Porsi)',
                        'price' => 3000000,
                        'description' => 'Tumpeng mini kemasan mika eksklusif lengkap dengan ayam suwir pedas, telur rawis, dan perkedel.',
                        'image_url' => 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80',
                    ],
                ],
            ],
            [
                'email' => 'vendor.laksmana@evento.test',
                'name' => 'Raden Laksmana',
                'business_name' => 'Laksmana Pelaminan & Dekor',
                'category' => 'Decoration',
                'contact_number' => '081234567802',
                'address' => 'Jl. Kemang Timur No. 18, Jakarta Selatan',
                'description' => 'Spesialis dekorasi pelaminan adat nusantara, modern rustic, dan minimalis botanical dengan bunga segar berkualitas tinggi.',
                'image_url' => 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop&q=80',
                'packages' => [
                    [
                        'name' => 'Dekorasi Pelaminan Rustic Botanical (8 Meter)',
                        'price' => 24000000,
                        'description' => 'Pelaminan nuansa kayu hangat, full fresh flowers mawar & krisan, standing flower, dan lampu warm-white fairy.',
                        'image_url' => 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Paket Dekorasi Akad Nikah / Intimate Stage',
                        'price' => 12500000,
                        'description' => 'Backdrop akad minimalis bunga segar, meja akad kaca, 6 kursi tiffany, dan karpet permadani.',
                        'image_url' => 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Gate Masuk & Lorong Bunga Fresh Flowers',
                        'price' => 7500000,
                        'description' => 'Gerbang selamat datang bunga lengkung mewah, karpet merah jalan tamu 20 meter, dan 4 tiang standing lamp.',
                        'image_url' => 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Dekorasi Meja Prasmanan & VIP Lounge',
                        'price' => 6000000,
                        'description' => 'Centerpiece bunga segar meja VIP, skirting linen satin emas, dan papan nama tamu akrilik berlampu.',
                        'image_url' => 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Photobooth 3D Tematik Interaktif',
                        'price' => 5500000,
                        'description' => 'Backdrop photobooth lebar 4 meter, instalasi neon sign kustom, dan properti foto elegan.',
                        'image_url' => 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Dekorasi Panggung Seminar & Backdrop LED',
                        'price' => 15000000,
                        'description' => 'Panggung seminar korporat, podium kayu jati, lighting par spotlight, dan hiasan tanaman tropis panggung.',
                        'image_url' => 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&auto=format&fit=crop&q=80',
                    ],
                ],
            ],
            [
                'email' => 'vendor.lensavisi@evento.test',
                'name' => 'Dimas Anggoro',
                'business_name' => 'Lensa Visi Photography',
                'category' => 'Photography',
                'contact_number' => '081234567803',
                'address' => 'Jl. Radio Dalam No. 11, Jakarta Selatan',
                'description' => 'Tim fotografer dan sinematografer berpengalaman mengabadikan momen berharga dengan konsep candid emosional dan grading warna sinematik.',
                'image_url' => 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=600&auto=format&fit=crop&q=80',
                'packages' => [
                    [
                        'name' => 'Liputan Pernikahan All-Day Cinematic (Foto & Video)',
                        'price' => 18000000,
                        'description' => '2 Fotografer, 2 Videografer, 1 Drone pilot. Teaser video 1 menit, highlight film 5 menit, dan album kolase magnetik 30x40.',
                        'image_url' => 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Paket Foto Prewedding Outdoor Konseptual',
                        'price' => 8500000,
                        'description' => 'Sesi foto 1 hari penuh di 2 lokasi, termasuk wardrobe, make up, 2 cetak canvas 40x60 berbingkai minimalis.',
                        'image_url' => 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Dokumentasi Acara Seminar & Konferensi',
                        'price' => 6000000,
                        'description' => 'Dokumentasi foto ekspres siap rilis pers dalam 3 jam, video dokumentasi ringkasan kegiatan, dan seluruh master file di flashdisk.',
                        'image_url' => 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Paket Photo Studio On-Site (Unlimited Cetak 3 Jam)',
                        'price' => 4500000,
                        'description' => 'Mesin cetak mini lab cepat, lighting studio lengkap, custom frame template, dan link Google Drive seketika.',
                        'image_url' => 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Dokumentasi Ulang Tahun & Sweet Seventeen',
                        'price' => 5000000,
                        'description' => '1 Fotografer, 1 Videografer reels/tiktok, liputan 4 jam, 50 foto editan warna, dan 1 reel viral siap tayang.',
                        'image_url' => 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Live Streaming Multi-Camera YouTube / Zoom',
                        'price' => 7500000,
                        'description' => '3 Kamera Sony Mirrorless, video switcher Blackmagic, audio direct mixer, dan operator teknis siaran langsung.',
                        'image_url' => 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
                    ],
                ],
            ],
            [
                'email' => 'vendor.harmonisound@evento.test',
                'name' => 'Bambang Irawan',
                'business_name' => 'Harmoni Sound & Lighting',
                'category' => 'Sound & Lighting',
                'contact_number' => '081234567804',
                'address' => 'Jl. Percetakan Negara No. 7, Jakarta Pusat',
                'description' => 'Rental sound system konser, line array akustik gedung, panggung rigging, dan tata cahaya moving-beam profesional.',
                'image_url' => 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
                'packages' => [
                    [
                        'name' => 'Sound System Ballroom Wedding 10.000 Watt',
                        'price' => 14000000,
                        'description' => 'Subwoofer aktif ganda, line array 8 box, mixer digital Midas 32 channel, dan 6 wireless mic Shure.',
                        'image_url' => 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Lighting Stage Ambience & Beam Moving Head',
                        'price' => 9500000,
                        'description' => '8 Unit Moving Head Beam 230, 16 Par LED RGBW, 2 Smoke gun, dan grandMA light controller.',
                        'image_url' => 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Sound System Seminar & Meeting 5.000 Watt',
                        'price' => 5000000,
                        'description' => 'Speaker aktif clarity tinggi untuk vokal, 4 mic wireless, direct box laptop audio, dan soundman bertugas.',
                        'image_url' => 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Genset Silent 60 KVA (12 Jam Pemakaian)',
                        'price' => 4500000,
                        'description' => 'Termasuk bahan bakar solar penuh, kabel induk 50 meter, panel distribusi, dan operator standby.',
                        'image_url' => 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Paket Acoustic Band Sound Equipment',
                        'price' => 6000000,
                        'description' => 'Ampli gitar Roland JC-120, ampli bass Fender Rumble, drum akustik set Tama, keyboard monitor, dan mic vokal.',
                        'image_url' => 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Effect Dry Ice & Pyro Cold Spark Machine',
                        'price' => 3500000,
                        'description' => '2 Mesin dry ice kabut tebal untuk grand entrance wedding dan 4 pyro kembang api dingin indoor tanpa asap berbahaya.',
                        'image_url' => 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
                    ],
                ],
            ],
            [
                'email' => 'vendor.ayumakeup@evento.test',
                'name' => 'Ayu Saraswati',
                'business_name' => 'Ayu Saraswati Bridal & MUA',
                'category' => 'Make Up & Attire',
                'contact_number' => '081234567805',
                'address' => 'Jl. Bintaro Utama Sektor 3A, Tangerang Selatan',
                'description' => 'Jasa rias pengantin adat nusantara modifikasi dan internasional modern, dengan busana kebaya berpayet mutiara dan jas groom mewah.',
                'image_url' => 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&auto=format&fit=crop&q=80',
                'packages' => [
                    [
                        'name' => 'Rias Pengantin Akad & Resepsi Lengkap',
                        'price' => 15000000,
                        'description' => 'Make up pengantin wanita (2x ganti look), hairdo / hijab do, retouch standby, busana pengantin akad & resepsi.',
                        'image_url' => 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Paket Rias Ibu & Besan (4 Orang)',
                        'price' => 4500000,
                        'description' => 'Make up flawless tahan 12 jam untuk kedua ibu mempelai dan 2 keluarga inti, termasuk sanggul/hijab.',
                        'image_url' => 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Sewa Beskap Groom & Busana Adat',
                        'price' => 3500000,
                        'description' => 'Sewa beskap pengantin pria, blangkon, keris hias, kain batik senada, dan selop bordir.',
                        'image_url' => 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Make Up Bridesmaid / Pagar Ayu (6 Orang)',
                        'price' => 4200000,
                        'description' => 'Rias wajah natural glowing dan hairdo rapi untuk 6 orang pendamping mempelai.',
                        'image_url' => 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Sewa Gaun Malam Resepsi Glamour',
                        'price' => 6500000,
                        'description' => 'Gaun pesta ballgown berpayet swarovski mewah lengkap dengan tiara mahkota kristal.',
                        'image_url' => 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Make Up Wisuda & Pesta Personal',
                        'price' => 1200000,
                        'description' => 'Make up wisuda high-definition tahan keringat, bulu mata premium, dan penataan rambut modern.',
                        'image_url' => 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&auto=format&fit=crop&q=80',
                    ],
                ],
            ],
            [
                'email' => 'vendor.nadaestetika@evento.test',
                'name' => 'Rian Mahendra',
                'business_name' => 'Nada Estetika Entertainment',
                'category' => 'Music & Entertainment',
                'contact_number' => '081234567806',
                'address' => 'Jl. Boulevard Kelapa Gading Blok LA No. 3, Jakarta Utara',
                'description' => 'Penyedia hiburan musik live wedding orchestra, acoustic band, saxophonist, dan master of ceremonies (MC) berpengalaman ratusan event.',
                'image_url' => 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80',
                'packages' => [
                    [
                        'name' => 'Akustik Band Wedding Komplit (5 Personil)',
                        'price' => 9500000,
                        'description' => 'Vokalis pria & wanita, keyboardist, bassist, acoustic guitarist, dan cajon player. Repertoire lagu romantis dan pop hits.',
                        'image_url' => 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Chamber Mini Orchestra (7 Musisi)',
                        'price' => 17000000,
                        'description' => 'Format megah: 2 Violin, Cello, Flute, Baby Grand Piano, Kontrabas, dan Saxophone untuk resepsi berkelas.',
                        'image_url' => 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Master of Ceremony (MC) Bilingual Akad & Resepsi',
                        'price' => 4500000,
                        'description' => 'MC profesional fasih Bahasa Indonesia dan Bahasa Inggris, komunikatif, rundown flow keeper berwibawa.',
                        'image_url' => 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Solo Saxophonist Romantic Dinner & Entrance',
                        'price' => 3000000,
                        'description' => 'Pemain saksofon profesional mengiringi prosesi masuk pengantin dan waktu santap malam intim.',
                        'image_url' => 'https://images.unsplash.com/photo-1525994886773-080587e161c2?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'DJ Party & EDM Remix Set (3 Jam)',
                        'price' => 5000000,
                        'description' => 'DJ profesional untuk after party wedding atau sweet seventeen lengkap dengan controller canggih.',
                        'image_url' => 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Tarian Tradisional Penyambutan Pengantin',
                        'price' => 4000000,
                        'description' => 'Tari cucuk lampah adat Jawa / tari pasambahan Minang lengkap dengan 4 penari dan kostum megah.',
                        'image_url' => 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
                    ],
                ],
            ],
            [
                'email' => 'vendor.cendanatenda@evento.test',
                'name' => 'Haji Mansyur',
                'business_name' => 'Cendana Tenda & Rigging',
                'category' => 'Tent & Rigging',
                'contact_number' => '081234567807',
                'address' => 'Jl. Ciputat Raya No. 104, Jakarta Selatan',
                'description' => 'Sewa tenda dekorasi VIP, tenda transparan kubah, flooring karpet, AC portable, dan misty cooling fan.',
                'image_url' => 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&auto=format&fit=crop&q=80',
                'packages' => [
                    [
                        'name' => 'Tenda Plafon Dekorasi VIP Salur (100 m2)',
                        'price' => 11000000,
                        'description' => 'Tenda semi kedap air, kain plafon satin kombinasi 2 warna, tirai tiang keliling, dan instalasi kuat.',
                        'image_url' => 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Tenda Transparan Elegan Night Party (80 m2)',
                        'price' => 14500000,
                        'description' => 'Tenda mika transparan mewah untuk pemandangan langit malam, fairy light garland, dan tiang berbalut kain.',
                        'image_url' => 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Flooring Papan Kayu & Karpet Buana (100 m2)',
                        'price' => 6500000,
                        'description' => 'Alas lantai kayu anti becek di atas rumput halaman, terbungkus karpet warna pilihan yang rapi.',
                        'image_url' => 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Paket AC Portable Standing 5 PK (4 Unit)',
                        'price' => 4800000,
                        'description' => 'Penyejuk udara dingin kuat untuk tenda tertutup, termasuk instalasi pipa dan teknisi pemantau.',
                        'image_url' => 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Misty Cool Fan / Kipas Air Embun (6 Unit)',
                        'price' => 2400000,
                        'description' => 'Kipas angin embun sejuk untuk sirkulasi udara luar ruangan di siang hari.',
                        'image_url' => 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Sewa Kursi Tiffany Gold + Busa (100 Unit)',
                        'price' => 3500000,
                        'description' => 'Kursi tiffany kayu warna emas anggun dengan bantalan duduk kulit sintetis putih bersih.',
                        'image_url' => 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&auto=format&fit=crop&q=80',
                    ],
                ],
            ],
            [
                'email' => 'vendor.kartikaundangan@evento.test',
                'name' => 'Kartika Indah',
                'business_name' => 'Kartika Invitation & Souvenir',
                'category' => 'Souvenir & Invitation',
                'contact_number' => '081234567808',
                'address' => 'Jl. Margonda Raya No. 250, Depok',
                'description' => 'Pembuatan undangan cetak hard cover foil emas, undangan website digital interaktif dengan QR check-in, dan suvenir mewah bernilai guna.',
                'image_url' => 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80',
                'packages' => [
                    [
                        'name' => 'Undangan Hardcover Foil Emas Timbul (300 Pcs)',
                        'price' => 5400000,
                        'description' => 'Bahan jasmine tebal, cetak hotprint emas timbul, amplop berpita satin, dan plastik pelindung.',
                        'image_url' => 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Undangan Website Digital & Sistem QR Code Tamu',
                        'price' => 1500000,
                        'description' => 'Website responsif kustom nama domain, fitur RSVP realtime, galeri video, peta navigasi, dan QR check-in.',
                        'image_url' => 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Suvenir Tumbler Grafir Laser Nama (300 Pcs)',
                        'price' => 8400000,
                        'description' => 'Tumbler stainless tahan panas dingin 500ml, ukir nama kedua mempelai, kotak mika pita eksklusif.',
                        'image_url' => 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Suvenir Pouch Kulit Sintetis Premium (300 Pcs)',
                        'price' => 6000000,
                        'description' => 'Dompet pouch serbaguna bahan kulit sintetis lembut, emboss inisial, kemasan kantung tile transparan.',
                        'image_url' => 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Buku Tamu Hardcover & Spidol Khusus (2 Set)',
                        'price' => 600000,
                        'description' => 'Buku tamu berbalut beludru elegan dengan cetakan emas di sampul, memuat 500 tanda tangan ucapan.',
                        'image_url' => 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Kotak Cincin & Mahar Akrilik Presisi',
                        'price' => 1200000,
                        'description' => 'Kotak mahar akrilik bening hiasan bunga kering terawetkan, ukiran kaligrafi nama, dan lampu LED mini.',
                        'image_url' => 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop&q=80',
                    ],
                ],
            ],
            [
                'email' => 'vendor.pratamasound@evento.test',
                'name' => 'Pratama Kusuma',
                'business_name' => 'Pratama Panggung & Visual LED',
                'category' => 'Stage & Videotron',
                'contact_number' => '081234567809',
                'address' => 'Jl. Daan Mogot KM 14, Jakarta Barat',
                'description' => 'Rental Videotron LED Screen indoor dan outdoor P2.9/P3.9, panggung rigging konser, level panggung modular karpet.',
                'image_url' => 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
                'packages' => [
                    [
                        'name' => 'Videotron LED Screen Indoor P3.9 (Ukuran 3x4 Meter)',
                        'price' => 14400000,
                        'description' => 'Layar LED resolusi tinggi cerah, video processor Novastar, operator multimedia standby, dan rigging bracket.',
                        'image_url' => 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Videotron LED Screen Indoor P2.9 Ultra-HD (Ukuran 3x6 Meter)',
                        'price' => 25000000,
                        'description' => 'Layar lengkung LED ultra-fine pixel pitch, visual jernih dari jarak dekat, video switcher seamless.',
                        'image_url' => 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Panggung Rigging Aluminium Heavy Duty (6x8 Meter)',
                        'price' => 9000000,
                        'description' => 'Panggung modular rangka aluminium kuat, lantai multiplek tebal karpet abu-abu, tangga naik 2 sisi.',
                        'image_url' => 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Barricade Row Pembatas Penonton (30 Meter)',
                        'price' => 3000000,
                        'description' => 'Pagar pembatas crowd control aluminium kokoh untuk keamanan acara musik dan festival.',
                        'image_url' => 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Lighting Follow Spotlight HMI 1200W (2 Unit)',
                        'price' => 2000000,
                        'description' => 'Lampu sorot fokus mengiringi langkah pengantin atau pembicara utama dari balkon ballroom.',
                        'image_url' => 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
                    ],
                    [
                        'name' => 'Level Panggung Pelaminan Melamin Putih Glossy',
                        'price' => 4500000,
                        'description' => 'Lantai panggung lapis melamin putih mengkilat memberikan kesan mewah dan pantulan cahaya elegan.',
                        'image_url' => 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop&q=80',
                    ],
                ],
            ],
        ];

        foreach ($catalog as $vendorData) {
            // 1. User Vendor (Idempotent)
            $user = User::firstOrCreate(
                ['email' => $vendorData['email']],
                [
                    'name' => $vendorData['name'],
                    'password' => Hash::make('password'),
                    'role' => 'vendor',
                    'email_verified_at' => now(),
                ]
            );

            // 2. Vendor Record (Idempotent)
            $vendor = Vendor::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'business_name' => $vendorData['business_name'],
                    'slug' => Str::slug($vendorData['business_name']),
                    'category' => $vendorData['category'],
                    'contact_number' => $vendorData['contact_number'],
                    'address' => $vendorData['address'],
                    'description' => $vendorData['description'],
                    'image_url' => $vendorData['image_url'],
                    'status' => Vendor::STATUS_APPROVED,
                    'is_active' => true,
                    'approved_at' => now(),
                ]
            );

            // Pastikan jika vendor sudah ada namun slug/is_active belum terisi, update kolom tersebut
            if (empty($vendor->slug)) {
                $vendor->slug = Str::slug($vendor->business_name) ?: ('vendor-'.$vendor->id);
                $vendor->save();
            }

            // 3. Vendor Packages (Idempotent)
            foreach ($vendorData['packages'] as $pkgData) {
                $pkgSlug = Str::slug($pkgData['name']);

                VendorPackage::firstOrCreate(
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

