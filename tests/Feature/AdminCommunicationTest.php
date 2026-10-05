<?php

namespace Tests\Feature;

use App\Mail\AdminCandidateMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AdminCommunicationTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $regularUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $this->regularUser = User::factory()->create([
            'role' => 'user',
        ]);
    }

    public function test_non_admin_cannot_send_communication_email(): void
    {
        $response = $this->actingAs($this->regularUser)
            ->postJson('/api/admin/communications/send-email', [
                'recipient_email' => 'test@example.com',
                'subject' => 'Hello',
                'message' => 'Test message',
            ]);

        $response->assertStatus(403);
    }

    public function test_guest_cannot_send_communication_email(): void
    {
        $response = $this->postJson('/api/admin/communications/send-email', [
            'recipient_email' => 'test@example.com',
            'subject' => 'Hello',
            'message' => 'Test message',
        ]);

        $response->assertStatus(401);
    }

    public function test_admin_can_send_candidate_email_successfully(): void
    {
        Mail::fake();

        $file = UploadedFile::fake()->create('profile_card.png', 50, 'image/png');

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/communications/send-email', [
                'recipient_email' => 'candidate@example.com',
                'recipient_name' => 'Fatima Zahra',
                'subject' => 'Marriage Proposal Inquiry for Profile AP-1002',
                'message' => 'We are pleased to inform you that a verified family has shown interest.',
                'attachments' => [$file],
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true);

        Mail::assertSent(AdminCandidateMail::class, function ($mail) {
            return $mail->hasTo('candidate@example.com') &&
                   $mail->subjectLine === 'Marriage Proposal Inquiry for Profile AP-1002' &&
                   $mail->recipientName === 'Fatima Zahra' &&
                   count($mail->fileAttachments) === 1;
        });
    }

    public function test_send_email_validates_required_fields(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/communications/send-email', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['recipient_email', 'subject', 'message']);
    }
}
