<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class PromoteAdminCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admin:promote {email : The email address of the user} {--demote : Demote the user back to standard user role}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Promote a user to admin or demote them back to standard user';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $email = $this->argument('email');
        $demote = $this->option('demote');

        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error("User with email [{$email}] not found.");
            return Command::FAILURE;
        }

        $targetRole = $demote ? 'user' : 'admin';
        $actionName = $demote ? 'demoted to standard user' : 'promoted to admin';

        $user->update(['role' => $targetRole]);

        $this->info("User [{$user->name}] ({$user->email}) successfully {$actionName}.");

        return Command::SUCCESS;
    }
}
