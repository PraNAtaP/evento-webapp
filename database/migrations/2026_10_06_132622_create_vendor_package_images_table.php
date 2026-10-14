<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Membuat tabel untuk menyimpan foto tambahan paket vendor.
     */
    public function up(): void
    {
        Schema::create('vendor_package_images', function (Blueprint $table) {
            $table->id();

            // Menghubungkan foto dengan paket vendor
            $table->foreignId('vendor_package_id')
                ->constrained('vendor_packages')
                ->cascadeOnDelete();

            // Data foto dari Cloudinary
            $table->string('image_url');
            $table->string('image_public_id');

            $table->timestamps();
        });
    }

    /**
     * Menghapus tabel foto tambahan.
     */
    public function down(): void
    {
        Schema::dropIfExists('vendor_package_images');
    }
};