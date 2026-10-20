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
}
