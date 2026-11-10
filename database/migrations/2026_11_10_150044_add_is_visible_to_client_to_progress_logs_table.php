<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('progress_logs', function (Blueprint $table) {
            // Tambahkan kolom boolean, default-nya false (tersembunyi)
            $table->boolean('is_visible_to_client')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('progress_logs', function (Blueprint $table) {
            $table->dropColumn('is_visible_to_client');
        });
    }
};