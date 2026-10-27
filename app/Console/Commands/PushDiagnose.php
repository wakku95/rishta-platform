<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class PushDiagnose extends Command
{
    protected $signature = 'push:diagnose {email : Email of the user to send a diagnostic push to}';

    protected $description = 'Send a test push to a user and fetch the Expo delivery receipt to reveal the real FCM error.';

    public function handle(): int
    {
        $user = User::where('email', $this->argument('email'))->first();

        if (!$user) {
            $this->error('User not found.');
            return self::FAILURE;
        }

        if (empty($user->push_token)) {
            $this->error('This user has no push_token saved. Open the app, log in, and tap "Test Push Notification" first.');
            return self::FAILURE;
        }

        $this->info("Token: {$user->push_token}");

        $send = Http::timeout(10)->acceptJson()->post('https://exp.host/--/api/v2/push/send', [
            'to' => $user->push_token,
            'title' => 'RaabtaNow Diagnostic 🔔',
            'body' => 'If you see this, push notifications are working.',
            'sound' => 'default',
            'priority' => 'high',
            'channelId' => 'default',
        ]);

        $this->line('Send response: ' . $send->body());

        $ticket = $send->json('data');
        $ticket = isset($ticket[0]) ? $ticket[0] : $ticket;

        if (($ticket['status'] ?? null) !== 'ok') {
            $this->error('Ticket error: ' . json_encode($ticket));
            return self::FAILURE;
        }

        $ticketId = $ticket['id'] ?? null;
        $this->info("Ticket OK (id: {$ticketId}). Waiting 8 seconds for delivery receipt...");
        sleep(8);

        $receipt = Http::timeout(10)->acceptJson()->post('https://exp.host/--/api/v2/push/getReceipts', [
            'ids' => [$ticketId],
        ]);

        $this->line('Receipt response: ' . $receipt->body());

        $result = $receipt->json("data.{$ticketId}");

        if (!$result) {
            $this->warn('Receipt not ready yet. Run the command again in a minute.');
            return self::SUCCESS;
        }

        if (($result['status'] ?? null) === 'ok') {
            $this->info('Receipt OK: Firebase accepted the message. If the phone still shows nothing, check phone notification/battery settings.');
            return self::SUCCESS;
        }

        $this->error('DELIVERY FAILED: ' . ($result['message'] ?? 'unknown'));
        $this->error('Error code: ' . ($result['details']['error'] ?? 'n/a'));

        return self::FAILURE;
    }
}
