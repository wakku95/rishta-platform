<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\CommunicationLog;
use App\Models\Profile;
use App\Models\User;
use App\Services\Notification\PushNotificationService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminPushNotificationController extends Controller
{
    use ApiResponse;

    /**
     * Search candidate profiles to target for direct push notifications.
     */
    public function searchCandidate(Request $request): JsonResponse
    {
        $query = trim((string) $request->input('query', ''));

        if (strlen($query) < 2) {
            return $this->successResponse([], 'Please provide at least 2 characters to search.');
        }

        $candidates = Profile::query()
            ->with(['user', 'user.verifications'])
            ->where(function ($q) use ($query) {
                $q->where('profile_code', 'LIKE', "%{$query}%")
                  ->orWhere('full_name', 'LIKE', "%{$query}%")
                  ->orWhere('city', 'LIKE', "%{$query}%")
                  ->orWhereHas('user', function ($uq) use ($query) {
                      $uq->where('email', 'LIKE', "%{$query}%")
                         ->orWhere('phone', 'LIKE', "%{$query}%")
                         ->orWhere('name', 'LIKE', "%{$query}%");
                  });
            })
            ->limit(10)
            ->get()
            ->map(function ($profile) {
                $user = $profile->user;
                $hasPushToken = !empty($user?->push_token);
                $maskedToken = null;

                if ($hasPushToken) {
                    $token = $user->push_token;
                    $len = strlen($token);
                    $maskedToken = $len > 24 
                        ? substr($token, 0, 18) . '...' . substr($token, -6)
                        : $token;
                }

                $pendingProposals = \App\Models\RishtaRequest::where('receiver_id', $user?->id)
                    ->where('status', 'pending')
                    ->count();

                $latestVerification = $user?->latestIdentityVerification();

                return [
                    'profile_id' => $profile->id,
                    'user_id' => $user?->id,
                    'profile_code' => $profile->profile_code,
                    'full_name' => $profile->full_name ?? $user?->name ?? 'Candidate',
                    'email' => $user?->email,
                    'phone' => $user?->phone,
                    'gender' => $profile->gender,
                    'city' => $profile->city,
                    'age' => $profile->age,
                    'has_push_token' => $hasPushToken,
                    'push_token_preview' => $maskedToken,
                    'pending_proposals_count' => $pendingProposals,
                    'verification_status' => $latestVerification?->status ?? 'none',
                ];
            });

        return $this->successResponse($candidates, 'Matching candidates retrieved.');
    }

    /**
     * Dispatch custom push notification to a specific candidate.
     */
    public function sendPush(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'title' => ['required', 'string', 'min:3', 'max:100'],
            'message' => ['required', 'string', 'min:5', 'max:500'],
            'target_screen' => ['nullable', 'string', 'in:Proposals,Verification,MyProfile,Matches,Notifications'],
            'target_tab' => ['nullable', 'string', 'max:50'],
        ], [
            'user_id.required' => 'Please select a valid candidate user.',
            'title.required' => 'Notification title is required.',
            'message.required' => 'Notification message body is required.',
        ]);

        $admin = $request->user();
        $targetUser = User::with('profile')->find($request->input('user_id'));

        if (!$targetUser) {
            return $this->errorResponse('Target candidate not found.', [], Response::HTTP_NOT_FOUND);
        }

        $title = trim($request->input('title'));
        $message = trim($request->input('message'));
        $targetScreen = $request->input('target_screen', 'Proposals');
        $targetTab = $request->input('target_tab', 'received');

        // 1. Create personal in-app notice so user also sees it in notifications list
        Announcement::create([
            'user_id' => $targetUser->id,
            'title' => $title,
            'message' => $message,
            'type' => 'info',
            'target_audience' => Announcement::AUDIENCE_PERSONAL,
            'created_by' => $admin->id,
        ]);

        $pushDelivered = false;
        $statusNote = '';

        // 2. Dispatch push notification if device token is registered
        if (!empty($targetUser->push_token)) {
            $pushDelivered = PushNotificationService::sendToUser(
                $targetUser,
                $title,
                $message,
                [
                    'action' => 'admin_direct',
                    'screen' => $targetScreen,
                    'params' => [
                        'tab' => $targetTab,
                    ],
                ]
            );

            $statusNote = $pushDelivered 
                ? 'Mobile push notification delivered instantly to device.'
                : 'Mobile push delivery was attempted but returned non-200 from Expo push service.';
        } else {
            $statusNote = 'Candidate has not logged into the mobile app yet, but in-app notification was saved.';
        }

        // 3. Log event into communication audit trail
        CommunicationLog::create([
            'admin_id' => $admin->id,
            'contactable_type' => 'profile',
            'contactable_id' => $targetUser->profile?->id,
            'channel' => 'push',
            'recipient_name' => $targetUser->profile?->full_name ?? $targetUser->name,
            'recipient_contact' => $targetUser->email,
            'subject_or_template' => "{$title} | " . mb_substr($message, 0, 150),
        ]);

        return $this->successResponse([
            'user_id' => $targetUser->id,
            'candidate_name' => $targetUser->profile?->full_name ?? $targetUser->name,
            'push_delivered' => $pushDelivered,
            'has_device_token' => !empty($targetUser->push_token),
            'note' => $statusNote,
        ], 'Notification processed successfully.');
    }

    /**
     * Get recent push notifications audit log.
     */
    public function logs(Request $request): JsonResponse
    {
        $logs = CommunicationLog::query()
            ->with(['admin:id,name,email'])
            ->where('channel', 'push')
            ->latest()
            ->paginate(15);

        return $this->successResponse($logs, 'Push notification audit logs retrieved.');
    }
}
