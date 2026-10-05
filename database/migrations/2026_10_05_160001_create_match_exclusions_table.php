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
        Schema::create('match_exclusions', function (Blueprint $table) {
            $table->id();
            $table->string('source_type'); // 'profile' or 'assisted'
            $table->unsignedBigInteger('source_id');
            $table->string('target_type'); // 'profile' or 'assisted'
            $table->unsignedBigInteger('target_id');
            $table->foreignId('excluded_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('reason')->nullable(); // 'not_interested', 'passed', 'admin_curated'
            $table->timestamps();

            $table->unique(['source_type', 'source_id', 'target_type', 'target_id'], 'match_exclusions_unique_pair');
            $table->index(['source_type', 'source_id']);
            $table->index(['target_type', 'target_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('match_exclusions');
    }
};
