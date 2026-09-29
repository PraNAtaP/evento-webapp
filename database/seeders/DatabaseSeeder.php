<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Vendor;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Akun Customer / Client
        User::updateOrCreate(
            ['email' => 'client@evento.test'],
            [
                'name' => 'Budi Pratama',
                'password' => Hash::make('password'),
                'role' => 'client',
                'email_verified_at' => now(),
            ]
        );

        // 2. Akun Event Organizer (EO) / Admin
        User::updateOrCreate(
            ['email' => 'eo@evento.test'],
            [
                'name' => 'Admin EO Evento',
                'password' => Hash::make('password'),
                'role' => 'eo',
                'email_verified_at' => now(),
            ]
        );

        // 3. Akun Vendor
        $vendorUser = User::updateOrCreate(
            ['email' => 'vendor@evento.test'],
            [
                'name' => 'Siti Dekorasi',
                'password' => Hash::make('password'),
                'role' => 'vendor',
                'email_verified_at' => now(),
            ]
        );

        Vendor::updateOrCreate(
            ['user_id' => $vendorUser->id],
            [
                'business_name' => 'Dekorasi Impian Kita',
                'category' => 'Decoration',
                'contact_number' => '081234567890',
                'address' => 'Jl. Sudirman No. 45, Jakarta',
                'image_url' => null,
            ]
        );
    }
}
