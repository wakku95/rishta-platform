<?php

namespace App\Providers;

use App\Contracts\PaymentGatewayInterface;
use App\Contracts\SmsServiceInterface;
use App\Services\Payments\FakePaymentService;
use App\Services\Sms\MockSmsService;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Payment Gateway Binding
        $this->app->bind(PaymentGatewayInterface::class, function ($app) {
            $gateway = config('payment.default', 'fake');

            return match ($gateway) {
                'safepay' => $app->make(\App\Services\Payments\SafepayPaymentService::class),
                'fake' => $app->make(FakePaymentService::class),
                default => $app->make(FakePaymentService::class),
            };
        });

        // SMS Service Binding
        $this->app->bind(SmsServiceInterface::class, function ($app) {
            $driver = config('sms.default', 'mock');

            return match ($driver) {
                'mock' => $app->make(MockSmsService::class),
                // When Pakistan SMS is implemented in Phase 6:
                // 'pakistan_sms' => $app->make(PakistanSmsService::class),
                default => $app->make(MockSmsService::class),
            };
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            $frontendUrl = rtrim(config('app.frontend_url', config('app.url', 'http://localhost')), '/');
            return "{$frontendUrl}/reset-password?token={$token}&email={$notifiable->getEmailForPasswordReset()}";
        });
    }
}
