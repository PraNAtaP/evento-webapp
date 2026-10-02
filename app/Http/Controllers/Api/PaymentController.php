<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UploadPaymentProofRequest;
use App\Http\Requests\VerifyPaymentRequest;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Payment::with(['event:id,client_id,event_name,event_date']);

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

        if ($payment->status !== 'unpaid') {
            return response()->json([
                'message' => 'Bukti transfer sudah diunggah atau sudah diverifikasi.',
            ], 422);
        }

        if ($payment->payment_proof_url) {
            Storage::disk('public')->delete($payment->payment_proof_url);
        }

        $path = $request->file('payment_proof')
                        ->store('payment-proofs', 'public');

        $payment->update([
            'payment_proof_url' => $path,
            'status' => 'pending_verification',
            'rejection_note' => null,
        ]);

        return response()->json([
            'message' => 'Bukti transfer berhasil diunggah. Menunggu verifikasi EO.',
            'payment' => $payment->fresh()->load('event'),
        ]);
    }

    public function verify(
        VerifyPaymentRequest $request,
        Payment $payment
    ): JsonResponse {
        if ($payment->status !== 'pending_verification') {
            return response()->json([
                'message' => 'Pembayaran ini belum dalam status menunggu verifikasi.',
            ], 422);
        }

        $user = $request->user();

        if ($request->action === 'approve') {
            $payment->update([
                'status' => 'paid',
                'verified_by' => $user->id,
                'verified_at' => now(),
                'rejection_note' => null,
            ]);

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