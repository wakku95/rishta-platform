<?php

namespace App\Http\Requests\Profile;

use App\Constants\ProfileOptions;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'gender' => ['sometimes', 'required', 'string', Rule::in(array_keys(ProfileOptions::GENDERS))],
            'date_of_birth' => ['sometimes', 'required', 'date', 'before_or_equal:' . $maxDate, 'after_or_equal:' . $minDate],
            'religion' => ['sometimes', 'required', 'string', Rule::in(array_keys(ProfileOptions::RELIGIONS))],
            'sect' => ['nullable', 'string', Rule::in(array_keys(ProfileOptions::SECTS))],
            'city' => ['sometimes', 'required', 'string', Rule::in(array_keys(ProfileOptions::CITIES))],
            'education' => ['sometimes', 'required', 'string', Rule::in(array_keys(ProfileOptions::EDUCATIONS))],
            'profession' => ['sometimes', 'required', 'string', Rule::in(array_keys(ProfileOptions::PROFESSIONS))],
            'marital_status' => ['sometimes', 'required', 'string', Rule::in(array_keys(ProfileOptions::MARITAL_STATUSES))],
            'height' => ['sometimes', 'required', 'integer', 'min:120', 'max:230'],
            'about' => ['nullable', 'string', 'max:2000'],
            'family_background' => ['nullable', 'string', 'max:2000'],
            'managed_by' => ['sometimes', 'required', 'string', Rule::in(array_keys(ProfileOptions::MANAGED_BY))],
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
