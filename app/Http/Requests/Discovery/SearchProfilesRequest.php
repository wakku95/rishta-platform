<?php

namespace App\Http\Requests\Discovery;

use App\Constants\ProfileOptions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SearchProfilesRequest extends FormRequest
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
            'gender' => ['nullable', 'string', Rule::in(array_keys(ProfileOptions::GENDERS))],
            'min_age' => ['nullable', 'integer', 'min:18', 'max:80'],
            'max_age' => [
                'nullable',
                'integer',
                'min:18',
                'max:80',
                Rule::when($this->filled('min_age'), ['gte:min_age']),
            ],
            'city' => ['nullable', 'string', Rule::in(array_keys(ProfileOptions::CITIES))],
            'religion' => ['nullable', 'string', Rule::in(array_keys(ProfileOptions::RELIGIONS))],
            'sect' => ['nullable', 'string', Rule::in(array_keys(ProfileOptions::SECTS))],
            'education' => ['nullable', 'string', Rule::in(array_keys(ProfileOptions::EDUCATIONS))],
            'profession' => ['nullable', 'string', Rule::in(array_keys(ProfileOptions::PROFESSIONS))],
            'marital_status' => ['nullable', 'string', Rule::in(array_keys(ProfileOptions::MARITAL_STATUSES))],
            'min_height' => ['nullable', 'integer', 'min:120', 'max:230'],
            'max_height' => [
                'nullable',
                'integer',
                'min:120',
                'max:230',
                Rule::when($this->filled('min_height'), ['gte:min_height']),
            ],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [
            'max_age.gte' => 'Maximum age must be greater than or equal to minimum age.',
            'max_height.gte' => 'Maximum height must be greater than or equal to minimum height.',
            'min_age.min' => 'Minimum age cannot be less than 18.',
            'max_age.max' => 'Maximum age cannot exceed 80.',
            'min_height.min' => 'Minimum height must be at least 120 cm.',
            'max_height.max' => 'Maximum height cannot exceed 230 cm.',
        ];
    }
}
