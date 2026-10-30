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
        $driver = DB::getDriverName();

        // Tambahkan kolom rejection_reason jika EO menolak pesanan
        Schema::table('events', function (Blueprint $table) {
            $table->text('rejection_reason')->nullable()->after('kanban_status');
        });

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE events DROP CONSTRAINT IF EXISTS events_kanban_status_check');
            DB::statement("ALTER TABLE events ADD CONSTRAINT events_kanban_status_check CHECK (kanban_status IN ('request', 'drafting_quotation', 'client_review', 'awaiting_dp', 'on_progress', 'done', 'rejected'))");
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
            DB::statement("ALTER TABLE events ADD CONSTRAINT events_kanban_status_check CHECK (kanban_status IN ('request', 'drafting_quotation', 'client_review', 'awaiting_dp', 'on_progress', 'done'))");
        }

        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn('rejection_reason');
        });
    }
};
