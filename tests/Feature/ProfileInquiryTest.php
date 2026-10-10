<?php

namespace Tests\Feature;

use App\Models\Profile;
use App\Models\ProfileInquiry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileInquiryTest extends TestCase
{
    use RefreshDatabase;

    public function test_anyone_can_submit_profile_inquiry(): void
    {
        $candidateUser = User::factory()->create();
        $profile = Profile::create([
            'user_id' => $candidateUser->id,
            'profile_code' => 'RK-INQUIRY1',
            'gender' => 'female',
            'date_of_birth' => '1998-05-15',
            'religion' => 'Islam',
            'sect' => 'Sunni',
            'city' => 'Islamabad',
            'education' => "Master's",
            'profession' => 'Doctor',
            'marital_status' => 'never_married',
            'height' => 165,
            'managed_by' => 'myself',
            'profile_status' => 'active',
        ]);

        $payload = [
            'submitter_name' => 'Ahmad Khan',
            'submitter_contact' => '03001234567',
            'submitter_email' => 'ahmad@example.com',
            'family_details' => 'Decent business family residing in Islamabad.',
            'questions' => 'Are you open to relocating?',
        ];

        $response = $this->postJson("/api/discovery/profiles/{$profile->profile_code}/inquire", $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'profile_code' => $profile->profile_code,
                    'status' => 'new',
                ],
            ]);

        $this->assertDatabaseHas('profile_inquiries', [
            'profile_id' => $profile->id,
            'submitter_name' => 'Ahmad Khan',
            'submitter_contact' => '+923001234567',
            'status' => 'new',
        ]);
    }

    public function test_user_cannot_inquire_on_their_own_profile(): void
    {
        $user = User::factory()->create();
        $profile = Profile::create([
            'user_id' => $user->id,
            'profile_code' => 'RK-SELF1',
            'gender' => 'male',
            'date_of_birth' => '1995-01-01',
            'religion' => 'Islam',
            'sect' => 'Sunni',
            'city' => 'Lahore',
            'education' => "Bachelor's",
            'profession' => 'Engineer',
            'marital_status' => 'never_married',
            'height' => 175,
            'managed_by' => 'myself',
            'profile_status' => 'active',
        ]);

        $response = $this->actingAs($user)->postJson("/api/discovery/profiles/{$profile->profile_code}/inquire", [
            'submitter_name' => 'My Name',
            'submitter_contact' => '03009876543',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error_code' => 'CANNOT_INQUIRE_OWN_PROFILE',
            ]);
    }

    public function test_duplicate_inquiry_within_24_hours_is_rejected(): void
    {
        $candidateUser = User::factory()->create();
        $profile = Profile::create([
            'user_id' => $candidateUser->id,
            'profile_code' => 'RK-DUP1',
            'gender' => 'female',
            'date_of_birth' => '1998-05-15',
            'religion' => 'Islam',
            'sect' => 'Sunni',
            'city' => 'Lahore',
            'education' => "Bachelor's",
            'profession' => 'Teacher',
            'marital_status' => 'never_married',
            'height' => 162,
            'managed_by' => 'myself',
            'profile_status' => 'active',
        ]);

        $payload = [
            'submitter_name' => 'Bilal',
            'submitter_contact' => '03211234567',
        ];

        $this->postJson("/api/discovery/profiles/{$profile->profile_code}/inquire", $payload)
            ->assertStatus(201);

        // Immediate retry with same contact
        $this->postJson("/api/discovery/profiles/{$profile->profile_code}/inquire", $payload)
            ->assertStatus(429);
    }

    public function test_admin_can_manage_inquiries(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $regularUser = User::factory()->create(['role' => 'user']);

        $candidateUser = User::factory()->create();
        $profile = Profile::create([
            'user_id' => $candidateUser->id,
            'profile_code' => 'RK-ADMININQ',
            'gender' => 'female',
            'date_of_birth' => '1998-05-15',
            'religion' => 'Islam',
            'sect' => 'Sunni',
            'city' => 'Karachi',
            'education' => "Bachelor's",
            'profession' => 'Banker',
            'marital_status' => 'never_married',
            'height' => 160,
            'managed_by' => 'myself',
            'profile_status' => 'active',
        ]);

        $inquiry = ProfileInquiry::create([
            'profile_id' => $profile->id,
            'submitter_name' => 'Usman Tariq',
            'submitter_contact' => '+923001122334',
            'family_details' => 'Family in Karachi.',
            'questions' => 'Preferred cast?',
            'status' => 'new',
        ]);

        // Regular user cannot access admin inquiries
        $this->actingAs($regularUser)->getJson('/api/admin/inquiries')->assertStatus(403);

        // Admin can list inquiries
        $listRes = $this->actingAs($admin)->getJson('/api/admin/inquiries');
        $listRes->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'data' => [
                        '*' => ['id', 'profile_code', 'submitter_name', 'submitter_contact', 'status'],
                    ],
                ],
            ]);

        // Admin can update status
        $this->actingAs($admin)->postJson("/api/admin/inquiries/{$inquiry->id}/status", [
            'status' => 'contacted',
        ])->assertStatus(200);

        $this->assertEquals('contacted', $inquiry->fresh()->status);

        // Admin can update notes
        $this->actingAs($admin)->postJson("/api/admin/inquiries/{$inquiry->id}/notes", [
            'admin_notes' => 'Spoke to brother on WhatsApp. Both families interested.',
        ])->assertStatus(200);

        $this->assertEquals('Spoke to brother on WhatsApp. Both families interested.', $inquiry->fresh()->admin_notes);

        // Admin can delete inquiry
        $this->actingAs($admin)->deleteJson("/api/admin/inquiries/{$inquiry->id}")->assertStatus(200);
        $this->assertDatabaseMissing('profile_inquiries', ['id' => $inquiry->id]);
    }
}
