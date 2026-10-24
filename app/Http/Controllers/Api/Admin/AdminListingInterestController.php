<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AssistedListing;
use App\Models\AssistedListingInterest;
use App\Http\Resources\AssistedListingInterestResource;
use Illuminate\Validation\Rule;

class AdminListingInterestController extends Controller
{
    public function index(Request $request, AssistedListing $assistedListing)
    {
        $interests = $assistedListing->interests()
            ->with('user.profile')
            ->when($request->status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->last_sender, function ($query, $lastSender) {
                $query->where('last_sender', $lastSender);
            })
            ->when($request->boolean('awaiting_admin'), function ($query) {
                $query->where('last_sender', 'user');
            })
            ->latest()
            ->paginate($request->per_page ?? 15);

        return AssistedListingInterestResource::collection($interests);
    }

    /**
     * Send official matchmaker/admin message to the user for this inquiry.
     */
    public function sendMessage(Request $request, AssistedListing $assistedListing, AssistedListingInterest $interest)
    {
        if ($interest->assisted_listing_id !== $assistedListing->id) {
            abort(404);
        }

        $validated = $request->validate([
            'message' => ['required', 'string', 'min:2', 'max:2500'],
            'status' => ['nullable', 'string', Rule::in(AssistedListingInterest::getStatuses())],
        ]);

        $adminMessage = trim($validated['message']);
        $conversation = is_array($interest->conversation) ? $interest->conversation : [];
        $conversation[] = [
            'sender' => 'admin',
            'sender_name' => $request->user()->name ?: 'Matchmaker Coordinator',
            'message' => $adminMessage,
            'created_at' => now()->toISOString(),
        ];

        $updates = [
            'admin_message' => $adminMessage,
            'conversation' => $conversation,
            'last_sender' => 'admin',
            'admin_messaged_at' => now(),
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ];

        if (!empty($validated['status'])) {
            $updates['status'] = $validated['status'];
        }

        $interest->update($updates);

        return response()->json([
            'message' => 'Message sent to user successfully. User can now send 1 reply.',
            'data' => new AssistedListingInterestResource($interest),
        ]);
    }

    /**
     * Get global count of assisted interests where user has replied and is awaiting admin action.
     */
    public function awaitingRepliesCount(Request $request)
    {
        $count = AssistedListingInterest::where('last_sender', 'user')->count();

        return response()->json([
            'success' => true,
            'awaiting_replies_count' => $count,
        ]);
    }

    public function show(AssistedListing $assistedListing, AssistedListingInterest $interest)
    {
        if ($interest->assisted_listing_id !== $assistedListing->id) {
            abort(404);
        }
        
        return new AssistedListingInterestResource($interest);
    }

    public function updateStatus(Request $request, AssistedListing $assistedListing, AssistedListingInterest $interest)
    {
        if ($interest->assisted_listing_id !== $assistedListing->id) {
            abort(404);
        }

        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(AssistedListingInterest::getStatuses())],
        ]);

        $interest->update([
            'status' => $validated['status'],
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Interest status updated successfully',
            'data' => new AssistedListingInterestResource($interest)
        ]);
    }

    public function addNotes(Request $request, AssistedListing $assistedListing, AssistedListingInterest $interest)
    {
        if ($interest->assisted_listing_id !== $assistedListing->id) {
            abort(404);
        }

        $validated = $request->validate([
            'admin_notes' => ['nullable', 'string'],
        ]);

        $interest->update([
            'admin_notes' => $validated['admin_notes']
        ]);

        return response()->json([
            'message' => 'Admin notes updated successfully',
            'data' => new AssistedListingInterestResource($interest)
        ]);
    }

    public function destroy(Request $request, AssistedListing $assistedListing, AssistedListingInterest $interest)
    {
        if (!$request->user()?->isAdmin()) {
            return response()->json([
                'message' => 'Only Super Admin can delete interests.',
            ], 403);
        }

        if ($interest->assisted_listing_id !== $assistedListing->id) {
            abort(404);
        }

        $interest->delete();

        return response()->json([
            'message' => 'Interest deleted successfully'
        ]);
    }
}
