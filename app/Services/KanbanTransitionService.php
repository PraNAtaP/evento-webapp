<?php

namespace App\Services;

use App\Models\Event;
use App\Models\Payment;
use Illuminate\Validation\ValidationException;

class KanbanTransitionService
{
    /**
     * Alur urutan langkah kanban yang valid.
     */
    public const WORKFLOW_STAGES = [
        'request',
        'drafting_quotation',
        'client_review',
        'awaiting_dp',
        'on_progress',
        'done',
    ];

    /**
     * Mengeksekusi transisi status kanban event dengan validasi aturan bisnis ketat.
     *
     * @param  array{dp_percentage?: float|int, revision_note?: string}  $options
     *
     * @throws ValidationException
     */
    public function transition(Event $event, string $targetStatus, array $options = []): Event
    {
        $currentStatus = $event->kanban_status;

        if ($currentStatus === $targetStatus) {
            return $event;
        }

        // Cek apakah target status terdaftar
        if (! in_array($targetStatus, self::WORKFLOW_STAGES, true)) {
            throw ValidationException::withMessages([
                'target_status' => ["Status target '{$targetStatus}' tidak valid."],
            ]);
        }

        // 1. Kasus khusus revisi penawaran: client_review -> drafting_quotation
        if ($currentStatus === 'client_review' && $targetStatus === 'drafting_quotation') {
            $this->handleRevisionTransition($event, $options['revision_note'] ?? null);

            return $event->fresh(['client', 'vendorAssignments.package', 'vendorAssignments.vendor', 'payments']);
        }

        // 2. Validasi perpindahan mundur (tidak diizinkan selain revisi di atas)
        $currentIndex = array_search($currentStatus, self::WORKFLOW_STAGES, true);
        $targetIndex = array_search($targetStatus, self::WORKFLOW_STAGES, true);

        if ($targetIndex < $currentIndex) {
            throw ValidationException::withMessages([
                'target_status' => ['Perpindahan mundur status tidak diizinkan kecuali revisi penawaran dari Review Klien.'],
            ]);
        }

        // 3. Validasi perpindahan melompat langkah (harus tepat 1 langkah ke depan)
        if ($targetIndex > $currentIndex + 1) {
            throw ValidationException::withMessages([
                'target_status' => ['Perpindahan status tidak diizinkan melompati tahapan alur kerja.'],
            ]);
        }

        // 4. Validasi per tahapan spesifik
        match ($targetStatus) {
            'drafting_quotation' => $this->handleRequestToDrafting($event),
            'client_review' => $this->handleDraftingToClientReview($event, $options),
            'awaiting_dp' => $this->handleClientReviewToAwaitingDp($event),
            'on_progress' => $this->handleAwaitingDpToOnProgress($event),
            'done' => $this->handleOnProgressToDone($event),
            default => null,
        };

        return $event->fresh(['client', 'vendorAssignments.package', 'vendorAssignments.vendor', 'payments']);
    }

    /**
     * request -> drafting_quotation: EO mulai menyusun penawaran.
     */
    protected function handleRequestToDrafting(Event $event): void
    {
        $event->update([
            'kanban_status' => 'drafting_quotation',
        ]);
    }

    /**
     * drafting_quotation -> client_review: Penawaran dikirim ke klien.
     *
     * @param  array{dp_percentage?: float|int}  $options
     */
    protected function handleDraftingToClientReview(Event $event, array $options): void
    {
        // Validasi persentase DP opsional jika diinput (10 s/d 100)
        if (isset($options['dp_percentage'])) {
            $dpPercent = (float) $options['dp_percentage'];
            if ($dpPercent < 10 || $dpPercent > 100) {
                throw ValidationException::withMessages([
                    'dp_percentage' => ['Persentase DP harus bernilai antara 10% sampai 100%.'],
                ]);
            }
            $event->dp_percentage = $dpPercent;
        }

        $assignments = $event->vendorAssignments;

        $hasAccepted = $assignments->contains(fn ($a) => $a->eo_offer_status === 'accepted');
        if (! $hasAccepted) {
            throw ValidationException::withMessages([
                'target_status' => ['Tidak dapat mengirim penawaran. Minimal 1 vendor harus menerima tawaran (accepted).'],
            ]);
        }

        $hasPending = $assignments->contains(fn ($a) => $a->eo_offer_status === 'pending');
        if ($hasPending) {
            throw ValidationException::withMessages([
                'target_status' => ['Tidak dapat mengirim penawaran. Masih ada tawaran vendor yang belum dikonfirmasi (pending).'],
            ]);
        }

        $event->kanban_status = 'client_review';
        $event->save();
    }

    /**
     * client_review -> awaiting_dp: Klien menyetujui penawaran, kunci harga kontrak dan buat tagihan DP + Pelunasan.
     */
    protected function handleClientReviewToAwaitingDp(Event $event): void
    {
        $activeAssignments = $event->vendorAssignments()
            ->where('eo_offer_status', '!=', 'rejected')
            ->get();

        if ($activeAssignments->isEmpty()) {
            throw ValidationException::withMessages([
                'target_status' => ['Tidak ada penawaran vendor aktif untuk acara ini.'],
            ]);
        }

        // Cek semua assignment aktif harus disetujui klien
        $allApproved = $activeAssignments->every(fn ($a) => $a->client_approval === 'approved');
        if (! $allApproved) {
            throw ValidationException::withMessages([
                'target_status' => ['Tidak dapat melanjutkan ke Menunggu DP. Klien belum menyetujui seluruh penawaran vendor.'],
            ]);
        }

        // Hitung total penawaran dan set agreed_price
        $quotationTotal = (float) $activeAssignments->sum('locked_price');
        if ($quotationTotal <= 0) {
            throw ValidationException::withMessages([
                'target_status' => ['Total penawaran tidak valid (Rp 0).'],
            ]);
        }

        $event->agreed_price = $quotationTotal;
        $event->kanban_status = 'awaiting_dp';
        $event->save();

        // Buat tagihan DP dan Pelunasan otomatis jika belum dibuat
        $hasDpPayment = $event->payments()->where('payment_type', 'dp')->exists();

        if (! $hasDpPayment) {
            $dpPercent = (float) ($event->dp_percentage ?? config('evento.dp_percentage', 30.0));
            $dpNominal = round(($quotationTotal * $dpPercent) / 100);
            $pelunasanNominal = max(0, $quotationTotal - $dpNominal);

            Payment::create([
                'event_id' => $event->id,
                'payment_type' => 'dp',
                'nominal' => $dpNominal,
                'status' => 'unpaid',
            ]);

            Payment::create([
                'event_id' => $event->id,
                'payment_type' => 'pelunasan',
                'nominal' => $pelunasanNominal,
                'status' => 'unpaid',
            ]);
        }
    }

    /**
     * client_review -> drafting_quotation: Klien meminta revisi penawaran.
     */
    protected function handleRevisionTransition(Event $event, ?string $revisionNote = null): void
    {
        // Reset approval vendor assignments yang aktif kembali ke pending
        $event->vendorAssignments()
            ->where('eo_offer_status', '!=', 'rejected')
            ->update(['client_approval' => 'pending']);

        $event->update([
            'kanban_status' => 'drafting_quotation',
            'agreed_price' => null,
        ]);
    }

    /**
     * awaiting_dp -> on_progress: Persiapan teknis dimulai hanya jika DP lunas terverifikasi.
     */
    protected function handleAwaitingDpToOnProgress(Event $event): void
    {
        $isDpPaid = $event->payments()
            ->where('payment_type', 'dp')
            ->where('status', 'paid')
            ->exists();

        if (! $isDpPaid) {
            throw ValidationException::withMessages([
                'target_status' => ['Tidak dapat masuk ke tahap Persiapan. DP belum diverifikasi/lunas.'],
            ]);
        }

        $event->update([
            'kanban_status' => 'on_progress',
        ]);
    }

    /**
     * on_progress -> done: Event selesai hanya jika semua tagihan lunas terverifikasi.
     */
    protected function handleOnProgressToDone(Event $event): void
    {
        $payments = $event->payments;

        if ($payments->isEmpty()) {
            throw ValidationException::withMessages([
                'target_status' => ['Tidak dapat menyelesaikan event. Tagihan pembayaran belum diterbitkan.'],
            ]);
        }

        $allPaid = $payments->every(fn ($p) => $p->status === 'paid');

        if (! $allPaid) {
            throw ValidationException::withMessages([
                'target_status' => ['Tidak dapat menyelesaikan event. Masih ada pembayaran yang belum lunas.'],
            ]);
        }

        $event->update([
            'kanban_status' => 'done',
        ]);
    }
}
