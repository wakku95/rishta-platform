<?php

namespace Tests\Feature;

use App\Models\Profile;
use App\Models\Shortlist;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class ShortlistTest extends TestCase
{
    use RefreshDatabase;

    protected function createVerifiedUser(array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'email_verified_at' => now(),
            'status' => 'active',
        ], $attributes));
    }

    protected function createActiveProfile(User $user, array $attributes = []): Profile
    {
        return Profile::create(array_merge([
            'user_id' => $user->id,
            'gender' => 'female',
            'date_of_birth' => '1998-05-15',
            'religion' => 'Islam',
            'sect' => 'Sunni',
            'city' => 'Lahore',
            'education' => 'Bachelors',
            'profession' => 'Software Engineer',
            'marital_status' => 'never_married',
            'height' => 165,
            'managed_by' => 'self',
            'profile_status' => 'active',
        ], $attributes));
    }

    public function test_guest_cannot_access_shortlist_endpoints(): void
    {
        $this->getJson('/api/shortlists')->assertStatus(Response::HTTP_UNAUTHORIZED);
        $this->postJson('/api/shortlists', ['profile_code' => 'RK-ABC123'])->assertStatus(Response::HTTP_UNAUTHORIZED);
        $this->deleteJson('/api/shortlists/RK-ABC123')->assertStatus(Response::HTTP_UNAUTHORIZED);
    }

    public function test_authenticated_user_can_shortlist_an_active_candidate(): void
    {
        $user1 = $this->createVerifiedUser();
        $user2 = $this->createVerifiedUser();
        $targetProfile = $this->createActiveProfile($user2);

        $response = $this->actingAs($user1)
            ->postJson('/api/shortlists', [
                'profile_code' => $targetProfile->profile_code,
            ]);

        $response->assertStatus(Response::HTTP_CREATED)
            ->assertJson([
                'success' => true,
                'data' => ['is_shortlisted' => true],
            ]);

        $this->assertDatabaseHas('shortlists', [
            'user_id' => $user1->id,
            'profile_id' => $targetProfile->id,
        ]);
    }

    public function test_shortlisting_is_idempotent(): void
    {
        $user1 = $this->createVerifiedUser();
        $user2 = $this->createVerifiedUser();
        $targetProfile = $this->createActiveProfile($user2);

        $this->actingAs($user1)->postJson('/api/shortlists', ['profile_code' => $targetProfile->profile_code]);
        $response = $this->actingAs($user1)->postJson('/api/shortlists', ['profile_code' => $targetProfile->profile_code]);

        $response->assertStatus(Response::HTTP_CREATED);
        $this->assertEquals(1, Shortlist::where('user_id', $user1->id)->where('profile_id', $targetProfile->id)->count());
    }

    public function test_user_cannot_shortlist_their_own_profile(): void
    {
        $user = $this->createVerifiedUser();
        $ownProfile = $this->createActiveProfile($user);

        $response = $this->actingAs($user)
            ->postJson('/api/shortlists', [
                'profile_code' => $ownProfile->profile_code,
            ]);

        $response->assertStatus(Response::HTTP_UNPROCESSABLE_ENTITY)
            ->assertJson([
                'success' => false,
                'error_code' => 'CANNOT_SHORTLIST_SELF',
            ]);
    }

    public function test_cannot_shortlist_inactive_or_non_existent_profile(): void
    {
        $user1 = $this->createVerifiedUser();
        $user2 = $this->createVerifiedUser();
        $draftProfile = $this->createActiveProfile($user2, ['profile_status' => 'draft']);

        $response = $this->actingAs($user1)
            ->postJson('/api/shortlists', [
                'profile_code' => $draftProfile->profile_code,
            ]);

        $response->assertStatus(Response::HTTP_NOT_FOUND)
            ->assertJson([
                'success' => false,
                'error_code' => 'PROFILE_NOT_FOUND',
            ]);
    }

    public function test_authenticated_user_can_list_shortlists(): void
    {
        $user1 = $this->createVerifiedUser();
        $user2 = $this->createVerifiedUser();
        $user3 = $this->createVerifiedUser();

        $profile2 = $this->createActiveProfile($user2);
        $profile3 = $this->createActiveProfile($user3);

        $this->actingAs($user1)->postJson('/api/shortlists', ['profile_code' => $profile2->profile_code]);
        $this->actingAs($user1)->postJson('/api/shortlists', ['profile_code' => $profile3->profile_code]);

        $response = $this->actingAs($user1)->getJson('/api/shortlists');

        $response->assertStatus(Response::HTTP_OK)
            ->assertJsonStructure([
                'success',
                'data',
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ]);

        $data = $response->json('data');
        $this->assertCount(2, $data);
        // Ensure strictly privacy-safe PublicProfileResource
        $this->assertArrayNotHasKey('date_of_birth', $data[0]);
        $this->assertArrayNotHasKey('about', $data[0]);
    }

    public function test_user_can_remove_a_shortlisted_profile(): void
    {
        $user1 = $this->createVerifiedUser();
        $user2 = $this->createVerifiedUser();
        $profile2 = $this->createActiveProfile($user2);

        $this->actingAs($user1)->postJson('/api/shortlists', ['profile_code' => $profile2->profile_code]);
        $this->assertDatabaseHas('shortlists', ['user_id' => $user1->id, 'profile_id' => $profile2->id]);

        $response = $this->actingAs($user1)->deleteJson("/api/shortlists/{$profile2->profile_code}");

        $response->assertStatus(Response::HTTP_OK)
            ->assertJson([
                'success' => true,
                'data' => ['is_shortlisted' => false],
            ]);

        $this->assertDatabaseMissing('shortlists', ['user_id' => $user1->id, 'profile_id' => $profile2->id]);
    }

    public function test_removing_non_shortlisted_profile_is_graceful(): void
    {
        $user1 = $this->createVerifiedUser();
        $user2 = $this->createVerifiedUser();
        $profile2 = $this->createActiveProfile($user2);

        $response = $this->actingAs($user1)->deleteJson("/api/shortlists/{$profile2->profile_code}");

        $response->assertStatus(Response::HTTP_OK)
            ->assertJson([
                'success' => true,
                'data' => ['is_shortlisted' => false],
            ]);
    }
}
