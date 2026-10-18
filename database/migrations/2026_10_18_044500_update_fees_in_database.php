<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('rishta_requests', function (Blueprint $table) {
            $table->decimal('photo_fee', 10, 2)->default(300.00)->change();
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->decimal('amount', 10, 2)->default(2500.00)->change();
        });

        DB::table('rishta_requests')->where('photo_fee', 500.00)->update(['photo_fee' => 300.00]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rishta_requests', function (Blueprint $table) {
            $table->decimal('photo_fee', 10, 2)->default(500.00)->change();
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->decimal('amount', 10, 2)->default(300.00)->change();
        });
    }
};
