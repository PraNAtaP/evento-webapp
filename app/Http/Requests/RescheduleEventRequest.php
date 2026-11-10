<?php

namespace App\Http\Requests;

use App\Models\Event;
use Carbon\Carbon;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class RescheduleEventRequest extends FormRequest
{
    /**
     * Status kanban yang diizinkan untuk melakukan reschedule (Request sampai Menunggu DP).
     */
    public const ALLOWED_STATUSES = [
        'request',
        'drafting_quotation',
        'client_review',
        'awaiting_dp',
    ];

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
                'message' => 'Akses ditolak. Hanya akun Event Organizer (EO) yang dapat melakukan reschedule acara.',
            ], 403)
        );
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
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
     * Validasi status acara dan bentrok jadwal dengan acara lain.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            /** @var Event|null $event */
            $event = $this->route('event');

            if (! $event) {
                return;
            }

            if (! in_array($event->kanban_status, self::ALLOWED_STATUSES, true)) {
                $validator->errors()->add(
                    'event_date',
                    'Reschedule hanya diperbolehkan untuk acara dengan status Request hingga Menunggu DP.'
                );

                return;
            }

            $eventDateInput = $this->input('event_date');
            $isMultiDay = (bool) $this->input('is_multi_day', false);
            $endDateInput = $isMultiDay ? $this->input('end_date') : $eventDateInput;

            if ($eventDateInput && ! $validator->errors()->has('event_date') && ! $validator->errors()->has('end_date')) {
                try {
                    $startDate = Carbon::parse($eventDateInput)->format('Y-m-d');
                    $endDate = $endDateInput ? Carbon::parse($endDateInput)->format('Y-m-d') : $startDate;

                    // Cek konflik tanggal dengan acara aktif lain (kecualikan event ini sendiri dan yang ditolak)
                    $hasConflict = Event::where('id', '!=', $event->id)
                        ->where('kanban_status', '!=', 'rejected')
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
                        $validator->errors()->add('event_date', 'Tanggal baru bertabrakan dengan jadwal acara lain.');
                    }
                } catch (\Exception $e) {
                    // Abaikan error parsing tanggal
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
            'event_date.required' => 'Tanggal acara baru wajib dipilih.',
            'event_date.date_format' => 'Format tanggal acara harus YYYY-MM-DD.',
            'event_date.after_or_equal' => 'Tanggal reschedule tidak boleh kurang dari hari ini.',
            'end_date.required_if' => 'Tanggal selesai wajib diisi jika rentang hari (End date) diaktifkan.',
            'end_date.date_format' => 'Format tanggal selesai harus YYYY-MM-DD.',
            'end_date.after_or_equal' => 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.',
        ];
    }
}
