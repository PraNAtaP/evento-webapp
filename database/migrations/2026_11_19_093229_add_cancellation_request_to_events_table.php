<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->text('cancellation_request_reason')->nullable()->after('cancellation_reason');
            $table->timestamp('cancellation_requested_at')->nullable()->after('cancellation_request_reason');
            $table->string('cancellation_request_status', 20)->nullable()->after('cancellation_requested_at'); // pending | approved | rejected
            $table->text('cancellation_review_note')->nullable()->after('cancellation_request_status');
            $table->timestamp('cancellation_reviewed_at')->nullable()->after('cancellation_review_note');
        });

        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE events DROP CONSTRAINT IF EXISTS events_cancellation_request_status_check');
            DB::statement("ALTER TABLE events ADD CONSTRAINT events_cancellation_request_status_check CHECK (cancellation_request_status IN ('pending', 'approved', 'rejected'))");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn([
                'cancellation_request_reason',
                'cancellation_requested_at',
                'cancellation_request_status',
                'cancellation_review_note',
                'cancellation_reviewed_at',
            ]);
        });
    }
};
