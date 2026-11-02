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
        Schema::table('vendor_packages', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('package_name');
            $table->boolean('is_active')->default(true)->after('price');
        });

        // Backfill slug dari package_name untuk paket yang sudah ada (unik per vendor)
        $packages = DB::table('vendor_packages')->orderBy('id')->get();
        $usedSlugsPerVendor = [];

        foreach ($packages as $pkg) {
            $vendorId = $pkg->vendor_id;
            if (! isset($usedSlugsPerVendor[$vendorId])) {
                $usedSlugsPerVendor[$vendorId] = [];
            }

            $baseSlug = Str::slug($pkg->package_name) ?: ('package-'.$pkg->id);
            $slug = $baseSlug;
            $counter = 1;

            while (in_array($slug, $usedSlugsPerVendor[$vendorId], true)) {
                $slug = "{$baseSlug}-{$counter}";
                $counter++;
            }

            $usedSlugsPerVendor[$vendorId][] = $slug;
            DB::table('vendor_packages')->where('id', $pkg->id)->update(['slug' => $slug]);
        }

        Schema::table('vendor_packages', function (Blueprint $table) {
            $table->string('slug')->nullable(false)->change();
            $table->unique(['vendor_id', 'slug']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vendor_packages', function (Blueprint $table) {
            $table->dropUnique(['vendor_id', 'slug']);
            $table->dropColumn(['slug', 'is_active']);
        });
    }
};
