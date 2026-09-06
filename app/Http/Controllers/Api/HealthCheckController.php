<?php

namespace App\Http\Controllers\Api;

use App\Contracts\PaymentGatewayInterface;
use App\Contracts\SmsServiceInterface;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class HealthCheckController extends Controller
{
    use ApiResponse;

    public function __invoke(
        PaymentGatewayInterface $paymentGateway,
        SmsServiceInterface $smsService
    ): JsonResponse {
        return $this->successResponse([
            'name' => config('app.name', 'Rishta Platform'),
            'status' => 'healthy',
            'version' => '1.0.0-phase0',
            'timestamp' => now()->toIso8601String(),
            'services' => [
                'payment_driver' => config('payment.default'),
                'payment_gateway' => get_class($paymentGateway),
                'sms_driver' => config('sms.default'),
                'sms_service' => get_class($smsService),
                'unlock_fee' => config('rishta.unlock_fee'),
                'currency' => config('rishta.currency'),
            ],
        ], 'API is healthy and operational.');
    }
}
