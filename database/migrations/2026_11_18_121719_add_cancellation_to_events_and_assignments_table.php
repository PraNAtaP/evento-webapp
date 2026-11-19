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
            $table->text('cancellation_reason')->nullable()->after('rejection_reason');
            $table->timestamp('cancelled_at')->nullable()->after('completed_at');
        });

        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE events DROP CONSTRAINT IF EXISTS events_kanban_status_check');
            DB::statement("ALTER TABLE events ADD CONSTRAINT events_kanban_status_check CHECK (kanban_status IN ('request', 'drafting_quotation', 'client_review', 'awaiting_dp', 'on_progress', 'done', 'rejected', 'cancelled'))");

            DB::statement('ALTER TABLE event_vendor_assignments DROP CONSTRAINT IF EXISTS event_vendor_assignments_eo_offer_status_check');
            DB::statement("ALTER TABLE event_vendor_assignments ADD CONSTRAINT event_vendor_assignments_eo_offer_status_check CHECK (eo_offer_status IN ('pending', 'accepted', 'rejected', 'cancelled'))");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE events DROP CONSTRAINT IF EXISTS events_kanban_status_check');
            DB::statement("ALTER TABLE events ADD CONSTRAINT events_kanban_status_check CHECK (kanban_status IN ('request', 'drafting_quotation', 'client_review', 'awaiting_dp', 'on_progress', 'done', 'rejected'))");

            DB::statement('ALTER TABLE event_vendor_assignments DROP CONSTRAINT IF EXISTS event_vendor_assignments_eo_offer_status_check');
            DB::statement("ALTER TABLE event_vendor_assignments ADD CONSTRAINT event_vendor_assignments_eo_offer_status_check CHECK (eo_offer_status IN ('pending', 'accepted', 'rejected'))");
        }

        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['cancellation_reason', 'cancelled_at']);
        });
    }
};
