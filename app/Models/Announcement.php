<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Announcement extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'message',
        'type',
        'target_audience',
        'action_url',
        'action_label',
        'expires_at',
        'created_by',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public const AUDIENCE_ALL = 'all';
    public const AUDIENCE_MISSING_PHONE = 'missing_phone';
    public const AUDIENCE_UNVERIFIED_CNIC = 'unverified_cnic';
    public const AUDIENCE_GENDER_MALE = 'gender_male';
    public const AUDIENCE_GENDER_FEMALE = 'gender_female';
    public const AUDIENCE_PERSONAL = 'personal';

    public static function getAudiences(): array
    {
        return [
            self::AUDIENCE_ALL,
            self::AUDIENCE_MISSING_PHONE,
            self::AUDIENCE_UNVERIFIED_CNIC,
            self::AUDIENCE_GENDER_MALE,
            self::AUDIENCE_GENDER_FEMALE,
            self::AUDIENCE_PERSONAL,
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function reads(): HasMany
    {
        return $this->hasMany(AnnouncementRead::class);
    }

    /**
     * Determine if a given user matches this announcement's target audience.
     */
    public function matchesUser(User $user): bool
    {
        if ($this->user_id !== null) {
            return (int) $this->user_id === (int) $user->id;
        }

        return match ($this->target_audience) {
            self::AUDIENCE_ALL => true,
            self::AUDIENCE_MISSING_PHONE => empty($user->phone),
            self::AUDIENCE_UNVERIFIED_CNIC => !$user->profile?->identity_verified,
            self::AUDIENCE_GENDER_MALE => $user->profile?->gender === 'male',
            self::AUDIENCE_GENDER_FEMALE => $user->profile?->gender === 'female',
            default => true,
        };
    }

    /**
     * Helper to send an in-app notification directly to a user and dispatch device push notification.
     */
    public static function sendToUser(
        int $userId,
        string $title,
        string $message,
        string $type = 'info',
        ?string $actionUrl = null,
        ?string $actionLabel = null
    ): self {
        $announcement = self::create([
            'user_id' => $userId,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'target_audience' => self::AUDIENCE_PERSONAL,
            'action_url' => $actionUrl,
            'action_label' => $actionLabel,
        ]);

        try {
            \App\Services\Notification\PushNotificationService::sendToUser(
                $userId,
                $title,
                $message,
                [
                    'action' => 'in_app_notice',
                    'screen' => 'Notifications',
                    'action_url' => $actionUrl,
                    'type' => $type,
                ]
            );
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("Failed to auto-dispatch push in Announcement::sendToUser: {$e->getMessage()}");
        }

        return $announcement;
    }
}
