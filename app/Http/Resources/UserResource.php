<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into a safe array.
     * Never expose passwords, hashes, tokens, or private phone numbers.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'email_verified' => $this->hasVerifiedEmail(),
            'email_verified_at' => $this->email_verified_at?->toIso8601String(),
            'role' => $this->role ?? 'user',
            'status' => $this->status ?? 'active',
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
