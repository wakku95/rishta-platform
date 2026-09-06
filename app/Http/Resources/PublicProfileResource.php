<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicProfileResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'profile_code' => $this->profile_code,
            'age' => $this->age,
            'gender' => $this->gender,
            'religion' => $this->religion,
            'sect' => $this->religion === 'Islam' ? $this->sect : null,
            'city' => $this->city,
            'education' => $this->education,
            'profession' => $this->profession,
            'marital_status' => $this->marital_status,
            'height' => $this->height,
            'height_formatted' => $this->height_formatted,
            'managed_by' => $this->managed_by,
            'profile_status' => $this->profile_status,
            'verifications' => [
                'email_verified' => $this->user ? $this->user->hasVerifiedEmail() : false,
            ],
        ];
    }
}
