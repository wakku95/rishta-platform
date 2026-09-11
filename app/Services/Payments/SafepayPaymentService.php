<?php

namespace App\Services\Payments;

use App\Contracts\PaymentGatewayInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class SafepayPaymentService implements PaymentGatewayInterface
{
    protected string $publicKey;
    protected string $secretKey;
    protected string $webhookSecret;
    protected string $environment;
    protected string $baseUrl;
    protected string $checkoutUrl;

    public function __construct()
    {
        $this->publicKey = (string) config('payment.gateways.safepay.public_key', env('SAFEPAY_PUBLIC_KEY', ''));
        $this->secretKey = (string) config('payment.gateways.safepay.secret_key', env('SAFEPAY_SECRET_KEY', ''));
        $this->webhookSecret = (string) config('payment.gateways.safepay.webhook_secret', $this->secretKey);
        $this->environment = (string) config('payment.gateways.safepay.environment', env('SAFEPAY_ENV', 'sandbox'));
        $this->baseUrl = rtrim((string) config('payment.gateways.safepay.base_url', 'https://sandbox.api.getsafepay.com'), '/');
        $this->checkoutUrl = (string) config('payment.gateways.safepay.checkout_url', 'https://sandbox.api.getsafepay.com/checkout/pay');
    }

    /**
     * Initiate payment transaction with Safepay and return checkout URL.
     *
     * @param string $paymentUuid
     * @param float $amount
     * @param string $currency
     * @param array $metadata
     * @return array
     */
    public function initiatePayment(string $paymentUuid, float $amount, string $currency = 'PKR', array $metadata = []): array
    {
        $requestCode = $metadata['request_code'] ?? '';
        $endpoint = "{$this->baseUrl}/order/v1/init";

        try {
            $response = Http::timeout(15)->post($endpoint, [
                'client' => $this->publicKey,
                'amount' => (float) $amount,
                'currency' => $currency,
                'environment' => $this->environment,
            ]);

            if (!$response->successful()) {
                Log::error('Safepay order init failed', [
                    'payment_uuid' => $paymentUuid,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                throw new RuntimeException('Safepay order initiation rejected: ' . ($response->json('status.message') ?? $response->body()));
            }

            $token = $response->json('data.token');

            if (empty($token)) {
                Log::error('Safepay order init returned empty token', [
                    'payment_uuid' => $paymentUuid,
                    'response' => $response->json(),
                ]);

                throw new RuntimeException('Safepay returned an invalid order session token.');
            }

            // Construct callback & cancel URLs
            $appUrl = rtrim(config('app.url', 'https://raabtanow.com'), '/');
            $redirectUrl = "{$appUrl}/payments/{$paymentUuid}/safepay/callback";
            $cancelUrl = "{$appUrl}/dashboard/requests?request={$requestCode}&payment=cancelled";

            // Build Safepay hosted checkout redirect URL
            $queryParams = http_build_query([
                'beacon' => $token,
                'env' => $this->environment,
                'environment' => $this->environment,
                'source' => 'custom',
                'order_id' => $paymentUuid,
                'redirect_url' => $redirectUrl,
                'redirectUrl' => $redirectUrl,
                'cancel_url' => $cancelUrl,
                'cancelUrl' => $cancelUrl,
                'webhooks' => 'true',
            ]);

            $hostedCheckoutUrl = "{$this->checkoutUrl}?{$queryParams}";

            return [
                'redirect_url' => $hostedCheckoutUrl,
                'transaction_reference' => $token,
                'provider' => 'safepay',
                'amount' => $amount,
                'currency' => $currency,
                'beacon' => $token,
            ];
        } catch (\Throwable $e) {
            Log::error('Safepay payment initialization exception: ' . $e->getMessage(), [
                'payment_uuid' => $paymentUuid,
                'trace' => $e->getTraceAsString(),
            ]);

            throw new RuntimeException('Unable to initialize Safepay checkout: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Verify incoming webhook or redirect callback from Safepay.
     *
     * @param Request $request
     * @return PaymentVerificationResult
     */
    public function verifyWebhook(Request $request): PaymentVerificationResult
    {
        // Tracker token can be passed as 'tracker', 'beacon', or 'token'
        $tracker = $request->input('tracker')
            ?? $request->input('beacon')
            ?? $request->input('token')
            ?? $request->input('data.token')
            ?? $request->route('payment_uuid')
            ?? '';

        $signature = $request->input('sig')
            ?? $request->header('X-SFPY-SIGNATURE')
            ?? $request->header('x-sfpy-signature')
            ?? '';

        // 1. Signature Verification if signature provided
        $signatureValid = false;
        if (!empty($tracker) && !empty($signature)) {
            $expectedSignature = hash_hmac('sha256', $tracker, $this->secretKey);
            $signatureValid = hash_equals($expectedSignature, (string) $signature);

            // Also check webhook payload signature if header is present
            if (!$signatureValid && $request->hasHeader('X-SFPY-SIGNATURE')) {
                $rawBody = $request->getContent();
                $timestamp = $request->header('X-SFPY-TIMESTAMP', '');
                $payloadToSign = $timestamp ? "{$timestamp}.{$rawBody}" : $rawBody;
                $expectedWebhookSig = hash_hmac('sha256', $payloadToSign, $this->webhookSecret);
                $signatureValid = hash_equals($expectedWebhookSig, (string) $signature);
            }
        }

        // 2. Direct Server-to-Server Status Verification
        // If tracker token is present, directly query Safepay API to verify ground truth status
        if (!empty($tracker)) {
            $queryResult = $this->queryPaymentStatus($tracker);
            if ($queryResult->isSuccessful) {
                return $queryResult;
            }

            // If signature was valid and query succeeded or failed with pending
            if ($signatureValid && $queryResult->gatewayStatus === 'PAID') {
                return $queryResult;
            }
        }

        // If signature was strictly valid for this tracker
        if ($signatureValid && !empty($tracker)) {
            return PaymentVerificationResult::success(
                transactionReference: $tracker,
                gatewayStatus: 'PAID',
                rawResponse: $request->all()
            );
        }

        return PaymentVerificationResult::failure(
            transactionReference: $tracker ?: 'UNKNOWN',
            errorMessage: 'Safepay transaction verification failed or payment was not completed.',
            gatewayStatus: 'FAILED',
            rawResponse: $request->all()
        );
    }

    /**
     * Query Safepay directly for tracker status by tracker token.
     *
     * @param string $transactionReference
     * @return PaymentVerificationResult
     */
    public function queryPaymentStatus(string $transactionReference): PaymentVerificationResult
    {
        $endpoint = "{$this->baseUrl}/order/v1/{$transactionReference}";

        try {
            $response = Http::timeout(15)
                ->withHeaders([
                    'X-SFPY-MERCHANT-SECRET' => $this->secretKey,
                ])
                ->get($endpoint);

            if (!$response->successful()) {
                Log::warning('Safepay order status query non-200', [
                    'reference' => $transactionReference,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return PaymentVerificationResult::failure(
                    transactionReference: $transactionReference,
                    errorMessage: 'Safepay query returned HTTP ' . $response->status(),
                    gatewayStatus: 'FAILED',
                    rawResponse: $response->json() ?? ['raw' => $response->body()]
                );
            }

            $data = $response->json('data', []);
            $state = strtoupper((string) ($data['state'] ?? ''));

            // In Safepay, TRACKER_ENDED or completed state indicates successful transaction
            if (in_array($state, ['TRACKER_ENDED', 'PAID', 'COMPLETED', 'SUCCESS'])) {
                return PaymentVerificationResult::success(
                    transactionReference: $transactionReference,
                    gatewayStatus: 'PAID',
                    rawResponse: $data
                );
            }

            return PaymentVerificationResult::failure(
                transactionReference: $transactionReference,
                errorMessage: "Safepay payment state is '{$state}' (not completed).",
                gatewayStatus: $state ?: 'PENDING',
                rawResponse: $data
            );
        } catch (\Throwable $e) {
            Log::error('Safepay order status query exception: ' . $e->getMessage(), [
                'reference' => $transactionReference,
            ]);

            return PaymentVerificationResult::failure(
                transactionReference: $transactionReference,
                errorMessage: 'Safepay status check communication error: ' . $e->getMessage(),
                gatewayStatus: 'FAILED'
            );
        }
    }
}
