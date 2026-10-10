<?php

namespace App\Http\Requests;

use App\Models\Event;
use Carbon\Carbon;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreBookingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        return $user && $user->isClient();
    }

    /**
     * Handle a failed authorization attempt.
     */
    protected function failedAuthorization(): void
    {
        throw new HttpResponseException(
            response()->json([
                'message' => 'Akses ditolak. Hanya client yang dapat melakukan booking acara.',
            ], 403)
        );
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Mendukung start_date sebagai alias event_date
        if (! $this->has('event_date') && $this->has('start_date')) {
            $this->merge(['event_date' => $this->input('start_date')]);
        }

        // Normalisasi boolean jika dikirim dalam bentuk string
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
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'event_name' => ['required', 'string', 'max:150'],
            'category' => ['required', 'string', 'in:wedding,seminar,birthday'],
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
     * Custom validation rules hook (H-min dinamis dan range ketersediaan tanggal).
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $category = $this->input('category');
            $eventDateInput = $this->input('event_date');
            $isMultiDay = (bool) $this->input('is_multi_day', false);
            $endDateInput = $isMultiDay ? $this->input('end_date') : $eventDateInput;

            // 1. Validasi Batas Minimal Pemesanan (H-min Dinamis)
            if ($category && $eventDateInput && in_array($category, array_keys(Event::CATEGORY_MIN_DAYS))) {
                try {
                    $minDays = Event::CATEGORY_MIN_DAYS[$category];
                    $minDate = Carbon::today()->addDays($minDays);
                    $chosenDate = Carbon::parse($eventDateInput)->startOfDay();

                    if ($chosenDate->lt($minDate)) {
                        $categoryLabel = ucfirst($category);
                        $validator->errors()->add(
                            'event_date',
                            "Pemesanan kategori {$categoryLabel} minimal H-{$minDays} ({$minDays} hari sebelum acara)."
                        );
                    }
                } catch (\Exception $e) {
                    // Ignore date parsing error, handled by date_format rule
                }
            }

            // 2. Validasi Ketersediaan Tanggal / Range Acara (Konflik Jadwal)
            if ($eventDateInput && ! $validator->errors()->has('event_date') && ! $validator->errors()->has('end_date')) {
                try {
                    $startDate = Carbon::parse($eventDateInput)->format('Y-m-d');
                    $endDate = $endDateInput ? Carbon::parse($endDateInput)->format('Y-m-d') : $startDate;

                    // Cek apakah ada acara lain yang overlap dengan rentang [startDate, endDate]
                    $hasConflict = Event::where(function ($query) use ($startDate, $endDate) {
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
                        $validator->errors()->add('event_date', 'Tanggal sudah terisi');
                    }
                } catch (\Exception $e) {
                    // Ignore parsing error
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
            'event_name.required' => 'Nama acara wajib diisi.',
            'event_name.string' => 'Nama acara harus berupa teks.',
            'event_name.max' => 'Nama acara maksimal 150 karakter.',
            'category.required' => 'Kategori acara wajib dipilih.',
            'category.in' => 'Kategori acara harus salah satu dari: wedding, seminar, birthday.',
            'guest_count.required' => 'Jumlah tamu wajib diisi.',
            'guest_count.integer' => 'Jumlah tamu harus berupa angka.',
            'guest_count.min' => 'Jumlah tamu minimal 1 orang.',
            'budget.required' => 'Anggaran (budget) wajib diisi.',
            'budget.numeric' => 'Anggaran harus berupa angka nominal.',
            'budget.min' => 'Anggaran tidak boleh negatif.',
            'has_own_venue.required' => 'Informasi kepemilikan venue wajib ditentukan.',
            'has_own_venue.boolean' => 'Informasi kepemilikan venue harus bernilai boolean.',
            'venue.required_if' => 'Nama atau alamat venue wajib diisi jika Anda sudah memiliki venue.',
            'venue.max' => 'Nama venue maksimal 255 karakter.',
            'lat.required_if' => 'Pilih titik lokasi venue di peta.',
            'lat.numeric' => 'Koordinat latitude tidak valid.',
            'lat.between' => 'Latitude harus di antara -90 dan 90.',
            'lng.required_if' => 'Pilih titik lokasi venue di peta.',
            'lng.numeric' => 'Koordinat longitude tidak valid.',
            'lng.between' => 'Longitude harus di antara -180 dan 180.',
            'event_date.required' => 'Tanggal acara wajib diisi.',
            'event_date.date_format' => 'Format tanggal acara harus YYYY-MM-DD.',
            'event_date.after_or_equal' => 'Tanggal acara tidak boleh tanggal yang sudah lewat.',
            'is_multi_day.boolean' => 'Format multi-day tidak valid.',
            'end_date.required_if' => 'Tanggal selesai acara wajib diisi untuk acara lebih dari 1 hari.',
            'end_date.date_format' => 'Format tanggal selesai acara harus YYYY-MM-DD.',
            'end_date.after_or_equal' => 'Tanggal selesai acara harus sama atau setelah tanggal mulai acara.',
        ];
    }
}
