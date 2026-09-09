<?php

namespace App\Http\Requests\Unlock;

use Illuminate\Foundation\Http\FormRequest;

class SendOtpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'phone_number' => [
                'required_without:phone',
                'nullable',
                'string',
                'regex:/^((\+92)|(0092)|(92)|(0))?3[0-9]{9}$/',
            ],
            'phone' => [
                'required_without:phone_number',
                'nullable',
                'string',
                'regex:/^((\+92)|(0092)|(92)|(0))?3[0-9]{9}$/',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'phone_number.required' => 'Please provide a mobile phone number.',
            'phone_number.regex' => 'Please enter a valid Pakistani mobile number (e.g. 03001234567 or +923001234567).',
        ];
    }

    /**
     * Normalize the phone number to standard E.164 format (+923001234567).
     */
    public function normalizedPhoneNumber(): string
    {
        $raw = $this->input('phone_number') ?? $this->input('phone');
        $phone = preg_replace('/[^0-9]/', '', $raw);

        if (str_starts_with($phone, '0092')) {
            $phone = substr($phone, 4);
        } elseif (str_starts_with($phone, '92')) {
            $phone = substr($phone, 2);
        } elseif (str_starts_with($phone, '0')) {
            $phone = substr($phone, 1);
        }

        return '+92' . $phone;
    }
}
