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
        Schema::create('profile_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type', 32); // 'identity', 'education'
            $table->string('status', 32)->default('pending'); // 'pending', 'approved', 'rejected'
            $table->string('document_front_path')->nullable(); // Private disk path (identity front or single education doc)
            $table->string('document_back_path')->nullable();  // Private disk path (identity back)
            $table->string('document_name')->nullable();       // Safe sanitized label (e.g. "CNIC Card", "Degree Certificate")
            $table->text('rejection_reason')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['user_id', 'type']);
            $table->index(['status', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('profile_verifications');
    }
};
