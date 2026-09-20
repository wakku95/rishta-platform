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
        Schema::table('rishta_requests', function (Blueprint $table) {
            $table->foreignId('initiated_by_admin_id')->nullable()->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rishta_requests', function (Blueprint $table) {
            $table->dropForeign(['initiated_by_admin_id']);
            $table->dropColumn('initiated_by_admin_id');
        });
    }
};
