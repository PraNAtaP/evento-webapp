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
            $table->enum('category', ['wedding', 'seminar', 'birthday'])
                ->nullable()
                ->after('event_name');

            $table->unsignedInteger('guest_count')
                ->nullable()
                ->after('category');

            $table->decimal('budget', 15, 2)
                ->nullable()
                ->after('guest_count');

            $table->boolean('has_own_venue')
                ->default(false)
                ->after('budget');

            $table->string('venue', 255)
                ->nullable()
                ->after('has_own_venue');

            $table->boolean('is_multi_day')
                ->default(false)
                ->after('event_date');

            $table->date('end_date')
                ->nullable()
                ->after('is_multi_day');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn([
                'category',
                'guest_count',
                'budget',
                'has_own_venue',
                'venue',
                'is_multi_day',
                'end_date',
            ]);
        });
    }
};
