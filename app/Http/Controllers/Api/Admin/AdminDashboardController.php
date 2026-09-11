<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactUnlock;
use App\Models\Payment;
use App\Models\Profile;
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

        // Profiles Metrics
        $totalProfiles = Profile::count();
        $activeProfiles = Profile::where('profile_status', 'active')->count();
        $draftProfiles = Profile::where('profile_status', 'draft')->count();
        $suspendedProfiles = Profile::where('profile_status', 'suspended')->count();
        $maleProfiles = Profile::where('gender', 'male')->where('profile_status', 'active')->count();
        $femaleProfiles = Profile::where('gender', 'female')->where('profile_status', 'active')->count();

        // Top Cities
        $topCities = Profile::select('city', DB::raw('count(*) as total'))
            ->whereNotNull('city')
            ->where('city', '!=', '')
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

        return $this->successResponse([
            'users' => [
                'total' => $totalUsers,
                'active' => $activeUsers,
                'suspended' => $suspendedUsers,
                'admins' => $adminUsers,
                'verified' => $verifiedUsers,
                'new_this_week' => $newUsersThisWeek,
            ],
            'profiles' => [
                'total' => $totalProfiles,
                'active' => $activeProfiles,
                'draft' => $draftProfiles,
                'suspended' => $suspendedProfiles,
                'male_active' => $maleProfiles,
                'female_active' => $femaleProfiles,
                'top_cities' => $topCities,
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
