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
        Schema::create('assisted_listing_interests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assisted_listing_id')->constrained('assisted_listings')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            
            $table->string('submitter_name');
            $table->string('submitter_contact', 20); // Required for guests, normalized +923...
            $table->string('submitter_email')->nullable();
            $table->text('message')->nullable();
            
            $table->string('status', 32)->default('new');
            $table->text('admin_notes')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            
            $table->timestamps();
            
            $table->index(['assisted_listing_id', 'status']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assisted_listing_interests');
    }
};
