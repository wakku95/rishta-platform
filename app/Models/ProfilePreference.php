<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfilePreference extends Model
{
    use HasFactory;

    /**
     * Booted method for ProfilePreference model.
     */
    protected static function booted(): void
    {
        static::saving(function (ProfilePreference $preference) {
            if ($preference->preferred_religion && $preference->preferred_religion !== 'Islam') {
                $preference->preferred_sect = null;
            }
        });
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'profile_id',
        'preferred_gender',
        'min_age',
        'max_age',
        'preferred_cities',
        'preferred_religion',
        'preferred_sect',
        'min_height',
        'max_height',
        'preferred_education',
        'preferred_marital_status',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'min_age' => 'integer',
            'max_age' => 'integer',
            'min_height' => 'integer',
            'max_height' => 'integer',
            'preferred_cities' => 'array',
            'preferred_marital_status' => 'array',
        ];
    }

    /**
     * Get the profile that owns the partner preferences.
     */
    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }
}

