<?php

namespace App\Http\Controllers\Api\Listings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AssistedListing;
use App\Http\Resources\AssistedListingPublicResource;
use App\Http\Requests\Listings\SubmitInterestRequest;
use App\Models\AssistedListingInterest;

class AssistedListingController extends Controller
{
    public function index(Request $request)
    {
        $query = AssistedListing::query()->where('listing_status', 'published');

        if ($request->filled('gender')) {
            $query->where('gender', $request->gender);
        }

        if ($request->filled('city')) {
            $query->where('city', $request->city);
        }

        if ($request->filled('min_age')) {
            $maxDob = now()->subYears($request->min_age)->format('Y-m-d');
            $query->where('date_of_birth', '<=', $maxDob);
        }

        if ($request->filled('max_age')) {
            $minDob = now()->subYears($request->max_age + 1)->format('Y-m-d');
            $query->where('date_of_birth', '>', $minDob);
        }

        $listings = $query->latest()->paginate($request->per_page ?? 15);

        return AssistedListingPublicResource::collection($listings);
    }

    public function show($listing_code)
    {
        $listing = AssistedListing::where('listing_code', $listing_code)
            ->where('listing_status', 'published')
            ->firstOrFail();

        return new AssistedListingPublicResource($listing);
    }

    public function submitInterest(SubmitInterestRequest $request, $listing_code)
    {
        $listing = AssistedListing::where('listing_code', $listing_code)
            ->where('listing_status', 'published')
            ->firstOrFail();

        $validated = $request->validated();
        
        // Anti-abuse: Check if this exact normalized contact has submitted interest for this exact listing in the last 24 hours.
        $recentInterest = AssistedListingInterest::where('assisted_listing_id', $listing->id)
            ->where('submitter_contact', $validated['submitter_contact'])
            ->where('created_at', '>=', now()->subHours(24))
            ->exists();

        if ($recentInterest) {
            return response()->json([
                'message' => 'You have already submitted an interest for this listing recently.'
            ], 429);
        }

        $interestData = [
            'assisted_listing_id' => $listing->id,
            'submitter_name' => $validated['submitter_name'],
            'submitter_contact' => $validated['submitter_contact'],
            'submitter_email' => $validated['submitter_email'] ?? null,
            'message' => $validated['message'] ?? null,
            'status' => AssistedListingInterest::STATUS_NEW,
        ];

        // Attach logged-in user if available
        if ($request->user('sanctum')) {
            $interestData['user_id'] = $request->user('sanctum')->id;
        }

        $interest = AssistedListingInterest::create($interestData);

        return response()->json([
            'message' => 'Your interest has been submitted. An admin will review and may contact you.',
        ], 201);
    }
}
