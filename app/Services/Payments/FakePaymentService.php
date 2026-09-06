<?php

namespace App\Services\Payments;

use App\Contracts\PaymentGatewayInterface;
use Illuminate\Http\Request;

class FakePaymentService implements PaymentGatewayInterface
{
    protected bool $shouldSucceed = true;
    protected ?string $forcedStatus = null;

    /**
     * Set the mock behavior for testing.
     */
    public function setShouldSucceed(bool $shouldSucceed, ?string $forcedStatus = null): self
    {
        $this->shouldSucceed = $shouldSucceed;
        $this->forcedStatus = $forcedStatus;
        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function initiatePayment(string $paymentUuid, float $amount, string $currency = 'PKR', array $metadata = []): array
    {
        return [
            'redirect_url' => url("/payments/{$paymentUuid}/mock-checkout"),
            'transaction_reference' => 'FAKE-TXN-' . strtoupper(substr(md5($paymentUuid . microtime()), 0, 12)),
            'provider' => 'fake',
            'amount' => $amount,
            'currency' => $currency,
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function verifyWebhook(Request $request): PaymentVerificationResult
    {
        $reference = $request->input('transaction_reference', 'FAKE-TXN-123456');
        $status = $request->input('status', 'PAID');

        if ($this->shouldSucceed && in_array(strtoupper($status), ['PAID', 'SUCCESS', '00'])) {
            return PaymentVerificationResult::success(
                transactionReference: $reference,
                gatewayStatus: 'PAID',
                rawResponse: $request->all()
            );
        }

        return PaymentVerificationResult::failure(
            transactionReference: $reference,
            errorMessage: $request->input('error_message', 'Payment failed in fake gateway simulation.'),
            gatewayStatus: $status,
            rawResponse: $request->all()
        );
    }

    /**
     * {@inheritdoc}
     */
    public function queryPaymentStatus(string $transactionReference): PaymentVerificationResult
    {
        if ($this->shouldSucceed) {
            return PaymentVerificationResult::success(
                transactionReference: $transactionReference,
                gatewayStatus: $this->forcedStatus ?? 'PAID',
                rawResponse: ['simulated' => true]
            );
        }

        return PaymentVerificationResult::failure(
            transactionReference: $transactionReference,
            errorMessage: 'Simulated payment query failure.',
            gatewayStatus: $this->forcedStatus ?? 'FAILED',
            rawResponse: ['simulated' => true]
        );
    }
}
