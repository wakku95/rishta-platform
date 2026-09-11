<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_admin_metrics(): void
    {
        $response = $this->getJson('/api/admin/metrics');
        $response->assertStatus(401);
    }

    public function test_regular_user_cannot_access_admin_metrics(): void
    {
        $user = User::factory()->create([
            'role' => 'user',
            'status' => 'active',
        ]);

        Sanctum::actingAs($user, ['*']);

        $response = $this->getJson('/api/admin/metrics');
        $response->assertStatus(403);
        $response->assertJson([
            'success' => false,
            'error_code' => 'UNAUTHORIZED',
        ]);
    }

    public function test_admin_can_access_admin_metrics(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'status' => 'active',
        ]);

        Sanctum::actingAs($admin, ['*']);

        $response = $this->getJson('/api/admin/metrics');
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                'users' => ['total', 'active', 'suspended', 'admins'],
                'profiles' => ['total', 'active', 'top_cities'],
                'requests' => ['total', 'pending', 'accepted'],
                'financials' => ['total_revenue_pkr', 'successful_payments'],
                'recent' => ['users', 'requests', 'payments'],
            ],
        ]);
    }
}
