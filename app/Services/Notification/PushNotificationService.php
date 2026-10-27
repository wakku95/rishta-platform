<?php

namespace App\Services\Notification;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PushNotificationService
{
    public const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
    public const EXPO_RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts';

    /**
     * Send push notification to a specific user (by model instance or ID).
     */
    public static function sendToUser(User|int|null $user, string $title, string $body, array $data = []): bool
    {
        if (is_int($user)) {
            $user = User::find($user);
        }

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
        $result = self::sendWithDiagnostics($token, $title, $body, $data, false);
        return $result['success'];
    }

    /**
     * Send push notification and optionally verify the Expo delivery receipt for FCM errors.
     */
    public static function sendWithDiagnostics(
        string $token,
        string $title,
        string $body,
        array $data = [],
        bool $checkReceipt = true
    ): array {
        $token = trim($token, " \t\n\r\0\x0B\"'");

        // Sanity check: Expo tokens start with ExponentPushToken[...] or ExpoPushToken[...]
        if (!str_starts_with($token, 'ExponentPushToken') && !str_starts_with($token, 'ExpoPushToken')) {
            Log::info("Invalid or non-Expo push token format: {$token}");
            return [
                'success' => false,
                'stage' => 'token_validation',
                'error' => "Invalid Expo push token format: {$token}",
            ];
        }

        try {
            $payload = [
                'to' => $token,
                'title' => $title,
                'body' => $body,
                'data' => (object) $data,
                'sound' => 'default',
                'priority' => 'high',
                'channelId' => 'default',
                'badge' => 1,
            ];

            $response = Http::timeout(8)
                ->withHeaders([
                    'Accept' => 'application/json',
                    'Accept-Encoding' => 'gzip, deflate',
                    'Content-Type' => 'application/json',
                ])
                ->post(self::EXPO_PUSH_URL, $payload);

            if (!$response->successful()) {
                $errBody = $response->body();
                Log::warning("Expo push failed with status {$response->status()}: {$errBody}");
                return [
                    'success' => false,
                    'stage' => 'expo_send',
                    'error' => "Expo HTTP {$response->status()}: {$errBody}",
                ];
            }

            $json = $response->json();
            $ticket = $json['data'][0] ?? $json['data'] ?? [];
            $ticketStatus = $ticket['status'] ?? 'ok';

            if ($ticketStatus === 'error') {
                $errDetails = $ticket['message'] ?? 'Ticket returned error';
                $errCode = $ticket['details']['error'] ?? 'UNKNOWN_TICKET_ERROR';
                Log::warning("Expo push ticket error [{$errCode}] for token {$token}: {$errDetails}");
                return [
                    'success' => false,
                    'stage' => 'expo_ticket',
                    'error_code' => $errCode,
                    'error' => "{$errCode}: {$errDetails}",
                ];
            }

            $ticketId = $ticket['id'] ?? null;

            if ($checkReceipt && $ticketId && !app()->runningUnitTests()) {
                sleep(3);
                $receiptRes = Http::timeout(8)
                    ->acceptJson()
                    ->post(self::EXPO_RECEIPTS_URL, [
                        'ids' => [$ticketId],
                    ]);

                if ($receiptRes->successful()) {
                    $receipt = $receiptRes->json("data.{$ticketId}");
                    if (is_array($receipt) && ($receipt['status'] ?? null) === 'error') {
                        $rMsg = $receipt['message'] ?? 'FCM delivery error';
                        $rCode = $receipt['details']['error'] ?? 'FCM_ERROR';
                        $fcmDetails = $receipt['details']['fcm']['error'] ?? '';
                        Log::warning("Expo push receipt error [{$rCode}] for token {$token}: {$rMsg} {$fcmDetails}");
                        return [
                            'success' => false,
                            'stage' => 'fcm_receipt',
                            'ticket_id' => $ticketId,
                            'error_code' => $rCode,
                            'error' => "{$rCode}: {$rMsg}" . ($fcmDetails ? " ({$fcmDetails})" : ''),
                        ];
                    }
                }
            }

            Log::info("Push notification delivered to {$token}: {$title}");
            return [
                'success' => true,
                'stage' => 'delivered',
                'ticket_id' => $ticketId,
            ];
        } catch (\Throwable $e) {
            Log::warning("Exception sending push notification: {$e->getMessage()}");
            return [
                'success' => false,
                'stage' => 'exception',
                'error' => $e->getMessage(),
            ];
        }
    }
}
