<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssistedListingAdminResource extends JsonResource
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
            'listing_code' => $this->listing_code,
            'user_id' => $this->user_id,
            'created_by_admin_id' => $this->created_by_admin_id,
            'full_name' => $this->full_name,
            'gender' => $this->gender,
            'date_of_birth' => $this->date_of_birth?->format('Y-m-d'),
            'age' => $this->date_of_birth ? $this->date_of_birth->age : null,
            'religion' => $this->religion,
            'sect' => $this->sect,
            'city' => $this->city,
            'education' => $this->education,
            'profession' => $this->profession,
            'marital_status' => $this->marital_status,
            'height' => $this->height,
            'public_about' => $this->public_about,
            'family_background' => $this->family_background,
            'managed_by' => $this->managed_by,
            'contact_number' => $this->contact_number,
            'contact_number_verified_at' => $this->contact_number_verified_at,
            'contact_otp_sent_at' => $this->contact_otp_sent_at,
            'contact_otp_attempts' => $this->contact_otp_attempts,
            'listing_status' => $this->listing_status,
            'consent_given_at' => $this->consent_given_at,
            'admin_notes' => $this->admin_notes,
            'published_externally_at' => $this->published_externally_at,
            'external_notes' => $this->external_notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
