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
     * Seed the application's database with complete test data.
     * Semua akun memiliki password standar: testing@123$
     */
    public function run(): void
    {
        $defaultPassword = Hash::make('testing@123$');

        // 1. Akun Customer / Client Utama
        User::updateOrCreate(
            ['email' => 'client@evento.test'],
            [
                'name' => 'Budi Pratama',
                'password' => $defaultPassword,
                'role' => 'client',
                'email_verified_at' => now(),
            ]
        );

        // 2. Akun Event Organizer (EO) / Admin Utama
        User::updateOrCreate(
            ['email' => 'eo@evento.test'],
            [
                'name' => 'Admin EO Evento',
                'password' => $defaultPassword,
                'role' => 'eo',
                'email_verified_at' => now(),
            ]
        );

        // 3. Akun Vendor Default
        $vendorUser = User::updateOrCreate(
            ['email' => 'vendor@evento.test'],
            [
                'name' => 'Siti Dekorasi',
                'password' => $defaultPassword,
                'role' => 'vendor',
                'email_verified_at' => now(),
            ]
        );

        $vendor = Vendor::where('slug', 'dekorasi-impian-kita')
            ->orWhere('user_id', $vendorUser->id)
            ->first();

        if (! $vendor) {
            $vendor = new Vendor;
        }

        $vendor->fill([
            'user_id' => $vendorUser->id,
            'business_name' => 'Dekorasi Impian Kita',
            'slug' => 'dekorasi-impian-kita',
            'category' => 'Decoration',
            'contact_number' => '081234567890',
            'address' => 'Jl. Sudirman No. 45, Jakarta Pusat',
            'image_url' => 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
            'status' => Vendor::STATUS_APPROVED,
            'is_active' => true,
            'approved_at' => now(),
            'bank_name' => 'Bank Central Asia (BCA)',
            'bank_account_number' => '1234567890',
            'bank_account_holder' => 'Siti Nurhaliza',
        ]);
        $vendor->save();

        // Panggil Seeder Lengkap
        $this->call([
            EventCategorySeeder::class,
            VendorCatalogSeeder::class,
            EventWorkflowSeeder::class,
        ]);
    }
}
