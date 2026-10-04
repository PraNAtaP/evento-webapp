<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Database\Seeder;

class PaymentSeeder extends Seeder
{
    /**
     * Mengisi data uji untuk fitur Payment Tracking.
     *
     * Skenario:
     * - Pakai user client yang sudah ada (client@evento.test)
     * - Bikin 1 event untuk client tersebut
     * - Bikin 2 payment: DP + Pelunasan (keduanya unpaid)
     *
     * Jalankan: php artisan db:seed --class=PaymentSeeder
     */
    public function run(): void
    {
        // 1. Ambil user client yang sudah ada
        $client = User::where('email', 'client@evento.test')->first();

        if (! $client) {
            $this->command->error('❌ User client@evento.test tidak ditemukan. Jalankan DatabaseSeeder dulu: php artisan db:seed');
            return;
        }

        // 2. Bikin event milik client tersebut
        $event = Event::create([
            'client_id' => $client->id,
            'event_name' => 'Pernikahan Andi & Sari',
            'event_date' => now()->addMonths(2)->toDateString(),
            'kanban_status' => 'request',
        ]);

        // 3. Bikin 2 payment: DP dan Pelunasan
        Payment::create([
            'event_id' => $event->id,
            'payment_type' => 'dp',
            'nominal' => 15000000,
            'status' => 'unpaid',
        ]);

        Payment::create([
            'event_id' => $event->id,
            'payment_type' => 'pelunasan',
            'nominal' => 25000000,
            'status' => 'unpaid',
        ]);

        $this->command->info('PaymentSeeder selesai: 1 event, 2 payment dibuat untuk client@evento.test');
    }
}