<?php

namespace App\Services\Notification;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PushNotificationService
{
    public const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

    /**
     * Send push notification to a specific user.
     */
    public static function sendToUser(?User $user, string $title, string $body, array $data = []): bool
    {
        if (!$user || empty($user->push_token)) {
            return false;
        }

        return self::sendToToken($user->push_token, $title, $body, $data);
    }

    /**
     * Send push notification using an Expo Push Token.
     */
    public static function sendToToken(string $token, string $title, string $body, array $data = []): bool
    {
        $token = trim($token);

        // Sanity check: Expo tokens start with ExponentPushToken[...] or ExpoPushToken[...]
        if (!str_starts_with($token, 'ExponentPushToken') && !str_starts_with($token, 'ExpoPushToken')) {
            Log::info("Invalid or non-Expo push token format: {$token}");
            return false;
        }

        try {
            $response = Http::timeout(5)
                ->withHeaders([
                    'Accept' => 'application/json',
                    'Accept-Encoding' => 'gzip, deflate',
                    'Content-Type' => 'application/json',
                ])
                ->post(self::EXPO_PUSH_URL, [
                    'to' => $token,
                    'title' => $title,
                    'body' => $body,
                    'data' => $data,
                    'sound' => 'default',
                    'priority' => 'high',
                    'badge' => 1,
                ]);

            if ($response->successful()) {
                Log::info("Push notification delivered to {$token}: {$title}");
                return true;
            }

            Log::warning("Expo push failed with status {$response->status()}: " . $response->body());
            return false;
        } catch (\Throwable $e) {
            Log::warning("Exception sending push notification: {$e->getMessage()}");
            return false;
        }
    }
}
