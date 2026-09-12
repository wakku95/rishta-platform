<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ProfileVerification extends Model
{
    use HasFactory;

    public const TYPE_IDENTITY = 'identity';
    public const TYPE_EDUCATION = 'education';

    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'user_id',
        'type',
        'status',
        'document_front_path',
        'document_back_path',
        'document_name',
        'rejection_reason',
        'submitted_at',
        'reviewed_at',
        'reviewed_by',
        'documents_purged_at',
    ];

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'documents_purged_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isApproved(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }

    public function isRejected(): bool
    {
        return $this->status === self::STATUS_REJECTED;
    }

    /**
     * Safely delete physical documents associated with this record.
     */
    public function deleteStoredDocuments(): void
    {
        $disk = Storage::disk('local');

        if ($this->document_front_path && $disk->exists($this->document_front_path)) {
            $disk->delete($this->document_front_path);
        }

        if ($this->document_back_path && $disk->exists($this->document_back_path)) {
            $disk->delete($this->document_back_path);
        }
    }
}
