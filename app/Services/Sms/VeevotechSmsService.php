<?php

namespace App\Services\Sms;

use App\Contracts\SmsServiceInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class VeevotechSmsService implements SmsServiceInterface
{
    protected string $apiKey;
    protected string $senderId;
    protected string $endpoint;
    protected ?array $lastSent = null;

    public function __construct()
    {
        $this->apiKey = (string) config('sms.providers.veevotech.api_key', env('VEEVOTECH_API_KEY', ''));
        $this->senderId = (string) config('sms.providers.veevotech.sender_id', env('VEEVOTECH_SENDER_ID', 'Default'));
        $this->endpoint = (string) config('sms.providers.veevotech.endpoint', 'https://api.veevotech.com/v3/sendsms');
    }

    /**
     * {@inheritdoc}
     */
    public function sendSms(string $phoneNumber, string $message): bool
    {
        $normalizedPhone = $this->normalizePhoneNumber($phoneNumber);
        $maskedPhone = $this->maskPhoneNumber($normalizedPhone);

        if (empty($this->apiKey)) {
            Log::error("[VeevotechSMS] API Key is missing in configuration. Cannot send SMS to {$maskedPhone}.");
            return false;
        }

        try {
            $response = Http::timeout(15)->post($this->endpoint, [
                'apikey' => $this->apiKey,
                'receivernum' => $normalizedPhone,
                'sendernum' => $this->senderId,
                'textmessage' => $message,
            ]);

            $isSuccessful = $response->successful() && strtoupper((string) $response->json('STATUS')) === 'SUCCESSFUL';
            $messageId = $response->json('MESSAGE_ID');
            $errorFilter = $response->json('ERROR_FILTER');

            $this->lastSent = [
                'phone_masked' => $maskedPhone,
                'sent_at' => now()->toIso8601String(),
                'success' => $isSuccessful,
                'message_id' => $messageId,
            ];

            if ($isSuccessful) {
                Log::info("[VeevotechSMS] SMS dispatched successfully to {$maskedPhone}. Message ID: {$messageId}");
                return true;
            }

            Log::warning("[VeevotechSMS] SMS delivery failed to {$maskedPhone}. Status: " . ($response->json('STATUS') ?? $response->status()) . ", Error: {$errorFilter}");
            return false;
        } catch (\Throwable $e) {
            Log::error("[VeevotechSMS] Connection exception sending SMS to {$maskedPhone}: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * {@inheritdoc}
     */
    public function getLastSent(): ?array
    {
        return $this->lastSent;
    }

    /**
     * Normalize Pakistani mobile number to E.164 format (+923XXXXXXXXX).
     */
    protected function normalizePhoneNumber(string $phone): string
    {
        $clean = preg_replace('/[^\d+]/', '', trim($phone));

        if (str_starts_with($clean, '+92')) {
            return $clean;
        }

        if (str_starts_with($clean, '92')) {
            return '+' . $clean;
        }

        if (str_starts_with($clean, '03')) {
            return '+92' . substr($clean, 1);
        }

        return $clean;
    }

    /**
     * Mask phone number for secure logging (e.g., +92300****567).
     */
    protected function maskPhoneNumber(string $phone): string
    {
        $len = strlen($phone);
        if ($len <= 7) {
            return '***';
        }

        return substr($phone, 0, 6) . '****' . substr($phone, -3);
    }
}
