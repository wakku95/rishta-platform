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
        Schema::table('assisted_listing_interests', function (Blueprint $table) {
            $table->text('admin_message')->nullable()->after('admin_notes');
            $table->string('last_sender', 20)->nullable()->after('admin_message'); // 'admin' | 'user'
            $table->json('conversation')->nullable()->after('last_sender');
            $table->timestamp('admin_messaged_at')->nullable()->after('conversation');
            $table->timestamp('user_replied_at')->nullable()->after('admin_messaged_at');

            $table->index('last_sender');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('assisted_listing_interests', function (Blueprint $table) {
            $table->dropIndex(['last_sender']);
            $table->dropColumn([
                'admin_message',
                'last_sender',
                'conversation',
                'admin_messaged_at',
                'user_replied_at',
            ]);
        });
    }
};
