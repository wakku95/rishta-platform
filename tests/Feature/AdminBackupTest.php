<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminBackupTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
    }

    public function test_guest_cannot_access_backup_endpoints(): void
    {
        $this->getJson('/api/admin/backup/info')->assertStatus(401);
        $this->postJson('/api/admin/backup/create')->assertStatus(401);
    }

    public function test_non_admin_cannot_access_backup_endpoints(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/admin/backup/info')
            ->assertStatus(403);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/admin/backup/create')
            ->assertStatus(403);
    }

    public function test_admin_can_get_backup_info(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $res = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/backup/info')
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $res->assertJsonStructure([
            'data' => [
                'database' => [
                    'database_name',
                    'driver',
                    'tables_count',
                    'approx_rows',
                ],
                'backups',
            ]
        ]);
    }

    public function test_admin_can_generate_and_download_backup(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $createRes = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/backup/create', ['compress' => false])
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $filename = $createRes->json('data.filename');
        $this->assertNotEmpty($filename);
        $this->assertStringEndsWith('.sql', $filename);

        // Download
        $downloadRes = $this->actingAs($admin, 'sanctum')
            ->get("/api/admin/backup/download/{$filename}")
            ->assertStatus(200);

        $this->assertEquals('attachment; filename=' . $filename, $downloadRes->headers->get('content-disposition'));

        // Delete
        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/admin/backup/{$filename}")
            ->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    public function test_path_traversal_is_blocked(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin, 'sanctum')
            ->get("/api/admin/backup/download/..%2F..%2F.env")
            ->assertStatus(404);
    }
}
