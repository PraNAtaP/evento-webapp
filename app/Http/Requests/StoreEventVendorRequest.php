<?php

namespace App\Http\Requests;

use App\Models\Event;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEventVendorRequest extends FormRequest
{
    /**
     * Akses dijaga middleware `role:eo` pada route.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $event = $this->route('event');
        $eventId = $event instanceof Event ? $event->id : $event;

        return [
            'package_id' => [
                'required',
                'integer',
                'exists:vendor_packages,id',
                Rule::unique('event_vendor_assignments', 'package_id')
                    ->where('event_id', $eventId),
            ],
            // Batas decimal(12,2). Harga tidak dapat diedit setelah ditambahkan.
            'price' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'package_id.required' => 'Paket wajib dipilih.',
            'package_id.exists' => 'Paket tidak ditemukan.',
            'package_id.unique' => 'Paket ini sudah ada di acara ini.',
            'price.numeric' => 'Harga harus berupa angka.',
            'price.min' => 'Harga tidak boleh negatif.',
            'price.max' => 'Harga terlalu besar.',
            'notes.max' => 'Catatan maksimal 500 karakter.',
        ];
    }
}
