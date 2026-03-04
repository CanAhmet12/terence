<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class AdminBackupService
{
    protected $backupPath = 'backups';
    protected $maxBackups = 30; // Keep last 30 backups

    /**
     * Create database backup
     */
    public function createDatabaseBackup(): array
    {
        try {
            $timestamp = now()->format('Y-m-d_H-i-s');
            $filename = "database_backup_{$timestamp}.sql";
            $filepath = storage_path("app/{$this->backupPath}/{$filename}");

            // Ensure backup directory exists
            if (!is_dir(dirname($filepath))) {
                mkdir(dirname($filepath), 0755, true);
            }

            // Get database configuration
            $config = config('database.connections.' . config('database.default'));
            $host = $config['host'];
            $port = $config['port'];
            $database = $config['database'];
            $username = $config['username'];
            $password = $config['password'];

            // Create mysqldump command
            $command = sprintf(
                'mysqldump --host=%s --port=%s --user=%s --password=%s %s > %s',
                escapeshellarg($host),
                escapeshellarg($port),
                escapeshellarg($username),
                escapeshellarg($password),
                escapeshellarg($database),
                escapeshellarg($filepath)
            );

            // Execute backup command
            $output = [];
            $returnCode = 0;
            exec($command, $output, $returnCode);

            if ($returnCode !== 0) {
                throw new \Exception('Database backup failed: ' . implode("\n", $output));
            }

            // Verify backup file exists and has content
            if (!file_exists($filepath) || filesize($filepath) === 0) {
                throw new \Exception('Backup file was not created or is empty');
            }

            // Store backup metadata
            $metadata = [
                'filename' => $filename,
                'filepath' => $filepath,
                'size' => filesize($filepath),
                'created_at' => now()->toISOString(),
                'type' => 'database',
                'status' => 'completed',
            ];

            $this->storeBackupMetadata($metadata);

            // Cleanup old backups
            $this->cleanupOldBackups();

            Log::info('Database backup created successfully', $metadata);

            return [
                'success' => true,
                'message' => 'Database backup created successfully',
                'backup' => $metadata,
            ];

        } catch (\Exception $e) {
            Log::error('Database backup failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'message' => 'Database backup failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Create file system backup
     */
    public function createFileSystemBackup(): array
    {
        try {
            $timestamp = now()->format('Y-m-d_H-i-s');
            $filename = "filesystem_backup_{$timestamp}.tar.gz";
            $filepath = storage_path("app/{$this->backupPath}/{$filename}");

            // Ensure backup directory exists
            if (!is_dir(dirname($filepath))) {
                mkdir(dirname($filepath), 0755, true);
            }

            // Create tar.gz archive of storage directory
            $command = sprintf(
                'tar -czf %s -C %s .',
                escapeshellarg($filepath),
                escapeshellarg(storage_path('app'))
            );

            // Execute backup command
            $output = [];
            $returnCode = 0;
            exec($command, $output, $returnCode);

            if ($returnCode !== 0) {
                throw new \Exception('File system backup failed: ' . implode("\n", $output));
            }

            // Verify backup file exists and has content
            if (!file_exists($filepath) || filesize($filepath) === 0) {
                throw new \Exception('Backup file was not created or is empty');
            }

            // Store backup metadata
            $metadata = [
                'filename' => $filename,
                'filepath' => $filepath,
                'size' => filesize($filepath),
                'created_at' => now()->toISOString(),
                'type' => 'filesystem',
                'status' => 'completed',
            ];

            $this->storeBackupMetadata($metadata);

            // Cleanup old backups
            $this->cleanupOldBackups();

            Log::info('File system backup created successfully', $metadata);

            return [
                'success' => true,
                'message' => 'File system backup created successfully',
                'backup' => $metadata,
            ];

        } catch (\Exception $e) {
            Log::error('File system backup failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'message' => 'File system backup failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Create full system backup
     */
    public function createFullBackup(): array
    {
        try {
            $timestamp = now()->format('Y-m-d_H-i-s');
            $filename = "full_backup_{$timestamp}.tar.gz";
            $filepath = storage_path("app/{$this->backupPath}/{$filename}");

            // Ensure backup directory exists
            if (!is_dir(dirname($filepath))) {
                mkdir(dirname($filepath), 0755, true);
            }

            // Create full backup including database and files
            $tempDir = storage_path("app/{$this->backupPath}/temp_{$timestamp}");
            mkdir($tempDir, 0755, true);

            // Export database to temp directory
            $dbFile = "{$tempDir}/database.sql";
            $this->exportDatabaseToFile($dbFile);

            // Copy important directories
            $this->copyDirectory(storage_path('app'), "{$tempDir}/storage");
            $this->copyDirectory(base_path('config'), "{$tempDir}/config");
            $this->copyDirectory(base_path('database'), "{$tempDir}/database");

            // Create tar.gz archive
            $command = sprintf(
                'tar -czf %s -C %s .',
                escapeshellarg($filepath),
                escapeshellarg($tempDir)
            );

            // Execute backup command
            $output = [];
            $returnCode = 0;
            exec($command, $output, $returnCode);

            if ($returnCode !== 0) {
                throw new \Exception('Full backup failed: ' . implode("\n", $output));
            }

            // Cleanup temp directory
            $this->removeDirectory($tempDir);

            // Verify backup file exists and has content
            if (!file_exists($filepath) || filesize($filepath) === 0) {
                throw new \Exception('Backup file was not created or is empty');
            }

            // Store backup metadata
            $metadata = [
                'filename' => $filename,
                'filepath' => $filepath,
                'size' => filesize($filepath),
                'created_at' => now()->toISOString(),
                'type' => 'full',
                'status' => 'completed',
            ];

            $this->storeBackupMetadata($metadata);

            // Cleanup old backups
            $this->cleanupOldBackups();

            Log::info('Full backup created successfully', $metadata);

            return [
                'success' => true,
                'message' => 'Full backup created successfully',
                'backup' => $metadata,
            ];

        } catch (\Exception $e) {
            Log::error('Full backup failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'message' => 'Full backup failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * List all backups
     */
    public function listBackups(): array
    {
        $backupDir = storage_path("app/{$this->backupPath}");
        
        if (!is_dir($backupDir)) {
            return [];
        }

        $backups = [];
        $files = glob("{$backupDir}/*.{sql,tar.gz}", GLOB_BRACE);

        foreach ($files as $file) {
            $backups[] = [
                'filename' => basename($file),
                'filepath' => $file,
                'size' => filesize($file),
                'created_at' => date('Y-m-d H:i:s', filemtime($file)),
                'type' => $this->getBackupType($file),
            ];
        }

        // Sort by creation time (newest first)
        usort($backups, function ($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });

        return $backups;
    }

    /**
     * Restore from backup
     */
    public function restoreFromBackup(string $filename): array
    {
        try {
            $filepath = storage_path("app/{$this->backupPath}/{$filename}");
            
            if (!file_exists($filepath)) {
                throw new \Exception('Backup file not found');
            }

            $type = $this->getBackupType($filepath);

            if ($type === 'database') {
                return $this->restoreDatabase($filepath);
            } elseif ($type === 'filesystem' || $type === 'full') {
                return $this->restoreFilesystem($filepath);
            } else {
                throw new \Exception('Unknown backup type');
            }

        } catch (\Exception $e) {
            Log::error('Backup restore failed', [
                'filename' => $filename,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Backup restore failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Delete backup
     */
    public function deleteBackup(string $filename): array
    {
        try {
            $filepath = storage_path("app/{$this->backupPath}/{$filename}");
            
            if (!file_exists($filepath)) {
                throw new \Exception('Backup file not found');
            }

            if (!unlink($filepath)) {
                throw new \Exception('Failed to delete backup file');
            }

            Log::info('Backup deleted successfully', ['filename' => $filename]);

            return [
                'success' => true,
                'message' => 'Backup deleted successfully',
            ];

        } catch (\Exception $e) {
            Log::error('Backup deletion failed', [
                'filename' => $filename,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Backup deletion failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Get backup statistics
     */
    public function getBackupStats(): array
    {
        $backups = $this->listBackups();
        $totalSize = array_sum(array_column($backups, 'size'));
        
        return [
            'total_backups' => count($backups),
            'total_size' => $totalSize,
            'total_size_formatted' => $this->formatBytes($totalSize),
            'oldest_backup' => !empty($backups) ? end($backups)['created_at'] : null,
            'newest_backup' => !empty($backups) ? $backups[0]['created_at'] : null,
            'backups_by_type' => $this->getBackupsByType($backups),
        ];
    }

    /**
     * Export database to file
     */
    private function exportDatabaseToFile(string $filepath): void
    {
        $config = config('database.connections.' . config('database.default'));
        $host = $config['host'];
        $port = $config['port'];
        $database = $config['database'];
        $username = $config['username'];
        $password = $config['password'];

        $command = sprintf(
            'mysqldump --host=%s --port=%s --user=%s --password=%s %s > %s',
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($username),
            escapeshellarg($password),
            escapeshellarg($database),
            escapeshellarg($filepath)
        );

        $output = [];
        $returnCode = 0;
        exec($command, $output, $returnCode);

        if ($returnCode !== 0) {
            throw new \Exception('Database export failed: ' . implode("\n", $output));
        }
    }

    /**
     * Restore database
     */
    private function restoreDatabase(string $filepath): array
    {
        $config = config('database.connections.' . config('database.default'));
        $host = $config['host'];
        $port = $config['port'];
        $database = $config['database'];
        $username = $config['username'];
        $password = $config['password'];

        $command = sprintf(
            'mysql --host=%s --port=%s --user=%s --password=%s %s < %s',
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($username),
            escapeshellarg($password),
            escapeshellarg($database),
            escapeshellarg($filepath)
        );

        $output = [];
        $returnCode = 0;
        exec($command, $output, $returnCode);

        if ($returnCode !== 0) {
            throw new \Exception('Database restore failed: ' . implode("\n", $output));
        }

        return [
            'success' => true,
            'message' => 'Database restored successfully',
        ];
    }

    /**
     * Restore filesystem
     */
    private function restoreFilesystem(string $filepath): array
    {
        $command = sprintf(
            'tar -xzf %s -C %s',
            escapeshellarg($filepath),
            escapeshellarg(storage_path('app'))
        );

        $output = [];
        $returnCode = 0;
        exec($command, $output, $returnCode);

        if ($returnCode !== 0) {
            throw new \Exception('Filesystem restore failed: ' . implode("\n", $output));
        }

        return [
            'success' => true,
            'message' => 'Filesystem restored successfully',
        ];
    }

    /**
     * Copy directory recursively
     */
    private function copyDirectory(string $source, string $destination): void
    {
        if (!is_dir($source)) {
            return;
        }

        if (!is_dir($destination)) {
            mkdir($destination, 0755, true);
        }

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($source, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($iterator as $item) {
            $target = $destination . DIRECTORY_SEPARATOR . $iterator->getSubPathName();
            
            if ($item->isDir()) {
                if (!is_dir($target)) {
                    mkdir($target, 0755, true);
                }
            } else {
                copy($item, $target);
            }
        }
    }

    /**
     * Remove directory recursively
     */
    private function removeDirectory(string $directory): void
    {
        if (!is_dir($directory)) {
            return;
        }

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($directory, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST
        );

        foreach ($iterator as $item) {
            if ($item->isDir()) {
                rmdir($item->getPathname());
            } else {
                unlink($item->getPathname());
            }
        }

        rmdir($directory);
    }

    /**
     * Get backup type from filename
     */
    private function getBackupType(string $filepath): string
    {
        $filename = basename($filepath);
        
        if (strpos($filename, 'database_backup_') === 0) {
            return 'database';
        } elseif (strpos($filename, 'filesystem_backup_') === 0) {
            return 'filesystem';
        } elseif (strpos($filename, 'full_backup_') === 0) {
            return 'full';
        }
        
        return 'unknown';
    }

    /**
     * Store backup metadata
     */
    private function storeBackupMetadata(array $metadata): void
    {
        $metadataFile = storage_path("app/{$this->backupPath}/metadata.json");
        $existingMetadata = [];
        
        if (file_exists($metadataFile)) {
            $existingMetadata = json_decode(file_get_contents($metadataFile), true) ?? [];
        }
        
        $existingMetadata[] = $metadata;
        
        file_put_contents($metadataFile, json_encode($existingMetadata, JSON_PRETTY_PRINT));
    }

    /**
     * Cleanup old backups
     */
    private function cleanupOldBackups(): void
    {
        $backups = $this->listBackups();
        
        if (count($backups) > $this->maxBackups) {
            $backupsToDelete = array_slice($backups, $this->maxBackups);
            
            foreach ($backupsToDelete as $backup) {
                $this->deleteBackup($backup['filename']);
            }
        }
    }

    /**
     * Get backups by type
     */
    private function getBackupsByType(array $backups): array
    {
        $byType = [];
        
        foreach ($backups as $backup) {
            $type = $backup['type'];
            if (!isset($byType[$type])) {
                $byType[$type] = 0;
            }
            $byType[$type]++;
        }
        
        return $byType;
    }

    /**
     * Format bytes to human readable format
     */
    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        
        $bytes /= pow(1024, $pow);
        
        return round($bytes, 2) . ' ' . $units[$pow];
    }
}
