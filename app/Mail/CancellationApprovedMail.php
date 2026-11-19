<?php

namespace App\Mail;

use App\Models\Event;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CancellationApprovedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Event $event,
        public bool $isDpForfeited,
        public ?string $reviewNote = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "✅ Pembatalan Acara \"{$this->event->event_name}\" Telah Disetujui",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.cancellation.approved',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
