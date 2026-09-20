<?php

namespace App\Notifications;

use App\Models\Profile;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AssistedProfileConfirmationNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Profile $profile,
        public string $token
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $confirmUrl = rtrim(config('app.url', 'https://raabtanow.com'), '/') . '/confirm-profile/' . $this->token;
        $profileCode = $this->profile->profile_code;
        $adminName = $this->profile->createdByAdmin?->name ?? 'An administrator';

        return (new MailMessage)
            ->subject("Important: Setup Your RaabtaNow Matrimonial Profile")
            ->greeting("Assalam-o-Alaikum, {$notifiable->name}")
            ->line("{$adminName} from RaabtaNow has created a secure matrimonial profile on your behalf.")
            ->line("**Your Profile Code:** {$profileCode}")
            ->line("To take control of your profile, set your private password, and activate your account, please click the button below.")
            ->action('Set Password & Activate Profile', $confirmUrl)
            ->line("For your security, this secure link will expire in 7 days.")
            ->line("RaabtaNow values your privacy. Your contact details remain strictly hidden from other users.")
            ->salutation("With warm regards,\nThe RaabtaNow Team");
    }
}
