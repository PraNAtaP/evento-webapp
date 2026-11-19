<?php

namespace App\Mail;

use App\Models\Event;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderRejectedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Event $event,
        public ?string $reason = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "❌ Pengajuan Acara \"{$this->event->event_name}\" Belum Dapat Diterima",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.order.rejected',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
