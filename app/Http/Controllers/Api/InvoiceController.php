<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EventVendorAssignment;
use App\Models\Payment;
use Cloudinary\Uploader;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class InvoiceController extends Controller
{
    /**
     * Profil resmi perusahaan EO untuk kop surat invoice & kuitansi.
     *
     * @return array<string, mixed>
     */
    private function getCompanyProfile(): array
    {
        return [
            'name' => config('app.name', 'EVENTO').' Event Management',
            'legal_name' => 'PT EVENTO KREASI NUSANTARA',
            'address' => 'Gedung Graha Evento Lt. 5, Jl. Rasuna Said Kav. B-12, Jakarta Selatan 12920',
            'phone' => '+62 21 5550 8899 / +62 812 8899 7700',
            'email' => 'billing@evento.id',
            'website' => 'https://evento.id',
            'bank_accounts' => [
                [
                    'bank' => 'Bank Central Asia (BCA)',
                    'account_number' => '883-091-2345',
                    'account_holder' => 'PT EVENTO KREASI NUSANTARA',
                ],
                [
                    'bank' => 'Bank Mandiri',
                    'account_number' => '137-00-9876543-2',
                    'account_holder' => 'PT EVENTO KREASI NUSANTARA',
                ],
            ],
        ];
    }

    /**
     * Menampilkan data detail invoice / kuitansi resmi untuk klien atau EO.
     */
    public function clientInvoice(Request $request, Payment $payment): JsonResponse
    {
        $user = $request->user();

        // Autorisasi: Hanya klien pemilik atau EO yang dapat melihat
        if ($user->role === 'client' && $payment->event->client_id !== $user->id) {
            return response()->json([
                'message' => 'Anda tidak memiliki hak akses untuk melihat invoice ini.',
            ], 403);
        }

        $payment->load([
            'event.client:id,name,email',
            'event.vendorAssignments' => fn ($q) => $q->where('eo_offer_status', '!=', 'rejected')->with('vendor:id,business_name,category'),
            'verifiedBy:id,name',
        ]);

        $event = $payment->event;
        $totalAgreed = (float) ($event->agreed_price ?? 0);
        $totalPaid = (float) $event->payments()->where('status', 'paid')->sum('nominal');
        $remainingBalance = max(0.0, $totalAgreed - $totalPaid);

        $data = [
            'document_type' => $payment->status === 'paid' ? 'receipt' : 'invoice',
            'title' => $payment->status === 'paid' ? 'KUITANSI PEMBAYARAN RESMI' : 'INVOICE TAGIHAN ACARA',
            'invoice_number' => $payment->invoice_number,
            'receipt_number' => $payment->receipt_number,
            'issue_date' => $payment->created_at?->format('Y-m-d'),
            'paid_date' => $payment->verified_at?->format('Y-m-d'),
            'due_date' => $payment->due_date?->format('Y-m-d') ?? $payment->created_at?->addDays(3)->format('Y-m-d'),
            'payment' => [
                'id' => $payment->id,
                'type' => $payment->payment_type,
                'type_label' => $payment->payment_type === 'dp' ? 'Uang Muka (Down Payment)' : 'Pelunasan Biaya Acara',
                'nominal' => (float) $payment->nominal,
                'status' => $payment->status,
                'status_label' => match ($payment->status) {
                    'paid' => 'LUNAS / TERVERIFIKASI',
                    'pending_verification' => 'MENUNGGU VERIFIKASI EO',
                    default => 'MENUNGGU PEMBAYARAN',
                },
                'verified_by' => $payment->verifiedBy?->name ?? 'Tim Keuangan EVENTO',
                'verified_at' => $payment->verified_at?->toIso8601String(),
            ],
            'event' => [
                'id' => $event->id,
                'name' => $event->event_name,
                'category' => ucfirst($event->category),
                'date' => $event->event_date,
                'venue' => $event->venue ?? 'Ditentukan kemudian',
                'guest_count' => $event->guest_count,
                'agreed_price' => $totalAgreed,
            ],
            'client' => [
                'id' => $event->client?->id,
                'name' => $event->manual_client_name ?: ($event->client?->name ?? 'Klien'),
                'email' => $event->client?->email ?? '-',
                'contact' => $event->manual_client_contact ?? '-',
            ],
            'company' => $this->getCompanyProfile(),
            'items' => $event->vendorAssignments->map(fn ($assignment) => [
                'category' => ucfirst($assignment->vendor->category ?? 'Layanan'),
                'vendor_name' => $assignment->vendor->business_name ?? 'Mitra Vendor',
                'package_name' => $assignment->package_name ?? 'Paket Layanan',
                'price' => (float) $assignment->locked_price,
            ])->values()->all(),
            'financial_summary' => [
                'total_contract' => $totalAgreed,
                'billed_amount' => (float) $payment->nominal,
                'total_paid' => $totalPaid,
                'remaining_balance' => $remainingBalance,
            ],
        ];

        return response()->json([
            'data' => $data,
        ]);
    }

    /**
     * Menampilkan data tagihan vendor & voucher pencairan honor ke vendor.
     */
    public function vendorInvoice(Request $request, EventVendorAssignment $assignment): JsonResponse
    {
        $user = $request->user();

        // Autorisasi: Hanya vendor pemilik atau EO yang dapat melihat
        if ($user->role === 'vendor' && $assignment->vendor->user_id !== $user->id) {
            return response()->json([
                'message' => 'Anda tidak memiliki hak akses untuk melihat invoice pekerjaan ini.',
            ], 403);
        }

        $assignment->load([
            'event.client:id,name',
            'vendor.user:id,name,email',
            'package',
        ]);

        $data = [
            'document_type' => $assignment->payout_status === 'paid' ? 'payout_voucher' : 'vendor_invoice',
            'title' => $assignment->payout_status === 'paid'
                ? 'VOUCHER PENCAIRAN HONOR VENDOR'
                : 'SURAT TAGIHAN HONOR VENDOR (INVOICE)',
            'vendor_invoice_number' => $assignment->vendor_invoice_number,
            'payout_receipt_number' => $assignment->payout_receipt_number,
            'issue_date' => $assignment->created_at?->format('Y-m-d'),
            'payout_date' => $assignment->payout_at?->format('Y-m-d'),
            'assignment' => [
                'id' => $assignment->id,
                'package_name' => $assignment->package_name,
                'locked_price' => (float) $assignment->locked_price,
                'eo_offer_status' => $assignment->eo_offer_status,
                'client_approval' => $assignment->client_approval,
                'payout_status' => $assignment->payout_status,
                'payout_nominal' => (float) ($assignment->payout_nominal ?? $assignment->locked_price),
                'payout_at' => $assignment->payout_at?->toIso8601String(),
                'payout_proof_url' => $assignment->payout_proof_url,
                'payout_note' => $assignment->payout_note,
            ],
            'event' => [
                'id' => $assignment->event->id,
                'name' => $assignment->event->event_name,
                'category' => ucfirst($assignment->event->category),
                'date' => $assignment->event->event_date,
                'status' => $assignment->event->kanban_status,
            ],
            'vendor' => [
                'id' => $assignment->vendor->id,
                'business_name' => $assignment->vendor->business_name,
                'category' => ucfirst($assignment->vendor->category),
                'contact_number' => $assignment->vendor->contact_number,
                'address' => $assignment->vendor->address,
                'bank_name' => $assignment->vendor->bank_name ?? 'Belum Diatur',
                'bank_account_number' => $assignment->vendor->bank_account_number ?? '-',
                'bank_account_holder' => $assignment->vendor->bank_account_holder ?? $assignment->vendor->business_name,
            ],
            'company' => $this->getCompanyProfile(),
        ];

        return response()->json([
            'data' => $data,
        ]);
    }

    /**
     * [EO] Mencatat pencairan honorarium dari EO ke Vendor.
     */
    public function disburseVendorPayout(Request $request, EventVendorAssignment $assignment): JsonResponse
    {
        if ($assignment->eo_offer_status !== 'accepted') {
            throw ValidationException::withMessages([
                'assignment' => ['Hanya pekerjaan yang telah diterima (accepted) oleh vendor yang dapat dicairkan honornya.'],
            ]);
        }

        if (in_array($assignment->event->kanban_status, ['cancelled', 'rejected'], true)) {
            throw ValidationException::withMessages([
                'assignment' => ['Tidak dapat mencairkan honor untuk acara yang sudah dibatalkan atau ditolak.'],
            ]);
        }

        $validated = $request->validate([
            'nominal' => ['nullable', 'numeric', 'min:1'],
            'note' => ['nullable', 'string', 'max:500'],
            'proof' => ['nullable', 'image', 'max:3072'],
        ], [
            'nominal.numeric' => 'Nominal transfer harus berupa angka.',
            'nominal.min' => 'Nominal transfer minimal Rp 1.',
            'proof.image' => 'Bukti transfer harus berupa file gambar (JPG/PNG).',
            'proof.max' => 'Ukuran bukti transfer maksimal 3 MB.',
        ]);

        $nominal = ! empty($validated['nominal'])
            ? (float) $validated['nominal']
            : (float) $assignment->locked_price;

        $proofUrl = null;
        if ($request->hasFile('proof')) {
            // Upload bukti bayar vendor
            try {
                \Cloudinary::config();
                $upload = Uploader::upload(
                    $request->file('proof')->getRealPath(),
                    ['folder' => 'evento/vendor-payouts']
                );
                $proofUrl = $upload['secure_url'];
            } catch (\Throwable $e) {
                // Fallback local storage
                $path = $request->file('proof')->store('vendor-payouts', 'public');
                $proofUrl = Storage::disk('public')->url($path);
            }
        }

        $receiptNumber = sprintf('VCH/EVN/%s/%04d', now()->format('Ym'), $assignment->id);

        $assignment->update([
            'payout_status' => 'paid',
            'payout_nominal' => $nominal,
            'payout_at' => now(),
            'payout_proof_url' => $proofUrl ?? $assignment->payout_proof_url,
            'payout_receipt_number' => $receiptNumber,
            'payout_note' => $validated['note'] ?? 'Transfer honorarium vendor via Rekening Resmi EO.',
        ]);

        return response()->json([
            'message' => "Honorarium untuk {$assignment->vendor->business_name} sebesar Rp ".number_format($nominal, 0, ',', '.').' berhasil dicatat LUNAS.',
            'data' => $assignment->fresh(['vendor', 'event']),
        ]);
    }

    /**
     * [VENDOR] Memperbarui informasi rekening bank vendor.
     */
    public function updateVendorBankAccount(Request $request): JsonResponse
    {
        $vendor = $request->user()->vendor;
        if (! $vendor) {
            return response()->json(['message' => 'Profil vendor tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'bank_name' => ['required', 'string', 'max:50'],
            'bank_account_number' => ['required', 'string', 'max:50'],
            'bank_account_holder' => ['required', 'string', 'max:100'],
        ], [
            'bank_name.required' => 'Nama bank wajib diisi (misal: BCA, Mandiri, BRI).',
            'bank_account_number.required' => 'Nomor rekening bank wajib diisi.',
            'bank_account_holder.required' => 'Nama pemilik rekening wajib diisi.',
        ]);

        $vendor->update($validated);

        return response()->json([
            'message' => 'Informasi rekening bank vendor berhasil diperbarui.',
            'data' => $vendor->fresh(),
        ]);
    }
}
