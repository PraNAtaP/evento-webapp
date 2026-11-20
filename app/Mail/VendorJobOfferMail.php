<?php

namespace App\Mail;

use App\Models\Event;
use App\Models\EventVendorAssignment;
use App\Models\Vendor;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class VendorJobOfferMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public EventVendorAssignment $assignment,
        public Vendor $vendor,
        public Event $event
    ) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "💼 Tawaran Pekerjaan Acara Baru: '{$this->event->title}' - EVENTO",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.vendors.job-offer',
        );
    }
}
