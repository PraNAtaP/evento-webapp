<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('vendor_id')->nullable()->constrained('vendors')->nullOnDelete();
            $table->string('reviewee_type', 20)->default('vendor'); // 'vendor' atau 'eo'
            $table->unsignedTinyInteger('rating'); // 1 - 5
            $table->text('comment')->nullable();
            $table->timestamps();

            // Indeks untuk query pencarian ulasan
            $table->index(['event_id', 'client_id']);
            $table->index(['vendor_id', 'reviewee_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
