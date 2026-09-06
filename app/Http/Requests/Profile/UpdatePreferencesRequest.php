<?php

namespace App\Http\Requests\Profile;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePreferencesRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'preferred_gender' => ['required', 'string', 'in:male,female'],
            'min_age' => ['required', 'integer', 'min:18', 'max:80'],
            'max_age' => ['required', 'integer', 'min:18', 'max:80', 'gte:min_age'],
            'preferred_cities' => ['nullable', 'array'],
            'preferred_cities.*' => ['string', 'max:100'],
            'preferred_religion' => ['nullable', 'string', 'max:64'],
            'preferred_sect' => ['nullable', 'string', 'max:64'],
            'min_height' => ['nullable', 'integer', 'min:120', 'max:230'],
            'max_height' => ['nullable', 'integer', 'min:120', 'max:230', 'gte:min_height'],
            'preferred_education' => ['nullable', 'string', 'max:100'],
            'preferred_marital_status' => ['nullable', 'array'],
            'preferred_marital_status.*' => ['string', 'in:never_married,divorced,widowed,separated'],
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [
            'max_age.gte' => 'Maximum preferred age must be greater than or equal to minimum preferred age.',
            'max_height.gte' => 'Maximum preferred height must be greater than or equal to minimum preferred height.',
        ];
    }
}
