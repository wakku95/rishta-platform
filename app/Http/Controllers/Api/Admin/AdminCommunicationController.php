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

            // Log communication record
            if ($request->filled('candidate_type') && $request->filled('candidate_id')) {
                $cType = $request->input('candidate_type') === 'registered' ? 'profile' : $request->input('candidate_type');
                \App\Models\CommunicationLog::create([
                    'admin_id'            => $request->user()?->id,
                    'contactable_type'    => $cType,
                    'contactable_id'      => (int) $request->input('candidate_id'),
                    'channel'             => 'email',
                    'recipient_name'      => $validated['recipient_name'] ?? null,
                    'recipient_contact'   => $validated['recipient_email'],
                    'subject_or_template' => $validated['subject'],
                ]);
            }

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

    /**
     * Record a communication event (e.g. WhatsApp Web open, phone call).
     */
    public function logContact(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'candidate_type'      => 'required|string|in:assisted,profile,registered',
            'candidate_id'        => 'required|integer',
            'channel'             => 'required|string|in:whatsapp,email,sms,phone',
            'recipient_name'      => 'nullable|string|max:255',
            'recipient_contact'   => 'nullable|string|max:255',
            'subject_or_template' => 'nullable|string|max:255',
        ]);

        $cType = $validated['candidate_type'] === 'registered' ? 'profile' : $validated['candidate_type'];

        $log = \App\Models\CommunicationLog::create([
            'admin_id'            => $request->user()?->id,
            'contactable_type'    => $cType,
            'contactable_id'      => $validated['candidate_id'],
            'channel'             => $validated['channel'],
            'recipient_name'      => $validated['recipient_name'] ?? null,
            'recipient_contact'   => $validated['recipient_contact'] ?? null,
            'subject_or_template' => $validated['subject_or_template'] ?? null,
        ]);

        return $this->successResponse([
            'id' => $log->id,
            'channel' => $log->channel,
            'time' => $log->created_at->diffForHumans(),
        ], 'Contact recorded successfully.');
    }
}
