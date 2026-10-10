<?php

namespace App\Http\Requests\ProfileInquiry;

use Illuminate\Foundation\Http\FormRequest;

class SubmitProfileInquiryRequest extends FormRequest
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
            'submitter_name' => ['required', 'string', 'max:255'],
            'submitter_contact' => ['required', 'string', 'regex:/^((\+92)|(0092)|(92)|(0))?3[0-9]{9}$/'],
            'submitter_email' => ['nullable', 'email', 'max:255'],
            'family_details' => ['nullable', 'string', 'max:2000'],
            'questions' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * Prepare data before validation (normalize Pakistani phone number).
     */
    public function prepareForValidation(): void
    {
        if ($this->has('submitter_contact')) {
            $contact = preg_replace('/[^0-9+]/', '', (string) $this->submitter_contact);

            if (preg_match('/^(0092|92|0)?(3[0-9]{9})$/', $contact, $matches)) {
                $contact = '+92' . $matches[2];
            }

            $this->merge([
                'submitter_contact' => $contact,
            ]);
        }
    }
}
