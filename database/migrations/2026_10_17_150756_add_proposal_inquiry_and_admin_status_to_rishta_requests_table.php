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
            $table->text('sender_intro')->nullable()->after('status');
            $table->text('sender_questions')->nullable()->after('sender_intro');
            $table->text('receiver_intro')->nullable()->after('sender_questions');
            $table->text('receiver_answers')->nullable()->after('receiver_intro');
            $table->text('receiver_questions')->nullable()->after('receiver_answers');
            $table->string('admin_status', 32)->default('approved')->after('receiver_questions');
            $table->text('admin_notes')->nullable()->after('admin_status');
            $table->foreignId('reviewed_by')->nullable()->after('admin_notes')->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');

            $table->index(['admin_status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rishta_requests', function (Blueprint $table) {
            $table->dropForeign(['reviewed_by']);
            $table->dropIndex(['admin_status', 'created_at']);
            $table->dropColumn([
                'sender_intro',
                'sender_questions',
                'receiver_intro',
                'receiver_answers',
                'receiver_questions',
                'admin_status',
                'admin_notes',
                'reviewed_by',
                'reviewed_at',
            ]);
        });
    }
};
