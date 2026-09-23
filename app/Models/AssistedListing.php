<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssistedListing extends Model
{
    use HasFactory, \Illuminate\Database\Eloquent\SoftDeletes;

    protected $fillable = [
        'user_id',
        'created_by_admin_id',
        'full_name',
        'gender',
        'date_of_birth',
        'religion',
        'sect',
        'city',
        'education',
        'profession',
        'marital_status',
        'height',
        'public_about',
        'family_background',
        'managed_by',
        'contact_number',
        'contact_number_verified_at',
        'contact_otp_hash',
        'contact_otp_expires_at',
        'contact_otp_attempts',
        'contact_otp_sent_at',
        'listing_status',
        'consent_given_at',
        'admin_notes',
        'published_externally_at',
        'external_notes',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'contact_number_verified_at' => 'datetime',
        'contact_otp_expires_at' => 'datetime',
        'contact_otp_sent_at' => 'datetime',
        'consent_given_at' => 'datetime',
        'published_externally_at' => 'datetime',
    ];

    protected $hidden = [
        'contact_otp_hash',
    ];

    public static function boot()
    {
        parent::boot();

        static::creating(function ($listing) {
            if (empty($listing->listing_code)) {
                $listing->listing_code = self::generateUniqueListingCode();
            }
        });
    }

    public static function generateUniqueListingCode(): string
    {
        // Simple sequential format AP-1001, AP-1002
        $lastListing = self::withTrashed()
            ->where('listing_code', 'like', 'AP-%')
            ->orderByRaw('CAST(SUBSTRING(listing_code, 4) AS UNSIGNED) DESC')
            ->first();

        if (!$lastListing) {
            return 'AP-1001';
        }

        $lastNumber = (int) substr($lastListing->listing_code, 3);
        return 'AP-' . ($lastNumber + 1);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function createdByAdmin()
    {
        return $this->belongsTo(User::class, 'created_by_admin_id');
    }

    public function interests()
    {
        return $this->hasMany(AssistedListingInterest::class);
    }
}
