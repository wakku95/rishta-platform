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

    /**
     * Test that GET / on the primary web domain returns the React SPA Blade view.
     */
    public function test_primary_web_root_returns_spa_blade_view(): void
    {
        $response = $this->get('http://raabtanow.com/');

        $response->assertStatus(200)
            ->assertSee('id="app"', false);
    }

    /**
     * Test that non-API web paths on the API domain return 404 JSON and never render Blade.
     */
    public function test_api_domain_non_api_paths_return_404_json(): void
    {
        $response = $this->get('http://api.raabtanow.com/login');

        $response->assertStatus(404)
            ->assertHeader('content-type', 'application/json')
            ->assertExactJson([
                'success' => false,
                'message' => 'The requested API resource was not found.',
                'error_code' => 'NOT_FOUND',
            ]);
    }

    /**
     * Test that SPA deep links on the web domain return the React SPA Blade shell.
     */
    public function test_spa_deep_links_return_blade_spa_view(): void
    {
        $response = $this->get('http://raabtanow.com/profile');

        $response->assertStatus(200)
            ->assertSee('id="app"', false);
    }

    /**
     * Test that Laravel 12 application instance supports rebinding public path for public_html deployment.
     */
    public function test_application_supports_custom_public_path_binding(): void
    {
        $customPath = base_path('../public_html');
        $originalPath = app()->publicPath();

        app()->usePublicPath($customPath);

        $this->assertEquals($customPath, app()->publicPath());
        $this->assertEquals($customPath, app('path.public'));

        // Restore original path to avoid polluting subsequent tests
        app()->usePublicPath($originalPath);
        $this->assertEquals($originalPath, app()->publicPath());
    }

    /**
     * Test that sitemap.xml returns 200 with valid XML and all 9 public URLs.
     */
    public function test_sitemap_xml_endpoint_returns_valid_xml(): void
    {
        $response = $this->get('http://raabtanow.com/sitemap.xml');

        $response->assertStatus(200)
            ->assertHeader('Content-Type', 'application/xml; charset=utf-8')
            ->assertSee('<urlset', false)
            ->assertSee('https://raabtanow.com/', false)
            ->assertSee('https://raabtanow.com/how-it-works', false)
            ->assertSee('https://raabtanow.com/pricing', false)
            ->assertSee('https://raabtanow.com/about', false)
            ->assertSee('https://raabtanow.com/contact', false)
            ->assertSee('https://raabtanow.com/privacy-policy', false)
            ->assertSee('https://raabtanow.com/terms', false)
            ->assertSee('https://raabtanow.com/refund-policy', false)
            ->assertSee('https://raabtanow.com/delivery-policy', false)
            ->assertDontSee('/dashboard')
            ->assertDontSee('/search')
            ->assertDontSee('/login')
            ->assertDontSee('/api/');
    }

    /**
     * Test that public marketing routes render indexable SEO meta tags and canonical URLs.
     */
    public function test_public_pages_render_indexable_seo_metadata(): void
    {
        $response = $this->get('http://raabtanow.com/');

        $response->assertStatus(200)
            ->assertSee('<meta name="robots" content="index, follow', false)
            ->assertSee('<link rel="canonical" href="https://raabtanow.com">', false)
            ->assertSee('Online Rishta in Pakistan | Pakistani Matrimonial Website | RaabtaNow', false)
            ->assertSee('https://schema.org', false)
            ->assertSee('FAQPage', false);
    }

    /**
     * Test that private authenticated or sensitive routes render noindex meta tags.
     */
    public function test_private_routes_render_noindex_metadata(): void
    {
        $response = $this->get('http://raabtanow.com/dashboard');

        $response->assertStatus(200)
            ->assertSee('<meta name="robots" content="noindex, nofollow, noarchive, nosnippet">', false)
            ->assertDontSee('<link rel="canonical"');
    }
}
