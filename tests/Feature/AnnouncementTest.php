<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class AnnouncementTest extends TestCase
{
    use RefreshDatabase;

    protected function createAdmin(): User
    {
        return User::factory()->create(['role' => User::ROLE_ADMIN]);
    }

    protected function createUser(): User
    {
        return User::factory()->create(['role' => User::ROLE_USER]);
    }

    public function test_admin_can_broadcast_announcement(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->postJson('/api/admin/announcements', [
            'title' => 'Update Your Phone Number',
            'message' => 'Please update your WhatsApp number so we can help you.',
            'type' => 'warning',
            'target_audience' => Announcement::AUDIENCE_MISSING_PHONE,
            'action_url' => '/dashboard',
            'action_label' => 'Go to Dashboard',
        ]);

        $response->assertStatus(Response::HTTP_CREATED)
            ->assertJson([
                'success' => true,
                'message' => 'Announcement broadcasted successfully to targeted users.',
            ]);

        $this->assertDatabaseHas('announcements', [
            'title' => 'Update Your Phone Number',
            'target_audience' => 'missing_phone',
        ]);
    }

    public function test_non_admin_cannot_broadcast_announcement(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user)->postJson('/api/admin/announcements', [
            'title' => 'Hacked announcement',
            'message' => 'Test message',
            'type' => 'info',
            'target_audience' => 'all',
        ]);

        $response->assertStatus(Response::HTTP_FORBIDDEN);
    }

    public function test_user_receives_targeted_announcement(): void
    {
        $admin = $this->createAdmin();
        $userWithPhone = User::factory()->create(['phone' => '03001234567']);
        $userWithoutPhone = User::factory()->create(['phone' => null]);

        // Announcement for missing phone only
        Announcement::create([
            'title' => 'Add Phone',
            'message' => 'Please add phone',
            'type' => 'info',
            'target_audience' => Announcement::AUDIENCE_MISSING_PHONE,
            'created_by' => $admin->id,
        ]);

        // Announcement for all
        Announcement::create([
            'title' => 'Welcome to RaabtaNow',
            'message' => 'Welcome everyone',
            'type' => 'success',
            'target_audience' => Announcement::AUDIENCE_ALL,
            'created_by' => $admin->id,
        ]);

        // User WITHOUT phone should see 2 announcements
        $res1 = $this->actingAs($userWithoutPhone)->getJson('/api/notifications');
        $res1->assertStatus(Response::HTTP_OK)
            ->assertJson([
                'success' => true,
                'unread_count' => 2,
            ]);

        // User WITH phone should only see 1 announcement (the 'all' one)
        $res2 = $this->actingAs($userWithPhone)->getJson('/api/notifications');
        $res2->assertStatus(Response::HTTP_OK)
            ->assertJson([
                'success' => true,
                'unread_count' => 1,
            ]);
    }

    public function test_user_can_mark_notification_as_read(): void
    {
        $admin = $this->createAdmin();
        $user = $this->createUser();

        $announcement = Announcement::create([
            'title' => 'Test Notice',
            'message' => 'Some notice',
            'type' => 'info',
            'target_audience' => Announcement::AUDIENCE_ALL,
            'created_by' => $admin->id,
        ]);

        $resBefore = $this->actingAs($user)->getJson('/api/notifications');
        $resBefore->assertJson(['unread_count' => 1]);

        $markRes = $this->actingAs($user)->postJson("/api/notifications/{$announcement->id}/read");
        $markRes->assertStatus(Response::HTTP_OK);

        $resAfter = $this->actingAs($user)->getJson('/api/notifications');
        $resAfter->assertJson(['unread_count' => 0]);
        $this->assertTrue($resAfter->json('data.0.is_read'));
    }

    public function test_user_can_mark_all_as_read(): void
    {
        $admin = $this->createAdmin();
        $user = $this->createUser();

        Announcement::create([
            'title' => 'Notice 1',
            'message' => 'Notice 1 text',
            'type' => 'info',
            'target_audience' => 'all',
            'created_by' => $admin->id,
        ]);
        Announcement::create([
            'title' => 'Notice 2',
            'message' => 'Notice 2 text',
            'type' => 'warning',
            'target_audience' => 'all',
            'created_by' => $admin->id,
        ]);

        $this->actingAs($user)->postJson('/api/notifications/read-all')
            ->assertStatus(Response::HTTP_OK);

        $res = $this->actingAs($user)->getJson('/api/notifications');
        $res->assertJson(['unread_count' => 0]);
    }

    public function test_admin_can_delete_announcement(): void
    {
        $admin = $this->createAdmin();
        $announcement = Announcement::create([
            'title' => 'Delete Me',
            'message' => 'To be deleted',
            'type' => 'info',
            'target_audience' => 'all',
            'created_by' => $admin->id,
        ]);

        $response = $this->actingAs($admin)->deleteJson("/api/admin/announcements/{$announcement->id}");
        $response->assertStatus(Response::HTTP_OK);

        $this->assertDatabaseMissing('announcements', ['id' => $announcement->id]);
    }

    public function test_user_receives_personal_activity_notification(): void
    {
        $user1 = $this->createUser();
        $user2 = $this->createUser();

        Announcement::sendToUser(
            $user1->id,
            'New Proposal Received 💌',
            'Candidate RK-123456 sent you a proposal.',
            'info',
            '/requests',
            'View Proposal'
        );

        // User 1 sees the personal notification
        $res1 = $this->actingAs($user1)->getJson('/api/notifications');
        $res1->assertStatus(Response::HTTP_OK)
            ->assertJson([
                'success' => true,
                'unread_count' => 1,
                'data' => [
                    [
                        'title' => 'New Proposal Received 💌',
                        'is_personal' => true,
                        'is_read' => false,
                    ]
                ]
            ]);

        // User 2 does NOT see User 1's personal notification
        $res2 = $this->actingAs($user2)->getJson('/api/notifications');
        $res2->assertStatus(Response::HTTP_OK)
            ->assertJson([
                'success' => true,
                'unread_count' => 0,
                'data' => []
            ]);
    }

    public function test_activity_lifecycle_in_app_notifications(): void
    {
        $sender = $this->createUser();
        $receiver = $this->createUser();

        // 1. New proposal received
        Announcement::sendToUser(
            $receiver->id,
            'New Proposal Received 💌',
            'You have received a new matrimonial proposal from candidate RK-AAAAAA [REQ-123456].',
            'info',
            '/requests',
            'Review Proposal'
        );

        $receiverNotes = $this->actingAs($receiver)->getJson('/api/notifications');
        $receiverNotes->assertStatus(Response::HTTP_OK)
            ->assertJson([
                'unread_count' => 1,
                'data' => [
                    [
                        'title' => 'New Proposal Received 💌',
                        'action_url' => '/requests',
                    ]
                ]
            ]);

        // 2. Proposal accepted
        Announcement::sendToUser(
            $sender->id,
            'Proposal Accepted 🎉',
            'Candidate RK-BBBBBB has accepted your rishta proposal [REQ-123456]!',
            'success',
            '/requests',
            'View Response'
        );

        $senderNotes = $this->actingAs($sender)->getJson('/api/notifications');
        $senderNotes->assertStatus(Response::HTTP_OK)
            ->assertJson([
                'unread_count' => 1,
                'data' => [
                    [
                        'title' => 'Proposal Accepted 🎉',
                        'type' => 'success',
                        'action_url' => '/requests',
                    ]
                ]
            ]);

        // 3. Counter-questions answered
        Announcement::sendToUser(
            $receiver->id,
            'Counter-Questions Answered',
            'Candidate RK-AAAAAA has answered your questions on proposal [REQ-123456].',
            'info',
            '/requests',
            'View Answers'
        );

        $receiverNotes2 = $this->actingAs($receiver)->getJson('/api/notifications');
        $receiverNotes2->assertJson(['unread_count' => 2]);
    }
}
