<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UploadPaymentProofRequest;
use App\Http\Requests\VerifyPaymentRequest;
use App\Mail\PaymentVerifiedMail;
use App\Models\Payment;
use App\Services\AdminNotificationService;
use Cloudinary\Uploader;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class PaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Payment::with(['event:id,client_id,event_name,event_date,kanban_status']);

        if ($user->role === 'client') {
            $query->whereHas('event', function ($q) use ($user) {
                $q->where('client_id', $user->id);
            });
        } elseif ($user->role !== 'eo') {
            return response()->json([
                'message' => 'Akses ditolak.',
            ], 403);
        }

        $payments = $query->orderByDesc('created_at')->get();

        return response()->json([
            'payments' => $payments,
        ]);
    }

    public function uploadProof(
        UploadPaymentProofRequest $request,
        Payment $payment
    ): JsonResponse {
        if ($payment->event->client_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Anda tidak berhak mengunggah bukti untuk pembayaran ini.',
            ], 403);
        }

        if (in_array($payment->event->kanban_status, ['cancelled', 'rejected'], true)) {
            return response()->json([
                'message' => 'Tidak dapat mengunggah bukti bayar untuk acara yang sudah dibatalkan atau ditolak.',
            ], 422);
        }

        if ($payment->payment_type === 'pelunasan') {
            $isDpPaid = $payment->event->payments()
                ->where('payment_type', 'dp')
                ->where('status', 'paid')
                ->exists();

            if (! $isDpPaid) {
                return response()->json([
                    'message' => 'Uang muka (DP) harus dilunasi dan diverifikasi terlebih dahulu sebelum mengunggah bukti pelunasan.',
                ], 422);
            }
        }

        if ($payment->status !== 'unpaid') {
            return response()->json([
                'message' => 'Bukti transfer sudah diunggah atau sudah diverifikasi.',
            ], 422);
        }

        if ($payment->payment_proof_url && ! str_starts_with($payment->payment_proof_url, 'http')) {
            Storage::disk('public')->delete($payment->payment_proof_url);
        }

        $proofFile = $request->file('payment_proof');

        try {
            \Cloudinary::config();
            $upload = Uploader::upload(
                $proofFile->getRealPath(),
                ['folder' => 'evento/payment-proofs']
            );
            $proofUrl = $upload['secure_url'];
        } catch (\Throwable $e) {
            // Fallback ke penyimpanan lokal jika Cloudinary tidak tersedia.
            $proofUrl = $proofFile->store('payment-proofs', 'public');
        }

        $payment->update([
            'payment_proof_url' => $proofUrl,
            'status' => 'pending_verification',
            'rejection_note' => null,
        ]);

        $payment->load(['event.client']);
        AdminNotificationService::notifyAdmins(
            title: 'Bukti Pembayaran Masuk',
            message: "Klien {$payment->event->client?->name} mengunggah bukti bayar {$payment->payment_type} untuk acara '{$payment->event->title}'.",
            category: 'payment',
            actionUrl: '/admin/payments',
            metadata: ['payment_id' => $payment->id, 'event_id' => $payment->event_id]
        );

        return response()->json([
            'message' => 'Bukti transfer berhasil diunggah. Menunggu verifikasi EO.',
            'payment' => $payment->fresh()->load('event'),
        ]);
    }

    public function verify(
        VerifyPaymentRequest $request,
        Payment $payment
    ): JsonResponse {
        if (in_array($payment->event->kanban_status, ['cancelled', 'rejected'], true)) {
            return response()->json([
                'message' => 'Tidak dapat memverifikasi pembayaran untuk acara yang sudah dibatalkan atau ditolak.',
            ], 422);
        }

        if ($payment->payment_type === 'pelunasan' && $request->action === 'approve') {
            $isDpPaid = $payment->event->payments()
                ->where('payment_type', 'dp')
                ->where('status', 'paid')
                ->exists();

            if (! $isDpPaid) {
                return response()->json([
                    'message' => 'Tidak dapat memverifikasi pelunasan karena pembayaran DP belum lunas.',
                ], 422);
            }
        }

        if ($payment->status !== 'pending_verification') {
            return response()->json([
                'message' => 'Pembayaran ini belum dalam status menunggu verifikasi.',
            ], 422);
        }

        $user = $request->user();

        if ($request->action === 'approve') {
            $receiptNumber = sprintf('RCP/EVN/%s/%04d-%s', now()->format('Ym'), $payment->id, strtoupper($payment->payment_type));
            $payment->update([
                'status' => 'paid',
                'receipt_number' => $receiptNumber,
                'verified_by' => $user->id,
                'verified_at' => now(),
                'rejection_note' => null,
            ]);

            // Jika pembayaran DP diverifikasi dan acara sedang awaiting_dp, otomatis transisi ke on_progress
            if ($payment->payment_type === 'dp' && $payment->event->kanban_status === 'awaiting_dp') {
                $payment->event->update([
                    'kanban_status' => 'on_progress',
                ]);
            }

            // Kirim email kwitansi pelunasan / DP ke klien
            $payment->load(['event.client']);
            $clientEmail = $payment->event?->client?->email;
            if ($clientEmail) {
                try {
                    Mail::to($clientEmail)->send(new PaymentVerifiedMail($payment, $payment->event));
                } catch (\Throwable $e) {
                    Log::warning("Gagal mengirim email PaymentVerifiedMail ke {$clientEmail}: ".$e->getMessage());
                }
            }

            $message = 'Pembayaran berhasil diverifikasi sebagai LUNAS.';
        } else {
            $payment->update([
                'status' => 'unpaid',
                'verified_by' => $user->id,
                'verified_at' => now(),
                'rejection_note' => $request->rejection_note,
            ]);

            $message = 'Pembayaran ditolak. Client diminta mengunggah ulang bukti transfer.';
        }

        return response()->json([
            'message' => $message,
            'payment' => $payment->fresh()->load('event'),
        ]);
    }
}
