<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEoManualBookingRequest;
use App\Models\Event;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class AdminCalendarBookingController extends Controller
{
    /**
     * Mengembalikan daftar seluruh event aktif beserta mapping tanggal terblokir
     * agar Smart Calendar EO bisa memblokir tanggal namun tetap mengklik tanggal terisi untuk melihat detail read-only.
     */
    public function index(): JsonResponse
    {
        $events = Event::with(['client:id,name,email,role'])
            ->where('kanban_status', '!=', 'rejected')
            ->orderBy('event_date', 'asc')
            ->get();

        $dateEventMap = [];
        $bookedDates = [];

        foreach ($events as $event) {
            $start = Carbon::parse($event->event_date);
            $end = ($event->is_multi_day && $event->end_date)
                ? Carbon::parse($event->end_date)
                : $start->copy();

            $payload = [
                'id' => $event->id,
                'event_name' => $event->event_name,
                'category' => $event->category,
                'guest_count' => $event->guest_count,
                'estimated_budget' => (float) ($event->estimated_budget ?? $event->budget ?? 0),
                'agreed_price' => $event->agreed_price !== null ? (float) $event->agreed_price : null,
                'has_own_venue' => (bool) $event->has_own_venue,
                'venue' => $event->venue,
                'lat' => $event->lat !== null ? (float) $event->lat : null,
                'lng' => $event->lng !== null ? (float) $event->lng : null,
                'event_date' => $start->format('Y-m-d'),
                'is_multi_day' => (bool) $event->is_multi_day,
                'end_date' => $event->end_date ? $end->format('Y-m-d') : null,
                'kanban_status' => $event->kanban_status,
                'booked_by_eo' => (bool) $event->booked_by_eo,
                'manual_client_name' => $event->manual_client_name,
                'manual_client_contact' => $event->manual_client_contact,
                'client_name' => $event->manual_client_name ?: ($event->client?->name ?? 'Klien'),
                'client_email' => $event->client?->email,
                'created_at' => $event->created_at?->toIso8601String(),
                'updated_at' => $event->updated_at?->toIso8601String(),
            ];

            $cursor = $start->copy();
            while ($cursor->lte($end)) {
                $ymd = $cursor->format('Y-m-d');
                $bookedDates[] = $ymd;
                $dateEventMap[$ymd] = $payload;
                $cursor->addDay();
            }
        }

        // Sertakan daftar akun client aktif agar EO dapat memilih akun client atau input manual
        $clients = User::where('role', 'client')
            ->orderBy('name', 'asc')
            ->get(['id', 'name', 'email']);

        return response()->json([
            'booked_dates' => array_values(array_unique($bookedDates)),
            'events_by_date' => $dateEventMap,
            'clients' => $clients,
        ]);
    }

    /**
     * Menyimpan acara baru secara manual oleh EO (tanpa batasan H-min untuk acara mendadak).
     *
     * @throws ValidationException
     */
    public function store(StoreEoManualBookingRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $isMultiDay = (bool) ($validated['is_multi_day'] ?? false);

        // Jika memilih akun client, pakai client_id tersebut; jika manual, tautkan ke user EO pembuat dengan nama manual tersimpan
        $resolvedClientId = ! empty($validated['client_id'])
            ? (int) $validated['client_id']
            : $request->user()->id;

        try {
            $event = Event::create([
                'client_id' => $resolvedClientId,
                'booked_by_eo' => true,
                'manual_client_name' => $validated['manual_client_name'] ?? null,
                'manual_client_contact' => $validated['manual_client_contact'] ?? null,
                'event_name' => $validated['event_name'],
                'category' => $validated['category'],
                'guest_count' => $validated['guest_count'],
                'budget' => $validated['budget'],
                'has_own_venue' => (bool) $validated['has_own_venue'],
                'venue' => $validated['has_own_venue'] ? ($validated['venue'] ?? null) : null,
                'lat' => $validated['has_own_venue'] ? ($validated['lat'] ?? null) : null,
                'lng' => $validated['has_own_venue'] ? ($validated['lng'] ?? null) : null,
                'event_date' => $validated['event_date'],
                'is_multi_day' => $isMultiDay,
                'end_date' => $isMultiDay ? ($validated['end_date'] ?? null) : null,
                'kanban_status' => 'request',
            ]);
        } catch (UniqueConstraintViolationException|QueryException $e) {
            throw ValidationException::withMessages([
                'event_date' => ['Tanggal sudah terisi oleh acara lain.'],
            ]);
        }

        $event->load(['client:id,name,email']);

        return response()->json([
            'message' => 'Acara mendadak / manual berhasil ditambahkan oleh EO.',
            'event' => $event,
        ], 201);
    }
}
