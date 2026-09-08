<?php

namespace Tests\Feature;

use App\Contracts\PaymentGatewayInterface;
use App\Contracts\SmsServiceInterface;
use App\Services\Payments\FakePaymentService;
use App\Services\Sms\MockSmsService;
use Tests\TestCase;

class FoundationTest extends TestCase
{
    /**
     * Test that the API health check endpoint returns 200 with standardized JSON.
     */
    public function test_api_health_check_returns_healthy_status(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'API is healthy and operational.',
                'data' => [
                    'status' => 'healthy',
                    'version' => '1.0.0-phase0',
                    'services' => [
                        'payment_driver' => 'fake',
                        'sms_driver' => 'mock',
                        'unlock_fee' => 300,
                        'currency' => 'PKR',
                    ],
                ],
            ]);
    }

    /**
     * Test that an unauthenticated request to a protected route returns standardized 401 JSON.
     */
    public function test_unauthenticated_api_request_returns_standard_401_json(): void
    {
        $response = $this->getJson('/api/user');

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Unauthenticated.',
                'error_code' => 'UNAUTHENTICATED',
            ]);
    }

    /**
     * Test that a non-existent API route returns standardized 404 JSON.
     */
    public function test_non_existent_api_route_returns_standard_404_json(): void
    {
        $response = $this->getJson('/api/non-existent-endpoint');

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'The requested resource was not found.',
                'error_code' => 'NOT_FOUND',
            ]);
    }

    /**
     * Test that PaymentGatewayInterface resolves properly from the container.
     */
    public function test_payment_gateway_interface_resolves_fake_service(): void
    {
        $gateway = app(PaymentGatewayInterface::class);

        $this->assertInstanceOf(FakePaymentService::class, $gateway);

        $initiation = $gateway->initiatePayment('test-uuid-123', 300.00, 'PKR');
        $this->assertArrayHasKey('redirect_url', $initiation);
        $this->assertEquals('fake', $initiation['provider']);
        $this->assertEquals(300.00, $initiation['amount']);
    }

    /**
     * Test that SmsServiceInterface resolves properly from the container.
     */
    public function test_sms_service_interface_resolves_mock_service(): void
    {
        $smsService = app(SmsServiceInterface::class);

        $this->assertInstanceOf(MockSmsService::class, $smsService);

        $result = $smsService->sendSms('+923001234567', 'Your OTP code is 123456');
        $this->assertTrue($result);
        $this->assertNotNull($smsService->getLastSent());
        $this->assertEquals('+923001234567', $smsService->getLastSent()['phone_number']);
    }

    /**
     * Test that GET / on the API domain returns the operational JSON response.
     */
    public function test_api_domain_root_returns_operational_json_response(): void
    {
        $response = $this->get('http://api.raabtanow.com/');

        $response->assertStatus(200)
            ->assertHeader('content-type', 'application/json')
            ->assertExactJson([
                'success' => true,
                'message' => 'RaabtaNow API is operational.',
                'version' => '1.0.0',
            ]);
    }

    /**
     * Test that GET / with Accept: application/json returns the operational JSON response.
     */
    public function test_root_with_json_accept_header_returns_operational_json_response(): void
    {
        $response = $this->getJson('/');

        $response->assertStatus(200)
            ->assertExactJson([
                'success' => true,
                'message' => 'RaabtaNow API is operational.',
                'version' => '1.0.0',
            ]);
    }
}
