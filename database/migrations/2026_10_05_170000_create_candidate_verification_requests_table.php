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
        Schema::create('candidate_verification_requests', function (Blueprint $table) {
            $table->id();
            $table->string('token', 64)->unique()->index();
            $table->string('candidate_type', 30)->index(); // 'assisted' or 'profile'
            $table->unsignedBigInteger('candidate_id')->index();
            $table->string('candidate_code', 50)->index();
            $table->string('candidate_name')->nullable();
            $table->string('phone')->nullable();
            $table->string('document_type', 50)->default('cnic'); // 'cnic', 'salary_slip', 'degree', etc.
            $table->string('status', 30)->default('pending')->index(); // 'pending', 'submitted', 'approved', 'rejected'
            $table->string('document_front_path')->nullable();
            $table->string('document_back_path')->nullable();
            $table->text('notes')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamp('expires_at')->index();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('reviewed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('candidate_verification_requests');
    }
};
