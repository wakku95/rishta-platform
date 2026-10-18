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
            $table->string('photo_watermark_text', 255)->nullable()->after('photo_watermark_level');
            $table->string('sender_photo_watermark_text', 255)->nullable()->after('sender_photo_watermark_level');
            $table->string('receiver_photo_watermark_text', 255)->nullable()->after('receiver_photo_watermark_level');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rishta_requests', function (Blueprint $table) {
            $table->dropColumn([
                'photo_watermark_text',
                'sender_photo_watermark_text',
                'receiver_photo_watermark_text',
            ]);
        });
    }
};
