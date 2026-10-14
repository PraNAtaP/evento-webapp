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

        // 1. Rename budget -> estimated_budget pada tabel events
        Schema::table('events', function (Blueprint $table) {
            $table->renameColumn('budget', 'estimated_budget');
        });

        // 2. Tambah agreed_price dan dp_percentage pada tabel events
        Schema::table('events', function (Blueprint $table) {
            $table->decimal('agreed_price', 15, 2)
                ->nullable()
                ->after('estimated_budget');

            $table->decimal('dp_percentage', 5, 2)
                ->nullable()
                ->after('agreed_price');
        });

        // 3. Update Enum kanban_status
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE events DROP CONSTRAINT IF EXISTS events_kanban_status_check');
            DB::statement("ALTER TABLE events ADD CONSTRAINT events_kanban_status_check CHECK (kanban_status IN ('request', 'drafting_quotation', 'client_review', 'awaiting_dp', 'on_progress', 'done', 'dp_paid'))");
        } elseif ($driver === 'sqlite') {
            Schema::table('events', function (Blueprint $table) {
                $table->string('kanban_status', 50)->default('request')->change();
            });
        }

        // 4. Migrasi data lama kanban_status: dp_paid -> on_progress
        $convertedEventIds = DB::table('events')
            ->where('kanban_status', 'dp_paid')
            ->pluck('id')
            ->all();

        DB::table('events')
            ->where('kanban_status', 'dp_paid')
            ->update(['kanban_status' => 'on_progress']);

        // 5. Isi agreed_price untuk event yang sudah lewat tahap request
        $nonRequestEvents = DB::table('events')
            ->where('kanban_status', '!=', 'request')
            ->get();

        $defaultDpPercentage = (float) config('evento.dp_percentage', 30.0);

        foreach ($nonRequestEvents as $event) {
            $assignmentSum = DB::table('event_vendor_assignments')
                ->where('event_id', $event->id)
                ->where('eo_offer_status', '!=', 'rejected')
                ->sum('locked_price');

            $agreedPrice = $assignmentSum > 0 ? (float) $assignmentSum : (float) ($event->estimated_budget ?? 0);

            DB::table('events')
                ->where('id', $event->id)
                ->update(['agreed_price' => $agreedPrice]);

            $dpPercent = (float) ($event->dp_percentage ?? $defaultDpPercentage);

            // Cek apakah event ini hasil konversi dp_paid -> on_progress dan belum memiliki payments
            if (in_array($event->id, $convertedEventIds)) {
                $hasPayments = DB::table('payments')->where('event_id', $event->id)->exists();
                if (! $hasPayments && $agreedPrice > 0) {
                    $dpAmount = round(($agreedPrice * $dpPercent) / 100);
                    $pelunasanAmount = max(0, $agreedPrice - $dpAmount);

                    DB::table('payments')->insert([
                        [
                            'event_id' => $event->id,
                            'payment_type' => 'dp',
                            'nominal' => $dpAmount,
                            'status' => 'paid',
                            'verified_at' => now(),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ],
                        [
                            'event_id' => $event->id,
                            'payment_type' => 'pelunasan',
                            'nominal' => $pelunasanAmount,
                            'status' => 'unpaid',
                            'verified_at' => null,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ],
                    ]);
                }
            }

            // Untuk event berstatus done yang tidak punya payment lengkap, pastikan tercatat lunas
            if ($event->kanban_status === 'done' && $agreedPrice > 0) {
                $hasPayments = DB::table('payments')->where('event_id', $event->id)->exists();
                if (! $hasPayments) {
                    $dpAmount = round(($agreedPrice * $dpPercent) / 100);
                    $pelunasanAmount = max(0, $agreedPrice - $dpAmount);

                    DB::table('payments')->insert([
                        [
                            'event_id' => $event->id,
                            'payment_type' => 'dp',
                            'nominal' => $dpAmount,
                            'status' => 'paid',
                            'verified_at' => now(),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ],
                        [
                            'event_id' => $event->id,
                            'payment_type' => 'pelunasan',
                            'nominal' => $pelunasanAmount,
                            'status' => 'paid',
                            'verified_at' => now(),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ],
                    ]);
                } else {
                    DB::table('payments')
                        ->where('event_id', $event->id)
                        ->where('status', '!=', 'paid')
                        ->update(['status' => 'paid', 'verified_at' => now()]);
                }
            }
        }

        // 6. Buang 'dp_paid' dari enum kanban_status di PostgreSQL
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE events DROP CONSTRAINT IF EXISTS events_kanban_status_check');
            DB::statement("ALTER TABLE events ADD CONSTRAINT events_kanban_status_check CHECK (kanban_status IN ('request', 'drafting_quotation', 'client_review', 'awaiting_dp', 'on_progress', 'done'))");
        }

        // 7. Tambah nilai 'termin' pada payments.payment_type
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_type_check');
            DB::statement("ALTER TABLE payments ADD CONSTRAINT payments_payment_type_check CHECK (payment_type IN ('dp', 'pelunasan', 'termin'))");
        } elseif ($driver === 'sqlite') {
            Schema::table('payments', function (Blueprint $table) {
                $table->string('payment_type', 50)->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();

        // 1. Kembalikan constraint payments_payment_type_check
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_type_check');
            DB::statement("ALTER TABLE payments ADD CONSTRAINT payments_payment_type_check CHECK (payment_type IN ('dp', 'pelunasan'))");
        }

        // 2. Normalisasi kanban_status sebelum mengembalikan constraint lama
        DB::table('events')
            ->whereIn('kanban_status', ['drafting_quotation', 'client_review'])
            ->update(['kanban_status' => 'request']);

        DB::table('events')
            ->where('kanban_status', 'awaiting_dp')
            ->update(['kanban_status' => 'on_progress']);

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE events DROP CONSTRAINT IF EXISTS events_kanban_status_check');
            DB::statement("ALTER TABLE events ADD CONSTRAINT events_kanban_status_check CHECK (kanban_status IN ('request', 'dp_paid', 'on_progress', 'done'))");
        }

        // 3. Drop agreed_price dan dp_percentage
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['agreed_price', 'dp_percentage']);
        });

        // 4. Rename estimated_budget kembali menjadi budget
        Schema::table('events', function (Blueprint $table) {
            $table->renameColumn('estimated_budget', 'budget');
        });
    }
};
