<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AssistedProfileSubmission extends Model
{
    protected $fillable = [
        'submitter_name',
        'submitter_contact',
        'public_biodata',
        'terms_accepted',
        'terms_accepted_at',
        'social_publication_consent',
        'social_publication_consent_at',
        'status',
        'rejection_reason',
        'reviewed_by',
        'reviewed_at',
        'resulting_assisted_listing_id'
    ];

    protected $casts = [
        'public_biodata' => 'array',
        'terms_accepted' => 'boolean',
        'social_publication_consent' => 'boolean',
        'terms_accepted_at' => 'datetime',
        'social_publication_consent_at' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function resultingListing()
    {
        return $this->belongsTo(AssistedListing::class, 'resulting_assisted_listing_id');
    }
}
