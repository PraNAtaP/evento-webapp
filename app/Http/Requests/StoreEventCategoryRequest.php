<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class StoreEventCategoryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->isEo() ?? false;
    }

    /**
     * Prepare data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('name') && ! $this->filled('slug')) {
            $this->merge([
                'slug' => Str::slug($this->input('name')),
            ]);
        }

        if ($this->has('is_active')) {
            $this->merge([
                'is_active' => filter_var($this->input('is_active'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? true,
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
            'name' => ['required', 'string', 'max:100', 'unique:event_categories,name'],
            'slug' => ['required', 'string', 'max:100', 'unique:event_categories,slug'],
            'min_booking_days' => ['required', 'integer', 'min:0', 'max:365'],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name' => 'nama kategori',
            'slug' => 'slug kategori',
            'min_booking_days' => 'batas hari minimum (H-min)',
            'description' => 'deskripsi',
            'is_active' => 'status aktif',
        ];
    }

    /**
     * Get the error messages for the defined validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama kategori wajib diisi.',
            'name.unique' => 'Nama kategori ini sudah terdaftar.',
            'slug.unique' => 'Slug kategori ini sudah terdaftar.',
            'min_booking_days.required' => 'Batas hari minimum (min_booking_days) wajib diisi.',
            'min_booking_days.integer' => 'Batas hari minimum harus berupa angka.',
            'min_booking_days.min' => 'Batas hari minimum tidak boleh negatif.',
            'min_booking_days.max' => 'Batas hari minimum maksimal 365 hari.',
        ];
    }
}
