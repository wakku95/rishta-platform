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
            if (!Schema::hasColumn('rishta_requests', 'photo_watermark_level')) {
                $table->string('photo_watermark_level', 20)->default('medium')->after('photo_moderation_status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rishta_requests', function (Blueprint $table) {
            if (Schema::hasColumn('rishta_requests', 'photo_watermark_level')) {
                $table->dropColumn('photo_watermark_level');
            }
        });
    }
};
