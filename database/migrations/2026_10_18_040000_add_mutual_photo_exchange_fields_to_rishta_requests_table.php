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
            if (!Schema::hasColumn('rishta_requests', 'sender_requested_photo')) {
                $table->boolean('sender_requested_photo')->default(false)->after('photo_requested_by');
            }
            if (!Schema::hasColumn('rishta_requests', 'receiver_requested_photo')) {
                $table->boolean('receiver_requested_photo')->default(false)->after('sender_requested_photo');
            }
            if (!Schema::hasColumn('rishta_requests', 'sender_photo_moderation_status')) {
                $table->string('sender_photo_moderation_status', 32)->default('none')->after('receiver_requested_photo');
            }
            if (!Schema::hasColumn('rishta_requests', 'sender_photo_watermark_level')) {
                $table->string('sender_photo_watermark_level', 20)->default('medium')->after('sender_photo_moderation_status');
            }
            if (!Schema::hasColumn('rishta_requests', 'sender_photo_rejection_notes')) {
                $table->text('sender_photo_rejection_notes')->nullable()->after('sender_photo_watermark_level');
            }
            if (!Schema::hasColumn('rishta_requests', 'receiver_photo_moderation_status')) {
                $table->string('receiver_photo_moderation_status', 32)->default('none')->after('sender_photo_rejection_notes');
            }
            if (!Schema::hasColumn('rishta_requests', 'receiver_photo_watermark_level')) {
                $table->string('receiver_photo_watermark_level', 20)->default('medium')->after('receiver_photo_moderation_status');
            }
            if (!Schema::hasColumn('rishta_requests', 'receiver_photo_rejection_notes')) {
                $table->text('receiver_photo_rejection_notes')->nullable()->after('receiver_photo_watermark_level');
            }
            if (!Schema::hasColumn('rishta_requests', 'sender_photo_paid')) {
                $table->boolean('sender_photo_paid')->default(false)->after('receiver_photo_rejection_notes');
            }
            if (!Schema::hasColumn('rishta_requests', 'sender_photo_paid_at')) {
                $table->timestamp('sender_photo_paid_at')->nullable()->after('sender_photo_paid');
            }
            if (!Schema::hasColumn('rishta_requests', 'receiver_photo_paid')) {
                $table->boolean('receiver_photo_paid')->default(false)->after('sender_photo_paid_at');
            }
            if (!Schema::hasColumn('rishta_requests', 'receiver_photo_paid_at')) {
                $table->timestamp('receiver_photo_paid_at')->nullable()->after('receiver_photo_paid');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rishta_requests', function (Blueprint $table) {
            $cols = [
                'sender_requested_photo',
                'receiver_requested_photo',
                'sender_photo_moderation_status',
                'sender_photo_watermark_level',
                'sender_photo_rejection_notes',
                'receiver_photo_moderation_status',
                'receiver_photo_watermark_level',
                'receiver_photo_rejection_notes',
                'sender_photo_paid',
                'sender_photo_paid_at',
                'receiver_photo_paid',
                'receiver_photo_paid_at',
            ];
            foreach ($cols as $col) {
                if (Schema::hasColumn('rishta_requests', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
