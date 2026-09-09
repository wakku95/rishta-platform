<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class RishtaRequest extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_ACCEPTED = 'accepted';
    public const STATUS_DECLINED = 'declined';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_EXPIRED = 'expired';

    public const EXPIRATION_DAYS = 14;

    protected $fillable = [
        'request_code',
        'sender_id',
        'receiver_id',
        'status',
        'active_pair_hash',
        'accepted_at',
        'declined_at',
        'cancelled_at',
        'expires_at',
    ];

    protected $casts = [
        'accepted_at' => 'datetime',
        'declined_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    /**
     * Calculate active pair hash for two user IDs.
     */
    public static function generateActivePairHash(int $userId1, int $userId2): string
    {
        return min($userId1, $userId2) . '_' . max($userId1, $userId2);
    }

    /**
     * Generate unique public request code (REQ-XXXXXX).
     */
    public static function generateUniqueRequestCode(): string
    {
        do {
            $code = 'REQ-' . strtoupper(Str::random(6));
        } while (static::where('request_code', $code)->exists());

        return $code;
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public function payments(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function successfulPayment(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Payment::class)->where('status', Payment::STATUS_PAID);
    }

    public function contactUnlock(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(ContactUnlock::class);
    }

    /**
     * Check if request is currently pending and expired, and if so lazily expire it.
     */
    public function checkAndApplyLazyExpiration(): bool
    {
        if ($this->status === self::STATUS_PENDING && $this->expires_at && $this->expires_at->isPast()) {
            $this->update([
                'status' => self::STATUS_EXPIRED,
                'active_pair_hash' => null,
            ]);
            return true;
        }

        return false;
    }
}
