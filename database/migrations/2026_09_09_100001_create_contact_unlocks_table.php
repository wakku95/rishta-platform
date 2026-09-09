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
        Schema::create('contact_unlocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rishta_request_id')->unique()->constrained('rishta_requests')->cascadeOnDelete();
            $table->foreignId('payment_id')->constrained('payments')->cascadeOnDelete();

            // Sender OTP & Phone State
            $table->string('sender_phone', 20)->nullable();
            $table->string('sender_otp_hash', 255)->nullable();
            $table->timestamp('sender_otp_expires_at')->nullable();
            $table->unsignedTinyInteger('sender_otp_attempts')->default(0);
            $table->timestamp('sender_otp_sent_at')->nullable();
            $table->timestamp('sender_verified_at')->nullable();

            // Receiver OTP & Phone State
            $table->string('receiver_phone', 20)->nullable();
            $table->string('receiver_otp_hash', 255)->nullable();
            $table->timestamp('receiver_otp_expires_at')->nullable();
            $table->unsignedTinyInteger('receiver_otp_attempts')->default(0);
            $table->timestamp('receiver_otp_sent_at')->nullable();
            $table->timestamp('receiver_verified_at')->nullable();

            // Unlock Timestamp
            $table->timestamp('unlocked_at')->nullable()->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contact_unlocks');
    }
};
