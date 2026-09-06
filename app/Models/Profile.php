<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class Profile extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'profile_code',
        'gender',
        'date_of_birth',
        'religion',
        'sect',
        'city',
        'education',
        'profession',
        'marital_status',
        'height',
        'about',
        'managed_by',
        'profile_status',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date:Y-m-d',
            'height' => 'integer',
        ];
    }

    /**
     * Boot the model to auto-generate privacy-friendly, non-sequential profile codes.
     */
    protected static function booted(): void
    {
        static::creating(function (Profile $profile) {
            if (empty($profile->profile_code)) {
                $profile->profile_code = static::generateUniqueProfileCode();
            }
        });
    }

    /**
     * Generate a random alphanumeric code such as 'RK-7F4K92'.
     */
    public static function generateUniqueProfileCode(): string
    {
        do {
            $code = 'RK-' . strtoupper(Str::random(6));
        } while (static::where('profile_code', $code)->exists());

        return $code;
    }

    /**
     * Get the owning user.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the partner preferences for this profile.
     */
    public function preferences(): HasOne
    {
        return $this->hasOne(ProfilePreference::class);
    }

    /**
     * Calculate candidate's current age from date of birth.
     */
    public function getAgeAttribute(): ?int
    {
        if (!$this->date_of_birth) {
            return null;
        }

        return Carbon::parse($this->date_of_birth)->age;
    }

    /**
     * Format height from cm to feet/inches string e.g. "5'7\" (170 cm)".
     */
    public function getHeightFormattedAttribute(): ?string
    {
        if (!$this->height) {
            return null;
        }

        $totalInches = round($this->height / 2.54);
        $feet = floor($totalInches / 12);
        $inches = $totalInches % 12;

        return sprintf("%d'%d\" (%d cm)", $feet, $inches, $this->height);
    }

    /**
     * Deterministic profile completion score (0 to 100).
     * 
     * Breakdown:
     * - Mandatory Core Biodata: 70% total (10 items @ 7% each)
     *   [gender, date_of_birth, religion, city, education, profession, marital_status, height, managed_by, about]
     * - Partner Preferences: 30% total (6 items @ 5% each)
     *   [preferred_gender, min_age & max_age, preferred_cities, preferred_education, preferred_marital_status, min_height & max_height]
     */
    public function calculateCompletionPercentage(): int
    {
        $score = 0;

        // Core Biodata items (70% total)
        $coreItems = [
            !empty($this->gender),
            !empty($this->date_of_birth),
            !empty($this->religion),
            !empty($this->city),
            !empty($this->education),
            !empty($this->profession),
            !empty($this->marital_status),
            !empty($this->height) && $this->height > 0,
            !empty($this->managed_by),
            !empty($this->about) && mb_strlen(trim($this->about)) >= 10,
        ];

        foreach ($coreItems as $completed) {
            if ($completed) {
                $score += 7;
            }
        }

        // Partner Preferences items (30% total)
        $prefs = $this->relationLoaded('preferences') ? $this->preferences : $this->preferences()->first();

        if ($prefs) {
            if (!empty($prefs->preferred_gender)) {
                $score += 5;
            }
            if (!empty($prefs->min_age) && !empty($prefs->max_age)) {
                $score += 5;
            }
            if (!empty($prefs->preferred_cities) && count($prefs->preferred_cities) > 0) {
                $score += 5;
            }
            if (!empty($prefs->preferred_education)) {
                $score += 5;
            }
            if (!empty($prefs->preferred_marital_status) && count($prefs->preferred_marital_status) > 0) {
                $score += 5;
            }
            if (!empty($prefs->min_height) || !empty($prefs->max_height)) {
                $score += 5;
            }
        }

        return min(100, $score);
    }
}

