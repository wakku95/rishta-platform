<?php

namespace App\Http\Controllers\Api\Listings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Constants\ProfileOptions;
use App\Models\AssistedListing;
use App\Http\Resources\AssistedListingPublicResource;
use App\Http\Requests\Listings\SubmitInterestRequest;
use App\Models\AssistedListingInterest;

class AssistedListingController extends Controller
{
    public function index(Request $request)
    {
        $query = AssistedListing::query()->where('listing_status', 'published');

        if ($request->filled('profile_code')) {
            $code = trim($request->profile_code);
            $query->where('listing_code', 'like', "%{$code}%");
        }

        if ($request->filled('listing_code')) {
            $code = trim($request->listing_code);
            $query->where('listing_code', 'like', "%{$code}%");
        }

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

        // Faith Filters
        if ($request->filled('religion')) {
            $query->where('religion', $request->religion);
        }

        if ($request->filled('sect')) {
            $query->where('sect', $request->sect);
        }

        // Education Filter (canonical matching at or above specified level)
        if ($request->filled('education')) {
            $qualifyingEducations = ProfileOptions::getEducationsAtOrAbove($request->education);
            $query->whereIn('education', $qualifyingEducations);
        }

        // Profession & Marital Status
        if ($request->filled('profession')) {
            $query->where('profession', $request->profession);
        }

        if ($request->filled('marital_status')) {
            $query->where('marital_status', $request->marital_status);
        }

        // Height Boundaries
        if ($request->filled('min_height')) {
            $query->where('height', '>=', $request->integer('min_height'));
        }

        if ($request->filled('max_height')) {
            $query->where('height', '<=', $request->integer('max_height'));
        }

        // Filter out listings hidden by the authenticated user
        $user = $request->user('sanctum');
        if ($user && $user->profile) {
            $excludedListingIds = \App\Models\MatchExclusion::where('source_type', 'profile')
                ->where('source_id', $user->profile->id)
                ->where('target_type', 'assisted')
                ->pluck('target_id');

            if ($excludedListingIds->isNotEmpty()) {
                $query->whereNotIn('id', $excludedListingIds);
            }
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
