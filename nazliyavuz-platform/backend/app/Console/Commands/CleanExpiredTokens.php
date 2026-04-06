<?php

namespace App\Console\Commands;

use App\Models\RefreshToken;
use Illuminate\Console\Command;

class CleanExpiredTokens extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tokens:clean
                            {--force : Force deletion without confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up expired and revoked refresh tokens';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Cleaning expired refresh tokens...');

        $deletedCount = RefreshToken::cleanExpired();

        $this->info("✓ Cleaned {$deletedCount} expired/revoked tokens");

        return Command::SUCCESS;
    }
}
