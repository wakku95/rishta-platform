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
        'family_background',
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
     * - Basic Profile (Required for activation): 60% total (10 items @ 6% each)
     *   [gender, date_of_birth, religion, sect, city, education, profession, marital_status, height, managed_by]
     * - Private Introduction (Optional): 10% total (2 items @ 5% each)
     *   [about (5%), family_background (5%)]
     * - Partner Preferences (Required for activation): 30% total (8 items)
     *   [preferred_gender (4%), min_age & max_age (4%), preferred_cities (4%), preferred_religion (3%),
     *    preferred_sect (3%), min_height & max_height (4%), preferred_education (4%), preferred_marital_status (4%)]
     */
    public function calculateCompletionPercentage(): int
    {
        $score = 0;

        // 1. Basic Profile (60% total - 10 items @ 6% each)
        $basicItems = [
            !empty($this->gender),
            !empty($this->date_of_birth),
            !empty($this->religion),
            !empty($this->sect),
            !empty($this->city),
            !empty($this->education),
            !empty($this->profession),
            !empty($this->marital_status),
            !empty($this->height) && $this->height > 0,
            !empty($this->managed_by),
        ];

        foreach ($basicItems as $completed) {
            if ($completed) {
                $score += 6;
            }
        }

        // 2. Private Introduction (10% total - 2 items @ 5% each)
        if (!empty($this->about) && mb_strlen(trim($this->about)) >= 10) {
            $score += 5;
        }
        if (!empty($this->family_background) && mb_strlen(trim($this->family_background)) >= 10) {
            $score += 5;
        }

        // 3. Partner Preferences (30% total)
        $prefs = $this->relationLoaded('preferences') ? $this->preferences : $this->preferences()->first();

        if ($prefs) {
            if (!empty($prefs->preferred_gender)) {
                $score += 4;
            }
            if (!empty($prefs->min_age) && !empty($prefs->max_age)) {
                $score += 4;
            }
            if (!empty($prefs->preferred_cities) && count($prefs->preferred_cities) > 0) {
                $score += 4;
            }
            if (!empty($prefs->preferred_religion)) {
                $score += 3;
            }
            if (!empty($prefs->preferred_sect)) {
                $score += 3;
            }
            if (!empty($prefs->min_height) || !empty($prefs->max_height)) {
                $score += 4;
            }
            if (!empty($prefs->preferred_education)) {
                $score += 4;
            }
            if (!empty($prefs->preferred_marital_status) && count($prefs->preferred_marital_status) > 0) {
                $score += 4;
            }
        }

        return min(100, $score);
    }
}

