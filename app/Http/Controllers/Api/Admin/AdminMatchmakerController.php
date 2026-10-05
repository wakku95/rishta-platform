<?php

namespace App\Http\Controllers\Api\Admin;

use App\Constants\ProfileOptions;
use App\Http\Controllers\Controller;
use App\Models\AssistedListing;
use App\Models\Profile;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMatchmakerController extends Controller
{
    use ApiResponse;

    /**
     * Get candidate profiles to match for (Assisted Listings or Registered Profiles).
     */
    public function getCandidates(Request $request): JsonResponse
    {
        $type = $request->input('type', 'assisted'); // 'assisted' or 'registered'
        $gender = $request->input('gender', 'female'); // 'female' or 'male'
        $search = $request->input('search');

        if ($type === 'assisted') {
            $query = AssistedListing::query()
                ->whereIn('listing_status', ['published', 'draft', 'unpublished'])
                ->where('gender', $gender);

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('listing_code', 'like', "%{$search}%")
                      ->orWhere('full_name', 'like', "%{$search}%")
                      ->orWhere('city', 'like', "%{$search}%")
                      ->orWhere('profession', 'like', "%{$search}%");
                });
            }

            $candidates = $query->latest()->paginate(20);

            $formatted = $candidates->getCollection()->map(function ($c) {
                return [
                    'id' => $c->id,
                    'type' => 'assisted',
                    'code' => $c->listing_code,
                    'name' => $c->full_name,
                    'gender' => $c->gender,
                    'age' => $c->date_of_birth ? $c->date_of_birth->age : 28,
                    'date_of_birth' => $c->date_of_birth?->format('Y-m-d'),
                    'city' => $c->city,
                    'religion' => $c->religion,
                    'sect' => $c->sect,
                    'education' => $c->education,
                    'profession' => $c->profession,
                    'marital_status' => $c->marital_status,
                    'height' => $c->height,
                    'managed_by' => $c->managed_by,
                    'contact_number' => $c->contact_number,
                    'preferences' => null, // Assisted listings don't have a rigid preferences row
                ];
            });

            return $this->successResponse([
                'candidates' => $formatted,
                'pagination' => [
                    'current_page' => $candidates->currentPage(),
                    'last_page' => $candidates->lastPage(),
                    'total' => $candidates->total(),
                ]
            ], 'Candidates retrieved.');
        }

        // Registered user profiles
        $query = Profile::query()
            ->with(['user:id,name,email', 'preferences'])
            ->where('profile_status', 'active')
            ->where('gender', $gender);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('profile_code', 'like', "%{$search}%")
                  ->orWhere('city', 'like', "%{$search}%")
                  ->orWhere('profession', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $candidates = $query->latest()->paginate(20);

        $formatted = $candidates->getCollection()->map(function ($p) {
            return [
                'id' => $p->id,
                'type' => 'registered',
                'code' => $p->profile_code,
                'name' => $p->user?->name ?? 'Candidate',
                'gender' => $p->gender,
                'age' => $p->age,
                'date_of_birth' => $p->date_of_birth?->format('Y-m-d'),
                'city' => $p->city,
                'religion' => $p->religion,
                'sect' => $p->sect,
                'education' => $p->education,
                'profession' => $p->profession,
                'marital_status' => $p->marital_status,
                'height' => $p->height,
                'managed_by' => $p->managed_by,
                'preferences' => $p->preferences ? [
                    'preferred_gender' => $p->preferences->preferred_gender,
                    'min_age' => $p->preferences->min_age,
                    'max_age' => $p->preferences->max_age,
                    'preferred_cities' => $p->preferences->preferred_cities ?? [],
                    'preferred_religion' => $p->preferences->preferred_religion,
                    'preferred_sect' => $p->preferences->preferred_sect,
                    'preferred_education' => $p->preferences->preferred_education,
                    'preferred_marital_status' => $p->preferences->preferred_marital_status ?? [],
                    'min_height' => $p->preferences->min_height,
                    'max_height' => $p->preferences->max_height,
                ] : null,
            ];
        });

        return $this->successResponse([
            'candidates' => $formatted,
            'pagination' => [
                'current_page' => $candidates->currentPage(),
                'last_page' => $candidates->lastPage(),
                'total' => $candidates->total(),
            ]
        ], 'Candidates retrieved.');
    }

    /**
     * Find compatible matches for a candidate based on provided or saved preferences.
     */
    public function findMatches(Request $request): JsonResponse
    {
        $preferredGender = $request->input('preferred_gender', 'male');
        $minAge = $request->input('min_age');
        $maxAge = $request->input('max_age');
        $cities = $request->input('cities', []);
        if (is_string($cities) && !empty($cities)) {
            $cities = array_filter(array_map('trim', explode(',', $cities)));
        }
        $religion = $request->input('religion');
        $sect = $request->input('sect');
        $education = $request->input('education');
        $maritalStatuses = $request->input('marital_status', []);
        if (is_string($maritalStatuses) && !empty($maritalStatuses)) {
            $maritalStatuses = array_filter(array_map('trim', explode(',', $maritalStatuses)));
        }
        $minHeight = $request->input('min_height');
        $maxHeight = $request->input('max_height');

        $excludeProfileId = $request->input('exclude_profile_id');
        $excludeListingId = $request->input('exclude_listing_id');

        // 1. Query Registered Profiles
        $profileQuery = Profile::query()
            ->with('user:id,name,email')
            ->where('profile_status', 'active')
            ->where('gender', $preferredGender);

        if ($excludeProfileId) {
            $profileQuery->where('id', '!=', $excludeProfileId);
        }

        if ($minAge) {
            $profileQuery->where('date_of_birth', '<=', now()->subYears((int) $minAge)->toDateString());
        }
        if ($maxAge) {
            $profileQuery->where('date_of_birth', '>=', now()->subYears((int) $maxAge + 1)->addDay()->toDateString());
        }
        if (!empty($cities)) {
            $profileQuery->whereIn('city', (array) $cities);
        }
        if ($religion) {
            $profileQuery->where('religion', $religion);
        }
        if ($sect) {
            $profileQuery->where('sect', $sect);
        }
        if ($education) {
            $qualifying = ProfileOptions::getEducationsAtOrAbove($education);
            $profileQuery->whereIn('education', $qualifying);
        }
        if (!empty($maritalStatuses)) {
            $profileQuery->whereIn('marital_status', (array) $maritalStatuses);
        }
        if ($minHeight) {
            $profileQuery->where('height', '>=', (int) $minHeight);
        }
        if ($maxHeight) {
            $profileQuery->where('height', '<=', (int) $maxHeight);
        }

        $matchedProfiles = $profileQuery->latest()->limit(30)->get();

        // 2. Query Assisted Listings
        $listingQuery = AssistedListing::query()
            ->where('listing_status', 'published')
            ->where('gender', $preferredGender);

        if ($excludeListingId) {
            $listingQuery->where('id', '!=', $excludeListingId);
        }

        if ($minAge) {
            $listingQuery->where('date_of_birth', '<=', now()->subYears((int) $minAge)->toDateString());
        }
        if ($maxAge) {
            $listingQuery->where('date_of_birth', '>', now()->subYears((int) $maxAge + 1)->toDateString());
        }
        if (!empty($cities)) {
            $listingQuery->whereIn('city', (array) $cities);
        }
        if ($religion) {
            $listingQuery->where('religion', $religion);
        }
        if ($sect) {
            $listingQuery->where('sect', $sect);
        }
        if ($education) {
            $qualifying = ProfileOptions::getEducationsAtOrAbove($education);
            $listingQuery->whereIn('education', $qualifying);
        }
        if (!empty($maritalStatuses)) {
            $listingQuery->whereIn('marital_status', (array) $maritalStatuses);
        }
        if ($minHeight) {
            $listingQuery->where('height', '>=', (int) $minHeight);
        }
        if ($maxHeight) {
            $listingQuery->where('height', '<=', (int) $maxHeight);
        }

        $matchedListings = $listingQuery->latest()->limit(30)->get();

        // 3. Format and compute compatibility scores
        $results = collect();

        foreach ($matchedProfiles as $p) {
            $badges = [];
            $score = 70; // baseline for passing SQL filter

            if (!empty($cities) && in_array($p->city, (array) $cities)) {
                $badges[] = 'City Match';
                $score += 10;
            }
            if ($sect && $p->sect === $sect) {
                $badges[] = 'Sect Match';
                $score += 10;
            }
            if ($education && $p->education === $education) {
                $badges[] = 'Exact Education';
                $score += 10;
            }

            $results->push([
                'id' => $p->id,
                'source' => 'registered',
                'code' => $p->profile_code,
                'name' => $p->user?->name ?? 'Candidate',
                'gender' => $p->gender,
                'age' => $p->age,
                'city' => $p->city,
                'religion' => $p->religion,
                'sect' => $p->sect,
                'education' => $p->education,
                'profession' => $p->profession,
                'marital_status' => $p->marital_status,
                'height' => $p->height,
                'height_formatted' => $p->height_formatted,
                'managed_by' => $p->managed_by,
                'about' => $p->about,
                'match_score' => min(100, $score),
                'match_badges' => $badges,
            ]);
        }

        foreach ($matchedListings as $l) {
            $badges = [];
            $score = 70;

            if (!empty($cities) && in_array($l->city, (array) $cities)) {
                $badges[] = 'City Match';
                $score += 10;
            }
            if ($sect && $l->sect === $sect) {
                $badges[] = 'Sect Match';
                $score += 10;
            }
            if ($education && $l->education === $education) {
                $badges[] = 'Exact Education';
                $score += 10;
            }

            $age = $l->date_of_birth ? $l->date_of_birth->age : 28;

            $results->push([
                'id' => $l->id,
                'source' => 'assisted',
                'code' => $l->listing_code,
                'name' => $l->full_name,
                'gender' => $l->gender,
                'age' => $age,
                'city' => $l->city,
                'religion' => $l->religion,
                'sect' => $l->sect,
                'education' => $l->education,
                'profession' => $l->profession,
                'marital_status' => $l->marital_status,
                'height' => $l->height,
                'height_formatted' => $l->height ? "{$l->height} cm" : 'N/A',
                'managed_by' => $l->managed_by,
                'about' => $l->public_about,
                'contact_number' => $l->contact_number,
                'match_score' => min(100, $score),
                'match_badges' => $badges,
            ]);
        }

        $sorted = $results->sortByDesc('match_score')->values();

        return $this->successResponse([
            'matches' => $sorted,
            'total' => $sorted->count(),
        ], 'Matches calculated successfully.');
    }
}
