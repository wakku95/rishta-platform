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
        Schema::create('assisted_listings', function (Blueprint $table) {
            $table->id();
            $table->string('listing_code', 16)->unique();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by_admin_id')->nullable()->constrained('users')->nullOnDelete();
            
            // Biodata fields
            $table->string('full_name');
            $table->string('gender', 16);
            $table->date('date_of_birth');
            $table->string('religion', 64)->default('Islam');
            $table->string('sect', 64)->nullable();
            $table->string('city', 100);
            $table->string('education', 100);
            $table->string('profession', 150);
            $table->string('marital_status', 32);
            $table->unsignedSmallInteger('height'); // in cm
            $table->text('public_about')->nullable();
            $table->text('family_background')->nullable(); // admin-only
            $table->string('managed_by', 32)->default('family');
            
            // OTP/Contact fields
            $table->string('contact_number', 20)->nullable();
            $table->timestamp('contact_number_verified_at')->nullable();
            $table->string('contact_otp_hash')->nullable();
            $table->timestamp('contact_otp_expires_at')->nullable();
            $table->unsignedTinyInteger('contact_otp_attempts')->default(0);
            $table->timestamp('contact_otp_sent_at')->nullable();
            
            // Status and meta fields
            $table->string('listing_status', 32)->default('draft');
            $table->timestamp('consent_given_at')->nullable();
            $table->text('admin_notes')->nullable();
            $table->timestamp('published_externally_at')->nullable();
            $table->text('external_notes')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('listing_status');
            $table->index(['gender', 'city', 'listing_status']);
            $table->unique('user_id'); // Handles multiple NULLs in MySQL
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assisted_listings');
    }
};
