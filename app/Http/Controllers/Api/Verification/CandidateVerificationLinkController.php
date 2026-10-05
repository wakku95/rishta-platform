<?php

namespace App\Http\Controllers\Api\Verification;

use App\Http\Controllers\Controller;
use App\Models\AssistedListing;
use App\Models\CandidateVerificationRequest;
use App\Models\Profile;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class CandidateVerificationLinkController extends Controller
{
    use ApiResponse;

    protected string $storageDisk = 'local';
    protected string $storageFolder = 'verification_documents/links';

    /**
     * Admin: Generate or retrieve an active verification link for a candidate.
     */
    public function generateLink(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'candidate_type' => 'required|string|in:assisted,profile,registered',
            'candidate_id'   => 'required|integer',
            'document_type'  => 'nullable|string|max:50',
        ]);

        $type = $validated['candidate_type'] === 'registered' ? 'profile' : $validated['candidate_type'];
        $id = (int) $validated['candidate_id'];
        $docType = $validated['document_type'] ?? 'cnic';

        $candidateCode = '';
        $candidateName = null;
        $phone = null;

        if ($type === 'assisted') {
            $listing = AssistedListing::find($id);
            if (!$listing) {
                return $this->errorResponse('Assisted listing not found.', [], Response::HTTP_NOT_FOUND);
            }
            $candidateCode = $listing->listing_code;
            $candidateName = $listing->full_name ?? "Candidate #{$listing->listing_code}";
            $phone = $listing->contact_number;
        } else {
            $profile = Profile::with('user')->find($id);
            if (!$profile) {
                return $this->errorResponse('Profile not found.', [], Response::HTTP_NOT_FOUND);
            }
            $candidateCode = $profile->profile_code;
            $candidateName = $profile->user?->name ?? "Profile #{$profile->profile_code}";
            $phone = $profile->user?->phone;
        }

        // Check if an active unexpired request already exists
        $existing = CandidateVerificationRequest::where('candidate_type', $type)
            ->where('candidate_id', $id)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        if ($existing) {
            $record = $existing;
        } else {
            $token = Str::random(48);
            $record = CandidateVerificationRequest::create([
                'token' => $token,
                'candidate_type' => $type,
                'candidate_id' => $id,
                'candidate_code' => $candidateCode,
                'candidate_name' => $candidateName,
                'phone' => $phone,
                'document_type' => $docType,
                'status' => 'pending',
                'expires_at' => now()->addDays(7),
            ]);
        }

        $appUrl = rtrim(config('app.url', url('/')), '/');
        $verifyUrl = "{$appUrl}/verify-doc/{$record->token}";

        $whatsappMsg = "Assalam-o-Alaikum, RaabtaNow Matrimonial profile verification ke liye baraye meherbani is secure link par apna CNIC / Document upload karein: {$verifyUrl}\n\nNote: Aapka document confidential rahega aur kisi public user ko show nahi kiya jayega.";

        return $this->successResponse([
            'id' => $record->id,
            'token' => $record->token,
            'url' => $verifyUrl,
            'whatsapp_message' => $whatsappMsg,
            'phone' => $phone,
            'candidate_code' => $candidateCode,
            'candidate_name' => $candidateName,
            'status' => $record->status,
            'expires_at' => $record->expires_at->toIso8601String(),
        ], 'Verification link generated successfully.');
    }

    /**
     * Admin: List verification requests with status filters.
     */
    public function listLinks(Request $request): JsonResponse
    {
        $query = CandidateVerificationRequest::with('reviewer:id,name,email');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('candidate_code', 'like', "%{$search}%")
                  ->orWhere('candidate_name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $perPage = min((int) $request->input('per_page', 15), 50);
        $records = $query->latest()->paginate($perPage);

        return $this->successResponse($records, 'Verification requests retrieved.');
    }

    /**
     * Admin: Stream private document.
     */
    public function viewDocument(Request $request, int $id, string $side = 'front')
    {
        $record = CandidateVerificationRequest::find($id);
        if (!$record) {
            return response()->json(['message' => 'Record not found.'], Response::HTTP_NOT_FOUND);
        }

        $path = $side === 'back' ? $record->document_back_path : $record->document_front_path;
        if (!$path || !Storage::disk($this->storageDisk)->exists($path)) {
            return response()->json(['message' => 'Document file not found.'], Response::HTTP_NOT_FOUND);
        }

        $mimeType = Storage::disk($this->storageDisk)->mimeType($path) ?: 'application/octet-stream';

        return Storage::disk($this->storageDisk)->response($path, null, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline',
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'no-store, no-cache, private',
        ]);
    }

    /**
     * Admin: Approve verification.
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        $record = CandidateVerificationRequest::find($id);
        if (!$record) {
            return $this->errorResponse('Verification record not found.', [], Response::HTTP_NOT_FOUND);
        }

        $record->update([
            'status' => 'approved',
            'reviewed_at' => now(),
            'reviewed_by_user_id' => $request->user()?->id,
            'notes' => $request->input('notes'),
        ]);

        return $this->successResponse($record, 'Candidate verification approved successfully.');
    }

    /**
     * Admin: Reject verification.
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $record = CandidateVerificationRequest::find($id);
        if (!$record) {
            return $this->errorResponse('Verification record not found.', [], Response::HTTP_NOT_FOUND);
        }

        $record->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['reason'],
            'reviewed_at' => now(),
            'reviewed_by_user_id' => $request->user()?->id,
        ]);

        return $this->successResponse($record, 'Candidate verification rejected.');
    }

    /**
     * Public: Get verification details by token (no login required).
     */
    public function showPublic(string $token): JsonResponse
    {
        $record = CandidateVerificationRequest::where('token', $token)->first();

        if (!$record) {
            return $this->errorResponse('Invalid or expired verification link.', [], Response::HTTP_NOT_FOUND);
        }

        return $this->successResponse([
            'candidate_code' => $record->candidate_code,
            'candidate_type' => $record->candidate_type,
            'document_type'  => $record->document_type,
            'status'         => $record->status,
            'is_expired'     => $record->isExpired(),
            'expires_at'     => $record->expires_at->toIso8601String(),
            'submitted_at'   => $record->submitted_at?->toIso8601String(),
            'rejection_reason' => $record->status === 'rejected' ? $record->rejection_reason : null,
        ], 'Verification details retrieved.');
    }

    /**
     * Public: Upload document via token (no login required).
     */
    public function submitPublic(Request $request, string $token): JsonResponse
    {
        $record = CandidateVerificationRequest::where('token', $token)->first();

        if (!$record) {
            return $this->errorResponse('Invalid verification link.', [], Response::HTTP_NOT_FOUND);
        }

        if ($record->isExpired()) {
            return $this->errorResponse('This verification link has expired. Please contact RaabtaNow matchmaker for a new link.', [], Response::HTTP_GONE);
        }

        if ($record->isApproved()) {
            return $this->errorResponse('This document has already been verified and approved.', [], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $validated = $request->validate([
            'front_image' => 'required|file|mimes:jpeg,jpg,png,pdf|max:5120',
            'back_image'  => 'nullable|file|mimes:jpeg,jpg,png,pdf|max:5120',
            'notes'       => 'nullable|string|max:500',
        ]);

        $folder = "{$this->storageFolder}/{$record->token}";

        // Store front image
        $frontFile = $request->file('front_image');
        $frontExt = $frontFile->getClientOriginalExtension();
        $frontPath = $frontFile->storeAs($folder, "front_{$record->token}.{$frontExt}", $this->storageDisk);

        // Store back image if provided
        $backPath = null;
        if ($request->hasFile('back_image')) {
            $backFile = $request->file('back_image');
            $backExt = $backFile->getClientOriginalExtension();
            $backPath = $backFile->storeAs($folder, "back_{$record->token}.{$backExt}", $this->storageDisk);
        }

        $record->update([
            'document_front_path' => $frontPath,
            'document_back_path'  => $backPath,
            'notes'               => $validated['notes'] ?? null,
            'status'              => 'submitted',
            'submitted_at'        => now(),
        ]);

        return $this->successResponse([
            'candidate_code' => $record->candidate_code,
            'status'         => 'submitted',
            'submitted_at'   => $record->submitted_at->toIso8601String(),
        ], 'Documents submitted successfully. RaabtaNow matchmakers will review them shortly.');
    }
}
