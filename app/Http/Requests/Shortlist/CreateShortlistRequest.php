<?php

namespace App\Http\Requests\Shortlist;

use Illuminate\Foundation\Http\FormRequest;

class CreateShortlistRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'profile_code' => ['required', 'string', 'regex:/^RK-[A-Z0-9]{6}$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'profile_code.required' => 'Candidate profile code is required.',
            'profile_code.regex' => 'Invalid candidate profile code format.',
        ];
    }
}
