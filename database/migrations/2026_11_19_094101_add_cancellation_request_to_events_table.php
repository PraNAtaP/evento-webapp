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
            $table->string('cancellation_request_status', 20)->nullable()->after('cancelled_at');
            $table->text('cancellation_request_reason')->nullable()->after('cancellation_request_status');
            $table->timestamp('cancellation_requested_at')->nullable()->after('cancellation_request_reason');
            $table->text('cancellation_review_note')->nullable()->after('cancellation_requested_at');
            $table->timestamp('cancellation_reviewed_at')->nullable()->after('cancellation_review_note');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn([
                'cancellation_request_status',
                'cancellation_request_reason',
                'cancellation_requested_at',
                'cancellation_review_note',
                'cancellation_reviewed_at',
            ]);
        });
    }
};
