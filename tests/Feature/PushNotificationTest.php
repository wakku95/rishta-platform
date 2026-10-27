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

    public function test_admin_can_search_and_send_direct_push(): void
    {
        Http::fake([
            'https://exp.host/--/api/v2/push/send' => Http::response([
                'data' => ['status' => 'ok'],
            ], 200),
        ]);

        $admin = User::factory()->create(['role' => 'admin']);
        $candidateUser = User::factory()->create([
            'push_token' => 'ExponentPushToken[candidate-device-token]',
        ]);

        \App\Models\Profile::create([
            'user_id' => $candidateUser->id,
            'profile_code' => 'RN-TEST99',
            'full_name' => 'Sara Ahmed',
            'gender' => 'female',
            'date_of_birth' => '1998-05-10',
            'religion' => 'Islam',
            'sect' => 'Sunni',
            'city' => 'Lahore',
            'education' => 'Bachelors',
            'profession' => 'Teacher',
            'marital_status' => 'never_married',
            'height' => 165,
            'managed_by' => 'myself',
            'profile_status' => 'active',
        ]);

        // 1. Search candidate
        $searchRes = $this->actingAs($admin)
            ->postJson('/api/admin/push-notifications/search-candidate', [
                'query' => 'RN-TEST',
            ]);

        $searchRes->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertEquals('RN-TEST99', $searchRes->json('data.0.profile_code'));
        $this->assertTrue($searchRes->json('data.0.has_push_token'));

        // 2. Send custom push
        $sendRes = $this->actingAs($admin)
            ->postJson('/api/admin/push-notifications/send', [
                'user_id' => $candidateUser->id,
                'title' => 'Proposal Response Reminder 💍',
                'message' => 'You have a pending proposal. Please review.',
                'target_screen' => 'Proposals',
                'target_tab' => 'received',
            ]);

        $sendRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'push_delivered' => true,
                ],
            ]);

        // 3. Assert in-app announcement & communication log created
        $this->assertDatabaseHas('announcements', [
            'user_id' => $candidateUser->id,
            'title' => 'Proposal Response Reminder 💍',
        ]);

        $this->assertDatabaseHas('communication_logs', [
            'channel' => 'push',
            'admin_id' => $admin->id,
        ]);
    }

    public function test_push_payload_includes_default_android_channel(): void
    {
        Http::fake([
            'https://exp.host/--/api/v2/push/send' => Http::response([
                'data' => [['status' => 'ok', 'id' => 'abc-123']],
            ], 200),
        ]);

        $dispatched = PushNotificationService::sendToToken(
            'ExponentPushToken[android-channel-test]',
            'Channel Test',
            'Testing Android channel',
            ['screen' => 'Notifications']
        );

        $this->assertTrue($dispatched);

        Http::assertSent(function ($request) {
            return $request->url() === 'https://exp.host/--/api/v2/push/send'
                && $request['to'] === 'ExponentPushToken[android-channel-test]'
                && $request['channelId'] === 'default'
                && $request['priority'] === 'high'
                && $request['sound'] === 'default';
        });
    }

    public function test_announcement_send_to_user_automatically_dispatches_push(): void
    {
        Http::fake([
            'https://exp.host/--/api/v2/push/send' => Http::response([
                'data' => [['status' => 'ok', 'id' => 'announcement-push-1']],
            ], 200),
        ]);

        $user = User::factory()->create([
            'push_token' => 'ExponentPushToken[announcement-user-token]',
        ]);

        $announcement = \App\Models\Announcement::sendToUser(
            $user->id,
            'New Proposal Received 💌',
            'Candidate RN-1024 has sent you a proposal.',
            'info',
            '/requests',
            'Review Proposal'
        );

        $this->assertNotNull($announcement);
        $this->assertDatabaseHas('announcements', [
            'id' => $announcement->id,
            'user_id' => $user->id,
        ]);

        Http::assertSent(function ($request) {
            return $request->url() === 'https://exp.host/--/api/v2/push/send'
                && $request['to'] === 'ExponentPushToken[announcement-user-token]'
                && $request['title'] === 'New Proposal Received 💌';
        });
    }
}
