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
     */
    public function toArray(Request $request): array
    {
        $profile = $this->profile;
        $hasProfile = (bool) $profile;
        $preferences = $hasProfile ? $profile->preferences : null;
        $hasPreferences = $preferences && 
                          !empty($preferences->preferred_gender) && 
                          !empty($preferences->min_age) && 
                          !empty($preferences->max_age);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'email_verified' => $this->hasVerifiedEmail(),
            'email_verified_at' => $this->email_verified_at?->toIso8601String(),
            'role' => $this->role ?? 'user',
            'status' => $this->status ?? 'active',
            'has_profile' => $hasProfile,
            'has_preferences' => $hasPreferences,
            'profile_status' => $hasProfile ? $profile->profile_status : null,
            'completion_score' => $hasProfile ? $profile->calculateCompletionPercentage() : 0,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
