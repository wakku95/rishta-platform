<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Notification\PushNotificationService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class NotificationController extends Controller
{
    use ApiResponse;

    /**
     * Register or update the user's Expo push token.
     */
    public function updatePushToken(Request $request): JsonResponse
    {
        $request->validate([
            'push_token' => ['nullable', 'string', 'max:255'],
        ]);

        $user = $request->user();
        $token = $request->input('push_token');

        $user->update([
            'push_token' => $token,
        ]);

        return $this->successResponse([
            'push_token' => $user->push_token,
            'registered' => !empty($user->push_token),
        ], 'Push token updated successfully.');
    }

    /**
     * Send a test push notification to the authenticated user.
     */
    public function sendTestPush(Request $request): JsonResponse
    {
        $user = $request->user();

        if (empty($user->push_token)) {
            return $this->errorResponse(
                'No push notification token registered for this account.',
                [],
                Response::HTTP_UNPROCESSABLE_ENTITY,
                'NO_PUSH_TOKEN'
            );
        }

        $result = PushNotificationService::sendToUser(
            $user,
            'Test Notification 🔔',
            'Push notifications are working perfectly on RaabtaNow!',
            [
                'action' => 'test',
                'screen' => 'MyProfile',
                'timestamp' => now()->toIso8601String(),
            ]
        );

        return $this->successResponse($result, 'Test notification dispatched.');
    }
}
