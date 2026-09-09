<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactUnlock extends Model
{
    use HasFactory;

    protected $fillable = [
        'rishta_request_id',
        'payment_id',
        'sender_phone',
        'sender_otp_hash',
        'sender_otp_expires_at',
        'sender_otp_attempts',
        'sender_otp_sent_at',
        'sender_verified_at',
        'receiver_phone',
        'receiver_otp_hash',
        'receiver_otp_expires_at',
        'receiver_otp_attempts',
        'receiver_otp_sent_at',
        'receiver_verified_at',
        'unlocked_at',
    ];

    protected function casts(): array
    {
        return [
            'sender_otp_expires_at' => 'datetime',
            'sender_otp_sent_at' => 'datetime',
            'sender_verified_at' => 'datetime',
            'receiver_otp_expires_at' => 'datetime',
            'receiver_otp_sent_at' => 'datetime',
            'receiver_verified_at' => 'datetime',
            'unlocked_at' => 'datetime',
            'sender_otp_attempts' => 'integer',
            'receiver_otp_attempts' => 'integer',
        ];
    }

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'sender_otp_hash',
        'receiver_otp_hash',
    ];

    public function rishtaRequest(): BelongsTo
    {
        return $this->belongsTo(RishtaRequest::class);
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    public function isUnlocked(): bool
    {
        return $this->unlocked_at !== null;
    }

    public function isSenderVerified(): bool
    {
        return $this->sender_verified_at !== null;
    }

    public function isReceiverVerified(): bool
    {
        return $this->receiver_verified_at !== null;
    }
}
