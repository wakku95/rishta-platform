<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Mail\AdminCandidateMail;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Throwable;

class AdminCommunicationController extends Controller
{
    use ApiResponse;

    /**
     * Send personalized email to candidate with optional attachments.
     */
    public function sendEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'recipient_email' => 'required|email|max:255',
            'recipient_name'  => 'nullable|string|max:255',
            'subject'         => 'required|string|max:255',
            'message'         => 'required|string|max:10000',
            'cta_url'         => 'nullable|url|max:500',
            'cta_text'        => 'nullable|string|max:100',
            'attachments.*'   => 'nullable|file|max:10240|mimes:jpeg,jpg,png,webp,pdf,doc,docx',
        ]);

        $fileAttachments = [];
        $tempPaths = [];

        try {
            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    if ($file->isValid()) {
                        $originalName = $file->getClientOriginalName();
                        $mimeType = $file->getMimeType();
                        $path = $file->store('temp_mail_attachments');
                        $fullPath = Storage::path($path);

                        $tempPaths[] = $path;
                        $fileAttachments[] = [
                            'path' => $fullPath,
                            'name' => $originalName,
                            'mime' => $mimeType,
                        ];
                    }
                }
            }

            Mail::to($validated['recipient_email'])->send(
                new AdminCandidateMail(
                    subjectLine: $validated['subject'],
                    messageBody: $validated['message'],
                    recipientName: $validated['recipient_name'] ?? null,
                    ctaUrl: $validated['cta_url'] ?? null,
                    ctaText: $validated['cta_text'] ?? null,
                    fileAttachments: $fileAttachments,
                )
            );

            return $this->successResponse(null, 'Email sent successfully to ' . $validated['recipient_email']);
        } catch (Throwable $e) {
            Log::error('AdminCommunicationController::sendEmail failed: ' . $e->getMessage(), [
                'exception' => $e,
                'recipient' => $validated['recipient_email'] ?? null,
            ]);

            return $this->errorResponse(
                'Could not send email: ' . $e->getMessage(),
                500
            );
        } finally {
            // Clean up temporary stored attachment files
            foreach ($tempPaths as $tPath) {
                try {
                    Storage::delete($tPath);
                } catch (Throwable) {
                    // Suppress cleanup error
                }
            }
        }
    }
}
