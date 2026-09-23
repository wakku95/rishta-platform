<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssistedListingPublicResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'listing_code' => $this->listing_code,
            'gender' => $this->gender,
            'age' => $this->date_of_birth ? $this->date_of_birth->age : null,
            'religion' => $this->religion,
            'sect' => $this->sect,
            'city' => $this->city,
            'education' => $this->education,
            'profession' => $this->profession,
            'marital_status' => $this->marital_status,
            'height' => $this->height,
            'public_about' => $this->public_about,
            'managed_by' => $this->managed_by,
            'listing_status' => $this->listing_status,
            'published_externally_at' => $this->published_externally_at,
            'created_at' => $this->created_at,
        ];
    }
}
