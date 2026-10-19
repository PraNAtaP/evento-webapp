<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEventCategoryRequest;
use App\Http\Requests\UpdateEventCategoryRequest;
use App\Models\Event;
use App\Models\EventCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventCategoryController extends Controller
{
    /**
     * Mengambil daftar kategori aktif (dapat diakses oleh semua pengguna terautentikasi untuk form booking & kalender).
     */
    public function index(Request $request): JsonResponse
    {
        $categories = EventCategory::query()
            ->active()
            ->orderBy('name', 'asc')
            ->get();

        return response()->json([
            'data' => $categories,
        ]);
    }

    /**
     * Mengambil seluruh daftar kategori acara (aktif dan non-aktif) untuk dashboard EO.
     * Dilengkapi jumlah acara yang memakai kategori tersebut.
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $categories = EventCategory::query()
            ->orderBy('id', 'asc')
            ->get()
            ->map(function (EventCategory $category) {
                $eventsCount = Event::where('category', $category->slug)
                    ->orWhere('category', strtolower($category->name))
                    ->count();

                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'min_booking_days' => $category->min_booking_days,
                    'description' => $category->description,
                    'is_active' => $category->is_active,
                    'events_count' => $eventsCount,
                    'created_at' => $category->created_at?->toISOString(),
                    'updated_at' => $category->updated_at?->toISOString(),
                ];
            });

        return response()->json([
            'data' => $categories,
        ]);
    }

    /**
     * Menyimpan kategori acara baru (Khusus EO).
     */
    public function store(StoreEventCategoryRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $category = EventCategory::create($validated);

        return response()->json([
            'message' => 'Kategori acara berhasil ditambahkan.',
            'category' => $category,
        ], 201);
    }

    /**
     * Menampilkan detail satu kategori.
     */
    public function show(EventCategory $eventCategory): JsonResponse
    {
        return response()->json([
            'data' => $eventCategory,
        ]);
    }

    /**
     * Memperbarui kategori acara yang ada (Khusus EO).
     */
    public function update(UpdateEventCategoryRequest $request, EventCategory $eventCategory): JsonResponse
    {
        $validated = $request->validated();

        $eventCategory->update($validated);

        return response()->json([
            'message' => 'Kategori acara berhasil diperbarui.',
            'category' => $eventCategory->fresh(),
        ]);
    }

    /**
     * Menghapus kategori acara (Khusus EO).
     * Mencegah penghapusan jika sudah dipakai pada data acara.
     */
    public function destroy(EventCategory $eventCategory): JsonResponse
    {
        $isUsed = Event::where('category', $eventCategory->slug)
            ->orWhere('category', strtolower($eventCategory->name))
            ->exists();

        if ($isUsed) {
            return response()->json([
                'message' => 'Kategori acara tidak dapat dihapus karena sudah digunakan oleh acara tersimpan. Silakan nonaktifkan kategori ini sebagai alternatif.',
            ], 422);
        }

        $eventCategory->delete();

        return response()->json([
            'message' => 'Kategori acara berhasil dihapus.',
        ]);
    }
}
