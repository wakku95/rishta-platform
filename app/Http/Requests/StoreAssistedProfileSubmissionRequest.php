<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreAssistedProfileSubmissionRequest extends FormRequest
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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Private information
            'submitter_name' => ['required', 'string', 'max:255'],
            'submitter_contact' => ['required', 'string', 'regex:/^((\+92)|(0092)|(92)|(0))?3[0-9]{9}$/'],

            // Public Biodata
            'public_biodata' => ['required', 'array'],
            'public_biodata.gender' => ['required', 'string', \Illuminate\Validation\Rule::in(array_keys(\App\Constants\ProfileOptions::GENDERS))],
            'public_biodata.date_of_birth' => ['required', 'date', 'before_or_equal:-18 years'],
            'public_biodata.religion' => ['required', 'string', \Illuminate\Validation\Rule::in(array_keys(\App\Constants\ProfileOptions::RELIGIONS))],
            'public_biodata.sect' => ['nullable', 'string', function($attribute, $value, $fail) {
                if (request()->input('public_biodata.religion') === 'islam' && empty($value)) {
                    $fail('The sect field is required when religion is Islam.');
                }
            }, \Illuminate\Validation\Rule::in(array_keys(\App\Constants\ProfileOptions::SECTS))],
            'public_biodata.city' => ['required', 'string', \Illuminate\Validation\Rule::in(array_keys(\App\Constants\ProfileOptions::CITIES))],
            'public_biodata.education' => ['required', 'string', \Illuminate\Validation\Rule::in(array_keys(\App\Constants\ProfileOptions::EDUCATIONS))],
            'public_biodata.profession' => ['required', 'string', \Illuminate\Validation\Rule::in(array_keys(\App\Constants\ProfileOptions::PROFESSIONS))],
            'public_biodata.marital_status' => ['required', 'string', \Illuminate\Validation\Rule::in(array_keys(\App\Constants\ProfileOptions::MARITAL_STATUSES))],
            'public_biodata.height' => ['required', 'integer', 'min:120', 'max:250'],
            'public_biodata.public_about' => ['nullable', 'string', 'max:2000'],
            'public_biodata.managed_by' => ['required', 'string', \Illuminate\Validation\Rule::in(array_keys(\App\Constants\ProfileOptions::MANAGED_BY))],

            // Consent
            'terms_accepted' => ['required', 'accepted'],
            'social_publication_consent' => ['boolean'],
        ];
    }
}
