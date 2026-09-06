<?php

namespace App\Http\Requests\Profile;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
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
        $maxDate = now()->subYears(18)->format('Y-m-d');
        $minDate = now()->subYears(80)->format('Y-m-d');

        return [
            'gender' => ['sometimes', 'required', 'string', 'in:male,female'],
            'date_of_birth' => ['sometimes', 'required', 'date', 'before_or_equal:' . $maxDate, 'after_or_equal:' . $minDate],
            'religion' => ['sometimes', 'required', 'string', 'max:64'],
            'sect' => ['nullable', 'string', 'max:64'],
            'city' => ['sometimes', 'required', 'string', 'max:100'],
            'education' => ['sometimes', 'required', 'string', 'max:100'],
            'profession' => ['sometimes', 'required', 'string', 'max:150'],
            'marital_status' => ['sometimes', 'required', 'string', 'in:never_married,divorced,widowed,separated'],
            'height' => ['sometimes', 'required', 'integer', 'min:120', 'max:230'],
            'about' => ['nullable', 'string', 'max:2000'],
            'managed_by' => ['sometimes', 'required', 'string', 'in:myself,parent,sibling,guardian,family'],
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [
            'date_of_birth.before_or_equal' => 'You must be at least 18 years of age to create a matrimonial profile.',
            'date_of_birth.after_or_equal' => 'Please enter a realistic date of birth.',
            'height.min' => 'Height must be at least 120 cm (approx 3\'11").',
            'height.max' => 'Height must not exceed 230 cm (approx 7\'6").',
        ];
    }
}
