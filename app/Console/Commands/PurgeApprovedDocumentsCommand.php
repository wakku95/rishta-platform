<?php

namespace App\Console\Commands;

use App\Services\Verification\VerificationService;
use Illuminate\Console\Command;

class PurgeApprovedDocumentsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'verifications:purge-documents {--days=30 : Number of days after approval to retain files}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Safely delete stored document files for approved verifications older than the retention threshold';

    /**
     * Execute the console command.
     */
    public function handle(VerificationService $service): int
    {
        $days = (int) $this->option('days');

        $this->info("Starting purge of approved verification documents older than {$days} days...");

        $result = $service->purgeApprovedDocuments($days);

        $this->info("Purge completed successfully.");
        $this->line(" - Verification records updated: {$result['purged_records']}");
        $this->line(" - Physical files unlinked from storage: {$result['freed_files']}");

        return Command::SUCCESS;
    }
}
