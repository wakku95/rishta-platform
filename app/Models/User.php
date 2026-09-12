<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'status',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the user's matrimonial profile.
     */
    public function profile(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Profile::class);
    }

    /**
     * Get the shortlists saved by the user.
     */
    public function shortlists(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Shortlist::class);
    }

    /**
     * Get the rishta requests sent by the user.
     */
    public function sentRequests(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(RishtaRequest::class, 'sender_id');
    }

    /**
     * Get the rishta requests received by the user.
     */
    public function receivedRequests(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(RishtaRequest::class, 'receiver_id');
    }

    /**
     * Get the payments made by the user.
     */
    public function payments(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Get all profile verifications submitted by the user.
     */
    public function verifications(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ProfileVerification::class);
    }

    /**
     * Check if user has an approved identity verification.
     */
    public function isIdentityVerified(): bool
    {
        return $this->verifications()
            ->where('type', ProfileVerification::TYPE_IDENTITY)
            ->where('status', ProfileVerification::STATUS_APPROVED)
            ->exists();
    }

    /**
     * Check if user has an approved education verification.
     */
    public function isEducationVerified(): bool
    {
        return $this->verifications()
            ->where('type', ProfileVerification::TYPE_EDUCATION)
            ->where('status', ProfileVerification::STATUS_APPROVED)
            ->exists();
    }

    /**
     * Get latest identity verification record.
     */
    public function latestIdentityVerification(): ?ProfileVerification
    {
        return $this->verifications()
            ->where('type', ProfileVerification::TYPE_IDENTITY)
            ->latest('id')
            ->first();
    }

    /**
     * Get latest education verification record.
     */
    public function latestEducationVerification(): ?ProfileVerification
    {
        return $this->verifications()
            ->where('type', ProfileVerification::TYPE_EDUCATION)
            ->latest('id')
            ->first();
    }
}

