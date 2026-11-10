<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ToggleProgressVisibilityRequest extends FormRequest
{
    
    public function authorize(): bool
    {
        return $this->user()?->role === 'eo';
    }

    public function rules(): array
    {
        return [
            'is_visible_to_client' => ['required', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'is_visible_to_client.required' => 'Status visibilitas wajib diisi.',
            'is_visible_to_client.boolean'  => 'Status visibilitas harus true atau false.',
        ];
    }
}