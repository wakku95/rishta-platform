<?php

namespace App\Contracts;

use App\Services\Payments\PaymentVerificationResult;
use Illuminate\Http\Request;

interface PaymentGatewayInterface
{
    /**
     * Initiate payment transaction and return redirect URL or checkout parameters.
     *
     * @param string $paymentUuid
     * @param float $amount
     * @param string $currency
     * @param array $metadata
     * @return array
     */
    public function initiatePayment(string $paymentUuid, float $amount, string $currency = 'PKR', array $metadata = []): array;

    /**
     * Verify incoming webhook callback signature and status.
     *
     * @param Request $request
     * @return PaymentVerificationResult
     */
    public function verifyWebhook(Request $request): PaymentVerificationResult;

    /**
     * Query gateway directly for payment status by transaction reference.
     *
     * @param string $transactionReference
     * @return PaymentVerificationResult
     */
    public function queryPaymentStatus(string $transactionReference): PaymentVerificationResult;
}
