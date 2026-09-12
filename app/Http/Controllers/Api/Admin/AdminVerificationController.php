<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProfileVerification;
use App\Services\Verification\VerificationService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminVerificationController extends Controller
{
    use ApiResponse;

    protected VerificationService $service;

    public function __construct(VerificationService $service)
    {
        $this->service = $service;
    }

    /**
     * List paginated verification requests with status/type filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ProfileVerification::query()
            ->with([
                'user:id,name,email,status',
                'user.profile:id,user_id,profile_code,gender,city',
                'reviewer:id,name,email',
            ]);

        if ($type = $request->input('type')) {
            if (in_array($type, [ProfileVerification::TYPE_IDENTITY, ProfileVerification::TYPE_EDUCATION])) {
                $query->where('type', $type);
            }
        }

        if ($status = $request->input('status')) {
            if (in_array($status, [ProfileVerification::STATUS_PENDING, ProfileVerification::STATUS_APPROVED, ProfileVerification::STATUS_REJECTED])) {
                $query->where('status', $status);
            }
        }

        if ($search = $request->input('search')) {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $perPage = min((int) $request->input('per_page', 15), 50);
        $verifications = $query->latest('submitted_at')->paginate($perPage);

        return $this->successResponse($verifications, 'Verification requests retrieved.');
    }

    /**
     * Get specific verification detail with user context.
     */
    public function show(int $id): JsonResponse
    {
        $verification = ProfileVerification::with([
            'user',
            'user.profile',
            'reviewer:id,name,email',
        ])->find($id);

        if (!$verification) {
            return $this->errorResponse('Verification request not found.', [], Response::HTTP_NOT_FOUND, 'VERIFICATION_NOT_FOUND');
        }

        return $this->successResponse($verification, 'Verification detail retrieved.');
    }

    /**
     * Securely stream private document file to authorized admin.
     */
    public function viewDocument(Request $request, int $id, string $side = 'front')
    {
        $verification = ProfileVerification::find($id);

        if (!$verification) {
            return response()->json([
                'success' => false,
                'message' => 'Verification record not found.',
                'error_code' => 'VERIFICATION_NOT_FOUND',
            ], Response::HTTP_NOT_FOUND);
        }

        $path = ($side === 'back') ? $verification->document_back_path : $verification->document_front_path;

        if (!$path || !Storage::disk('local')->exists($path)) {
            return response()->json([
                'success' => false,
                'message' => 'Document file not found or has been deleted.',
                'error_code' => 'FILE_NOT_FOUND',
            ], Response::HTTP_NOT_FOUND);
        }

        $mimeType = Storage::disk('local')->mimeType($path) ?: 'application/octet-stream';

        return Storage::disk('local')->response($path, null, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline',
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, private',
        ]);
    }

    /**
     * Approve verification request.
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        $verification = ProfileVerification::find($id);

        if (!$verification) {
            return $this->errorResponse('Verification request not found.', [], Response::HTTP_NOT_FOUND, 'VERIFICATION_NOT_FOUND');
        }

        $this->service->approve($verification, $request->user());

        return $this->successResponse([
            'id' => $verification->id,
            'status' => $verification->status,
            'reviewed_at' => $verification->reviewed_at?->toIso8601String(),
        ], 'Verification request approved successfully.');
    }

    /**
     * Reject verification request with reason.
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string|min:5|max:1000',
        ], [
            'reason.required' => 'Please provide a reason explaining why the verification was rejected.',
            'reason.min' => 'Rejection reason must be at least 5 characters.',
        ]);

        $verification = ProfileVerification::find($id);

        if (!$verification) {
            return $this->errorResponse('Verification request not found.', [], Response::HTTP_NOT_FOUND, 'VERIFICATION_NOT_FOUND');
        }

        $this->service->reject($verification, $request->user(), $request->input('reason'));

        return $this->successResponse([
            'id' => $verification->id,
            'status' => $verification->status,
            'reviewed_at' => $verification->reviewed_at?->toIso8601String(),
            'rejection_reason' => $verification->rejection_reason,
        ], 'Verification request marked as rejected.');
    }

    /**
     * Purge physical document files for approved verifications older than specified days.
     */
    public function purge(Request $request): JsonResponse
    {
        $request->validate([
            'days' => 'nullable|integer|min:0|max:365',
        ]);

        $days = (int) $request->input('days', 30);
        $result = $this->service->purgeApprovedDocuments($days);

        $message = $days === 0
            ? "Purged {$result['freed_files']} physical files across {$result['purged_records']} approved verification records."
            : "Purged {$result['freed_files']} physical files for approved verifications older than {$days} days ({$result['purged_records']} records updated).";

        return $this->successResponse($result, $message);
    }
}
