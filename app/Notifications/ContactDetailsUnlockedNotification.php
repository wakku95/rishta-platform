<?php

namespace App\Notifications;

use App\Models\ContactUnlock;
use App\Models\RishtaRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ContactDetailsUnlockedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public RishtaRequest $rishtaRequest,
        public string $otherPartyProfileCode
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $requestsUrl = rtrim(config('app.url', 'https://raabtanow.com'), '/') . '/requests';

        return (new MailMessage)
            ->subject("Verified Contact Details Unlocked! — RaabtaNow")
            ->greeting("Assalam-o-Alaikum, {$notifiable->name}")
            ->line("Mutual interest and dual mobile phone verification have been successfully completed.")
            ->line("Verified contact details have now been unlocked for your connection with Candidate **{$this->otherPartyProfileCode}**.")
            ->line("You can now view their direct phone number and initiate a respectful WhatsApp conversation.")
            ->action('View Contact Details', $requestsUrl)
            ->line("Please ensure all communication remains dignified, respectful, and culturally appropriate.")
            ->salutation("With warm regards,\nThe RaabtaNow Team");
    }
}
