<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\EventInspectorResource;
use App\Models\Event;

class EventInspectorController extends Controller
{
    /**
     * Menampilkan detail read-only satu event untuk Board Inspector.
     *
     * Catatan: tidak ada pengecekan kepemilikan karena aplikasi ini diasumsikan
     * memiliki satu EO; middleware `role:eo` pada route sudah cukup.
     */
    public function show(Event $event): EventInspectorResource
    {
        $event->load([
            'client:id,name',
            'vendorAssignments' => fn ($query) => $query->orderBy('id'),
            'vendorAssignments.vendor:id,business_name,category',
        ]);

        return new EventInspectorResource($event);
    }
}
