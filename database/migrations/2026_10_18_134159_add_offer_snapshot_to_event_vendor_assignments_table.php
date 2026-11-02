<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Menambah snapshot paket + catatan EO pada assignment, mencegah paket ganda per event,
     * dan membuat package_id tidak ikut terhapus (nullOnDelete) saat paket dihapus vendor.
     */
    public function up(): void
    {
        $hasDuplicates = DB::table('event_vendor_assignments')
            ->select('event_id', 'package_id')
            ->groupBy('event_id', 'package_id')
            ->havingRaw('COUNT(*) > 1')
            ->exists();

        if ($hasDuplicates) {
            throw new RuntimeException('Ada assignment ganda (event_id, package_id). Bersihkan dulu sebelum menjalankan migration ini.');
        }

        Schema::table('event_vendor_assignments', function (Blueprint $table) {
            $table->string('package_name', 150)->nullable()->after('package_id');
            $table->decimal('package_price', 12, 2)->nullable()->after('package_name');
            $table->string('notes', 500)->nullable()->after('locked_price');
        });

        // Backfill snapshot dari paket yang sudah ada
        DB::table('event_vendor_assignments')
            ->whereNull('package_name')
            ->orderBy('id')
            ->each(function ($row) {
                $package = DB::table('vendor_packages')
                    ->where('id', $row->package_id)
                    ->first(['package_name', 'price']);

                if ($package) {
                    DB::table('event_vendor_assignments')
                        ->where('id', $row->id)
                        ->update([
                            'package_name' => $package->package_name,
                            'package_price' => $package->price,
                        ]);
                }
            });

        Schema::table('event_vendor_assignments', function (Blueprint $table) {
            $table->dropForeign(['package_id']);
        });

        Schema::table('event_vendor_assignments', function (Blueprint $table) {
            $table->unsignedBigInteger('package_id')->nullable()->change();
        });

        Schema::table('event_vendor_assignments', function (Blueprint $table) {
            $table->foreign('package_id')->references('id')->on('vendor_packages')->nullOnDelete();
            $table->unique(['event_id', 'package_id']);
            $table->index('vendor_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * Catatan: package_id kembali NOT NULL, sehingga rollback gagal bila sudah ada
     * assignment dengan package_id null (paket sudah dihapus).
     */
    public function down(): void
    {
        Schema::table('event_vendor_assignments', function (Blueprint $table) {
            $table->dropUnique(['event_id', 'package_id']);
            $table->dropIndex(['vendor_id']);
            $table->dropForeign(['package_id']);
        });

        Schema::table('event_vendor_assignments', function (Blueprint $table) {
            $table->unsignedBigInteger('package_id')->nullable(false)->change();
        });

        Schema::table('event_vendor_assignments', function (Blueprint $table) {
            $table->foreign('package_id')->references('id')->on('vendor_packages')->cascadeOnDelete();
            $table->dropColumn(['package_name', 'package_price', 'notes']);
        });
    }
};
