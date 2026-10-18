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
            $table->foreignId('photo_requested_by')->nullable()->after('photo_request_status')->constrained('users')->nullOnDelete();
            $table->string('sender_photo_path')->nullable()->after('photo_requested_by');
            $table->string('receiver_photo_path')->nullable()->after('sender_photo_path');
            $table->foreignId('nic_requested_by')->nullable()->after('nic_request_status')->constrained('users')->nullOnDelete();
            $table->boolean('nic_shared_by_sender')->default(false)->after('nic_requested_by');
            $table->boolean('nic_shared_by_receiver')->default(false)->after('nic_shared_by_sender');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rishta_requests', function (Blueprint $table) {
            $table->dropForeign(['photo_requested_by']);
            $table->dropForeign(['nic_requested_by']);
            $table->dropColumn([
                'photo_requested_by',
                'sender_photo_path',
                'receiver_photo_path',
                'nic_requested_by',
                'nic_shared_by_sender',
                'nic_shared_by_receiver',
            ]);
        });
    }
};
