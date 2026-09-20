<?php

namespace App\Http\Requests\Admin;

use App\Constants\ProfileOptions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateAssistedProfileRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() && $this->user()->role === 'admin';
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
            // User Data
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],

            // Profile Data
            'gender' => ['required', 'string', Rule::in(array_keys(ProfileOptions::GENDERS))],
            'date_of_birth' => ['required', 'date', 'before_or_equal:' . $maxDate, 'after_or_equal:' . $minDate],
            'religion' => ['required', 'string', Rule::in(array_keys(ProfileOptions::RELIGIONS))],
            'sect' => [
                Rule::requiredIf(fn () => $this->input('religion') === 'Islam'),
                'nullable',
                'string',
                Rule::in(array_keys(ProfileOptions::SECTS)),
            ],
            'city' => ['required', 'string', Rule::in(array_keys(ProfileOptions::CITIES))],
            'education' => ['required', 'string', Rule::in(array_keys(ProfileOptions::EDUCATIONS))],
            'profession' => ['required', 'string', Rule::in(array_keys(ProfileOptions::PROFESSIONS))],
            'marital_status' => ['required', 'string', Rule::in(array_keys(ProfileOptions::MARITAL_STATUSES))],
            'height' => ['required', 'integer', 'min:120', 'max:230'],
            'about' => ['nullable', 'string', 'max:2000'],
            'family_background' => ['nullable', 'string', 'max:2000'],
            'managed_by' => ['required', 'string', Rule::in(array_keys(ProfileOptions::MANAGED_BY))],

            // Preferences Data (Optional at creation)
            'preferred_gender' => ['nullable', 'string', Rule::in(array_keys(ProfileOptions::GENDERS))],
            'min_age' => ['nullable', 'integer', 'min:18', 'max:80'],
            'max_age' => ['nullable', 'integer', 'min:18', 'max:80', 'gte:min_age'],
            'preferred_cities' => ['nullable', 'array'],
            'preferred_cities.*' => ['string', Rule::in(array_keys(ProfileOptions::CITIES))],
            'preferred_religion' => ['nullable', 'string', Rule::in(array_keys(ProfileOptions::RELIGIONS))],
            'preferred_sect' => [
                'nullable',
                'string',
                Rule::in(array_keys(ProfileOptions::SECTS)),
            ],
            'min_height' => ['nullable', 'integer', 'min:120', 'max:230'],
            'max_height' => ['nullable', 'integer', 'min:120', 'max:230', 'gte:min_height'],
            'preferred_education' => ['nullable', 'string', Rule::in(array_keys(ProfileOptions::EDUCATIONS))],
            'preferred_marital_status' => ['nullable', 'array'],
            'preferred_marital_status.*' => ['string', Rule::in(array_keys(ProfileOptions::MARITAL_STATUSES))],
        ];
    }

    public function messages(): array
    {
        return [
            'date_of_birth.before_or_equal' => 'Candidate must be at least 18 years of age.',
            'date_of_birth.after_or_equal' => 'Please enter a realistic date of birth.',
            'height.min' => 'Height must be at least 120 cm.',
            'height.max' => 'Height must not exceed 230 cm.',
            'max_age.gte' => 'Maximum age preference must be greater than or equal to minimum age.',
            'max_height.gte' => 'Maximum height preference must be greater than or equal to minimum height.',
        ];
    }
}
