<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Carbon;
use Exception;

class DatabaseBackupService
{
    protected string $storageDisk = 'local';
    protected string $backupDir = 'backups';

    public function __construct()
    {
        if (!Storage::disk($this->storageDisk)->exists($this->backupDir)) {
            Storage::disk($this->storageDisk)->makeDirectory($this->backupDir);
        }
    }

    /**
     * Get database summary and storage info.
     */
    public function getDatabaseInfo(): array
    {
        $conn = DB::connection();
        $driver = $conn->getDriverName();
        $dbName = $conn->getDatabaseName();

        $tables = [];
        $totalRows = 0;
        $approxSizeBytes = 0;

        if ($driver === 'mysql') {
            $tableList = DB::select("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
            foreach ($tableList as $t) {
                $tableName = array_values((array)$t)[0];
                $tables[] = $tableName;
            }

            // Get table stats
            $tableStatus = DB::select("SHOW TABLE STATUS FROM `{$dbName}`");
            foreach ($tableStatus as $status) {
                $totalRows += (int) ($status->Rows ?? 0);
                $approxSizeBytes += (int) (($status->Data_length ?? 0) + ($status->Index_length ?? 0));
            }
        } elseif ($driver === 'sqlite') {
            $tableList = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
            foreach ($tableList as $t) {
                $tables[] = $t->name;
                $count = DB::table($t->name)->count();
                $totalRows += $count;
            }
            if (file_exists($dbName)) {
                $approxSizeBytes = filesize($dbName);
            }
        }

        return [
            'database_name' => $dbName,
            'driver' => $driver,
            'tables_count' => count($tables),
            'tables' => $tables,
            'approx_rows' => $totalRows,
            'approx_size_bytes' => $approxSizeBytes,
            'approx_size_formatted' => $this->formatBytes($approxSizeBytes),
        ];
    }

    /**
     * List all generated backup files in storage.
     */
    public function listBackups(): array
    {
        $files = Storage::disk($this->storageDisk)->files($this->backupDir);
        $backups = [];

        foreach ($files as $file) {
            $filename = basename($file);
            // Only list .sql and .sql.gz backup files
            if (!preg_match('/\.sql(\.gz)?$/i', $filename)) {
                continue;
            }

            $size = Storage::disk($this->storageDisk)->size($file);
            $lastModified = Storage::disk($this->storageDisk)->lastModified($file);

            $backups[] = [
                'filename' => $filename,
                'path' => $file,
                'size_bytes' => $size,
                'size_formatted' => $this->formatBytes($size),
                'created_at' => Carbon::createFromTimestamp($lastModified)->toIso8601String(),
                'created_at_human' => Carbon::createFromTimestamp($lastModified)->diffForHumans(),
                'is_compressed' => str_ends_with($filename, '.gz'),
            ];
        }

        // Sort latest first
        usort($backups, fn($a, $b) => strcmp($b['created_at'], $a['created_at']));

        return $backups;
    }

    /**
     * Generate a new database backup file.
     *
     * @param bool $compress
     * @return array Backup metadata
     */
    public function generateBackup(bool $compress = false): array
    {
        $timestamp = date('Y-m-d_His');
        $ext = $compress ? 'sql.gz' : 'sql';
        $filename = "raabtanow_backup_{$timestamp}.{$ext}";
        $relativeFilePath = "{$this->backupDir}/{$filename}";
        $fullPath = Storage::disk($this->storageDisk)->path($relativeFilePath);

        $dir = dirname($fullPath);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $conn = DB::connection();
        $driver = $conn->getDriverName();
        $dbName = $conn->getDatabaseName();
        $pdo = $conn->getPdo();

        $handle = $compress ? gzopen($fullPath, 'w9') : fopen($fullPath, 'w');
        if (!$handle) {
            throw new Exception("Unable to open backup file for writing: {$fullPath}");
        }

        $write = function(string $data) use ($handle, $compress) {
            if ($compress) {
                gzwrite($handle, $data);
            } else {
                fwrite($handle, $data);
            }
        };

        // Header
        $write("-- ======================================================\n");
        $write("-- RaabtaNow Matrimonial Platform Database Backup\n");
        $write("-- Generated At: " . Carbon::now()->toDateTimeString() . " UTC\n");
        $write("-- Database Engine: " . strtoupper($driver) . "\n");
        $write("-- Database Name: " . $dbName . "\n");
        $write("-- ======================================================\n\n");

        if ($driver === 'mysql') {
            $write("/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;\n");
            $write("/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;\n");
            $write("/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;\n");
            $write("/*!50503 SET NAMES utf8mb4 */;\n");
            $write("/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;\n");
            $write("/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;\n\n");

            $tableList = DB::select("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
            foreach ($tableList as $t) {
                $table = array_values((array)$t)[0];

                // Table Structure
                $createRes = DB::select("SHOW CREATE TABLE `{$table}`");
                $createSql = ((array)$createRes[0])['Create Table'] ?? null;

                $write("\n--\n-- Table structure for table `{$table}`\n--\n\n");
                $write("DROP TABLE IF EXISTS `{$table}`;\n");
                if ($createSql) {
                    $write("{$createSql};\n\n");
                }

                // Table Data
                $write("--\n-- Dumping data for table `{$table}`\n--\n\n");
                $totalRows = DB::table($table)->count();
                if ($totalRows > 0) {
                    $write("/*!40000 ALTER TABLE `{$table}` DISABLE KEYS */;\n");

                    DB::table($table)->orderBy(DB::raw('1'))->chunk(200, function ($rows) use ($write, $pdo, $table) {
                        if ($rows->isEmpty()) return;

                        $columns = array_keys((array)$rows[0]);
                        $escapedCols = implode(', ', array_map(fn($c) => "`{$c}`", $columns));

                        $rowInserts = [];
                        foreach ($rows as $row) {
                            $vals = [];
                            foreach ((array)$row as $val) {
                                if (is_null($val)) {
                                    $vals[] = 'NULL';
                                } elseif (is_int($val) || is_float($val)) {
                                    $vals[] = (string)$val;
                                } else {
                                    $vals[] = $pdo->quote((string)$val);
                                }
                            }
                            $rowInserts[] = "(" . implode(', ', $vals) . ")";
                        }

                        $write("INSERT INTO `{$table}` ({$escapedCols}) VALUES\n" . implode(",\n", $rowInserts) . ";\n");
                    });

                    $write("/*!40000 ALTER TABLE `{$table}` ENABLE KEYS */;\n\n");
                }
            }

            $write("/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;\n");
            $write("/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;\n");
            $write("/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;\n");
            $write("/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;\n");
            $write("/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;\n");
            $write("-- Dump completed on " . Carbon::now()->toDateTimeString() . "\n");

        } elseif ($driver === 'sqlite') {
            $write("PRAGMA foreign_keys = OFF;\n\n");

            $tables = DB::select("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
            foreach ($tables as $t) {
                $table = $t->name;
                $schemaSql = $t->sql;

                $write("\n--\n-- Table structure for `{$table}`\n--\n\n");
                $write("DROP TABLE IF EXISTS \"{$table}\";\n");
                $write("{$schemaSql};\n\n");

                // Dump data
                $rows = DB::table($table)->get();
                if ($rows->isNotEmpty()) {
                    $columns = array_keys((array)$rows[0]);
                    $colList = implode(', ', array_map(fn($c) => "\"{$c}\"", $columns));

                    foreach ($rows as $row) {
                        $vals = [];
                        foreach ((array)$row as $val) {
                            if (is_null($val)) {
                                $vals[] = 'NULL';
                            } elseif (is_int($val) || is_float($val)) {
                                $vals[] = (string)$val;
                            } else {
                                $vals[] = $pdo->quote((string)$val);
                            }
                        }
                        $write("INSERT INTO \"{$table}\" ({$colList}) VALUES (" . implode(', ', $vals) . ");\n");
                    }
                    $write("\n");
                }
            }

            $write("PRAGMA foreign_keys = ON;\n");
            $write("-- SQLite Dump completed on " . Carbon::now()->toDateTimeString() . "\n");
        }

        if ($compress) {
            gzclose($handle);
        } else {
            fclose($handle);
        }

        $size = filesize($fullPath);

        return [
            'filename' => $filename,
            'path' => $relativeFilePath,
            'size_bytes' => $size,
            'size_formatted' => $this->formatBytes($size),
            'created_at' => Carbon::now()->toIso8601String(),
            'created_at_human' => 'Just now',
            'is_compressed' => $compress,
        ];
    }

    /**
     * Get absolute path for download after safety validation.
     */
    public function getBackupPath(string $filename): ?string
    {
        // Prevent path traversal
        $safeName = basename($filename);
        if ($safeName !== $filename || !preg_match('/^raabtanow_backup_[0-9_\-]+\.sql(\.gz)?$/i', $safeName)) {
            return null;
        }

        $relative = "{$this->backupDir}/{$safeName}";
        if (!Storage::disk($this->storageDisk)->exists($relative)) {
            return null;
        }

        return Storage::disk($this->storageDisk)->path($relative);
    }

    /**
     * Delete a backup file safely.
     */
    public function deleteBackup(string $filename): bool
    {
        $safeName = basename($filename);
        if ($safeName !== $filename || !preg_match('/^raabtanow_backup_[0-9_\-]+\.sql(\.gz)?$/i', $safeName)) {
            return false;
        }

        $relative = "{$this->backupDir}/{$safeName}";
        if (Storage::disk($this->storageDisk)->exists($relative)) {
            return Storage::disk($this->storageDisk)->delete($relative);
        }

        return false;
    }

    /**
     * Helper to format bytes to human readable form.
     */
    protected function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);

        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}
