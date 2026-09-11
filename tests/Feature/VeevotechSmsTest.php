<?php

namespace Tests\Feature;

use App\Contracts\SmsServiceInterface;
use App\Services\Sms\VeevotechSmsService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class VeevotechSmsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'sms.default' => 'veevotech',
            'sms.providers.veevotech.api_key' => 'test_hash_apikey_12345',
            'sms.providers.veevotech.sender_id' => 'Default',
            'sms.providers.veevotech.endpoint' => 'https://api.veevotech.com/v3/sendsms',
        ]);
    }

    public function test_container_resolves_veevotech_sms_service(): void
    {
        $service = app(SmsServiceInterface::class);
        $this->assertInstanceOf(VeevotechSmsService::class, $service);
    }

    public function test_sends_sms_with_correct_payload_and_handles_success(): void
    {
        Http::fake([
            'https://api.veevotech.com/v3/sendsms' => Http::response([
                'STATUS' => 'SUCCESSFUL',
                'MESSAGE_ID' => 'msg_abc12345',
                'COUNTRY_SUPPORTED' => 'TRUE',
                'COUNTRY_CODE' => 92,
                'COUNTRY_ISO' => 'PK',
                'NETWORK_NAME' => 'Jazz-PK',
                'RECEIVER_NUMBER' => '+923001234567',
                'ERROR_FILTER' => '',
            ], 200),
        ]);

        $service = new VeevotechSmsService();
        $result = $service->sendSms('03001234567', 'Your RaabtaNow OTP is 654321');

        $this->assertTrue($result);

        // Verify outgoing request payload
        Http::assertSent(function ($request) {
            $data = $request->data();
            return $request->url() === 'https://api.veevotech.com/v3/sendsms'
                && ($data['apikey'] ?? '') === 'test_hash_apikey_12345'
                && ($data['receivernum'] ?? '') === '+923001234567'
                && ($data['sendernum'] ?? '') === 'Default'
                && str_contains($data['textmessage'] ?? '', '654321');
        });

        // Verify last sent metadata masks phone number
        $lastSent = $service->getLastSent();
        $this->assertNotNull($lastSent);
        $this->assertTrue($lastSent['success']);
        $this->assertEquals('msg_abc12345', $lastSent['message_id']);
        $this->assertEquals('+92300****567', $lastSent['phone_masked']);
        $this->assertArrayNotHasKey('apikey', $lastSent);
    }

    public function test_normalizes_various_pakistani_phone_formats(): void
    {
        Http::fake([
            'https://api.veevotech.com/v3/sendsms' => Http::response([
                'STATUS' => 'SUCCESSFUL',
                'MESSAGE_ID' => 'msg_norm1',
            ], 200),
        ]);

        $service = new VeevotechSmsService();

        // 0300... format
        $service->sendSms('03001234567', 'Test');
        Http::assertSent(fn($req) => $req['receivernum'] === '+923001234567');

        // 92300... format without plus
        $service->sendSms('923001234567', 'Test');
        Http::assertSent(fn($req) => $req['receivernum'] === '+923001234567');

        // +92300... format with plus
        $service->sendSms('+923001234567', 'Test');
        Http::assertSent(fn($req) => $req['receivernum'] === '+923001234567');
    }

    public function test_handles_gateway_failure_gracefully_without_exception(): void
    {
        Http::fake([
            'https://api.veevotech.com/v3/sendsms' => Http::response([
                'STATUS' => 'FAILED',
                'ERROR_FILTER' => 'INSUFFICIENT_BALANCE',
            ], 200),
        ]);

        $service = new VeevotechSmsService();
        $result = $service->sendSms('03001234567', 'Your RaabtaNow OTP is 112233');

        $this->assertFalse($result);

        $lastSent = $service->getLastSent();
        $this->assertNotNull($lastSent);
        $this->assertFalse($lastSent['success']);
    }

    public function test_returns_false_when_api_key_is_empty(): void
    {
        config(['sms.providers.veevotech.api_key' => '']);

        $service = new VeevotechSmsService();
        $result = $service->sendSms('03001234567', 'Your OTP is 999999');

        $this->assertFalse($result);
        Http::assertNothingSent();
    }
}
