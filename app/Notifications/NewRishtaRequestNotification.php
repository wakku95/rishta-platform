<?php

namespace App\Notifications;

use App\Models\RishtaRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewRishtaRequestNotification extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public RishtaRequest $rishtaRequest)
    {
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $senderProfile = $this->rishtaRequest->sender?->profile;
        $profileCode = $senderProfile?->profile_code ?? 'Verified Candidate';
        
        $details = [];
        if ($senderProfile?->age) {
            $details[] = $senderProfile->age . ' yrs';
        }
        if ($senderProfile?->profession) {
            $details[] = $senderProfile->profession;
        }
        if ($senderProfile?->city) {
            $details[] = $senderProfile->city;
        }

        $summary = !empty($details) ? implode(' • ', $details) : 'Verified Candidate';
        $requestsUrl = rtrim(config('app.url', 'https://raabtanow.com'), '/') . '/requests';

        return (new MailMessage)
            ->subject("New Rishta Request from {$profileCode} — RaabtaNow")
            ->greeting("Assalam-o-Alaikum, {$notifiable->name}")
            ->line("A verified candidate has expressed interest in connecting with you on RaabtaNow:")
            ->line("**Candidate Profile:** {$profileCode} ({$summary})")
            ->line("You can review their full matrimonial profile, family background, and partner preferences privately on your account.")
            ->action('Review Rishta Request', $requestsUrl)
            ->line("Please review and respond within **14 days**. Your contact details remain strictly hidden unless both candidates mutually accept.")
            ->salutation("With warm regards,\nThe RaabtaNow Team");
    }
}
