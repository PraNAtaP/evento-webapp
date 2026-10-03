<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class BookingController extends Controller
{
    /**
     * Mengembalikan daftar tanggal yang sudah dibooking dalam format JSON (array tanggal).
     *
     * @return JsonResponse list<string> (e.g. ["2026-10-25", "2026-10-26"])
     */
    public function bookedDates(): JsonResponse
    {
        $bookedDates = Event::query()
            ->orderBy('event_date', 'asc')
            ->pluck('event_date')
            ->map(fn ($date) => Carbon::parse($date)->format('Y-m-d'))
            ->unique()
            ->values()
            ->all();

        return response()->json($bookedDates);
    }

    /**
     * Menyimpan booking baru dari klien.
     * Terapkan validasi ketat bahwa satu tanggal hanya untuk satu acara.
     * Jika tanggal sudah terisi, tolak dan kembalikan error validation HTTP 422 dengan pesan 'Tanggal sudah terisi'.
     *
     * @throws ValidationException
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->isClient()) {
            return response()->json([
                'message' => 'Akses ditolak. Hanya client yang dapat melakukan booking acara.',
            ], 403);
        }

        $validated = $request->validate([
            'event_name' => ['required', 'string', 'max:150'],
            'event_date' => ['required', 'date_format:Y-m-d', 'unique:events,event_date'],
        ], [
            'event_date.unique' => 'Tanggal sudah terisi',
            'event_date.required' => 'Tanggal acara wajib diisi.',
            'event_date.date_format' => 'Format tanggal acara harus YYYY-MM-DD.',
            'event_name.required' => 'Nama acara wajib diisi.',
            'event_name.string' => 'Nama acara harus berupa teks.',
            'event_name.max' => 'Nama acara maksimal 150 karakter.',
        ]);

        try {
            $event = Event::create([
                'client_id' => $user->id,
                'event_name' => $validated['event_name'],
                'event_date' => $validated['event_date'],
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
                'event_date' => Carbon::parse($event->event_date)->format('Y-m-d'),
                'kanban_status' => $event->kanban_status,
                'created_at' => $event->created_at?->toISOString(),
                'updated_at' => $event->updated_at?->toISOString(),
            ],
        ], 201);
    }
}
