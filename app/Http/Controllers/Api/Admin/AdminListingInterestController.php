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
            ->when($request->status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->latest()
            ->paginate($request->per_page ?? 15);

        return AssistedListingInterestResource::collection($interests);
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

    public function destroy(AssistedListing $assistedListing, AssistedListingInterest $interest)
    {
        if ($interest->assisted_listing_id !== $assistedListing->id) {
            abort(404);
        }

        $interest->delete();

        return response()->json([
            'message' => 'Interest deleted successfully'
        ]);
    }
}
