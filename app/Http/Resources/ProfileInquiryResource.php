<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfileInquiryResource extends JsonResource
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
            'profile_id' => $this->profile_id,
            'profile_code' => $this->profile?->profile_code,
            'candidate_gender' => $this->profile?->gender,
            'candidate_age' => $this->profile?->age,
            'candidate_city' => $this->profile?->city,
            'candidate_profession' => $this->profile?->profession,
            'candidate_user_name' => $this->profile?->user?->name,
            'candidate_user_email' => $this->profile?->user?->email,
            'user_id' => $this->user_id,
            'submitter_name' => $this->submitter_name,
            'submitter_contact' => $this->submitter_contact,
            'submitter_email' => $this->submitter_email,
            'family_details' => $this->family_details,
            'questions' => $this->questions,
            'status' => $this->status,
            'admin_notes' => $this->admin_notes,
            'reviewed_by' => $this->reviewed_by,
            'reviewed_at' => $this->reviewed_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
