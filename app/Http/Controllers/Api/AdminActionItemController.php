<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventVendorAssignment;
use App\Models\Payment;
use App\Models\Vendor;
use Illuminate\Http\JsonResponse;

class AdminActionItemController extends Controller
{
    /**
     * Mengembalikan jumlah pekerjaan yang butuh tindakan EO saat ini.
     *
     * @return JsonResponse Array shape:
     *                      [
     *                      'items' => list<array{key: string, label: string, count: int, path: string}>,
     *                      'total' => int
     *                      ]
     */
    public function index(): JsonResponse
    {
        $counts = [
            'new_requests' => Event::where('kanban_status', 'request')->count(),
            'revision_requests' => Event::where('kanban_status', Event::VENDOR_MANAGEABLE_STATUS)
                ->whereNotNull('revision_requested_at')
                ->count(),
            'payments_pending' => Payment::where('status', 'pending_verification')->count(),
            'vendor_registrations' => Vendor::where('status', Vendor::STATUS_PENDING)->count(),
            'vendor_offers_unanswered' => EventVendorAssignment::where('eo_offer_status', 'pending')
                ->whereHas('event', fn ($query) => $query->where('kanban_status', Event::VENDOR_MANAGEABLE_STATUS))
                ->count(),
        ];

        $items = [
            ['key' => 'new_requests', 'label' => 'Request acara baru', 'path' => '/admin/kanban'],
            ['key' => 'revision_requests', 'label' => 'Klien minta revisi penawaran', 'path' => '/admin/kanban'],
            ['key' => 'payments_pending', 'label' => 'Bukti bayar menunggu verifikasi', 'path' => '/admin/payments'],
            ['key' => 'vendor_registrations', 'label' => 'Pendaftar vendor menunggu', 'path' => '/admin/vendors'],
            ['key' => 'vendor_offers_unanswered', 'label' => 'Tawaran vendor belum dijawab', 'path' => '/admin/kanban'],
        ];

        $items = array_map(fn (array $item) => $item + ['count' => $counts[$item['key']]], $items);

        return response()->json([
            'items' => $items,
            'total' => array_sum($counts),
        ]);
    }
}
