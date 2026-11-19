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
        // 1. Tambah informasi rekening bank pada tabel vendors
        Schema::table('vendors', function (Blueprint $table) {
            $table->string('bank_name', 50)->nullable()->after('address');
            $table->string('bank_account_number', 50)->nullable()->after('bank_name');
            $table->string('bank_account_holder', 100)->nullable()->after('bank_account_number');
        });

        // 2. Tambah nomor invoice, nomor kuitansi, dan due_date pada tabel payments
        Schema::table('payments', function (Blueprint $table) {
            $table->string('invoice_number', 50)->nullable()->after('nominal');
            $table->string('receipt_number', 50)->nullable()->after('invoice_number');
            $table->date('due_date')->nullable()->after('receipt_number');
        });

        // 3. Tambah pelacakan pembayaran honor EO ke vendor pada event_vendor_assignments
        Schema::table('event_vendor_assignments', function (Blueprint $table) {
            $table->string('payout_status', 30)->default('unpaid')->after('locked_price'); // unpaid, paid
            $table->decimal('payout_nominal', 12, 2)->nullable()->after('payout_status');
            $table->timestamp('payout_at')->nullable()->after('payout_nominal');
            $table->string('payout_proof_url', 255)->nullable()->after('payout_at');
            $table->string('payout_receipt_number', 50)->nullable()->after('payout_proof_url');
            $table->text('payout_note')->nullable()->after('payout_receipt_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('event_vendor_assignments', function (Blueprint $table) {
            $table->dropColumn([
                'payout_status',
                'payout_nominal',
                'payout_at',
                'payout_proof_url',
                'payout_receipt_number',
                'payout_note',
            ]);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn([
                'invoice_number',
                'receipt_number',
                'due_date',
            ]);
        });

        Schema::table('vendors', function (Blueprint $table) {
            $table->dropColumn([
                'bank_name',
                'bank_account_number',
                'bank_account_holder',
            ]);
        });
    }
};
