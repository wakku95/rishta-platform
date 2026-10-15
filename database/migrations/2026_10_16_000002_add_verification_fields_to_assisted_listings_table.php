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
        Schema::table('assisted_listings', function (Blueprint $table) {
            $table->timestamp('identity_verified_at')->nullable()->after('contact_number_verified_at');
            $table->timestamp('education_verified_at')->nullable()->after('identity_verified_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('assisted_listings', function (Blueprint $table) {
            $table->dropColumn(['identity_verified_at', 'education_verified_at']);
        });
    }
};
