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
        // 1. Add purpose column to payments table
        Schema::table('payments', function (Blueprint $table) {
            if (!Schema::hasColumn('payments', 'purpose')) {
                $table->string('purpose', 32)->default('contact_unlock')->after('status');
                $table->index(['rishta_request_id', 'purpose', 'status'], 'payments_request_purpose_status_idx');
            }
        });

        // 2. Add photo moderation & payment columns to rishta_requests
        Schema::table('rishta_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('rishta_requests', 'photo_moderation_status')) {
                $table->string('photo_moderation_status', 32)->default('none')->after('photo_request_status');
            }
            if (!Schema::hasColumn('rishta_requests', 'photo_rejection_notes')) {
                $table->text('photo_rejection_notes')->nullable()->after('photo_moderation_status');
            }
            if (!Schema::hasColumn('rishta_requests', 'photo_fee')) {
                $table->decimal('photo_fee', 10, 2)->default(500.00)->after('photo_rejection_notes');
            }
            if (!Schema::hasColumn('rishta_requests', 'photo_paid')) {
                $table->boolean('photo_paid')->default(false)->after('photo_fee');
            }
            if (!Schema::hasColumn('rishta_requests', 'photo_paid_at')) {
                $table->timestamp('photo_paid_at')->nullable()->after('photo_paid');
            }
            if (!Schema::hasColumn('rishta_requests', 'photo_paid_by')) {
                $table->foreignId('photo_paid_by')->nullable()->after('photo_paid_at')->constrained('users')->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            if (Schema::hasColumn('payments', 'purpose')) {
                $table->dropIndex('payments_request_purpose_status_idx');
                $table->dropColumn('purpose');
            }
        });

        Schema::table('rishta_requests', function (Blueprint $table) {
            if (Schema::hasColumn('rishta_requests', 'photo_paid_by')) {
                $table->dropForeign(['photo_paid_by']);
                $table->dropColumn('photo_paid_by');
            }
            $colsToDrop = [];
            foreach (['photo_moderation_status', 'photo_rejection_notes', 'photo_fee', 'photo_paid', 'photo_paid_at'] as $col) {
                if (Schema::hasColumn('rishta_requests', $col)) {
                    $colsToDrop[] = $col;
                }
            }
            if (!empty($colsToDrop)) {
                $table->dropColumn($colsToDrop);
            }
        });
    }
};
