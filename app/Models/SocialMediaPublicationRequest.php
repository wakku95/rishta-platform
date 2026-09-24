<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SocialMediaPublicationRequest extends Model
{

    protected $fillable = [
        'user_id',
        'profile_id',
        'assisted_listing_id',
        'status',
        'requested_platforms',
        'consent_given',
        'consent_version',
        'consented_at',
        'submitted_at',
        'reviewed_by',
        'reviewed_at',
        'rejection_reason',
        'approved_at',
        'published_at',
        'published_by',
        'removal_requested_at',
        'removed_at',
        'removed_by',
        'removal_reason',
        'public_profile_snapshot',
        'admin_notes',
    ];

    protected $casts = [
        'requested_platforms' => 'array',
        'consent_given' => 'boolean',
        'consented_at' => 'datetime',
        'submitted_at' => 'datetime',
        'reviewed_at' => 'datetime',
        'approved_at' => 'datetime',
        'published_at' => 'datetime',
        'removal_requested_at' => 'datetime',
        'removed_at' => 'datetime',
        'public_profile_snapshot' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function profile()
    {
        return $this->belongsTo(Profile::class);
    }

    public function assistedListing()
    {
        return $this->belongsTo(AssistedListing::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function publisher()
    {
        return $this->belongsTo(User::class, 'published_by');
    }

    public function remover()
    {
        return $this->belongsTo(User::class, 'removed_by');
    }
}
