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
            'admin_status' => $this->admin_status ?? RishtaRequest::ADMIN_STATUS_APPROVED,
            'sender_intro' => $this->sender_intro,
            'sender_questions' => $this->sender_questions,
            'receiver_intro' => $this->receiver_intro,
            'receiver_answers' => $this->receiver_answers,
            'receiver_questions' => $this->receiver_questions,
            'sender_answers' => $this->sender_answers,
            'photo_request_status' => $this->photo_request_status ?? 'none',
            'photo_requested_by_me' => ($isSender ? (bool) $this->sender_requested_photo : (bool) $this->receiver_requested_photo) || ($this->photo_requested_by === $currentUserId),
            'photo_requested_by_candidate' => ($isSender ? (bool) $this->receiver_requested_photo : (bool) $this->sender_requested_photo) || (!empty($this->photo_requested_by) && $this->photo_requested_by !== $currentUserId),
            'my_photo_shared' => $isSender ? !empty($this->sender_photo_path) : !empty($this->receiver_photo_path),
            'candidate_photo_shared' => $isSender ? !empty($this->receiver_photo_path) : !empty($this->sender_photo_path),
            'photo_moderation_status' => $isSender 
                ? ($this->receiver_photo_moderation_status !== 'none' ? $this->receiver_photo_moderation_status : ($this->photo_moderation_status ?? 'none'))
                : ($this->sender_photo_moderation_status !== 'none' ? $this->sender_photo_moderation_status : ($this->photo_moderation_status ?? 'none')),
            'my_photo_moderation_status' => $isSender
                ? ($this->sender_photo_moderation_status !== 'none' ? $this->sender_photo_moderation_status : ($this->photo_moderation_status ?? 'none'))
                : ($this->receiver_photo_moderation_status !== 'none' ? $this->receiver_photo_moderation_status : ($this->photo_moderation_status ?? 'none')),
            'photo_watermark_level' => $isSender
                ? ($this->receiver_photo_watermark_level ?: ($this->photo_watermark_level ?? 'medium'))
                : ($this->sender_photo_watermark_level ?: ($this->photo_watermark_level ?? 'medium')),
            'photo_watermark_text' => $isSender
                ? ($this->receiver_photo_watermark_text ?: $this->photo_watermark_text)
                : ($this->sender_photo_watermark_text ?: $this->photo_watermark_text),
            'photo_rejection_notes' => $isSender ? $this->receiver_photo_rejection_notes : $this->sender_photo_rejection_notes,
            'my_photo_rejection_notes' => $isSender ? $this->sender_photo_rejection_notes : $this->receiver_photo_rejection_notes,
            'photo_fee' => (float) ($this->photo_fee ?? 300.00),
            'photo_paid' => $isSender
                ? (bool) ($this->sender_photo_paid || ($this->photo_paid && $this->photo_paid_by === $currentUserId))
                : (bool) ($this->receiver_photo_paid || ($this->photo_paid && $this->photo_paid_by === $currentUserId)),
            'candidate_photo_paid' => $isSender
                ? (bool) ($this->receiver_photo_paid || ($this->photo_paid && $this->photo_paid_by !== $currentUserId))
                : (bool) ($this->sender_photo_paid || ($this->photo_paid && $this->photo_paid_by !== $currentUserId)),
            'photo_payment_pending' => $this->payments()->where('user_id', $currentUserId)->where('purpose', 'photo_unlock')->where('status', 'pending')->exists(),
            'can_view_candidate_photo' => ($isSender ? !empty($this->receiver_photo_path) : !empty($this->sender_photo_path)) 
                && (($isSender ? $this->receiver_photo_moderation_status : $this->sender_photo_moderation_status) === 'approved' || $this->photo_moderation_status === 'approved')
                && ($isSender ? (bool) ($this->sender_photo_paid || ($this->photo_paid && $this->photo_paid_by === $currentUserId)) : (bool) ($this->receiver_photo_paid || ($this->photo_paid && $this->photo_paid_by === $currentUserId))),
            'candidate_photo_url' => url("/api/requests/{$this->request_code}/view-photo"),
            'my_photo_url' => ($isSender ? !empty($this->sender_photo_path) : !empty($this->receiver_photo_path))
                ? url("/api/requests/{$this->request_code}/view-my-photo")
                : null,
            'nic_request_status' => $this->nic_request_status ?? 'none',
            'nic_requested_by_me' => $this->nic_requested_by === $currentUserId,
            'nic_requested_by_candidate' => !empty($this->nic_requested_by) && $this->nic_requested_by !== $currentUserId,
            'my_nic_shared' => $isSender ? (bool) $this->nic_shared_by_sender : (bool) $this->nic_shared_by_receiver,
            'candidate_nic_shared' => $isSender ? (bool) $this->nic_shared_by_receiver : (bool) $this->nic_shared_by_sender,
            'candidate_is_identity_verified' => $targetUser ? $targetUser->isIdentityVerified() : false,
            'i_am_identity_verified' => $request->user() ? $request->user()->isIdentityVerified() : false,
            'admin_notes' => $this->admin_notes,
            'is_sender' => $isSender,
            'is_admin_initiated' => !empty($this->initiated_by_admin_id),
            'candidate_profile' => $targetProfile ? new PublicProfileResource($targetProfile) : null,
            'created_at' => $this->created_at?->toIso8601String(),
            'expires_at' => $this->expires_at?->toIso8601String(),
            'accepted_at' => $this->accepted_at?->toIso8601String(),
            'declined_at' => $this->declined_at?->toIso8601String(),
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
        ];
    }
}
