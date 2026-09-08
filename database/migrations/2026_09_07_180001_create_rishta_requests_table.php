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
        Schema::create('rishta_requests', function (Blueprint $table) {
            $table->id();
            $table->string('request_code', 16)->unique();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('receiver_id')->constrained('users')->cascadeOnDelete();
            $table->enum('status', ['pending', 'accepted', 'declined', 'cancelled', 'expired'])->default('pending');
            $table->string('active_pair_hash', 64)->nullable()->unique();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('declined_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            // Query indexes
            $table->index(['sender_id', 'status', 'created_at']);
            $table->index(['receiver_id', 'status', 'created_at']);
            // Permanent decline query index
            $table->index(['sender_id', 'receiver_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rishta_requests');
    }
};
