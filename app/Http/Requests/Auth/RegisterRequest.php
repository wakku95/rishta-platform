<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
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
            'name' => ['required', 'string', 'min:3', 'max:100'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                'unique:users,email',
                function ($attribute, $value, $fail) {
                    $domain = substr(strrchr($value, "@"), 1);
                    $typoDomains = [
                        'gmail.co' => 'gmail.com',
                        'yahoo.co' => 'yahoo.com',
                        'hotmail.co' => 'hotmail.com',
                        'outlook.co' => 'outlook.com',
                        'icloud.co' => 'icloud.com',
                        'gamil.com' => 'gmail.com',
                        'gmai.com' => 'gmail.com',
                        'gmial.com' => 'gmail.com',
                        'gmaill.com' => 'gmail.com',
                        'yaho.com' => 'yahoo.com',
                        'yaho.co' => 'yahoo.com',
                        'hotmial.com' => 'hotmail.com',
                        'hotmaill.com' => 'hotmail.com',
                        'outlok.com' => 'outlook.com',
                    ];
                    if (isset($typoDomains[$domain])) {
                        $fail("Did you mean @{$typoDomains[$domain]}? Please check your email address domain.");
                    }
                },
            ],
            'phone' => ['nullable', 'string', 'max:25', 'regex:/^[0-9+\-\s()]{7,25}$/'],
            'password' => ['required', 'string', 'confirmed', Password::min(8)->letters()->numbers()],
        ];
    }

    /**
     * Custom messages for validation errors.
     */
    public function messages(): array
    {
        return [
            'phone.regex' => 'Please provide a valid phone or mobile number.',
        ];
    }

    /**
     * Prepare inputs for validation (trim whitespace and lowercase email).
     */
    protected function prepareForValidation(): void
    {
        $phone = trim((string) $this->input('phone'));
        $this->merge([
            'name' => trim((string) $this->input('name')),
            'email' => strtolower(trim((string) $this->input('email'))),
            'phone' => $phone !== '' ? $phone : null,
        ]);
    }
}
