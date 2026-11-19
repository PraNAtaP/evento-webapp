<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class RejectCancellationRequest extends FormRequest
{
    /**
     * Akses dibatasi oleh middleware role:eo pada route.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'note' => ['required', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'note.required' => 'Catatan penolakan wajib diisi.',
            'note.max' => 'Catatan penolakan maksimal 1000 karakter.',
        ];
    }
}
