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
        Schema::create('social_media_publication_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->foreignId('profile_id')->nullable()->constrained('profiles')->cascadeOnDelete();
            $table->foreignId('assisted_listing_id')->nullable()->constrained('assisted_listings')->cascadeOnDelete();
            
            $table->string('status')->default('pending'); // pending, approved, published, rejected, removal_requested, removed
            $table->json('requested_platforms')->nullable(); // ["facebook", "instagram"]
            
            $table->boolean('consent_given')->default(false);
            $table->string('consent_version')->nullable();
            $table->timestamp('consented_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('rejection_reason')->nullable();
            
            $table->timestamp('approved_at')->nullable();
            
            $table->timestamp('published_at')->nullable();
            $table->foreignId('published_by')->nullable()->constrained('users')->nullOnDelete();
            
            $table->timestamp('removal_requested_at')->nullable();
            $table->timestamp('removed_at')->nullable();
            $table->foreignId('removed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('removal_reason')->nullable();
            
            $table->json('public_profile_snapshot')->nullable();
            $table->text('admin_notes')->nullable();

            $table->timestamps();
            
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('social_media_publication_requests');
    }
};
