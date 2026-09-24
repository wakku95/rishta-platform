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
        Schema::create('assisted_profile_submissions', function (Blueprint $table) {
            $table->id();
            $table->string('submitter_name');
            $table->string('submitter_contact', 20);
            $table->json('public_biodata');
            $table->boolean('terms_accepted')->default(false);
            $table->timestamp('terms_accepted_at')->nullable();
            $table->boolean('social_publication_consent')->default(false);
            $table->timestamp('social_publication_consent_at')->nullable();
            
            $table->string('status', 32)->default('pending'); // pending, approved, rejected
            $table->text('rejection_reason')->nullable();
            
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            
            $table->foreignId('resulting_assisted_listing_id')->nullable()->constrained('assisted_listings', 'id', 'aps_listing_id_foreign')->nullOnDelete();

            $table->timestamps();
            
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assisted_profile_submissions');
    }
};
