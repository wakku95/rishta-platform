<?php

namespace App\Services\Payments;

class PaymentVerificationResult
{
    public function __construct(
        public readonly bool $isSuccessful,
        public readonly string $transactionReference,
        public readonly string $gatewayStatus,
        public readonly ?array $rawResponse = null,
        public readonly ?string $errorMessage = null
    ) {}

    public static function success(
        string $transactionReference,
        string $gatewayStatus = 'PAID',
        ?array $rawResponse = null
    ): self {
        return new self(
            isSuccessful: true,
            transactionReference: $transactionReference,
            gatewayStatus: $gatewayStatus,
            rawResponse: $rawResponse
        );
    }

    public static function failure(
        string $transactionReference,
        string $errorMessage,
        string $gatewayStatus = 'FAILED',
        ?array $rawResponse = null
    ): self {
        return new self(
            isSuccessful: false,
            transactionReference: $transactionReference,
            gatewayStatus: $gatewayStatus,
            rawResponse: $rawResponse,
            errorMessage: $errorMessage
        );
    }
}
