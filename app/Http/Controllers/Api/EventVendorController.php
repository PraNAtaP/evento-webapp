<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEventVendorRequest;
use App\Http\Resources\EventVendorResource;
use App\Models\Event;
use App\Models\EventVendorAssignment;
use App\Models\VendorPackage;
use App\Services\KanbanTransitionService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class EventVendorController extends Controller
{
    /**
     * Menambahkan vendor+paket ke event dari Board Inspector.
     *
     * Baris yang dibuat adalah assignment `pending`: vendor langsung melihatnya sebagai tawaran.
     * Harga (`locked_price`) tidak dapat diedit setelah ditambahkan; untuk mengubahnya,
     * hapus lalu tambahkan ulang.
     *
     * Catatan: tanpa pengecekan kepemilikan karena aplikasi diasumsikan memiliki satu EO;
     * middleware `role:eo` pada route sudah cukup.
     */
    public function store(StoreEventVendorRequest $request, Event $event): JsonResponse
    {
        try {
            $assignment = DB::transaction(function () use ($request, $event) {
                $lockedEvent = Event::query()->lockForUpdate()->findOrFail($event->id);
                $this->ensureVendorsManageable($lockedEvent);

                $package = VendorPackage::query()->findOrFail($request->validated('package_id'));

                return $lockedEvent->vendorAssignments()->create([
                    // vendor_id diturunkan dari paket, bukan dari input klien
                    'vendor_id' => $package->vendor_id,
                    'package_id' => $package->id,
                    'package_name' => $package->package_name,
                    'package_price' => $package->price,
                    'locked_price' => $request->validated('price') ?? $package->price,
                    'notes' => $request->validated('notes'),
                ]);
            });
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages([
                'package_id' => ['Paket ini sudah ada di acara ini.'],
            ]);
        }

        $assignment->refresh()->load('vendor:id,business_name,category');

        return (new EventVendorResource($assignment))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Melepas vendor dari event. Vendor/paket di katalog tidak ikut terhapus.
     */
    public function destroy(Event $event, EventVendorAssignment $assignment): Response
    {
        abort_unless($assignment->event_id === $event->id, 404);

        $this->ensureVendorsManageable($event);

        if ($assignment->eo_offer_status === 'accepted' && $assignment->progressLogs()->exists()) {
            throw ValidationException::withMessages([
                'event' => ['Vendor sudah menerima tawaran dan memiliki catatan progres, sehingga tidak dapat dihapus.'],
            ]);
        }

        $assignment->delete();

        return response()->noContent();
    }

    /**
     * Mengirim penawaran ke klien dari Board Inspector (memindahkan event ke client_review).
     * Terlindungi dalam transaksi atomik dengan lockForUpdate untuk mencegah klik ganda.
     */
    public function sendQuotation(
        Request $request,
        Event $event,
        KanbanTransitionService $transitionService
    ): JsonResponse {
        $validated = $request->validate([
            'dp_percentage' => ['nullable', 'numeric', 'between:10,100'],
        ], [
            'dp_percentage.numeric' => 'Persentase DP harus berupa angka.',
            'dp_percentage.between' => 'Persentase DP harus bernilai antara 10% sampai 100%.',
        ]);

        $updatedEvent = DB::transaction(function () use ($event, $validated, $transitionService) {
            $lockedEvent = Event::query()->lockForUpdate()->findOrFail($event->id);

            if ($lockedEvent->kanban_status !== Event::VENDOR_MANAGEABLE_STATUS) {
                throw ValidationException::withMessages([
                    'event' => ['Penawaran hanya dapat dikirim saat acara berada di tahap Penyusunan Penawaran.'],
                ]);
            }

            return $transitionService->transition(
                $lockedEvent,
                'client_review',
                ['dp_percentage' => $validated['dp_percentage'] ?? null]
            );
        });

        return response()->json([
            'message' => 'Penawaran berhasil dikirim ke klien.',
            'event' => $updatedEvent,
        ]);
    }

    /**
     * @throws ValidationException
     */
    private function ensureVendorsManageable(Event $event): void
    {
        if (! $event->canManageVendors()) {
            throw ValidationException::withMessages([
                'event' => ['Vendor hanya dapat diubah saat acara berada di tahap Penyusunan Penawaran.'],
            ]);
        }
    }
}
