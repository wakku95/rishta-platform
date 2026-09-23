<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssistedListingInterest extends Model
{
    use HasFactory;

    protected $fillable = [
        'assisted_listing_id',
        'user_id',
        'submitter_name',
        'submitter_contact',
        'submitter_email',
        'message',
        'status',
        'admin_notes',
        'reviewed_by',
        'reviewed_at',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
    ];

    // Status Constants
    public const STATUS_NEW = 'new';
    public const STATUS_CONTACTED = 'contacted';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_INTRODUCED = 'introduced';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_CANCELLED = 'cancelled';

    public static function getStatuses(): array
    {
        return [
            self::STATUS_NEW,
            self::STATUS_CONTACTED,
            self::STATUS_IN_PROGRESS,
            self::STATUS_INTRODUCED,
            self::STATUS_REJECTED,
            self::STATUS_CANCELLED,
        ];
    }

    public function assistedListing()
    {
        return $this->belongsTo(AssistedListing::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reviewedByAdmin()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
