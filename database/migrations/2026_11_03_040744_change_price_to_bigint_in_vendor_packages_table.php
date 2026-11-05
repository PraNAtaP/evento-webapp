<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('
            ALTER TABLE vendor_packages
            ALTER COLUMN price TYPE BIGINT
            USING ROUND(price)::BIGINT
        ');
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('
            ALTER TABLE vendor_packages
            ALTER COLUMN price TYPE DECIMAL(12, 2)
            USING price::DECIMAL(12, 2)
        ');
    }
};
