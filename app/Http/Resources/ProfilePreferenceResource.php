<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfilePreferenceResource extends JsonResource
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
            'preferred_gender' => $this->preferred_gender,
            'min_age' => $this->min_age,
            'max_age' => $this->max_age,
            'preferred_cities' => $this->preferred_cities ?? [],
            'preferred_religion' => $this->preferred_religion,
            'preferred_sect' => $this->preferred_religion === 'Islam' ? $this->preferred_sect : null,
            'min_height' => $this->min_height,
            'max_height' => $this->max_height,
            'preferred_education' => $this->preferred_education,
            'preferred_marital_status' => $this->preferred_marital_status ?? [],
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
