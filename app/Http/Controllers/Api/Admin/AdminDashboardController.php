<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AssistedListing;
use App\Models\AssistedListingInterest;
use App\Models\AssistedProfileSubmission;
use App\Models\CandidateVerificationRequest;
use App\Models\ContactUnlock;
use App\Models\Payment;
use App\Models\Profile;
use App\Models\ProfileInquiry;
use App\Models\ProfileVerification;
use App\Models\RishtaRequest;
use App\Models\User;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    use ApiResponse;

    /**
     * Get aggregated platform metrics for the admin dashboard.
     */
    public function metrics(Request $request): JsonResponse
    {
        $oneWeekAgo = Carbon::now()->subDays(7);

        // Users Metrics
        $totalUsers = User::count();
        $activeUsers = User::where('status', 'active')->count();
        $suspendedUsers = User::where('status', 'suspended')->count();
        $adminUsers = User::where('role', 'admin')->count();
        $verifiedUsers = User::whereNotNull('email_verified_at')->count();
        $newUsersThisWeek = User::where('created_at', '>=', $oneWeekAgo)->count();

        // Registered User Profiles Metrics
        $registeredProfilesTotal = Profile::count();
        $registeredProfilesActive = Profile::where('profile_status', 'active')->count();
        $draftProfiles = Profile::where('profile_status', 'draft')->count();
        $suspendedProfiles = Profile::where('profile_status', 'suspended')->count();
        $registeredMaleActive = Profile::where('gender', 'male')->where('profile_status', 'active')->count();
        $registeredFemaleActive = Profile::where('gender', 'female')->where('profile_status', 'active')->count();

        // Assisted Listings Metrics
        $assistedListingsTotal = AssistedListing::count();
        $assistedListingsPublished = AssistedListing::where('listing_status', 'published')->count();
        $assistedListingsDraft = AssistedListing::where('listing_status', 'draft')->count();
        $assistedListingsArchived = AssistedListing::where('listing_status', 'archived')->count();
        $assistedMalePublished = AssistedListing::where('gender', 'male')->where('listing_status', 'published')->count();
        $assistedFemalePublished = AssistedListing::where('gender', 'female')->where('listing_status', 'published')->count();

        // Combined Overall Candidate Inventory
        $totalCombinedProfiles = $registeredProfilesTotal + $assistedListingsTotal;
        $totalCombinedActive = $registeredProfilesActive + $assistedListingsPublished;
        $totalCombinedMaleActive = $registeredMaleActive + $assistedMalePublished;
        $totalCombinedFemaleActive = $registeredFemaleActive + $assistedFemalePublished;

        // Top Cities (Combined across Profiles & Published Assisted Listings)
        $topCitiesProfiles = Profile::select('city', DB::raw('count(*) as total'))
            ->whereNotNull('city')
            ->where('city', '!=', '')
            ->groupBy('city');

        $topCitiesAssisted = AssistedListing::select('city', DB::raw('count(*) as total'))
            ->whereNotNull('city')
            ->where('city', '!=', '')
            ->where('listing_status', 'published')
            ->groupBy('city');

        $topCities = DB::query()
            ->fromSub($topCitiesProfiles->unionAll($topCitiesAssisted), 'combined_cities')
            ->select('city', DB::raw('SUM(total) as total'))
            ->groupBy('city')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        // Requests Metrics
        $totalRequests = RishtaRequest::count();
        $pendingRequests = RishtaRequest::where('status', RishtaRequest::STATUS_PENDING)->count();
        $acceptedRequests = RishtaRequest::where('status', RishtaRequest::STATUS_ACCEPTED)->count();
        $declinedRequests = RishtaRequest::where('status', RishtaRequest::STATUS_DECLINED)->count();
        $cancelledRequests = RishtaRequest::where('status', RishtaRequest::STATUS_CANCELLED)->count();
        $expiredRequests = RishtaRequest::where('status', RishtaRequest::STATUS_EXPIRED)->count();
        $conversionRate = $totalRequests > 0 ? round(($acceptedRequests / $totalRequests) * 100, 1) : 0;

        // Financial & Unlocks Metrics
        $totalRevenue = Payment::where('status', Payment::STATUS_PAID)->sum('amount');
        $successfulPaymentsCount = Payment::where('status', Payment::STATUS_PAID)->count();
        $totalUnlocks = ContactUnlock::whereNotNull('unlocked_at')->count();
        $pendingPaymentsCount = Payment::where('status', Payment::STATUS_PENDING)->count();

        // Recent Activity Feed (Registrations, Requests, Payments)
        $recentUsers = User::latest()->limit(5)->get(['id', 'name', 'email', 'role', 'status', 'created_at']);
        $recentRequests = RishtaRequest::with(['sender:id,name,email', 'receiver:id,name,email'])
            ->latest()
            ->limit(5)
            ->get(['id', 'request_code', 'sender_id', 'receiver_id', 'status', 'created_at']);
        $recentPayments = Payment::with('user:id,name,email')
            ->latest()
            ->limit(5)
            ->get(['id', 'payment_uuid', 'user_id', 'amount', 'currency', 'status', 'gateway', 'transaction_reference', 'paid_at', 'created_at']);

        // Action Center: Pending items requiring Admin intervention
        $pendingBioApprovals = Profile::whereNotNull('about')->where('about', '!=', '')->whereNull('about_approved_at')->count();
        $pendingDirectInquiries = ProfileInquiry::where('status', ProfileInquiry::STATUS_NEW)
            ->whereHas('profile')
            ->count();
        $pendingProfileVerifications = ProfileVerification::where('status', 'pending')->count();
        $pendingMagicLinkVerifications = CandidateVerificationRequest::where('status', 'submitted')->count();
        $totalPendingVerifications = $pendingProfileVerifications + $pendingMagicLinkVerifications;

        $pendingProposals = RishtaRequest::whereIn('admin_status', [RishtaRequest::ADMIN_STATUS_PENDING, RishtaRequest::ADMIN_STATUS_NEEDS_REVISION])->count();
        $pendingPhotos = RishtaRequest::where(function ($q) {
            $q->where('photo_moderation_status', 'pending_review')
              ->orWhere('sender_photo_moderation_status', 'pending_review')
              ->orWhere('receiver_photo_moderation_status', 'pending_review');
        })->count();
        $totalPendingRequests = RishtaRequest::where(function ($q) {
            $q->whereIn('admin_status', [RishtaRequest::ADMIN_STATUS_PENDING, RishtaRequest::ADMIN_STATUS_NEEDS_REVISION])
              ->orWhere('photo_moderation_status', 'pending_review')
              ->orWhere('sender_photo_moderation_status', 'pending_review')
              ->orWhere('receiver_photo_moderation_status', 'pending_review');
        })->count();

        $pendingFinancialUnlocks = Payment::where('status', Payment::STATUS_PENDING)->count();
        $pendingAssistedSubmissions = AssistedProfileSubmission::where('status', 'pending')->count();
        $newAssistedInterests = AssistedListingInterest::where('status', AssistedListingInterest::STATUS_NEW)
            ->whereHas('assistedListing')
            ->count();

        $totalPendingActions = $pendingBioApprovals 
            + $pendingDirectInquiries 
            + $totalPendingVerifications 
            + $totalPendingRequests 
            + $pendingFinancialUnlocks 
            + $pendingAssistedSubmissions 
            + $newAssistedInterests;

        return $this->successResponse([
            'pending_actions' => [
                'total' => $totalPendingActions,
                'bio_approvals' => $pendingBioApprovals,
                'direct_inquiries' => $pendingDirectInquiries,
                'verifications' => [
                    'total' => $totalPendingVerifications,
                    'registered' => $pendingProfileVerifications,
                    'magic_links' => $pendingMagicLinkVerifications,
                ],
                'requests' => [
                    'total' => $totalPendingRequests,
                    'proposals' => $pendingProposals,
                    'photos' => $pendingPhotos,
                ],
                'financial_unlocks' => $pendingFinancialUnlocks,
                'assisted_submissions' => $pendingAssistedSubmissions,
                'assisted_interests' => $newAssistedInterests,
            ],
            'users' => [
                'total' => $totalUsers,
                'active' => $activeUsers,
                'suspended' => $suspendedUsers,
                'admins' => $adminUsers,
                'verified' => $verifiedUsers,
                'new_this_week' => $newUsersThisWeek,
            ],
            'profiles' => [
                'total' => $totalCombinedProfiles,
                'active' => $totalCombinedActive,
                'draft' => $draftProfiles + $assistedListingsDraft,
                'suspended' => $suspendedProfiles,
                'male_active' => $totalCombinedMaleActive,
                'female_active' => $totalCombinedFemaleActive,
                'top_cities' => $topCities,
                'breakdown' => [
                    'registered_total' => $registeredProfilesTotal,
                    'registered_active' => $registeredProfilesActive,
                    'registered_draft' => $draftProfiles,
                    'registered_suspended' => $suspendedProfiles,
                    'registered_male' => $registeredMaleActive,
                    'registered_female' => $registeredFemaleActive,
                    'assisted_total' => $assistedListingsTotal,
                    'assisted_published' => $assistedListingsPublished,
                    'assisted_draft' => $assistedListingsDraft,
                    'assisted_archived' => $assistedListingsArchived,
                    'assisted_male' => $assistedMalePublished,
                    'assisted_female' => $assistedFemalePublished,
                ],
            ],
            'requests' => [
                'total' => $totalRequests,
                'pending' => $pendingRequests,
                'accepted' => $acceptedRequests,
                'declined' => $declinedRequests,
                'cancelled' => $cancelledRequests,
                'expired' => $expiredRequests,
                'acceptance_rate' => $conversionRate,
            ],
            'financials' => [
                'total_revenue_pkr' => (float) $totalRevenue,
                'successful_payments' => $successfulPaymentsCount,
                'unlocked_contacts' => $totalUnlocks,
                'pending_payments' => $pendingPaymentsCount,
            ],
            'recent' => [
                'users' => $recentUsers,
                'requests' => $recentRequests,
                'payments' => $recentPayments,
            ],
        ], 'Admin metrics retrieved successfully.');
    }
}
