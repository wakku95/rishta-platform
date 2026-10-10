<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProfileInquiryResource;
use App\Models\ProfileInquiry;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

class AdminProfileInquiryController extends Controller
{
    use ApiResponse;

    /**
     * List all candidate inquiries with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ProfileInquiry::with(['profile.user', 'user', 'reviewedByAdmin']);

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('submitter_name', 'like', "%{$search}%")
                  ->orWhere('submitter_contact', 'like', "%{$search}%")
                  ->orWhere('submitter_email', 'like', "%{$search}%")
                  ->orWhereHas('profile', function ($pq) use ($search) {
                      $pq->where('profile_code', 'like', "%{$search}%")
                         ->orWhere('city', 'like', "%{$search}%")
                         ->orWhere('profession', 'like', "%{$search}%");
                  });
            });
        }

        $perPage = min((int) $request->input('per_page', 15), 50);
        $inquiries = $query->latest()->paginate($perPage);

        return $this->successResponse(
            ProfileInquiryResource::collection($inquiries)->response()->getData(true),
            'Candidate inquiries retrieved successfully.'
        );
    }

    /**
     * Update status of an inquiry.
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'string', Rule::in(ProfileInquiry::getStatuses())],
        ]);

        $inquiry = ProfileInquiry::with(['profile.user', 'user'])->find($id);

        if (!$inquiry) {
            return $this->errorResponse('Inquiry not found.', [], Response::HTTP_NOT_FOUND, 'INQUIRY_NOT_FOUND');
        }

        $inquiry->update([
            'status' => $request->input('status'),
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return $this->successResponse(
            new ProfileInquiryResource($inquiry),
            "Inquiry status updated to [{$inquiry->status}]."
        );
    }

    /**
     * Update internal agent notes on an inquiry.
     */
    public function addNotes(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'admin_notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $inquiry = ProfileInquiry::with(['profile.user', 'user'])->find($id);

        if (!$inquiry) {
            return $this->errorResponse('Inquiry not found.', [], Response::HTTP_NOT_FOUND, 'INQUIRY_NOT_FOUND');
        }

        $inquiry->update([
            'admin_notes' => $request->input('admin_notes'),
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return $this->successResponse(
            new ProfileInquiryResource($inquiry),
            'Agent notes updated successfully.'
        );
    }

    /**
     * Delete an inquiry.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $inquiry = ProfileInquiry::find($id);

        if (!$inquiry) {
            return $this->errorResponse('Inquiry not found.', [], Response::HTTP_NOT_FOUND, 'INQUIRY_NOT_FOUND');
        }

        $inquiry->delete();

        return $this->successResponse(null, 'Inquiry deleted successfully.');
    }
}
