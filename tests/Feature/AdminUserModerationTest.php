<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminUserModerationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_and_filter_users(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user1 = User::factory()->create(['name' => 'Sara Khan', 'email' => 'sara@example.com', 'status' => 'active']);
        $user2 = User::factory()->create(['name' => 'Bilal Ahmed', 'email' => 'bilal@example.com', 'status' => 'suspended']);

        Sanctum::actingAs($admin, ['*']);

        $response = $this->getJson('/api/admin/users?search=Sara');
        $response->assertStatus(200);
        $response->assertJsonFragment(['email' => 'sara@example.com']);
        $response->assertJsonMissing(['email' => 'bilal@example.com']);

        $responseFilter = $this->getJson('/api/admin/users?status=suspended');
        $responseFilter->assertStatus(200);
        $responseFilter->assertJsonFragment(['email' => 'bilal@example.com']);
    }

    public function test_admin_can_suspend_and_activate_user(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $targetUser = User::factory()->create(['role' => 'user', 'status' => 'active']);

        Sanctum::actingAs($admin, ['*']);

        // Suspend
        $suspendRes = $this->postJson("/api/admin/users/{$targetUser->id}/suspend");
        $suspendRes->assertStatus(200);
        $this->assertEquals('suspended', $targetUser->fresh()->status);

        // Activate
        $activateRes = $this->postJson("/api/admin/users/{$targetUser->id}/activate");
        $activateRes->assertStatus(200);
        $this->assertEquals('active', $targetUser->fresh()->status);
    }

    public function test_admin_cannot_suspend_or_demote_themselves(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);

        Sanctum::actingAs($admin, ['*']);

        $suspendRes = $this->postJson("/api/admin/users/{$admin->id}/suspend");
        $suspendRes->assertStatus(422);

        $roleRes = $this->postJson("/api/admin/users/{$admin->id}/role", ['role' => 'user']);
        $roleRes->assertStatus(422);

        $deleteRes = $this->deleteJson("/api/admin/users/{$admin->id}");
        $deleteRes->assertStatus(422);
    }
}
