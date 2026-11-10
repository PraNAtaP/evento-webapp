<?php

namespace App\Http\Requests;

use App\Models\Event;
use App\Models\EventCategory;
use Carbon\Carbon;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreEoManualBookingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        return $user && $user->isEo();
    }

    /**
     * Handle a failed authorization attempt.
     */
    protected function failedAuthorization(): void
    {
        throw new HttpResponseException(
            response()->json([
                'message' => 'Akses ditolak. Hanya akun Event Organizer (EO) yang dapat melakukan input manual.',
            ], 403)
        );
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if (! $this->has('event_date') && $this->has('start_date')) {
            $this->merge(['event_date' => $this->input('start_date')]);
        }

        if ($this->has('has_own_venue')) {
            $this->merge([
                'has_own_venue' => filter_var($this->input('has_own_venue'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? $this->input('has_own_venue'),
            ]);
        }

        if ($this->has('is_multi_day')) {
            $this->merge([
                'is_multi_day' => filter_var($this->input('is_multi_day'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? $this->input('is_multi_day'),
            ]);
        }

        if ($this->has('category') && is_string($this->input('category'))) {
            $cat = EventCategory::where('slug', $this->input('category'))
                ->orWhere('name', $this->input('category'))
                ->first();
            if ($cat) {
                $this->merge(['category' => $cat->slug]);
            }
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'client_id' => ['nullable', 'integer', 'exists:users,id'],
            'manual_client_name' => ['required_without:client_id', 'nullable', 'string', 'max:120'],
            'manual_client_contact' => ['nullable', 'string', 'max:100'],
            'event_name' => ['required', 'string', 'max:150'],
            'category' => ['required', 'string', 'max:100'],
            'guest_count' => ['required', 'integer', 'min:1'],
            'budget' => ['required', 'numeric', 'min:0'],
            'has_own_venue' => ['required', 'boolean'],
            'venue' => ['nullable', 'string', 'max:255', 'required_if:has_own_venue,true'],
            'lat' => ['required_if:has_own_venue,true', 'nullable', 'numeric', 'between:-90,90'],
            'lng' => ['required_if:has_own_venue,true', 'nullable', 'numeric', 'between:-180,180'],
            'event_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'is_multi_day' => ['sometimes', 'boolean'],
            'end_date' => [
                'nullable',
                'date_format:Y-m-d',
                'after_or_equal:event_date',
                'required_if:is_multi_day,true',
            ],
        ];
    }

    /**
     * Custom validation: Tanpa batas H-min untuk EO (mendukung pesanan mendadak),
     * namun tetap wajib cek kategori aktif & konflik tanggal dengan acara yang sudah ada.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $category = $this->input('category');
            $eventDateInput = $this->input('event_date');
            $isMultiDay = (bool) $this->input('is_multi_day', false);
            $endDateInput = $isMultiDay ? $this->input('end_date') : $eventDateInput;

            // 1. Validasi Kategori (Pastikan terdaftar dan aktif)
            if ($category) {
                $categoryModel = EventCategory::query()
                    ->where('slug', $category)
                    ->orWhere('name', $category)
                    ->first();

                $isValidCategory = false;

                if ($categoryModel) {
                    if (! $categoryModel->is_active) {
                        $validator->errors()->add('category', 'Kategori acara yang dipilih sedang tidak aktif.');

                        return;
                    }
                    $isValidCategory = true;
                } elseif (array_key_exists(strtolower((string) $category), Event::CATEGORY_MIN_DAYS)) {
                    $isValidCategory = true;
                }

                if (! $isValidCategory) {
                    $validator->errors()->add('category', 'Kategori acara tidak valid.');

                    return;
                }
            }

            // 2. Validasi Konflik Tanggal / Range Acara (Tidak menabrak jadwal aktif yang tidak rejected)
            if ($eventDateInput && ! $validator->errors()->has('event_date') && ! $validator->errors()->has('end_date')) {
                try {
                    $startDate = Carbon::parse($eventDateInput)->format('Y-m-d');
                    $endDate = $endDateInput ? Carbon::parse($endDateInput)->format('Y-m-d') : $startDate;

                    $hasConflict = Event::where('kanban_status', '!=', 'rejected')
                        ->where(function ($query) use ($startDate, $endDate) {
                            $query->where('event_date', '<=', $endDate)
                                ->where(function ($sub) use ($startDate) {
                                    $sub->where(function ($q1) use ($startDate) {
                                        $q1->whereNotNull('end_date')
                                            ->where('end_date', '>=', $startDate);
                                    })->orWhere(function ($q2) use ($startDate) {
                                        $q2->whereNull('end_date')
                                            ->where('event_date', '>=', $startDate);
                                    });
                                });
                        })->exists();

                    if ($hasConflict) {
                        $validator->errors()->add('event_date', 'Tanggal sudah terisi oleh acara lain.');
                    }
                } catch (\Exception $e) {
                    // Abaikan jika error parsing tanggal
                }
            }
        });
    }

    /**
     * Get the error messages for the defined validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'client_id.exists' => 'Akun klien yang dipilih tidak ditemukan.',
            'manual_client_name.required_without' => 'Nama klien/pemesan wajib diisi jika tidak memilih akun klien terdaftar.',
            'event_name.required' => 'Nama acara wajib diisi.',
            'category.required' => 'Kategori acara wajib dipilih.',
            'guest_count.required' => 'Jumlah tamu wajib diisi.',
            'guest_count.min' => 'Jumlah tamu minimal 1 orang.',
            'budget.required' => 'Anggaran wajib diisi.',
            'budget.numeric' => 'Anggaran harus berupa angka.',
            'venue.required_if' => 'Nama atau alamat venue wajib diisi jika lokasi sudah tersedia.',
            'lat.required_if' => 'Pilih titik lokasi venue di peta.',
            'lng.required_if' => 'Pilih titik lokasi venue di peta.',
            'event_date.required' => 'Tanggal acara wajib diisi.',
            'event_date.after_or_equal' => 'Tanggal acara tidak boleh tanggal yang sudah lewat.',
            'end_date.required_if' => 'Tanggal selesai acara wajib diisi untuk acara multi-hari.',
            'end_date.after_or_equal' => 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.',
        ];
    }
}
