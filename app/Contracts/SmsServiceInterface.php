<?php

namespace App\Contracts;

interface SmsServiceInterface
{
    /**
     * Send an SMS text message to the specified phone number.
     *
     * @param string $phoneNumber Normalized E.164 format (e.g., +923001234567)
     * @param string $message
     * @return bool
     */
    public function sendSms(string $phoneNumber, string $message): bool;

    /**
     * Retrieve the last sent SMS details (useful for testing and verification).
     *
     * @return array|null
     */
    public function getLastSent(): ?array;
}
