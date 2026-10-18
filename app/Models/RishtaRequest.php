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

    public const ADMIN_STATUS_PENDING = 'pending_review';
    public const ADMIN_STATUS_APPROVED = 'approved';
    public const ADMIN_STATUS_REJECTED = 'rejected';
    public const ADMIN_STATUS_NEEDS_REVISION = 'needs_revision';

    public const EXPIRATION_DAYS = 14;

    protected $fillable = [
        'request_code',
        'sender_id',
        'receiver_id',
        'status',
        'sender_intro',
        'sender_questions',
        'receiver_intro',
        'receiver_answers',
        'receiver_questions',
        'sender_answers',
        'photo_request_status',
        'photo_requested_by',
        'sender_requested_photo',
        'receiver_requested_photo',
        'sender_photo_path',
        'receiver_photo_path',
        'photo_moderation_status',
        'photo_watermark_level',
        'photo_watermark_text',
        'photo_rejection_notes',
        'sender_photo_moderation_status',
        'sender_photo_watermark_level',
        'sender_photo_watermark_text',
        'sender_photo_rejection_notes',
        'receiver_photo_moderation_status',
        'receiver_photo_watermark_level',
        'receiver_photo_watermark_text',
        'receiver_photo_rejection_notes',
        'photo_fee',
        'photo_paid',
        'photo_paid_at',
        'photo_paid_by',
        'sender_photo_paid',
        'sender_photo_paid_at',
        'receiver_photo_paid',
        'receiver_photo_paid_at',
        'nic_request_status',
        'nic_requested_by',
        'nic_shared_by_sender',
        'nic_shared_by_receiver',
        'admin_status',
        'admin_notes',
        'reviewed_by',
        'reviewed_at',
        'active_pair_hash',
        'accepted_at',
        'declined_at',
        'cancelled_at',
        'expires_at',
        'initiated_by_admin_id',
    ];

    protected $casts = [
        'sender_requested_photo' => 'boolean',
        'receiver_requested_photo' => 'boolean',
        'sender_photo_paid' => 'boolean',
        'receiver_photo_paid' => 'boolean',
        'sender_photo_paid_at' => 'datetime',
        'receiver_photo_paid_at' => 'datetime',
        'nic_shared_by_sender' => 'boolean',
        'nic_shared_by_receiver' => 'boolean',
        'photo_paid' => 'boolean',
        'photo_fee' => 'decimal:2',
        'photo_paid_at' => 'datetime',
        'accepted_at' => 'datetime',
        'declined_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'expires_at' => 'datetime',
        'reviewed_at' => 'datetime',
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
        return $this->hasOne(Payment::class)
            ->where('status', Payment::STATUS_PAID)
            ->where(function ($q) {
                $q->whereNull('purpose')->orWhere('purpose', 'contact_unlock');
            });
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

    /**
     * Get the admin who initiated this request (if assisted).
     */
    public function initiatedByAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'initiated_by_admin_id');
    }

    /**
     * Check if this request was initiated by an admin on behalf of a user.
     */
    public function isAdminInitiated(): bool
    {
        return !empty($this->initiated_by_admin_id);
    }

    /**
     * Get the admin who reviewed/moderated this proposal.
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
