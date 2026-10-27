<?php

namespace App\Console\Commands;

use App\Mail\VendorApprovedMail;
use App\Models\Vendor;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

#[Signature('mail:test {email : Alamat email tujuan untuk uji coba SMTP}')]
#[Description('Kirimkan email uji coba persetujuan vendor EVENTO untuk memverifikasi konfigurasi SMTP')]
class SendTestMail extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $targetEmail = $this->argument('email');

        $this->info("📧 Menguji konfigurasi SMTP pengiriman email ke: {$targetEmail}");
        $this->line('   - Host: '.config('mail.mailers.smtp.host').':'.config('mail.mailers.smtp.port'));
        $this->line('   - Username: '.(config('mail.mailers.smtp.username') ?? '(belum disetel)'));
        $this->line('   - From: '.config('mail.from.address'));

        $vendor = Vendor::with('user')->latest()->first();

        if (! $vendor) {
            $this->warn('Belum ada data vendor di database. Menggunakan data simulasi untuk pengetesan template email...');
            $vendor = new Vendor([
                'business_name' => 'Studio Foto & Dekorasi Nusantara',
                'category' => 'Dekorasi & Florist',
                'contact_number' => '081234567890',
                'social_media' => '@studio.nusantara',
                'address' => 'Jl. Sudirman No. 88, Jakarta Selatan',
                'approved_at' => now(),
            ]);
        }

        try {
            Mail::to($targetEmail)->send(new VendorApprovedMail($vendor));
            $this->info("✅ Berhasil! Email notifikasi persetujuan vendor telah sukses terkirim via SMTP ke {$targetEmail}.");

            return Command::SUCCESS;
        } catch (\Throwable $e) {
            $this->error('❌ Gagal mengirim email via SMTP:');
            $this->error('   '.$e->getMessage());
            $this->newLine();
            $this->warn('💡 Tips Penyelesaian:');
            $this->line('   1. Pastikan MAIL_HOST, MAIL_PORT, MAIL_USERNAME, dan MAIL_PASSWORD di file .env sudah diisi dengan benar.');
            $this->line("   2. Untuk Gmail: Gunakan host smtp.gmail.com port 587 dan buat 'App Password' 16-karakter di Akun Google.");
            $this->line('   3. Untuk Mailtrap/Brevo: Gunakan host dan credential yang disediakan dashboard Mailtrap/Brevo.');

            return Command::FAILURE;
        }
    }
}
