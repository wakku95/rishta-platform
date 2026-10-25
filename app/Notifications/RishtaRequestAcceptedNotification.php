<?php

namespace App\Notifications;

use App\Models\RishtaRequest;
use App\Channels\ExpoPushChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RishtaRequestAcceptedNotification extends Notification
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
        return ['mail', ExpoPushChannel::class];
    }

    /**
     * Get the Expo push representation of the notification.
     */
    public function toExpoPush(object $notifiable): array
    {
        $receiverProfile = $this->rishtaRequest->receiver?->profile;
        $profileCode = $receiverProfile?->profile_code ?? 'Candidate';

        return [
            'title' => 'Proposal Accepted! 🎉',
            'body' => "Candidate {$profileCode} has accepted your marriage proposal! Tap to view biodata.",
            'data' => [
                'screen' => 'Proposals',
                'tab' => 'accepted',
                'requestCode' => $this->rishtaRequest->request_code,
            ],
        ];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $receiverProfile = $this->rishtaRequest->receiver?->profile;
        $profileCode = $receiverProfile?->profile_code ?? 'Candidate';
        $requestsUrl = rtrim(config('app.url', 'https://raabtanow.com'), '/') . '/requests';

        return (new MailMessage)
            ->subject("Great News! Your Rishta Request was Accepted — RaabtaNow")
            ->greeting("Assalam-o-Alaikum, {$notifiable->name}")
            ->line("Candidate **{$profileCode}** has reviewed your profile and **accepted** your Rishta Request!")
            ->line("Both candidates have expressed mutual interest. You can now view the request details on your dashboard.")
            ->action('View Request Details', $requestsUrl)
            ->salutation("With warm regards,\nThe RaabtaNow Team");
    }
}
