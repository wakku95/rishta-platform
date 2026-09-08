<?php

namespace App\Console\Commands;

use App\Models\RishtaRequest;
use Carbon\Carbon;
use Illuminate\Console\Command;

class ExpireStaleRequestsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'requests:expire-stale';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Expire pending Rishta requests that have exceeded their expiration date (14 days)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $now = Carbon::now();

        $count = RishtaRequest::where('status', RishtaRequest::STATUS_PENDING)
            ->where('expires_at', '<=', $now)
            ->update([
                'status' => RishtaRequest::STATUS_EXPIRED,
                'active_pair_hash' => null,
            ]);

        $this->info("Expired {$count} stale rishta request(s).");

        return Command::SUCCESS;
    }
}
