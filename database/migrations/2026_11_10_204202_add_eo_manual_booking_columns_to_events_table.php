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
        Schema::table('events', function (Blueprint $table) {
            $table->boolean('booked_by_eo')
                ->default(false)
                ->after('client_id');

            $table->string('manual_client_name', 120)
                ->nullable()
                ->after('booked_by_eo');

            $table->string('manual_client_contact', 100)
                ->nullable()
                ->after('manual_client_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn([
                'booked_by_eo',
                'manual_client_name',
                'manual_client_contact',
            ]);
        });
    }
};
