<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\EventVendorAssignment;
use App\Models\Payment;
use App\Models\ProgressLog;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorPackage;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class EventWorkflowSeeder extends Seeder
{
    /**
     * Mengisi data uji komprehensif untuk seluruh alur Kanban, Pembayaran, Invoice, Kuitansi, dan Payout.
     */
    public function run(): void
    {
        $defaultPassword = Hash::make('testing@123$');

        // 1. Ambil atau Buat Akun EO (Admin)
        $eoUser = User::updateOrCreate(
            ['email' => 'eo@evento.test'],
            [
                'name' => 'Admin EO Evento',
                'password' => $defaultPassword,
                'role' => 'eo',
                'email_verified_at' => now(),
            ]
        );

        // 2. Buat Beberapa Akun Klien Realistis
        $clientBudi = User::updateOrCreate(
            ['email' => 'client@evento.test'],
            [
                'name' => 'Budi Pratama',
                'password' => $defaultPassword,
                'role' => 'client',
                'email_verified_at' => now(),
            ]
        );

        $clientSiti = User::updateOrCreate(
            ['email' => 'siti.aminah@evento.test'],
            [
                'name' => 'Siti Aminah',
                'password' => $defaultPassword,
                'role' => 'client',
                'email_verified_at' => now(),
            ]
        );

        $clientHendra = User::updateOrCreate(
            ['email' => 'hendra.tech@evento.test'],
            [
                'name' => 'Hendra Gunawan',
                'password' => $defaultPassword,
                'role' => 'client',
                'email_verified_at' => now(),
            ]
        );

        $clientRatna = User::updateOrCreate(
            ['email' => 'ratna.sari@evento.test'],
            [
                'name' => 'Ratna Sari',
                'password' => $defaultPassword,
                'role' => 'client',
                'email_verified_at' => now(),
            ]
        );

        // Klien Belum Verifikasi Email (Untuk testing validasi verifikasi email)
        User::updateOrCreate(
            ['email' => 'unverified.client@evento.test'],
            [
                'name' => 'Rizky Perdana (Unverified)',
                'password' => $defaultPassword,
                'role' => 'client',
                'email_verified_at' => null,
            ]
        );

        // Ambil Vendor-Vendor Utama
        $cateringVendor = Vendor::where('slug', 'aroma-selera-catering')->first();
        $decorVendor = Vendor::where('slug', 'laksmana-pelaminan-dekor')->first();
        $photoVendor = Vendor::where('slug', 'lensa-visi-photography')->first();
        $soundVendor = Vendor::where('slug', 'harmoni-sound-lighting')->first();
        $muaVendor = Vendor::where('slug', 'ayu-saraswati-bridal-mua')->first();
        $musicVendor = Vendor::where('slug', 'nada-estetika-entertainment')->first();
        $ledVendor = Vendor::where('slug', 'pratama-panggung-visual-led')->first();

        // -----------------------------------------------------------------------------------------
        // EVENT 1: ON PROGRESS (Pernikahan Akbar Raden & Ayu)
        // DP Lunas (Ada Kuitansi), 1 Vendor Lunas Dicairkan (Ada Voucher Kas), Log Progres Lengkap
        // -----------------------------------------------------------------------------------------
        $event1 = Event::updateOrCreate(
            ['event_name' => 'Pernikahan Akbar Raden & Ayu'],
            [
                'client_id' => $clientSiti->id,
                'category' => 'wedding',
                'event_date' => Carbon::now()->addDays(68)->format('Y-m-d'),
                'guest_count' => 500,
                'estimated_budget' => 120000000,
                'agreed_price' => 115000000,
                'dp_percentage' => 30.00,
                'has_own_venue' => true,
                'venue' => 'Grand Wijaya Ballroom Lantai 3, Jl. Gatot Subroto Kav 38 Jakarta',
                'lat' => -6.2297,
                'lng' => 106.8295,
                'is_multi_day' => false,
                'kanban_status' => 'on_progress',
                'terms_accepted_at' => Carbon::now()->subDays(10),
                'terms_version' => '1.0',
            ]
        );

        // Payment DP (Paid & Verified -> Menghasilkan Kuitansi Resmi RCP/EVN/...)
        Payment::updateOrCreate(
            ['event_id' => $event1->id, 'payment_type' => 'dp'],
            [
                'nominal' => 34500000,
                'status' => 'paid',
                'invoice_number' => 'INV/EVN/'.now()->format('Ym').'/0001',
                'receipt_number' => 'RCP/EVN/'.now()->format('Ym').'/0001',
                'due_date' => Carbon::now()->subDays(7)->format('Y-m-d'),
                'payment_proof_url' => 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
                'verified_by' => $eoUser->id,
                'verified_at' => Carbon::now()->subDays(6),
            ]
        );

        // Payment Pelunasan (Unpaid Invoice)
        Payment::updateOrCreate(
            ['event_id' => $event1->id, 'payment_type' => 'pelunasan'],
            [
                'nominal' => 80500000,
                'status' => 'unpaid',
                'invoice_number' => 'INV/EVN/'.now()->format('Ym').'/0002',
                'due_date' => Carbon::now()->addDays(50)->format('Y-m-d'),
            ]
        );

        // Vendor Assignments for Event 1
        if ($cateringVendor) {
            $catPkg = VendorPackage::where('vendor_id', $cateringVendor->id)->first();
            $assignCatering = EventVendorAssignment::updateOrCreate(
                ['event_id' => $event1->id, 'vendor_id' => $cateringVendor->id],
                [
                    'package_id' => $catPkg?->id,
                    'package_name' => $catPkg?->package_name ?? 'Prasmanan Nusantara Deluxe',
                    'package_price' => $catPkg?->price ?? 37500000,
                    'locked_price' => 37500000,
                    'eo_offer_status' => 'accepted',
                    'client_approval' => 'approved',
                    'payout_status' => 'paid',
                    'payout_nominal' => 37500000,
                    'payout_at' => Carbon::now()->subDays(3),
                    'payout_receipt_number' => 'VCH/EVN/'.now()->format('Ym').'/0001',
                    'payout_proof_url' => 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
                    'payout_note' => 'Pelunasan honor katering prasmanan 500 pax transfer rekening resmi BCA PT Aroma Selera.',
                ]
            );

            ProgressLog::updateOrCreate(
                ['assignment_id' => $assignCatering->id, 'note' => 'Sesi food tasting 6 menu utama nusantara bersama keluarga mempelai telah sukses disepakati.'],
                [
                    'photo_url' => 'https://images.unsplash.com/photo-1547573854-74d2a71d0826?w=800&auto=format&fit=crop&q=80',
                    'is_visible_to_client' => true,
                    'created_at' => Carbon::now()->subDays(4),
                ]
            );
        }

        if ($decorVendor) {
            $decorPkg = VendorPackage::where('vendor_id', $decorVendor->id)->first();
            $assignDecor = EventVendorAssignment::updateOrCreate(
                ['event_id' => $event1->id, 'vendor_id' => $decorVendor->id],
                [
                    'package_id' => $decorPkg?->id,
                    'package_name' => $decorPkg?->package_name ?? 'Dekorasi Pelaminan Rustic Botanical',
                    'package_price' => $decorPkg?->price ?? 24000000,
                    'locked_price' => 24000000,
                    'eo_offer_status' => 'accepted',
                    'client_approval' => 'approved',
                    'payout_status' => 'pending',
                ]
            );

            ProgressLog::updateOrCreate(
                ['assignment_id' => $assignDecor->id, 'note' => 'Survey lokasi Grand Wijaya Ballroom dan finalisasi sketsa 3D dekorasi pelaminan rustic floral.'],
                [
                    'photo_url' => 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
                    'is_visible_to_client' => true,
                    'created_at' => Carbon::now()->subDays(2),
                ]
            );
        }

        if ($photoVendor) {
            $photoPkg = VendorPackage::where('vendor_id', $photoVendor->id)->first();
            EventVendorAssignment::updateOrCreate(
                ['event_id' => $event1->id, 'vendor_id' => $photoVendor->id],
                [
                    'package_id' => $photoPkg?->id,
                    'package_name' => $photoPkg?->package_name ?? 'Wedding Day All-Day Cinematic',
                    'package_price' => $photoPkg?->price ?? 16500000,
                    'locked_price' => 16500000,
                    'eo_offer_status' => 'accepted',
                    'client_approval' => 'approved',
                    'payout_status' => 'pending',
                ]
            );
        }

        // -----------------------------------------------------------------------------------------
        // EVENT 2: AWAITING DP (National Tech Summit & Hackathon 2027)
        // Bukti transfer sudah diupload klien -> Status 'pending_verification' agar EO bisa verifikasi
        // -----------------------------------------------------------------------------------------
        $event2 = Event::updateOrCreate(
            ['event_name' => 'National Tech Summit & Hackathon 2027'],
            [
                'client_id' => $clientHendra->id,
                'category' => 'seminar',
                'event_date' => Carbon::now()->addDays(42)->format('Y-m-d'),
                'guest_count' => 350,
                'estimated_budget' => 85000000,
                'agreed_price' => 78000000,
                'dp_percentage' => 50.00,
                'has_own_venue' => true,
                'venue' => 'Jakarta Convention Center (JCC) Assembly Hall',
                'lat' => -6.2146,
                'lng' => 106.8077,
                'is_multi_day' => false,
                'kanban_status' => 'awaiting_dp',
                'terms_accepted_at' => Carbon::now()->subDays(2),
                'terms_version' => '1.0',
            ]
        );

        Payment::updateOrCreate(
            ['event_id' => $event2->id, 'payment_type' => 'dp'],
            [
                'nominal' => 39000000,
                'status' => 'pending_verification', // Menunggu Verifikasi EO!
                'invoice_number' => 'INV/EVN/'.now()->format('Ym').'/0003',
                'due_date' => Carbon::now()->addDays(3)->format('Y-m-d'),
                'payment_proof_url' => 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
            ]
        );

        Payment::updateOrCreate(
            ['event_id' => $event2->id, 'payment_type' => 'pelunasan'],
            [
                'nominal' => 39000000,
                'status' => 'unpaid',
                'invoice_number' => 'INV/EVN/'.now()->format('Ym').'/0004',
                'due_date' => Carbon::now()->addDays(35)->format('Y-m-d'),
            ]
        );

        if ($soundVendor) {
            $soundPkg = VendorPackage::where('vendor_id', $soundVendor->id)->first();
            EventVendorAssignment::updateOrCreate(
                ['event_id' => $event2->id, 'vendor_id' => $soundVendor->id],
                [
                    'package_id' => $soundPkg?->id,
                    'package_name' => $soundPkg?->package_name ?? 'Paket Sound System Gedung 10.000 Watt',
                    'package_price' => $soundPkg?->price ?? 12000000,
                    'locked_price' => 12000000,
                    'eo_offer_status' => 'accepted',
                    'client_approval' => 'approved',
                    'payout_status' => 'pending',
                ]
            );
        }

        // -----------------------------------------------------------------------------------------
        // EVENT 3: CLIENT REVIEW DENGAN REVISI (Sweet 17th Birthday Gala Putri)
        // Klien mengajukan revisi penawaran -> Mengisi antrean "Revisi Penawaran" di Dashboard EO
        // -----------------------------------------------------------------------------------------
        Event::updateOrCreate(
            ['event_name' => 'Sweet 17th Birthday Gala Putri'],
            [
                'client_id' => $clientRatna->id,
                'category' => 'birthday',
                'event_date' => Carbon::now()->addDays(28)->format('Y-m-d'),
                'guest_count' => 120,
                'estimated_budget' => 35000000,
                'agreed_price' => 32000000,
                'dp_percentage' => 40.00,
                'has_own_venue' => true,
                'venue' => 'Pinehill Outdoor Glasshouse Cafe & Garden, Lembang',
                'lat' => -6.8152,
                'lng' => 107.6186,
                'is_multi_day' => false,
                'kanban_status' => 'client_review',
                'revision_note' => 'Mohon tambahkan 1 paket mini acoustic band untuk iringan tiup lilin dan pemotongan kue ya min.',
                'revision_requested_at' => Carbon::now()->subHours(5),
            ]
        );

        // -----------------------------------------------------------------------------------------
        // EVENT 4: ON PROGRESS DENGAN PERMINTAAN BATAL PENDING (Annual Corporate Gathering)
        // Mengisi antrean "Permintaan Batal" di Dashboard EO agar fitur approval pembatalan bisa diuji
        // -----------------------------------------------------------------------------------------
        $event4 = Event::updateOrCreate(
            ['event_name' => 'Annual Corporate Gathering PT Nusantara Abadi'],
            [
                'client_id' => $clientHendra->id,
                'category' => 'corporate',
                'event_date' => Carbon::now()->addDays(32)->format('Y-m-d'),
                'guest_count' => 200,
                'estimated_budget' => 90000000,
                'agreed_price' => 85000000,
                'dp_percentage' => 30.00,
                'has_own_venue' => true,
                'venue' => 'Grand Wijaya Ballroom, Jakarta',
                'is_multi_day' => false,
                'kanban_status' => 'on_progress',
                'terms_accepted_at' => Carbon::now()->subDays(15),
                'terms_version' => '1.0',
                'cancellation_request_status' => 'pending',
                'cancellation_request_reason' => 'Jadwal rapat kerja tahunan direksi dimajukan ke luar kota karena adanya kunjungan menteri BUMN.',
                'cancellation_requested_at' => Carbon::now()->subHours(2),
            ]
        );

        Payment::updateOrCreate(
            ['event_id' => $event4->id, 'payment_type' => 'dp'],
            [
                'nominal' => 25500000,
                'status' => 'paid',
                'invoice_number' => 'INV/EVN/'.now()->format('Ym').'/0005',
                'receipt_number' => 'RCP/EVN/'.now()->format('Ym').'/0002',
                'due_date' => Carbon::now()->subDays(10)->format('Y-m-d'),
                'verified_by' => $eoUser->id,
                'verified_at' => Carbon::now()->subDays(9),
            ]
        );

        // -----------------------------------------------------------------------------------------
        // EVENT 5: REQUEST (Permohonan Masuk Baru dari Klien)
        // Mengisi antrean "Request Acara" di Dashboard EO
        // -----------------------------------------------------------------------------------------
        Event::updateOrCreate(
            ['event_name' => 'Intimate Garden Engagement Dimas & Sheila'],
            [
                'client_id' => $clientBudi->id,
                'category' => 'engagement',
                'event_date' => Carbon::now()->addDays(75)->format('Y-m-d'),
                'guest_count' => 80,
                'estimated_budget' => 45000000,
                'has_own_venue' => false,
                'venue' => 'Rencana di Taman Kajoe Cilandak atau Rumah Sarwono Pasar Minggu',
                'is_multi_day' => false,
                'kanban_status' => 'request',
            ]
        );

        // -----------------------------------------------------------------------------------------
        // EVENT 6: DRAFT (EO Sedang Merancang Penawaran Vendor)
        // Ada tawaran vendor berstatus 'pending' -> Mengisi antrean "Tawaran Vendor" di Dashboard EO
        // -----------------------------------------------------------------------------------------
        $event6 = Event::updateOrCreate(
            ['event_name' => 'Pameran Industri Kreatif Jakarta 2027'],
            [
                'client_id' => $clientBudi->id,
                'category' => 'exhibition',
                'event_date' => Carbon::now()->addDays(55)->format('Y-m-d'),
                'guest_count' => 1000,
                'estimated_budget' => 60000000,
                'has_own_venue' => true,
                'venue' => 'Senayan Park Exhibition Hall',
                'is_multi_day' => false,
                'kanban_status' => 'drafting_quotation',
            ]
        );

        if ($ledVendor) {
            $ledPkg = VendorPackage::where('vendor_id', $ledVendor->id)->first();
            EventVendorAssignment::updateOrCreate(
                ['event_id' => $event6->id, 'vendor_id' => $ledVendor->id],
                [
                    'package_id' => $ledPkg?->id,
                    'package_name' => $ledPkg?->package_name ?? 'Videotron LED Screen Indoor P2.9',
                    'package_price' => $ledPkg?->price ?? 15000000,
                    'locked_price' => 15000000,
                    'eo_offer_status' => 'pending', // Menunggu respon vendor!
                    'client_approval' => 'pending',
                ]
            );
        }

        // -----------------------------------------------------------------------------------------
        // EVENT 7: DONE (Acara Sukses Terlaksana & Pendapatan Diakui)
        // Menghasilkan analitik pendapatan selesai diakui di Dashboard EO (Rp 50.000.000)
        // -----------------------------------------------------------------------------------------
        $event7 = Event::updateOrCreate(
            ['event_name' => 'Konser Musik Indie Senja Harmoni'],
            [
                'client_id' => $clientBudi->id,
                'category' => 'concert',
                'event_date' => Carbon::now()->subDays(12)->format('Y-m-d'),
                'guest_count' => 400,
                'estimated_budget' => 50000000,
                'agreed_price' => 50000000,
                'dp_percentage' => 40.00,
                'has_own_venue' => true,
                'venue' => 'Amphitheater Taman Mini Indonesia Indah',
                'is_multi_day' => false,
                'kanban_status' => 'done',
                'completed_at' => Carbon::now()->subDays(10),
                'terms_accepted_at' => Carbon::now()->subDays(60),
                'terms_version' => '1.0',
            ]
        );

        Payment::updateOrCreate(
            ['event_id' => $event7->id, 'payment_type' => 'dp'],
            [
                'nominal' => 20000000,
                'status' => 'paid',
                'invoice_number' => 'INV/EVN/'.now()->format('Ym').'/0006',
                'receipt_number' => 'RCP/EVN/'.now()->format('Ym').'/0003',
                'due_date' => Carbon::now()->subDays(45)->format('Y-m-d'),
                'verified_by' => $eoUser->id,
                'verified_at' => Carbon::now()->subDays(44),
            ]
        );

        Payment::updateOrCreate(
            ['event_id' => $event7->id, 'payment_type' => 'pelunasan'],
            [
                'nominal' => 30000000,
                'status' => 'paid',
                'invoice_number' => 'INV/EVN/'.now()->format('Ym').'/0007',
                'receipt_number' => 'RCP/EVN/'.now()->format('Ym').'/0004',
                'due_date' => Carbon::now()->subDays(15)->format('Y-m-d'),
                'verified_by' => $eoUser->id,
                'verified_at' => Carbon::now()->subDays(14),
            ]
        );

        if ($musicVendor) {
            $musicPkg = VendorPackage::where('vendor_id', $musicVendor->id)->first();
            EventVendorAssignment::updateOrCreate(
                ['event_id' => $event7->id, 'vendor_id' => $musicVendor->id],
                [
                    'package_id' => $musicPkg?->id,
                    'package_name' => $musicPkg?->package_name ?? 'Full Acoustic Band & 2 Vokalis',
                    'package_price' => $musicPkg?->price ?? 8500000,
                    'locked_price' => 8500000,
                    'eo_offer_status' => 'accepted',
                    'client_approval' => 'approved',
                    'payout_status' => 'paid',
                    'payout_nominal' => 8500000,
                    'payout_at' => Carbon::now()->subDays(11),
                    'payout_receipt_number' => 'VCH/EVN/'.now()->format('Ym').'/0002',
                    'payout_note' => 'Honorarium panggung full band lunas ditransfer.',
                ]
            );
        }

        // -----------------------------------------------------------------------------------------
        // EVENT 8: CANCELLED (Acara Dibatalkan)
        // Memastikan analitik keuangan tidak menghitung acara batal & filter exclude berfungsi
        // -----------------------------------------------------------------------------------------
        Event::updateOrCreate(
            ['event_name' => 'Resepsi Pernikahan Ditunda Keluarga'],
            [
                'client_id' => $clientSiti->id,
                'category' => 'wedding',
                'event_date' => Carbon::now()->addDays(90)->format('Y-m-d'),
                'guest_count' => 300,
                'estimated_budget' => 60000000,
                'has_own_venue' => true,
                'venue' => 'Gedung Pertemuan Graha Kencana',
                'is_multi_day' => false,
                'kanban_status' => 'cancelled',
                'cancellation_reason' => 'Kesepakatan kedua keluarga menunda acara hingga tahun depan karena ada dinas luar negeri.',
                'cancelled_at' => Carbon::now()->subDays(3),
            ]
        );

        // -----------------------------------------------------------------------------------------
        // EVENT 9: REJECTED (Pengajuan Booking Ditolak EO)
        // -----------------------------------------------------------------------------------------
        Event::updateOrCreate(
            ['event_name' => 'Pernikahan Mepet H-15'],
            [
                'client_id' => $clientBudi->id,
                'category' => 'wedding',
                'event_date' => Carbon::now()->addDays(15)->format('Y-m-d'),
                'guest_count' => 500,
                'estimated_budget' => 70000000,
                'has_own_venue' => false,
                'is_multi_day' => false,
                'kanban_status' => 'rejected',
                'rejection_reason' => 'Jadwal persiapan pernikahan skala 500 tamu terlalu mepet (kurang dari syarat minimal 60 hari). Disarankan menjadwalkan ulang pada bulan depan.',
            ]
        );
    }
}
