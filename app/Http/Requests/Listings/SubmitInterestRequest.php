<?php

namespace App\Http\Requests\Listings;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SubmitInterestRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Anyone can submit interest
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
            'message' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function prepareForValidation()
    {
        // Normalise contact number
        if ($this->has('submitter_contact')) {
            $contact = preg_replace('/[^0-9+]/', '', $this->submitter_contact);
            
            // Format to +923...
            if (preg_match('/^(0092|92|0)?(3[0-9]{9})$/', $contact, $matches)) {
                $contact = '+92' . $matches[2];
            }
            
            $this->merge([
                'submitter_contact' => $contact,
            ]);
        }
    }
}
