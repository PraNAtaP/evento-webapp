<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventSummaryController extends Controller
{
    /**
     * Mengembalikan data mockup ringkasan acara dan keuangan untuk Event Organizer (EO).
     *
     * Catatan: Data ini saat ini merupakan data mockup statis yang angkanya
     * diselaraskan persis dengan data awal di resources/js/data/kanbanData.js
     * (9 proyek, 7 aktif, nilai kontrak Rp 882.000.000, total masuk Rp 561.400.000).
     * Data mockup ini nantinya akan digantikan dengan query agregasi database
     * dari tabel events dan payments.
     *
     * @return JsonResponse Array shape:
     *                      [
     *                      'total_proyek' => int,
     *                      'sedang_berjalan' => int,
     *                      'total_nilai_kontrak' => int,
     *                      'total_telah_masuk' => int,
     *                      'status_counts' => array{request: int, dp_paid: int, on_progress: int, done: int}
     *                      ]
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'eo') {
            return response()->json([
                'message' => 'Akses ditolak. Hanya Event Organizer (EO) yang dapat mengakses data ini.',
            ], 403);
        }

        return response()->json([
            'total_proyek' => 9,
            'sedang_berjalan' => 7,
            'total_nilai_kontrak' => 882000000,
            'total_telah_masuk' => 561400000,
            'status_counts' => [
                'request' => 2,
                'dp_paid' => 2,
                'on_progress' => 3,
                'done' => 2,
            ],
        ]);
    }
}
