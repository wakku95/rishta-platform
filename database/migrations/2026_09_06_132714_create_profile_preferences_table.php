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
        Schema::create('profile_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('profile_id')->unique()->constrained('profiles')->cascadeOnDelete();
            $table->string('preferred_gender', 16);
            $table->unsignedTinyInteger('min_age')->default(18);
            $table->unsignedTinyInteger('max_age')->default(70);
            $table->json('preferred_cities')->nullable();
            $table->string('preferred_religion', 64)->default('Islam')->nullable();
            $table->string('preferred_sect', 64)->nullable();
            $table->unsignedSmallInteger('min_height')->nullable(); // in cm
            $table->unsignedSmallInteger('max_height')->nullable(); // in cm
            $table->string('preferred_education', 100)->nullable();
            $table->json('preferred_marital_status')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('profile_preferences');
    }
};
