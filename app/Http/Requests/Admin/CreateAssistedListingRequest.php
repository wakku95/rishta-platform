<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CreateAssistedListingRequest extends FormRequest
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
        return [
            'full_name' => ['required', 'string', 'max:255'],
            'gender' => ['required', 'string', \Illuminate\Validation\Rule::in(array_keys(\App\Constants\ProfileOptions::GENDERS))],
            'date_of_birth' => ['required', 'date', 'before_or_equal:-18 years'],
            'religion' => ['required', 'string', \Illuminate\Validation\Rule::in(array_keys(\App\Constants\ProfileOptions::RELIGIONS))],
            'sect' => ['nullable', 'string', \Illuminate\Validation\Rule::in(array_keys(\App\Constants\ProfileOptions::SECTS))],
            'city' => ['required', 'string', \Illuminate\Validation\Rule::in(array_keys(\App\Constants\ProfileOptions::CITIES))],
            'education' => ['required', 'string', \Illuminate\Validation\Rule::in(array_keys(\App\Constants\ProfileOptions::EDUCATIONS))],
            'profession' => ['required', 'string', \Illuminate\Validation\Rule::in(array_keys(\App\Constants\ProfileOptions::PROFESSIONS))],
            'marital_status' => ['required', 'string', \Illuminate\Validation\Rule::in(array_keys(\App\Constants\ProfileOptions::MARITAL_STATUSES))],
            'height' => ['required', 'integer', 'min:120', 'max:250'],
            'public_about' => ['nullable', 'string', 'max:2000'],
            'family_background' => ['nullable', 'string', 'max:2000'],
            'managed_by' => ['required', 'string', \Illuminate\Validation\Rule::in(array_keys(\App\Constants\ProfileOptions::MANAGED_BY))],
            'contact_number' => ['nullable', 'string', 'regex:/^((\+92)|(0092)|(92)|(0))?3[0-9]{9}$/'],
            'admin_notes' => ['nullable', 'string'],
            'listing_status' => ['nullable', 'string', 'in:draft,published,unpublished'],
            'consent_given' => ['nullable', 'boolean'],
        ];
    }
}
