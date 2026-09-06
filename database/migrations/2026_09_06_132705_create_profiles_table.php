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
        Schema::create('profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('profile_code', 32)->unique();
            $table->string('gender', 16);
            $table->date('date_of_birth');
            $table->string('religion', 64)->default('Islam');
            $table->string('sect', 64)->nullable();
            $table->string('city', 100);
            $table->string('education', 100);
            $table->string('profession', 150);
            $table->string('marital_status', 32);
            $table->unsignedSmallInteger('height'); // height in cm (e.g. 170)
            $table->text('about')->nullable();
            $table->string('managed_by', 32)->default('myself');
            $table->string('profile_status', 32)->default('draft');
            $table->timestamps();

            $table->index(['gender', 'city', 'profile_status']);
            $table->index('date_of_birth');
            $table->index('profile_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('profiles');
    }
};
