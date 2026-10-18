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
            $table->text('sender_answers')->nullable()->after('receiver_questions');
            $table->string('photo_request_status', 32)->default('none')->after('admin_notes');
            $table->string('nic_request_status', 32)->default('none')->after('photo_request_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rishta_requests', function (Blueprint $table) {
            $table->dropColumn(['sender_answers', 'photo_request_status', 'nic_request_status']);
        });
    }
};
