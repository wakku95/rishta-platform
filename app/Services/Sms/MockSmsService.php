<?php

namespace App\Services\Sms;

use App\Contracts\SmsServiceInterface;
use Illuminate\Support\Facades\Log;

class MockSmsService implements SmsServiceInterface
{
    protected ?array $lastSent = null;
    protected bool $shouldSucceed = true;

    /**
     * Configure mock behavior.
     */
    public function setShouldSucceed(bool $shouldSucceed): self
    {
        $this->shouldSucceed = $shouldSucceed;
        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function sendSms(string $phoneNumber, string $message): bool
    {
        $this->lastSent = [
            'phone_number' => $phoneNumber,
            'message' => $message,
            'sent_at' => now()->toIso8601String(),
            'success' => $this->shouldSucceed,
        ];

        Log::info("[MockSMS] Sent to {$phoneNumber}: {$message}");

        return $this->shouldSucceed;
    }

    /**
     * {@inheritdoc}
     */
    public function getLastSent(): ?array
    {
        return $this->lastSent;
    }
}
