<?php

namespace App\Channels;

use App\Services\Notification\PushNotificationService;
use Illuminate\Notifications\Notification;

class ExpoPushChannel
{
    /**
     * Send the given notification via Expo Push Notification Service.
     */
    public function send(object $notifiable, Notification $notification): void
    {
        if (empty($notifiable->push_token)) {
            return;
        }

        if (!method_exists($notification, 'toExpoPush')) {
            return;
        }

        $message = $notification->toExpoPush($notifiable);
        if (empty($message) || empty($message['title'])) {
            return;
        }

        PushNotificationService::sendToToken(
            $notifiable->push_token,
            $message['title'],
            $message['body'] ?? '',
            $message['data'] ?? []
        );
    }
}
