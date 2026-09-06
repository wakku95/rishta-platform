<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfileResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'profile_code' => $this->profile_code,
            'gender' => $this->gender,
            'date_of_birth' => $this->date_of_birth?->format('Y-m-d'),
            'age' => $this->age,
            'religion' => $this->religion,
            'sect' => $this->religion === 'Islam' ? $this->sect : null,
            'city' => $this->city,
            'education' => $this->education,
            'profession' => $this->profession,
            'marital_status' => $this->marital_status,
            'height' => $this->height,
            'height_formatted' => $this->height_formatted,
            'about' => $this->about,
            'family_background' => $this->family_background,
            'managed_by' => $this->managed_by,
            'profile_status' => $this->profile_status,
            'completion_percentage' => $this->calculateCompletionPercentage(),
            'preferences' => new ProfilePreferenceResource($this->whenLoaded('preferences')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
