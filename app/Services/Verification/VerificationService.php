<?php

namespace App\Services\Verification;

use App\Models\ProfileVerification;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;

class VerificationService
{
    protected string $disk = 'local';

    /**
     * Submit an Identity verification (CNIC front + back).
     *
     * Rules:
     * - If user is already approved for identity, reject duplicate attempt.
     * - If user has a pending identity verification, safely delete its old private files and update it with the new ones.
     * - If previous submission was rejected, create a fresh pending record (old rejected record remains for audit integrity).
     */
    public function submitIdentity(User $user, UploadedFile $frontFile, UploadedFile $backFile): ProfileVerification
    {
        if ($user->isIdentityVerified()) {
            throw new InvalidArgumentException('Your identity has already been verified and approved.');
        }

        $pending = ProfileVerification::where('user_id', $user->id)
            ->where('type', ProfileVerification::TYPE_IDENTITY)
            ->where('status', ProfileVerification::STATUS_PENDING)
            ->first();

        // If pending exists, replace its files cleanly
        if ($pending) {
            $pending->deleteStoredDocuments();
            $frontPath = $this->storePrivateFile($frontFile, $user->id, 'identity_front');
            $backPath = $this->storePrivateFile($backFile, $user->id, 'identity_back');

            $pending->update([
                'document_front_path' => $frontPath,
                'document_back_path' => $backPath,
                'document_name' => 'CNIC Front & Back',
                'rejection_reason' => null,
                'submitted_at' => now(),
            ]);

            return $pending;
        }

        // Fresh pending submission
        $frontPath = $this->storePrivateFile($frontFile, $user->id, 'identity_front');
        $backPath = $this->storePrivateFile($backFile, $user->id, 'identity_back');

        return ProfileVerification::create([
            'user_id' => $user->id,
            'type' => ProfileVerification::TYPE_IDENTITY,
            'status' => ProfileVerification::STATUS_PENDING,
            'document_front_path' => $frontPath,
            'document_back_path' => $backPath,
            'document_name' => 'CNIC Front & Back',
            'submitted_at' => now(),
        ]);
    }

    /**
     * Submit an Education verification (Degree/Diploma/Transcript document).
     *
     * Rules:
     * - If user is already approved for education, reject duplicate attempt.
     * - If pending exists, clean old file and update with new submission.
     * - If previous was rejected, create fresh pending record.
     */
    public function submitEducation(User $user, UploadedFile $documentFile, ?string $documentLabel = null): ProfileVerification
    {
        if ($user->isEducationVerified()) {
            throw new InvalidArgumentException('Your education credential has already been verified and approved.');
        }

        $pending = ProfileVerification::where('user_id', $user->id)
            ->where('type', ProfileVerification::TYPE_EDUCATION)
            ->where('status', ProfileVerification::STATUS_PENDING)
            ->first();

        $safeLabel = $documentLabel ? Str::limit(trim($documentLabel), 100) : 'Degree / Transcript Certificate';

        if ($pending) {
            $pending->deleteStoredDocuments();
            $docPath = $this->storePrivateFile($documentFile, $user->id, 'education');

            $pending->update([
                'document_front_path' => $docPath,
                'document_back_path' => null,
                'document_name' => $safeLabel,
                'rejection_reason' => null,
                'submitted_at' => now(),
            ]);

            return $pending;
        }

        $docPath = $this->storePrivateFile($documentFile, $user->id, 'education');

        return ProfileVerification::create([
            'user_id' => $user->id,
            'type' => ProfileVerification::TYPE_EDUCATION,
            'status' => ProfileVerification::STATUS_PENDING,
            'document_front_path' => $docPath,
            'document_back_path' => null,
            'document_name' => $safeLabel,
            'submitted_at' => now(),
        ]);
    }

    /**
     * User withdrawal of a pending verification request.
     */
    public function withdrawPending(User $user, int $verificationId): bool
    {
        $verification = ProfileVerification::where('id', $verificationId)
            ->where('user_id', $user->id)
            ->first();

        if (!$verification) {
            return false;
        }

        if (!$verification->isPending()) {
            throw new InvalidArgumentException('Only pending verifications can be withdrawn.');
        }

        // Clean up uploaded files and delete the record
        $verification->deleteStoredDocuments();
        $verification->delete();

        return true;
    }

    /**
     * Admin Approval.
     */
    public function approve(ProfileVerification $verification, User $admin): ProfileVerification
    {
        $verification->update([
            'status' => ProfileVerification::STATUS_APPROVED,
            'reviewed_at' => now(),
            'reviewed_by' => $admin->id,
            'rejection_reason' => null,
        ]);

        return $verification;
    }

    /**
     * Admin Rejection with controlled reason.
     */
    public function reject(ProfileVerification $verification, User $admin, string $reason): ProfileVerification
    {
        $verification->update([
            'status' => ProfileVerification::STATUS_REJECTED,
            'reviewed_at' => now(),
            'reviewed_by' => $admin->id,
            'rejection_reason' => trim($reason),
        ]);

        return $verification;
    }

    /**
     * Purge physical document files for approved verifications older than $days.
     * Preserves audit record, verification status, and timestamps.
     *
     * @param int $days Number of days after approval (0 means all approved documents).
     * @return array Summary of purged records and files unlinked.
     */
    public function purgeApprovedDocuments(int $days = 30): array
    {
        $query = ProfileVerification::query()
            ->where('status', ProfileVerification::STATUS_APPROVED)
            ->where(function ($q) {
                $q->whereNotNull('document_front_path')
                  ->orWhereNotNull('document_back_path');
            });

        if ($days > 0) {
            $threshold = now()->subDays($days);
            $query->where('reviewed_at', '<=', $threshold);
        }

        $verifications = $query->get();
        $purgedRecords = 0;
        $freedFiles = 0;

        foreach ($verifications as $verification) {
            if ($verification->document_front_path && Storage::disk($this->disk)->exists($verification->document_front_path)) {
                Storage::disk($this->disk)->delete($verification->document_front_path);
                $freedFiles++;
            }

            if ($verification->document_back_path && Storage::disk($this->disk)->exists($verification->document_back_path)) {
                Storage::disk($this->disk)->delete($verification->document_back_path);
                $freedFiles++;
            }

            $verification->update([
                'document_front_path' => null,
                'document_back_path' => null,
                'documents_purged_at' => now(),
            ]);

            $purgedRecords++;
        }

        return [
            'purged_records' => $purgedRecords,
            'freed_files' => $freedFiles,
        ];
    }

    /**
     * Store file securely on private disk with randomized filename.
     */
    protected function storePrivateFile(UploadedFile $file, int $userId, string $prefix): string
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $randomName = $prefix . '_' . Str::random(32) . '.' . $extension;
        $directory = 'verifications/' . $userId;

        return Storage::disk($this->disk)->putFileAs($directory, $file, $randomName);
    }
}
