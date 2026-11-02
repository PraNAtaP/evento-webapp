<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('vendors', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('business_name');
            $table->boolean('is_active')->default(true)->after('status');
        });

        // Backfill slug dari business_name untuk vendor yang sudah ada
        $vendors = DB::table('vendors')->orderBy('id')->get();
        $usedSlugs = [];

        foreach ($vendors as $vendor) {
            $baseSlug = Str::slug($vendor->business_name) ?: ('vendor-'.$vendor->id);
            $slug = $baseSlug;
            $counter = 1;

            while (in_array($slug, $usedSlugs, true)) {
                $slug = "{$baseSlug}-{$counter}";
                $counter++;
            }

            $usedSlugs[] = $slug;
            DB::table('vendors')->where('id', $vendor->id)->update(['slug' => $slug]);
        }

        Schema::table('vendors', function (Blueprint $table) {
            $table->string('slug')->nullable(false)->unique()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vendors', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropColumn(['slug', 'is_active']);
        });
    }
};
