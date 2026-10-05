<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdminCandidateMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $subjectLine;
    public string $messageBody;
    public ?string $recipientName;
    public ?string $ctaUrl;
    public ?string $ctaText;
    /** @var array<int, array{path: string, name: string, mime: string}> */
    public array $fileAttachments;

    /**
     * Create a new message instance.
     */
    public function __construct(
        string $subjectLine,
        string $messageBody,
        ?string $recipientName = null,
        ?string $ctaUrl = null,
        ?string $ctaText = null,
        array $fileAttachments = []
    ) {
        $this->subjectLine = $subjectLine;
        $this->messageBody = $messageBody;
        $this->recipientName = $recipientName;
        $this->ctaUrl = $ctaUrl;
        $this->ctaText = $ctaText;
        $this->fileAttachments = $fileAttachments;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->subjectLine,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.admin_candidate_message',
            with: [
                'subjectLine' => $this->subjectLine,
                'messageBody' => $this->messageBody,
                'recipientName' => $this->recipientName,
                'ctaUrl' => $this->ctaUrl,
                'ctaText' => $this->ctaText,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        $mailAttachments = [];

        foreach ($this->fileAttachments as $file) {
            if (isset($file['path']) && file_exists($file['path'])) {
                $att = Attachment::fromPath($file['path'])
                    ->as($file['name'] ?? basename($file['path']));
                if (!empty($file['mime'])) {
                    $att->withMime($file['mime']);
                }
                $mailAttachments[] = $att;
            }
        }

        return $mailAttachments;
    }
}
