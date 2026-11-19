<?php

namespace App\Mail;

use App\Models\Event;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CancellationRejectedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Event $event,
        public string $reviewNote,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "❌ Permintaan Pembatalan Acara \"{$this->event->event_name}\" Ditolak",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.cancellation.rejected',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
