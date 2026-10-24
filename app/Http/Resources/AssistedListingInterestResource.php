<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssistedListingInterestResource extends JsonResource
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
            'assisted_listing_id' => $this->assisted_listing_id,
            'user_id' => $this->user_id,
            'submitter_name' => $this->submitter_name,
            'submitter_contact' => $this->submitter_contact,
            'submitter_email' => $this->submitter_email,
            'message' => $this->message,
            'status' => $this->status,
            'admin_notes' => $this->admin_notes,
            'admin_message' => $this->admin_message,
            'last_sender' => $this->last_sender,
            'can_reply' => $this->canUserReply(),
            'conversation' => $this->conversation ?? [],
            'admin_messaged_at' => $this->admin_messaged_at ? $this->admin_messaged_at->toISOString() : null,
            'user_replied_at' => $this->user_replied_at ? $this->user_replied_at->toISOString() : null,
            'reviewed_by' => $this->reviewed_by,
            'reviewed_at' => $this->reviewed_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'applicant_profile' => $this->user?->profile ? [
                'id' => $this->user->profile->id,
                'profile_code' => $this->user->profile->profile_code,
                'gender' => $this->user->profile->gender,
                'age' => $this->user->profile->age,
                'city' => $this->user->profile->city,
                'education' => $this->user->profile->education,
                'profession' => $this->user->profile->profession,
                'marital_status' => $this->user->profile->marital_status,
            ] : null,
        ];
    }
}
