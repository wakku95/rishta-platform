<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\DatabaseBackupService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use Exception;

class AdminBackupController extends Controller
{
    use ApiResponse;

    protected DatabaseBackupService $backupService;

    public function __construct(DatabaseBackupService $backupService)
    {
        $this->backupService = $backupService;
    }

    /**
     * Get database stats and list of backups.
     */
    public function info(): JsonResponse
    {
        try {
            $dbInfo = $this->backupService->getDatabaseInfo();
            $backups = $this->backupService->listBackups();

            return $this->successResponse([
                'database' => $dbInfo,
                'backups' => $backups,
            ], 'Backup status retrieved.');
        } catch (Exception $e) {
            return $this->errorResponse('Failed to retrieve database information: ' . $e->getMessage(), [], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Generate a new database backup.
     */
    public function create(Request $request): JsonResponse
    {
        $compress = (bool) $request->input('compress', false);

        try {
            $backup = $this->backupService->generateBackup($compress);

            return $this->successResponse($backup, 'Database backup generated successfully.');
        } catch (Exception $e) {
            return $this->errorResponse('Failed to generate backup: ' . $e->getMessage(), [], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Download a specific backup file.
     */
    public function download(string $filename): BinaryFileResponse|JsonResponse
    {
        $filePath = $this->backupService->getBackupPath($filename);

        if (!$filePath || !file_exists($filePath)) {
            return $this->errorResponse('Backup file not found or invalid filename.', [], Response::HTTP_NOT_FOUND);
        }

        $mimeType = str_ends_with($filename, '.gz') ? 'application/gzip' : 'application/sql';

        return response()->download($filePath, $filename, [
            'Content-Type' => $mimeType,
            'Cache-Control' => 'no-cache, private',
        ]);
    }

    /**
     * Delete an existing backup file.
     */
    public function delete(string $filename): JsonResponse
    {
        $deleted = $this->backupService->deleteBackup($filename);

        if (!$deleted) {
            return $this->errorResponse('Unable to delete backup file or file not found.', [], Response::HTTP_NOT_FOUND);
        }

        return $this->successResponse(null, 'Backup file deleted successfully.');
    }
}
