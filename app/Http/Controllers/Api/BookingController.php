<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBookingRequest;
use App\Models\Event;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class BookingController extends Controller
{
    /**
     * Mengembalikan daftar tanggal yang sudah dibooking dalam format JSON (array tanggal).
     * Mendukung rentang tanggal acara multi-day.
     *
     * @return JsonResponse list<string> (e.g. ["2026-10-25", "2026-10-26"])
     */
    public function bookedDates(): JsonResponse
    {
        $events = Event::query()
            ->orderBy('event_date', 'asc')
            ->get(['event_date', 'end_date', 'is_multi_day']);

        $dates = collect();

        foreach ($events as $event) {
            $startDate = Carbon::parse($event->event_date);
            if ($event->is_multi_day && $event->end_date) {
                $endDate = Carbon::parse($event->end_date);
                while ($startDate->lte($endDate)) {
                    $dates->push($startDate->format('Y-m-d'));
                    $startDate->addDay();
                }
            } else {
                $dates->push($startDate->format('Y-m-d'));
            }
        }

        return response()->json($dates->unique()->sort()->values()->all());
    }

    /**
     * Menyimpan booking baru dari klien.
     * Terapkan validasi ketat bahwa satu tanggal hanya untuk satu acara,
     * aturan range tanggal multi-day, serta batas minimal pemesanan H-min dinamis sesuai kategori.
     *
     * @throws ValidationException
     */
    public function store(StoreBookingRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $isMultiDay = (bool) ($validated['is_multi_day'] ?? false);

        try {
            $event = Event::create([
                'client_id' => $request->user()->id,
                'event_name' => $validated['event_name'],
                'category' => $validated['category'],
                'guest_count' => $validated['guest_count'],
                'budget' => $validated['budget'],
                'has_own_venue' => (bool) $validated['has_own_venue'],
                'venue' => $validated['has_own_venue'] ? ($validated['venue'] ?? null) : null,
                'event_date' => $validated['event_date'],
                'is_multi_day' => $isMultiDay,
                'end_date' => $isMultiDay ? ($validated['end_date'] ?? null) : null,
                'kanban_status' => 'request',
            ]);
        } catch (UniqueConstraintViolationException|QueryException $e) {
            throw ValidationException::withMessages([
                'event_date' => ['Tanggal sudah terisi'],
            ]);
        }

        return response()->json([
            'message' => 'Booking acara berhasil dibuat.',
            'event' => [
                'id' => $event->id,
                'client_id' => $event->client_id,
                'event_name' => $event->event_name,
                'category' => $event->category,
                'guest_count' => $event->guest_count,
                'budget' => $event->budget,
                'has_own_venue' => $event->has_own_venue,
                'venue' => $event->venue,
                'event_date' => Carbon::parse($event->event_date)->format('Y-m-d'),
                'is_multi_day' => $event->is_multi_day,
                'end_date' => $event->end_date ? Carbon::parse($event->end_date)->format('Y-m-d') : null,
                'kanban_status' => $event->kanban_status,
                'created_at' => $event->created_at?->toISOString(),
                'updated_at' => $event->updated_at?->toISOString(),
            ],
        ], 201);
    }
}
