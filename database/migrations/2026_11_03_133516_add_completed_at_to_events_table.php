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
            $table->timestamp('completed_at')->nullable()->after('end_date');
        });

        // Backfill tanggal selesai untuk acara yang sudah berstatus 'done'
        $doneEvents = DB::table('events')->where('kanban_status', 'done')->get();
        foreach ($doneEvents as $event) {
            $latestPayment = DB::table('payments')
                ->where('event_id', $event->id)
                ->where('status', 'paid')
                ->whereNotNull('verified_at')
                ->orderByDesc('verified_at')
                ->first();

            $completedAt = $latestPayment?->verified_at ?? $event->updated_at ?? $event->created_at;

            DB::table('events')
                ->where('id', $event->id)
                ->update(['completed_at' => $completedAt]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn('completed_at');
        });
    }
};
