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

    public static function getAudiences(): array
    {
        return [
            self::AUDIENCE_ALL,
            self::AUDIENCE_MISSING_PHONE,
            self::AUDIENCE_UNVERIFIED_CNIC,
            self::AUDIENCE_GENDER_MALE,
            self::AUDIENCE_GENDER_FEMALE,
        ];
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
        return match ($this->target_audience) {
            self::AUDIENCE_ALL => true,
            self::AUDIENCE_MISSING_PHONE => empty($user->phone),
            self::AUDIENCE_UNVERIFIED_CNIC => !$user->profile?->identity_verified,
            self::AUDIENCE_GENDER_MALE => $user->profile?->gender === 'male',
            self::AUDIENCE_GENDER_FEMALE => $user->profile?->gender === 'female',
            default => true,
        };
    }
}
