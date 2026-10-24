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

    public function myInquiries(Request $request)
    {
        $user = $request->user();

        $inquiries = AssistedListingInterest::with('assistedListing')
            ->where('user_id', $user->id)
            ->latest()
            ->paginate($request->integer('per_page', 12));

        $items = collect($inquiries->items())->map(function ($interest) {
            $listing = $interest->assistedListing;
            return [
                'id' => $interest->id,
                'status' => $interest->status,
                'message' => $interest->message,
                'submitter_name' => $interest->submitter_name,
                'submitter_contact' => $interest->submitter_contact,
                'admin_notes' => $interest->admin_notes,
                'created_at' => $interest->created_at ? $interest->created_at->toISOString() : null,
                'listing' => $listing ? [
                    'id' => $listing->id,
                    'listing_code' => $listing->listing_code,
                    'gender' => $listing->gender,
                    'age' => $listing->date_of_birth ? $listing->date_of_birth->age : null,
                    'city' => $listing->city,
                    'education' => $listing->education,
                    'profession' => $listing->profession,
                    'marital_status' => $listing->marital_status,
                    'religion' => $listing->religion,
                    'sect' => $listing->sect,
                    'public_about' => $listing->public_about,
                    'listing_status' => $listing->listing_status,
                    'identity_verified' => !is_null($listing->identity_verified_at),
                ] : null,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $items,
            'meta' => [
                'current_page' => $inquiries->currentPage(),
                'last_page' => $inquiries->lastPage(),
                'per_page' => $inquiries->perPage(),
                'total' => $inquiries->total(),
            ],
        ]);
    }

    public function submitInterest(SubmitInterestRequest $request, $listing_code)
    {
        $listing = AssistedListing::where('listing_code', $listing_code)
            ->where('listing_status', 'published')
            ->firstOrFail();

        $user = $request->user();

        // Enforce that authenticated user has created their matrimonial profile
        if (!$user->profile) {
            return response()->json([
                'message' => 'Please create your matrimonial profile first before expressing interest, so the candidate family can review your biodata.',
                'error_code' => 'PROFILE_REQUIRED'
            ], 422);
        }

        // Enforce that authenticated user has completed identity verification (CNIC + Live Selfie)
        if (!$user->isIdentityVerified()) {
            $verification = $user->latestIdentityVerification();
            return response()->json([
                'message' => 'Identity verification (CNIC + Live Selfie) is required before expressing interest in assisted listings.',
                'error_code' => 'IDENTITY_VERIFICATION_REQUIRED',
                'verification_status' => $verification ? $verification->status : 'none',
                'rejection_reason' => $verification ? $verification->rejection_reason : null,
            ], 403);
        }

        $validated = $request->validated();
        
        // Anti-abuse: Check if this user or contact has submitted interest for this exact listing in the last 24 hours.
        $recentInterest = AssistedListingInterest::where('assisted_listing_id', $listing->id)
            ->where(function ($q) use ($user, $validated) {
                $q->where('user_id', $user->id)
                  ->orWhere('submitter_contact', $validated['submitter_contact']);
            })
            ->where('created_at', '>=', now()->subHours(24))
            ->exists();

        if ($recentInterest) {
            return response()->json([
                'message' => 'You have already submitted an interest for this listing recently.'
            ], 429);
        }

        $interestData = [
            'assisted_listing_id' => $listing->id,
            'user_id' => $user->id,
            'submitter_name' => $validated['submitter_name'] ?? $user->name,
            'submitter_contact' => $validated['submitter_contact'] ?? $user->phone,
            'submitter_email' => $validated['submitter_email'] ?? $user->email,
            'message' => $validated['message'] ?? null,
            'status' => AssistedListingInterest::STATUS_NEW,
        ];

        $interest = AssistedListingInterest::create($interestData);

        return response()->json([
            'message' => 'Your interest has been submitted. An admin will review and may contact you.',
            'data' => $interest,
        ], 201);
    }
}
