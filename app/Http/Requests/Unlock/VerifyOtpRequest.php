<?php

namespace App\Http\Requests\Unlock;

use Illuminate\Foundation\Http\FormRequest;

class VerifyOtpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'otp' => [
                'required',
                'string',
                'regex:/^[0-9]{6}$/',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'otp.required' => 'Please enter the 6-digit verification code.',
            'otp.regex' => 'The verification code must be exactly 6 numeric digits.',
        ];
    }
}
