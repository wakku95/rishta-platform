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
        Schema::table('profiles', function (Blueprint $table) {
            $table->foreignId('created_by_admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('confirmation_token', 128)->nullable()->unique();
            $table->timestamp('confirmation_expires_at')->nullable();
            $table->timestamp('confirmed_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->dropForeign(['created_by_admin_id']);
            $table->dropColumn([
                'created_by_admin_id',
                'confirmation_token',
                'confirmation_expires_at',
                'confirmed_at',
            ]);
        });
    }
};
