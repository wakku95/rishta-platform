<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RishtaRequestResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $currentUserId = $request->user()?->id;
        $isSender = $currentUserId === $this->sender_id;

        // Candidate profile to display: if current user is sender, display receiver's profile;
        // if current user is receiver, display sender's profile.
        $targetUser = $isSender ? $this->receiver : $this->sender;
        $targetProfile = $targetUser?->profile;

        return [
            'request_code' => $this->request_code,
            'status' => $this->status,
            'is_sender' => $isSender,
            'candidate_profile' => $targetProfile ? new PublicProfileResource($targetProfile) : null,
            'created_at' => $this->created_at?->toIso8601String(),
            'expires_at' => $this->expires_at?->toIso8601String(),
            'accepted_at' => $this->accepted_at?->toIso8601String(),
            'declined_at' => $this->declined_at?->toIso8601String(),
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
        ];
    }
}
