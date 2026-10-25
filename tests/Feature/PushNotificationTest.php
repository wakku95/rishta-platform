<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\Notification\PushNotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PushNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_push_token(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/user/push-token', [
                'push_token' => 'ExponentPushToken[test-valid-device-token]',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'registered' => true,
                    'push_token' => 'ExponentPushToken[test-valid-device-token]',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'push_token' => 'ExponentPushToken[test-valid-device-token]',
        ]);
    }

    public function test_push_service_dispatches_expo_payload(): void
    {
        Http::fake([
            'https://exp.host/--/api/v2/push/send' => Http::response([
                'data' => [
                    'status' => 'ok',
                    'id' => 'xxxx-xxxx-xxxx',
                ],
            ], 200),
        ]);

        $result = PushNotificationService::sendToToken(
            'ExponentPushToken[test-device-token]',
            'New Proposal Received! 💍',
            'Someone sent you a marriage proposal.',
            ['action' => 'new_proposal', 'screen' => 'Proposals']
        );

        $this->assertTrue($result);

        Http::assertSent(function ($request) {
            return $request->url() === 'https://exp.host/--/api/v2/push/send'
                && $request['to'] === 'ExponentPushToken[test-device-token]'
                && $request['title'] === 'New Proposal Received! 💍';
        });
    }

    public function test_user_can_send_test_push(): void
    {
        Http::fake([
            'https://exp.host/--/api/v2/push/send' => Http::response([
                'data' => ['status' => 'ok'],
            ], 200),
        ]);

        $user = User::factory()->create([
            'push_token' => 'ExponentPushToken[valid-token]',
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/user/push-token/test');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
    }
}
