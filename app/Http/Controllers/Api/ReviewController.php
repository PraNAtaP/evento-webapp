<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Review;
use App\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    /**
     * Mengambil daftar ulasan pada suatu event tertentu.
     */
    public function indexForEvent(Event $event): JsonResponse
    {
        $reviews = $event->reviews()
            ->with([
                'client:id,name,avatar_url',
                'vendor:id,business_name,category,image_url',
            ])
            ->latest()
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $reviews,
        ]);
    }

    /**
     * Menyimpan atau memperbarui ulasan dari klien untuk EO atau Mitra Vendor penugasan acara.
     */
    public function store(Request $request, Event $event): JsonResponse
    {
        $user = $request->user();

        // Hanya klien pemilik acara atau EO yang dapat membuat ulasan
        if ($user->role === 'client' && $event->client_id !== $user->id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Anda tidak memiliki hak untuk memberikan ulasan pada acara ini.',
            ], 403);
        }

        // Pastikan acara sudah berstatus selesai (completed)
        if ($event->kanban_status !== 'completed' && is_null($event->completed_at)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ulasan dan penilaian bintang hanya dapat diberikan setelah acara selesai.',
            ], 422);
        }

        $validated = $request->validate([
            'reviewee_type' => ['required', 'string', 'in:eo,vendor'],
            'vendor_id' => ['nullable', 'required_if:reviewee_type,vendor', 'exists:vendors,id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ], [
            'rating.required' => 'Penilaian bintang (1-5) wajib dipilih.',
            'rating.min' => 'Rating minimal 1 bintang.',
            'rating.max' => 'Rating maksimal 5 bintang.',
        ]);

        $vendorId = $validated['reviewee_type'] === 'vendor' ? $validated['vendor_id'] : null;

        $review = Review::updateOrCreate(
            [
                'event_id' => $event->id,
                'client_id' => $user->id,
                'reviewee_type' => $validated['reviewee_type'],
                'vendor_id' => $vendorId,
            ],
            [
                'rating' => $validated['rating'],
                'comment' => $validated['comment'] ?? null,
            ]
        );

        $review->load([
            'client:id,name,avatar_url',
            'vendor:id,business_name,category,image_url',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Terima kasih! Ulasan dan rating Anda berhasil disimpan.',
            'data' => $review,
        ], 201);
    }

    /**
     * Mengambil daftar ulasan publik untuk suatu vendor.
     */
    public function indexForVendor(Vendor $vendor): JsonResponse
    {
        $reviews = $vendor->reviews()
            ->with(['client:id,name,avatar_url', 'event:id,event_name,event_date'])
            ->latest()
            ->paginate(10);

        return response()->json([
            'status' => 'success',
            'data' => $reviews,
            'meta' => [
                'average_rating' => $vendor->average_rating,
                'review_count' => $vendor->review_count,
            ],
        ]);
    }
}
